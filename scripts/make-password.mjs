/**
 * Generates — or verifies — the admin secrets.
 *
 *   node scripts/make-password.mjs                 (prompts, no shell involved)
 *   node scripts/make-password.mjs 'the password'   (argument form)
 *   node scripts/make-password.mjs --verify <salt> <hash>
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

/**
 * Reads a password straight from the terminal, with no shell in between.
 *
 * Passing the password as an argument means the shell gets to rewrite it
 * first — PowerShell expands $variables inside double quotes — and it also
 * leaves the password in shell history. Typing it here avoids both.
 */
async function promptHidden(question) {
  const readline = await import('node:readline');
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    // Echo asterisks instead of the password.
    rl._writeToOutput = (chunk) => {
      if (chunk.includes(question)) rl.output.write(chunk);
      else if (chunk.trim() !== '') rl.output.write('*');
    };
    rl.question(question, (answer) => {
      rl.output.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

const args = process.argv.slice(2);

if (args[0] === '--verify') {
  const [, salt, expected] = args;
  if (!salt || !expected) {
    console.error('usage: node scripts/make-password.mjs --verify <salt> <hash>');
    process.exit(1);
  }
  const password = args[3] ?? (await promptHidden('password to check: '));

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

const password = args[0] ?? (await promptHidden('choose the admin password: '));

if (!password) {
  console.error('no password entered.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('please choose at least 8 characters.');
  process.exit(1);
}

const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
const sessionSecret = hex(crypto.getRandomValues(new Uint8Array(32)));

/*
 * Echo back what Node actually received, masked.
 *
 * A shell can rewrite the password before Node sees it — PowerShell expands
 * $variables inside double quotes, so "my$secret" arrives as "my". The hash is
 * then perfectly valid for a string the owner never chose, and the only
 * symptom is "wrong password" weeks later. Showing the length and the ends
 * makes that visible immediately without printing the password.
 */
const masked =
  password.length <= 4
    ? '*'.repeat(password.length)
    : `${password.slice(0, 2)}${'*'.repeat(password.length - 4)}${password.slice(-2)}`;

console.log(`
Received a ${password.length}-character password: ${masked}
  If that length or those first/last characters are not what you typed, your
  shell rewrote it. In PowerShell use SINGLE quotes, then run this again.
`);

console.log(`
Add these as encrypted environment variables in
Cloudflare Pages -> Settings -> Variables and Secrets (Production):

ADMIN_PASSWORD_SALT   ${salt}
ADMIN_PASSWORD_HASH   ${await derive(password, salt)}
SESSION_SECRET        ${sessionSecret}

The salt and hash MUST be pasted together — they are a matched pair. Keep the
password itself somewhere safe; it cannot be recovered from these.
`);
