/**
 * Generates the three admin secrets from a password you choose.
 *
 *   node scripts/make-password.mjs "the password you want"
 *
 * Prints ADMIN_PASSWORD_SALT, ADMIN_PASSWORD_HASH and SESSION_SECRET to paste
 * into the Cloudflare Pages dashboard as encrypted environment variables.
 *
 * The password itself is never stored anywhere -- only the hash. Nobody,
 * including whoever can read the Cloudflare dashboard, can recover it.
 */
const password = process.argv[2];

if (!password) {
  console.error('usage: node scripts/make-password.mjs "your password"');
  process.exit(1);
}

if (password.length < 8) {
  console.error('please choose at least 8 characters.');
  process.exit(1);
}

const enc = new TextEncoder();
const hex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
const sessionSecret = hex(crypto.getRandomValues(new Uint8Array(32)));

// Must match hashPassword() in functions/lib/session.ts exactly.
const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
  'deriveBits',
]);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt: enc.encode(salt), iterations: 150_000, hash: 'SHA-256' },
  material,
  256
);

console.log(`
Add these three as encrypted environment variables in
Cloudflare Pages -> Settings -> Environment variables:

ADMIN_PASSWORD_SALT   ${salt}
ADMIN_PASSWORD_HASH   ${hex(bits)}
SESSION_SECRET        ${sessionSecret}

Keep the password itself somewhere safe -- it cannot be recovered from these.
`);
