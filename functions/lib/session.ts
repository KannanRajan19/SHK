/**
 * Session signing and password hashing for the admin.
 *
 * Everything here uses WebCrypto, which exists both in the Cloudflare Workers
 * runtime and in Node 20+, so the same code runs in production and in tests.
 *
 * A session token is `base64(expiry).base64(hmac(expiry))`. There is nothing
 * secret inside it -- it carries only an expiry -- so it is safe to hand to
 * the browser; the signature is what makes it unforgeable.
 */
const enc = new TextEncoder();

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

const b64 = (s: string) => btoa(s).replace(/=+$/, '');

async function sign(payload: string, secret: string): Promise<string> {
  const mac = await crypto.subtle.sign('HMAC', await key(secret), enc.encode(payload));
  return b64(String.fromCharCode(...new Uint8Array(mac)));
}

export async function signSession(secret: string, ttlSeconds: number): Promise<string> {
  const expires = String(Math.floor(Date.now() / 1000) + ttlSeconds);
  return `${b64(expires)}.${await sign(expires, secret)}`;
}

export async function verifySession(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  let expires: string;
  try {
    expires = atob(parts[0]);
  } catch {
    return false;
  }
  if (!/^\d+$/.test(expires)) return false;
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return false;

  return timingSafeEqual(await sign(expires, secret), parts[1]);
}

/**
 * Compares in constant time. A plain === would return as soon as two bytes
 * differ, and the time that takes leaks how much of a guess was correct.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * PBKDF2 with 100k iterations (the maximum the Workers runtime allows;
 * higher values throw at runtime, not at build time). The password is never stored anywhere, in any
 * form the browser can see -- only this hash lives as a Pages secret.
 */
export async function hashPassword(pw: string, salt: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    material,
    256
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
