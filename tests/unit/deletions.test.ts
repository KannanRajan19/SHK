import { describe, it, expect } from 'vitest';
import {
  entryImages, deletionPaths, removeBook, searchBooks,
} from '../../src/scripts/admin/deletions';

describe('entryImages', () => {
  it('finds a single image', () => {
    expect(entryImages({ id: 'a', title: 't', date: 'd', image: '/uploads/a.jpg' }))
      .toEqual(['/uploads/a.jpg']);
  });

  it('finds images spread across post blocks', () => {
    expect(entryImages({
      id: 'a', title: 't', date: 'd', images: ['/uploads/a.jpg', '/uploads/b.jpg'],
    })).toEqual(['/uploads/a.jpg', '/uploads/b.jpg']);
  });

  it('ignores an entry with no image', () => {
    expect(entryImages({ id: 'a', title: 't', date: 'd' })).toEqual([]);
    expect(entryImages({ id: 'a', title: 't', date: 'd', image: '' })).toEqual([]);
  });

  it('ignores anything outside uploads', () => {
    expect(entryImages({ id: 'a', title: 't', date: 'd', image: 'https://x.com/a.jpg' }))
      .toEqual([]);
  });
});

describe('deletionPaths', () => {
  const entry = { id: 'a', title: 't', date: 'd', image: '/uploads/a.jpg' };

  it('removes the content file and its own image', () => {
    expect(deletionPaths('content/doodles/a.json', entry, { '/uploads/a.jpg': 1 }))
      .toEqual(['content/doodles/a.json', 'public/uploads/a.jpg']);
  });

  it('keeps an image another entry still uses', () => {
    expect(deletionPaths('content/doodles/a.json', entry, { '/uploads/a.jpg': 2 }))
      .toEqual(['content/doodles/a.json']);
  });

  it('handles an entry with no image', () => {
    expect(deletionPaths('content/posts/a.json', { id: 'a', title: 't', date: 'd' }, {}))
      .toEqual(['content/posts/a.json']);
  });

  it('does not list the same image twice when a post reuses it', () => {
    const post = {
      id: 'p', title: 't', date: 'd',
      images: ['/uploads/a.jpg', '/uploads/a.jpg'],
    };
    expect(deletionPaths('content/posts/p.json', post, { '/uploads/a.jpg': 1 }))
      .toEqual(['content/posts/p.json', 'public/uploads/a.jpg']);
  });
});

describe('removeBook', () => {
  const books = [
    { title: 'a', author: 'x' },
    { title: 'b', author: 'y' },
    { title: 'a', author: 'x' },
  ];

  it('removes the matching book', () => {
    expect(removeBook(books, 'b', 'y')).toHaveLength(2);
  });

  it('removes only one of two identical entries', () => {
    const out = removeBook(books, 'a', 'x');
    expect(out).toHaveLength(2);
    expect(out.filter((b) => b.title === 'a')).toHaveLength(1);
  });

  it('leaves the list alone when nothing matches', () => {
    expect(removeBook(books, 'nope', 'nobody')).toHaveLength(3);
  });

  it('does not mutate the input', () => {
    const copy = structuredClone(books);
    removeBook(books, 'b', 'y');
    expect(books).toEqual(copy);
  });
});

describe('searchBooks', () => {
  const books = [
    { title: 'the hobbit', author: 'tolkien' },
    { title: 'dune', author: 'herbert' },
    { title: 'hobbits everywhere', author: 'someone' },
  ];

  it('matches on title', () => {
    expect(searchBooks(books, 'hobbit')).toHaveLength(2);
  });

  it('matches on author', () => {
    expect(searchBooks(books, 'herbert').map((b) => b.title)).toEqual(['dune']);
  });

  it('is case insensitive', () => {
    expect(searchBooks(books, 'DUNE')).toHaveLength(1);
  });

  it('returns the first N when the query is empty, not all 832', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ title: `t${i}`, author: 'a' }));
    expect(searchBooks(many, '   ', 25)).toHaveLength(25);
  });

  it('caps results so a broad query cannot render the whole log', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ title: `book ${i}`, author: 'a' }));
    expect(searchBooks(many, 'book', 25)).toHaveLength(25);
  });
});
