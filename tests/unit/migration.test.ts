import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe('content migration', () => {
  beforeAll(() => {
    if (!existsSync('content/books.json')) {
      throw new Error('run `npm run migrate` before these tests');
    }
  });

  it('preserves all 832 books in original order', () => {
    const before = read('design/books.json');
    const after = read('content/books.json');
    expect(after).toHaveLength(832);
    expect(after).toEqual(before);
  });

  it('keeps every book field lowercase', () => {
    for (const b of read('content/books.json')) {
      expect(b.title).toBe(b.title.toLowerCase());
      expect(b.author).toBe(b.author.toLowerCase());
    }
  });

  it('migrates 6 posts, all body paragraphs becoming text blocks', () => {
    const files = readdirSync('content/posts');
    expect(files).toHaveLength(6);
    for (const f of files) {
      const post = read(`content/posts/${f}`);
      expect(post.blocks.length).toBeGreaterThan(0);
      expect(post.blocks.every((b: any) => b.type === 'text')).toBe(true);
      expect(post.minutes).toBeGreaterThan(0);
      expect(post.excerpt.length).toBeGreaterThan(0);
    }
  });

  it('migrates 5 doodles and 8 pictures', () => {
    expect(readdirSync('content/doodles')).toHaveLength(5);
    expect(readdirSync('content/pictures')).toHaveLength(8);
  });

  it('migrates all five currently fields and six text fields', () => {
    const c = read('content/settings/currently.json');
    expect(Object.keys(c).sort()).toEqual(
      ['drawing', 'learning', 'listening', 'reading', 'watching']
    );
    for (const v of Object.values(c)) expect(String(v).length).toBeGreaterThan(0);

    const t = read('content/settings/text.json');
    expect(Object.keys(t).sort()).toEqual(
      ['aboutBio1', 'aboutBio2', 'aboutBio3', 'aboutBio4', 'homeIntro1', 'homeIntro2']
    );
    for (const v of Object.values(t)) expect(String(v).length).toBeGreaterThan(0);
  });
});
