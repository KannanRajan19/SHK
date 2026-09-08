import { describe, it, expect } from 'vitest';
import { readingTime, deriveExcerpt } from '../../src/lib/blocks';

describe('readingTime', () => {
  it('counts only text blocks, at 200wpm, minimum 1', () => {
    const blocks = [{ type: 'text', value: 'word '.repeat(400).trim() }] as const;
    expect(readingTime([...blocks])).toBe(2);
  });

  it('ignores image blocks and never returns 0', () => {
    expect(readingTime([{ type: 'image', value: '/uploads/a.jpg' }])).toBe(1);
  });
});

describe('deriveExcerpt', () => {
  it('uses the first text block and truncates on a word boundary', () => {
    const long = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet';
    const out = deriveExcerpt([{ type: 'text', value: long }], 20);
    expect(out.length).toBeLessThanOrEqual(21);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });

  it('skips leading image blocks', () => {
    const blocks = [
      { type: 'image' as const, value: '/uploads/a.jpg' },
      { type: 'text' as const, value: 'the real opening line' },
    ];
    expect(deriveExcerpt(blocks, 100)).toBe('the real opening line');
  });

  it('returns empty string when there is no text at all', () => {
    expect(deriveExcerpt([{ type: 'image', value: '/uploads/a.jpg' }], 100)).toBe('');
  });
});
