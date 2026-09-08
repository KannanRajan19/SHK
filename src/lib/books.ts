export type Book = {
  title: string;
  author: string;
  finished: string;
  rating: number;
  note: string;
};

export type SortMode = 'recent' | 'rating' | 'author';

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

export function sortBooks(books: Book[], mode: SortMode): Book[] {
  const list = [...books];
  if (mode === 'recent') {
    // books.json is already newest-first, so "recent" must not re-sort it.
    // The only adjustment is lifting anything still in progress to the top.
    return [...list.filter(isInProgress), ...list.filter((b) => !isInProgress(b))];
  }
  if (mode === 'rating') return list.sort((a, b) => b.rating - a.rating);
  return list.sort((a, b) => a.author.localeCompare(b.author));
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
