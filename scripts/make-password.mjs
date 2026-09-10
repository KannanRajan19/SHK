/**
 * Generates — or verifies — the admin secrets.
 *
 *   node scripts/make-password.mjs 'the password you want'
 *   node scripts/make-password.mjs --verify <salt> <hash> 'the password'
 *
 * Generate prints ADMIN_PASSWORD_SALT, ADMIN_PASSWORD_HASH and SESSION_SECRET
 * to paste into Cloudflare as encrypted environment variables.
 *
 * Verify re-derives the hash from a salt and password and says whether it
 * matches — use it when the admin reports "wrong password" and you are sure it
 * isn't. Nothing leaves your machine either way.
 *
 * QUOTING: in PowerShell, double quotes expand $variables. Use SINGLE quotes so
 * the password is taken literally.
 */
const ITERATIONS = 100_000; // the maximum the Cloudflare Workers runtime allows

const enc = new TextEncoder();
const hex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

// Must match hashPassword() in functions/lib/session.ts exactly.
async function derive(password, salt) {
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    256
  );
  return hex(bits);
}

const args = process.argv.slice(2);

if (args[0] === '--verify') {
  const [, salt, expected, password] = args;
  if (!salt || !expected || !password) {
    console.error("usage: node scripts/make-password.mjs --verify <salt> <hash> 'the password'");
    process.exit(1);
  }

  const actual = await derive(password, salt.trim());
  const match = actual === expected.trim().toLowerCase();

  console.log(`
  salt used     ${salt.trim()}
  expected      ${expected.trim()}
  derived       ${actual}

  ${match ? 'MATCH — this password works with these values.' : 'NO MATCH.'}
`);

  if (!match) {
    console.log(`  Most likely causes, in order:
   1. The salt and hash came from DIFFERENT runs of this script. Every run
      makes a new random salt, so the pair must always be pasted together.
   2. The hash predates the 100k-iteration fix. Regenerate it.
   3. The password was typed in PowerShell double quotes and contained a $,
      which PowerShell expanded before Node ever saw it. Use single quotes.
   4. A stray space or newline was copied into the Cloudflare variable.
`);
  }
  process.exit(match ? 0 : 1);
}

const password = args[0];

if (!password) {
  console.error("usage: node scripts/make-password.mjs 'your password'");
  process.exit(1);
}

if (password.length < 8) {
  console.error('please choose at least 8 characters.');
  process.exit(1);
}

const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
const sessionSecret = hex(crypto.getRandomValues(new Uint8Array(32)));

console.log(`
Add these as encrypted environment variables in
Cloudflare Pages -> Settings -> Variables and Secrets (Production):

ADMIN_PASSWORD_SALT   ${salt}
ADMIN_PASSWORD_HASH   ${await derive(password, salt)}
SESSION_SECRET        ${sessionSecret}

The salt and hash MUST be pasted together — they are a matched pair. Keep the
password itself somewhere safe; it cannot be recovered from these.
`);
