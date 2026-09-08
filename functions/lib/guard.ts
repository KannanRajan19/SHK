import { verifySession } from './session';

/**
 * Every write endpoint starts here. Without a valid signed cookie the request
 * is refused before it can reach the GitHub token.
 */
export async function requireSession(request: Request, secret?: string): Promise<boolean> {
  if (!secret) return false;
  const cookie = request.headers.get('Cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)ps_session=([^;]+)/);
  return match ? verifySession(match[1], secret) : false;
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
