export type Book = {
  title: string;
  author: string;
  finished: string;
  rating: number;
  note: string;
};

export type SortMode = 'date' | 'rating' | 'author';
export type SortDirection = 'asc' | 'desc';

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

/**
 * A sortable number for a "Mon YYYY" finished date.
 *
 * Parsed by hand rather than with Date.parse: that format is not in the spec's
 * required set, so engines differ on it, and a NaN here would quietly scramble
 * the ordering rather than fail loudly. Anything unrecognised sorts to the
 * bottom instead of poisoning the comparison.
 *
 * A book still being read has no finished date, so it sorts above everything
 * completed -- it is the most current thing in the log.
 */
export function finishedOrder(book: Book): number {
  if (isInProgress(book)) return Number.MAX_SAFE_INTEGER;

  const parts = book.finished.trim().toLowerCase().split(/\s+/);
  const month = MONTHS.indexOf(parts[0]?.slice(0, 3) ?? '');
  const year = Number(parts[1]);

  if (!Number.isFinite(year)) return -1;
  return year * 12 + (month >= 0 ? month : 0);
}

export const PER_PAGE = 20;

/**
 * A blank `finished` is how the admin records something still being read.
 * The prototype instead wrote the literal string "in progress", so both are
 * accepted — otherwise a book entered in the prototype would silently render
 * as finished on a date called "in progress".
 */
export function isInProgress(book: Book): boolean {
  const value = book.finished.trim().toLowerCase();
  return value === '' || value === 'in progress';
}

/** What the "finished" column shows; blank entries read as "in progress". */
export function formatFinished(book: Book): string {
  return isInProgress(book) ? 'in progress' : book.finished;
}

/**
 * Rating 0 means "not rated yet", not "rated zero" — every one of the 832
 * seeded entries is currently 0 — so it must never render as empty stars.
 */
export function formatRating(rating: number): string {
  return rating > 0 ? '★'.repeat(rating) : '—';
}

/** Null when nothing is rated, so the header can hide the line entirely. */
export function averageRating(books: Book[]): number | null {
  const rated = books.filter((b) => b.rating > 0);
  if (rated.length === 0) return null;
  return rated.reduce((n, b) => n + b.rating, 0) / rated.length;
}

/**
 * `direction` defaults to the reading most people want first: newest books,
 * highest ratings, authors from A. Passing the opposite reverses it.
 */
export function sortBooks(
  books: Book[],
  mode: SortMode,
  direction: SortDirection = mode === 'author' ? 'asc' : 'desc'
): Book[] {
  const list = [...books];
  const flip = (n: number) => (direction === 'asc' ? -n : n);

  if (mode === 'rating') return list.sort((a, b) => flip(b.rating - a.rating));
  if (mode === 'author') {
    return list.sort((a, b) => flip(b.author.localeCompare(a.author)));
  }
  return list.sort((a, b) => flip(finishedOrder(b) - finishedOrder(a)));
}

export function paginate<T>(items: T[], page: number, per = PER_PAGE) {
  const pages = Math.max(1, Math.ceil(items.length / per));
  const current = Math.min(Math.max(1, page), pages);
  return {
    items: items.slice((current - 1) * per, current * per),
    page: current,
    pages,
  };
}

/**
 * Free-text search across title and author.
 *
 * Substring rather than word-prefix matching, so "poss" finds "the
 * dispossessed" and a half-remembered fragment still lands — which is how
 * someone actually looks for a book they read years ago. Order is preserved so
 * the caller's sort still decides the arrangement.
 */
export function filterBooks(books: Book[], query: string): Book[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...books];
  return books.filter(
    (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
  );
}
