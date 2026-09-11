/**
 * Committing content to the repo on the owner's behalf.
 *
 * Every path here originates in the browser, so nothing is trusted: writes
 * are confined to the two directories the admin is allowed to touch, and
 * upload filenames are rebuilt rather than sanitised in place.
 */

const ALLOWED_PREFIXES = ['content/', 'public/uploads/'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export function isAllowedPath(path: string): boolean {
  if (path.startsWith('/') || path.includes('..') || path.includes('\\')) return false;
  // A prefix on its own is a directory, not a file worth writing.
  return ALLOWED_PREFIXES.some((p) => path.startsWith(p) && path.length > p.length);
}

/**
 * Builds an upload filename from scratch. SVG and HTML are excluded on
 * purpose: both can carry script, and these files are served from the site's
 * own origin.
 */
export function safeUploadName(original: string, stamp: number): string | null {
  const base = original.split(/[/\\]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return null;

  const ext = base.slice(dot + 1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return null;

  const slug = base
    .slice(0, dot)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return `${stamp}-${slug || 'image'}.${ext}`;
}

export type PutArgs = {
  token: string;
  repo: string;
  branch: string;
  path: string;
  /** Base64. Text and images take the same path because the API wants base64. */
  content: string;
  message: string;
};

export async function putFile({
  token, repo, branch, path, content, message,
}: PutArgs): Promise<void> {
  if (!isAllowedPath(path)) throw new Error('path not allowed');

  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'paper-sky-admin',
  };

  // Replacing an existing file requires its current blob sha.
  const existing = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
  const sha = existing.ok ? ((await existing.json()) as { sha: string }).sha : undefined;

  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content, branch, ...(sha ? { sha } : {}) }),
  });

  if (!res.ok) throw new GitHubError(res.status);
}

/**
 * Carries the status so the caller can say something a non-technical owner can
 * act on. An expired token is the single most likely failure a year from now,
 * and "could not publish" gives no clue that the fix is regenerating it.
 */
export class GitHubError extends Error {
  constructor(readonly status: number) {
    super(describeGitHubStatus(status));
  }
}

export function describeGitHubStatus(status: number): string {
  if (status === 401) return 'the github token is invalid — it has probably expired';
  if (status === 403) return 'the github token is missing write permission for this repo';
  if (status === 404) return 'the repo or branch was not found — check GITHUB_REPO and GITHUB_BRANCH';
  if (status === 409) return 'something else changed this file at the same time — try again';
  if (status === 422) return 'github rejected the file contents';
  return `github returned ${status}`;
}

/** UTF-8 safe base64: btoa alone mangles anything outside Latin-1. */
export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Which uploaded images can safely be deleted along with their entry.
 *
 * Deleting an entry should take its image with it. But if another entry points
 * at the same upload, removing the file would leave that one showing a broken
 * image with nothing to explain it — so a shared image is kept. `usage` is a
 * map of image path to how many entries reference it, built at page render.
 */
export function unusedImagePaths(
  images: (string | undefined)[],
  usage: Record<string, number>
): string[] {
  return images
    .filter((img): img is string => typeof img === 'string' && img.startsWith('/uploads/'))
    .filter((img) => (usage[img] ?? 0) <= 1)
    .map((img) => `public${img}`);
}

/**
 * Removes a file. The contents API needs the current blob sha, so this reads
 * before it writes; a file that is already gone is treated as success, since
 * the caller's intent — that it not exist — is satisfied either way.
 */
export async function deleteFile({
  token, repo, branch, path, message,
}: Omit<PutArgs, 'content'>): Promise<void> {
  if (!isAllowedPath(path)) throw new Error('path not allowed');

  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'paper-sky-admin',
  };

  const existing = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
  if (existing.status === 404) return;
  if (!existing.ok) throw new GitHubError(existing.status);

  const { sha } = (await existing.json()) as { sha: string };
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch }),
  });
  if (!res.ok) throw new GitHubError(res.status);
}

/**
 * Reads a JSON file from the repo. Returns null when absent.
 *
 * Editing needs read-modify-write: the browser sends only the fields that
 * changed, so the server must load the current file to merge into. Sending the
 * whole entry from the client instead would let a stale page silently revert
 * fields it never showed.
 */
export async function getJson<T>(
  { token, repo, branch, path }: Omit<PutArgs, 'content' | 'message'>
): Promise<T | null> {
  if (!isAllowedPath(path)) throw new Error('path not allowed');

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.raw+json',
        'User-Agent': 'paper-sky-admin',
      },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubError(res.status);
  return (await res.json()) as T;
}
