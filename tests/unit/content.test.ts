import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const listing = (dir: string) => (existsSync(dir) ? readdirSync(dir) : []);

/**
 * Content integrity, not a snapshot.
 *
 * This file used to assert that the seeded content was still present and
 * counted — 5 doodles, 8 pictures, 832 books. It broke three times, each time
 * because the owner did something the admin exists to let her do: publish a
 * doodle, then delete one, then delete a seeded one.
 *
 * Once content is owner-editable, no particular entry is an invariant. What
 * stays true is the SHAPE: every file parses, every field has the right type,
 * every image points somewhere real, books stay lowercase. That is what these
 * check. The migration itself was a one-off; git history is its record.
 */
describe('content integrity', () => {
  it('every book row is well-formed and lowercase', () => {
    const books = read('content/books.json');
    expect(Array.isArray(books)).toBe(true);
    for (const b of books) {
      expect(typeof b.title).toBe('string');
      expect(typeof b.author).toBe('string');
      expect(b.title).toBe(b.title.toLowerCase());
      expect(b.author).toBe(b.author.toLowerCase());
      expect(typeof b.finished).toBe('string');
      expect(b.rating).toBeGreaterThanOrEqual(0);
      expect(b.rating).toBeLessThanOrEqual(5);
      expect(typeof b.note).toBe('string');
    }
  });

  it('every post has ordered blocks of a known type', () => {
    for (const f of listing('content/posts')) {
      const p = read(`content/posts/${f}`);
      expect(typeof p.title).toBe('string');
      expect(p.title.length).toBeGreaterThan(0);
      expect(Array.isArray(p.blocks)).toBe(true);
      expect(p.minutes).toBeGreaterThan(0);
      for (const block of p.blocks) {
        expect(['text', 'image']).toContain(block.type);
        expect(typeof block.value).toBe('string');
      }
    }
  });

  it('every doodle and picture is well-formed', () => {
    for (const f of listing('content/doodles')) {
      const d = read(`content/doodles/${f}`);
      expect(typeof d.title).toBe('string');
      expect(d.title.length).toBeGreaterThan(0);
      expect(typeof d.date).toBe('string');
      expect(typeof d.note).toBe('string');
    }
    for (const f of listing('content/pictures')) {
      const p = read(`content/pictures/${f}`);
      expect(typeof p.caption).toBe('string');
      expect(['1/1', '3/4', '4/3', '4/5']).toContain(p.aspect);
    }
  });

  /**
   * The one that would actually be noticed: an entry pointing at an upload
   * that is not in the repo renders as a broken image on a live page.
   */
  it('every referenced image exists in public/uploads', () => {
    const referenced: string[] = [];
    for (const f of listing('content/doodles')) {
      const { image } = read(`content/doodles/${f}`);
      if (image) referenced.push(image);
    }
    for (const f of listing('content/pictures')) {
      const { image } = read(`content/pictures/${f}`);
      if (image) referenced.push(image);
    }
    for (const f of listing('content/posts')) {
      for (const b of read(`content/posts/${f}`).blocks) {
        if (b.type === 'image' && b.value) referenced.push(b.value);
      }
    }

    for (const img of referenced) {
      expect(img.startsWith('/uploads/')).toBe(true);
      expect(existsSync(`public${img}`)).toBe(true);
    }
  });

  it('has the five currently fields and six text fields', () => {
    const c = read('content/settings/currently.json');
    expect(Object.keys(c).sort()).toEqual(
      ['drawing', 'learning', 'listening', 'reading', 'watching']
    );

    const t = read('content/settings/text.json');
    expect(Object.keys(t).sort()).toEqual(
      ['aboutBio1', 'aboutBio2', 'aboutBio3', 'aboutBio4', 'homeIntro1', 'homeIntro2']
    );
    for (const v of Object.values(t)) expect(String(v).length).toBeGreaterThan(0);
  });

  it('every contact link is well-formed', () => {
    for (const s of read('content/socials.json')) {
      expect(typeof s.label).toBe('string');
      expect(typeof s.handle).toBe('string');
      expect(typeof s.note).toBe('string');
    }
  });
});
