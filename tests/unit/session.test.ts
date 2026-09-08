import { describe, it, expect } from 'vitest';
import { signSession, verifySession, hashPassword } from '../../functions/lib/session';

const SECRET = 'test-secret-value';

describe('session tokens', () => {
  it('accepts a token it just signed', async () => {
    expect(await verifySession(await signSession(SECRET, 60), SECRET)).toBe(true);
  });

  it('rejects a token signed with a different secret', async () => {
    expect(await verifySession(await signSession(SECRET, 60), 'other')).toBe(false);
  });

  it('rejects an expired token', async () => {
    expect(await verifySession(await signSession(SECRET, -1), SECRET)).toBe(false);
  });

  it('rejects a tampered payload', async () => {
    const token = await signSession(SECRET, 60);
    const sig = token.split('.')[1];
    const forged = `${btoa('9999999999').replace(/=+$/, '')}.${sig}`;
    expect(await verifySession(forged, SECRET)).toBe(false);
  });

  it('rejects malformed tokens instead of throwing', async () => {
    for (const bad of ['', 'nodot', 'a.b.c', '!!!.???']) {
      await expect(verifySession(bad, SECRET)).resolves.toBe(false);
    }
  });
});

describe('hashPassword', () => {
  it('is deterministic for the same password and salt', async () => {
    expect(await hashPassword('hunter2', 'salt')).toBe(await hashPassword('hunter2', 'salt'));
  });

  it('differs for a different password', async () => {
    expect(await hashPassword('hunter2', 'salt')).not.toBe(await hashPassword('hunter3', 'salt'));
  });

  it('differs for the same password under a different salt', async () => {
    expect(await hashPassword('hunter2', 'salt-a')).not.toBe(
      await hashPassword('hunter2', 'salt-b')
    );
  });

  it('never returns the password itself', async () => {
    const hash = await hashPassword('paperbird', 'salt');
    expect(hash).not.toContain('paperbird');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
