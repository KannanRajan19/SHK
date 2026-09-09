import { describe, it, expect } from 'vitest';
import { hashPassword } from '../../functions/lib/session';

/**
 * A golden vector, generated once by scripts/make-password.mjs at 100,000
 * PBKDF2 iterations -- the maximum the Cloudflare Workers runtime permits.
 * Anything higher throws at runtime (Cloudflare error 1101) while passing
 * every local Node test, so this number is not a free tuning knob.
 *
 * The script and the login Function must derive the same hash or the owner is
 * locked out of her own site with no error message that explains why. Changing
 * the iteration count, the hash algorithm or the encoding in either place
 * breaks this test — which is the point. If it fails, the stored
 * ADMIN_PASSWORD_HASH in Cloudflare must be regenerated too.
 */
const PASSWORD = 'test-password-123';
const SALT = 'e6ac1bfb2ea614d8737f0ba56511f3fa';
const EXPECTED = '4627756fe85824e52931de964f832ae9d672a40c58b5935d91d8af6c8820ad3c';

describe('password hashing stays compatible with the generator script', () => {
  it('derives the known hash for a known password and salt', async () => {
    expect(await hashPassword(PASSWORD, SALT)).toBe(EXPECTED);
  });

  it('rejects a near-miss password', async () => {
    expect(await hashPassword('test-password-124', SALT)).not.toBe(EXPECTED);
  });
});
