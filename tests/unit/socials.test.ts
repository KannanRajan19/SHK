import { describe, it, expect } from 'vitest';
import { visibleSocials, normaliseSocial } from '../../src/lib/socials';
import type { Social } from '../../src/lib/socials';

const s = (o: Partial<Social> = {}): Social =>
  ({ label: 'instagram', handle: '@paper', note: 'doodles', ...o });

describe('visibleSocials', () => {
  it('keeps links that have a handle', () => {
    expect(visibleSocials([s()])).toHaveLength(1);
  });

  it('hides a link whose handle was cleared', () => {
    expect(visibleSocials([s({ handle: '' })])).toHaveLength(0);
  });

  it('treats whitespace as cleared', () => {
    expect(visibleSocials([s({ handle: '   ' })])).toHaveLength(0);
  });

  it('hides a link with no label even if a handle remains', () => {
    expect(visibleSocials([s({ label: '' })])).toHaveLength(0);
  });

  it('keeps the remaining links when one is cleared', () => {
    const list = [s({ label: 'instagram' }), s({ label: 'bluesky', handle: '' }), s({ label: 'email' })];
    expect(visibleSocials(list).map((x) => x.label)).toEqual(['instagram', 'email']);
  });

  it('preserves the authored order', () => {
    const list = [s({ label: 'c' }), s({ label: 'a' }), s({ label: 'b' })];
    expect(visibleSocials(list).map((x) => x.label)).toEqual(['c', 'a', 'b']);
  });

  it('returns an empty array when every link is cleared, so the page can omit the section', () => {
    expect(visibleSocials([s({ handle: '' }), s({ handle: '' })])).toEqual([]);
  });

  it('does not mutate the input', () => {
    const list = [s(), s({ handle: '' })];
    const copy = structuredClone(list);
    visibleSocials(list);
    expect(list).toEqual(copy);
  });
});

describe('normaliseSocial', () => {
  it('trims every field so stray spaces never reach the page', () => {
    expect(normaliseSocial({ label: ' email ', handle: ' a@b.co ', note: ' slow ' })).toEqual({
      label: 'email',
      handle: 'a@b.co',
      note: 'slow',
    });
  });

  it('tolerates a missing note', () => {
    expect(normaliseSocial({ label: 'x', handle: 'y' } as Social).note).toBe('');
  });
});
