import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

/**
 * These assert that the migration PRESERVED the seed content — not that the
 * collections never change. The admin exists to add content, so any test
 * pinning an exact count fails the first time Sahana publishes something,
 * which would make a working system look broken.
 *
 * The rule is therefore: every seeded item must still be present and
 * unmodified. Anything beyond that is hers.
 */
describe('content migration', () => {
  beforeAll(() => {
    if (!existsSync('content/books.json')) {
      throw new Error('run `npm run migrate` before these tests');
    }
  });

  it('still contains all 832 seeded books, unmodified and in their original order', () => {
    const seeded = read('design/books.json');
    const current = read('content/books.json');

    expect(current.length).toBeGreaterThanOrEqual(832);
    // New books are unshifted to the top, so the seeded log is the tail.
    expect(current.slice(current.length - 832)).toEqual(seeded);
  });

  it('keeps every book field lowercase', () => {
    for (const b of read('content/books.json')) {
      expect(b.title).toBe(b.title.toLowerCase());
      expect(b.author).toBe(b.author.toLowerCase());
    }
  });

  it('has every seeded post, with body paragraphs as text blocks', () => {
    const seededSlugs = [
      'a-small-recipe-for-marmalade',
      'on-keeping-a-quiet-website',
      'on-slow-mornings',
      'the-lighthouse-book',
      'the-trees-on-my-street',
      'three-small-joys-this-week',
    ];
    for (const slug of seededSlugs) {
      const post = read(`content/posts/${slug}.json`);
      expect(post.blocks.length).toBeGreaterThan(0);
      expect(post.blocks.every((b: any) => b.type === 'text')).toBe(true);
      expect(post.minutes).toBeGreaterThan(0);
      expect(post.excerpt.length).toBeGreaterThan(0);
    }
  });

  it('has every seeded doodle and picture', () => {
    const doodles = [
      'a-coffee-that-took-too-long', 'lemons-in-a-blue-bowl',
      'sleepy-cat-by-the-window', 'the-moon-at-4am', 'three-small-mushrooms',
    ];
    for (const slug of doodles) {
      expect(existsSync(`content/doodles/${slug}.json`)).toBe(true);
      expect(read(`content/doodles/${slug}.json`).placeholder).toMatch(/^doodle/);
    }
    // Eight seeded pictures are prefixed 01-..08-; later ones are timestamped.
    const seededPictures = readdirSync('content/pictures').filter((f) => /^0[1-8]-/.test(f));
    expect(seededPictures).toHaveLength(8);
  });

  it('validates anything the admin has since published', () => {
    for (const f of readdirSync('content/doodles')) {
      const d = read(`content/doodles/${f}`);
      expect(typeof d.title).toBe('string');
      expect(d.title.length).toBeGreaterThan(0);
      expect(typeof d.date).toBe('string');
      // An image is either absent or a real uploads path — never a stray value.
      if (d.image) expect(d.image).toMatch(/^\/uploads\//);
    }
    for (const f of readdirSync('content/posts')) {
      const p = read(`content/posts/${f}`);
      expect(Array.isArray(p.blocks)).toBe(true);
      for (const b of p.blocks) expect(['text', 'image']).toContain(b.type);
    }
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
