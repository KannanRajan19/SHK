/**
 * Working out what a deletion should actually remove.
 *
 * Kept separate from the DOM so it can be tested directly — getting this wrong
 * either orphans image files forever or, worse, deletes one still in use.
 */

export type DeletableEntry = {
  id: string;
  title: string;
  date: string;
  /** doodles and pictures carry one image; posts carry several, in blocks. */
  image?: string;
  images?: string[];
};

/** Every upload an entry points at, whether it stores one image or many. */
export function entryImages(entry: DeletableEntry): string[] {
  const all = [entry.image, ...(entry.images ?? [])];
  return all.filter(
    (img): img is string => typeof img === 'string' && img.startsWith('/uploads/')
  );
}

/**
 * The repo paths to delete for one entry: its content file, plus any image it
 * owns outright. An image referenced by another entry is left alone — removing
 * it would break that entry with nothing on screen to explain why.
 */
export function deletionPaths(
  contentPath: string,
  entry: DeletableEntry,
  imageUsage: Record<string, number>
): string[] {
  const images = entryImages(entry)
    .filter((img) => (imageUsage[img] ?? 0) <= 1)
    .map((img) => `public${img}`);

  // De-duplicate: a post can legitimately use the same image twice.
  return [...new Set([contentPath, ...images])];
}

/**
 * Books live as rows in one JSON file rather than as files, so "deleting" one
 * means rewriting the array without it. Matching on title+author rather than
 * index keeps the right row even if the log shifted underneath.
 */
export function removeBook<T extends { title: string; author: string }>(
  books: T[],
  title: string,
  author: string
): T[] {
  let removed = false;
  return books.filter((b) => {
    if (!removed && b.title === title && b.author === author) {
      removed = true; // only the first match, never every duplicate
      return false;
    }
    return true;
  });
}

/** Case-insensitive search across title and author, for the 832-entry log. */
export function searchBooks<T extends { title: string; author: string }>(
  books: T[],
  query: string,
  limit = 25
): T[] {
  const q = query.trim().toLowerCase();
  if (q === '') return books.slice(0, limit);
  return books
    .filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    .slice(0, limit);
}
