import { describe, it, expect } from 'vitest';
import {
  sortBooks, paginate, formatRating, isInProgress, averageRating, formatFinished,
  filterBooks,
} from '../../src/lib/books';
import type { Book } from '../../src/lib/books';

const b = (o: Partial<Book> = {}): Book =>
  ({ title: 'a', author: 'z', finished: 'Jan 2020', rating: 0, note: '', ...o });

describe('formatRating', () => {
  it('renders 0 as an em dash, not zero stars', () => {
    expect(formatRating(0)).toBe('—');
  });
  it('renders n stars for n', () => {
    expect(formatRating(3)).toBe('★★★');
  });
});

describe('isInProgress', () => {
  it('is true only when finished is blank', () => {
    expect(isInProgress(b({ finished: '' }))).toBe(true);
    expect(isInProgress(b({ finished: 'Jul 2026' }))).toBe(false);
  });

  it('also accepts the prototype\'s literal "in progress" string', () => {
    expect(isInProgress(b({ finished: 'in progress' }))).toBe(true);
    expect(isInProgress(b({ finished: 'In Progress' }))).toBe(true);
  });

  it('shows blank entries as "in progress" in the finished column', () => {
    expect(formatFinished(b({ finished: '' }))).toBe('in progress');
    expect(formatFinished(b({ finished: 'Jul 2026' }))).toBe('Jul 2026');
  });
});

describe('averageRating', () => {
  it('returns null when nothing is rated, so the header can stay hidden', () => {
    expect(averageRating([b(), b()])).toBeNull();
  });
  it('averages only rated books', () => {
    expect(averageRating([b({ rating: 4 }), b({ rating: 2 }), b()])).toBe(3);
  });
});

describe('sortBooks', () => {
  it('recent keeps the source order untouched', () => {
    const list = [b({ title: 'first' }), b({ title: 'second' })];
    expect(sortBooks(list, 'recent').map((x) => x.title)).toEqual(['first', 'second']);
  });

  it('recent puts in-progress books at the very top', () => {
    const list = [b({ title: 'done' }), b({ title: 'reading', finished: '' })];
    expect(sortBooks(list, 'recent')[0].title).toBe('reading');
  });

  it('rating sorts high to low and never loses unrated books', () => {
    const list = [b({ rating: 0 }), b({ rating: 5 }), b({ rating: 3 })];
    const out = sortBooks(list, 'rating');
    expect(out.map((x) => x.rating)).toEqual([5, 3, 0]);
    expect(out).toHaveLength(3);
  });

  it('author sorts alphabetically without mutating the input', () => {
    const list = [b({ author: 'zadie' }), b({ author: 'ada' })];
    const copy = [...list];
    expect(sortBooks(list, 'author').map((x) => x.author)).toEqual(['ada', 'zadie']);
    expect(list).toEqual(copy);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 832 }, (_, i) => i);

  it('reports 42 pages for 832 items at 20 per page', () => {
    expect(paginate(items, 1).pages).toBe(42);
  });

  it('returns 20 on a full page and 12 on the last', () => {
    expect(paginate(items, 1).items).toHaveLength(20);
    expect(paginate(items, 42).items).toHaveLength(12);
  });

  it('clamps out-of-range pages instead of returning nothing', () => {
    expect(paginate(items, 0).page).toBe(1);
    expect(paginate(items, 999).page).toBe(42);
  });

  it('handles an empty log without dividing by zero', () => {
    expect(paginate([], 1)).toEqual({ items: [], page: 1, pages: 1 });
  });
});

describe('filterBooks', () => {
  const list = [
    b({ title: 'the hobbit', author: 'j r r tolkien' }),
    b({ title: 'dune', author: 'frank herbert' }),
    b({ title: 'the dispossessed', author: 'ursula k le guin' }),
  ];

  it('returns everything for an empty query', () => {
    expect(filterBooks(list, '')).toHaveLength(3);
    expect(filterBooks(list, '   ')).toHaveLength(3);
  });

  it('matches on title', () => {
    expect(filterBooks(list, 'hobbit').map((x) => x.title)).toEqual(['the hobbit']);
  });

  it('matches on author', () => {
    expect(filterBooks(list, 'herbert').map((x) => x.title)).toEqual(['dune']);
  });

  it('is case insensitive', () => {
    expect(filterBooks(list, 'DUNE')).toHaveLength(1);
    expect(filterBooks(list, 'Le Guin')).toHaveLength(1);
  });

  it('matches partial words anywhere in the string', () => {
    expect(filterBooks(list, 'poss')).toHaveLength(1);
  });

  it('ignores surrounding whitespace', () => {
    expect(filterBooks(list, '  dune  ')).toHaveLength(1);
  });

  it('returns nothing when there is no match, rather than everything', () => {
    expect(filterBooks(list, 'zzzzz')).toEqual([]);
  });

  it('preserves the incoming order', () => {
    expect(filterBooks(list, 'the').map((x) => x.title))
      .toEqual(['the hobbit', 'the dispossessed']);
  });

  it('does not mutate the input', () => {
    const copy = structuredClone(list);
    filterBooks(list, 'dune');
    expect(list).toEqual(copy);
  });
});
