import { describe, it, expect } from 'vitest';
import { validateContact } from '../../src/lib/validate';

const good = { name: 'sahana', email: 'a@b.co', message: 'hello there' };

describe('validateContact', () => {
  it('accepts a complete message', () => {
    expect(validateContact(good)).toEqual({ ok: true });
  });

  it('rejects each missing required field by name', () => {
    for (const key of ['name', 'email', 'message'] as const) {
      const result = validateContact({ ...good, [key]: '   ' });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors[key]).toBeTruthy();
    }
  });

  it('rejects malformed email addresses', () => {
    for (const email of ['nope', 'a@', '@b.co', 'a b@c.co']) {
      expect(validateContact({ ...good, email }).ok).toBe(false);
    }
  });

  it('rejects oversized messages so the endpoint cannot be used as a pipe', () => {
    expect(validateContact({ ...good, message: 'x'.repeat(5001) }).ok).toBe(false);
  });
});
