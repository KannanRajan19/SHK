import { hashPassword, signSession } from '../lib/session';

interface Env {
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_PASSWORD_SALT?: string;
  SESSION_SECRET?: string;
}

const SESSION_TTL = 60 * 60 * 8; // eight hours
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

/**
 * Best-effort rate limiting. This Map lives in one isolate, so it is not a
 * hard guarantee across Cloudflare's edge -- it raises the cost of guessing
 * without being the only thing standing in the way. The real protection is
 * that the password is never in the client and the hash uses 150k PBKDF2
 * iterations. If this ever needs to be strict, move it to KV.
 */
const attempts = new Map<string, { n: number; until: number }>();

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ADMIN_PASSWORD_HASH || !env.ADMIN_PASSWORD_SALT || !env.SESSION_SECRET) {
    return json({ ok: false, error: 'not configured' }, 503);
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.until > now && record.n >= MAX_ATTEMPTS) {
    return json({ ok: false, error: 'too many tries, wait a minute' }, 429);
  }

  let password = '';
  try {
    ({ password = '' } = await request.json<{ password?: string }>());
  } catch {
    return json({ ok: false }, 400);
  }

  let hash: string;
  try {
    hash = await hashPassword(password, env.ADMIN_PASSWORD_SALT);
  } catch {
    // An uncaught throw here surfaces as Cloudflare error 1101, which tells
    // nobody anything. The realistic cause is the runtime rejecting the
    // crypto parameters -- something a local Node test will not reproduce.
    return json({ ok: false, error: 'could not check the password' }, 500);
  }

  if (hash !== env.ADMIN_PASSWORD_HASH) {
    attempts.set(ip, {
      n: (record && record.until > now ? record.n : 0) + 1,
      until: now + WINDOW_MS,
    });
    // There is exactly one account, so there is nothing to enumerate and
    // nothing useful to say beyond "no".
    return json({ ok: false, error: 'wrong password, try again' }, 401);
  }

  attempts.delete(ip);
  const token = await signSession(env.SESSION_SECRET, SESSION_TTL);
  return json({ ok: true }, 200, {
    'Set-Cookie':
      `ps_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL}`,
  });
};
