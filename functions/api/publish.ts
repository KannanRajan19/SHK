import { requireSession, json } from '../lib/guard';
import {
  putFile, deleteFile, getJson, toBase64, isAllowedPath, GitHubError,
} from '../lib/github';

type Patch = { path: string; values: Record<string, unknown> };
type BookOp = {
  remove?: { title: string; author: string };
  update?: { match: { title: string; author: string }; values: Record<string, unknown> };
};
type BookRow = { title: string; author: string; [k: string]: unknown };

interface Env {
  SESSION_SECRET?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
}

type FileWrite = { path: string; json: unknown };

const MAX_FILES = 20;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await requireSession(request, env.SESSION_SECRET))) {
    return json({ ok: false, error: 'not signed in' }, 401);
  }
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return json({ ok: false, error: 'not configured' }, 503);
  }

  let body: {
    files?: FileWrite[];
    deletes?: string[];
    patches?: Patch[];
    books?: BookOp;
    message?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'bad request' }, 400);
  }

  const files = body.files ?? [];
  const deletes = body.deletes ?? [];
  const patches = body.patches ?? [];
  const books = body.books;

  if (files.length === 0 && deletes.length === 0 && patches.length === 0 && !books) {
    return json({ ok: false, error: 'nothing to publish' }, 400);
  }
  if (files.length + deletes.length > MAX_FILES) {
    return json({ ok: false, error: 'too many files' }, 413);
  }

  // Validate every path before touching any of them, so a bad path in the
  // middle of a batch cannot leave a half-applied publish behind.
  for (const file of files) {
    if (typeof file?.path !== 'string' || !isAllowedPath(file.path)) {
      return json({ ok: false, error: 'path not allowed' }, 400);
    }
  }
  for (const path of deletes) {
    if (typeof path !== 'string' || !isAllowedPath(path)) {
      return json({ ok: false, error: 'path not allowed' }, 400);
    }
  }
  for (const patch of patches) {
    if (typeof patch?.path !== 'string' || !isAllowedPath(patch.path)) {
      return json({ ok: false, error: 'path not allowed' }, 400);
    }
  }

  const branch = env.GITHUB_BRANCH || 'main';
  const message = typeof body.message === 'string' && body.message.trim()
    ? body.message.slice(0, 120)
    : 'content: update from admin';

  try {
    for (const file of files) {
      await putFile({
        token: env.GITHUB_TOKEN,
        repo: env.GITHUB_REPO,
        branch,
        path: file.path,
        content: toBase64(`${JSON.stringify(file.json, null, 2)}\n`),
        message,
      });
    }
    const repoArgs = { token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO, branch };

    // Patches merge into whatever is on the branch now, so a field the editor
    // never displayed cannot be reverted by a stale page.
    for (const patch of patches) {
      const current = await getJson<Record<string, unknown>>({ ...repoArgs, path: patch.path });
      if (current === null) throw new Error('that entry no longer exists');
      await putFile({
        ...repoArgs,
        path: patch.path,
        content: toBase64(`${JSON.stringify({ ...current, ...patch.values }, null, 2)}
`),
        message,
      });
    }

    if (books) {
      const path = 'content/books.json';
      const log = (await getJson<BookRow[]>({ ...repoArgs, path })) ?? [];
      let next = log;

      if (books.remove) {
        const { title, author } = books.remove;
        let done = false;
        // Only the first match: duplicate titles are legitimate in a reading log.
        next = log.filter((b) => {
          if (!done && b.title === title && b.author === author) {
            done = true;
            return false;
          }
          return true;
        });
        if (!done) throw new Error('that book is no longer in the log');
      } else if (books.update) {
        const { match, values } = books.update;
        let done = false;
        next = log.map((b) => {
          if (!done && b.title === match.title && b.author === match.author) {
            done = true;
            return { ...b, ...values };
          }
          return b;
        });
        if (!done) throw new Error('that book is no longer in the log');
      }

      await putFile({
        ...repoArgs,
        path,
        content: toBase64(`${JSON.stringify(next, null, 2)}
`),
        message,
      });
    }

    // Deletions run after writes: if a write fails the entry is still intact,
    // which is the safer half-applied state to be left in.
    for (const path of deletes) {
      await deleteFile({
        token: env.GITHUB_TOKEN,
        repo: env.GITHUB_REPO,
        branch,
        path,
        message,
      });
    }
  } catch (err) {
    // Says what went wrong without echoing GitHub's body, which can name the
    // repo and the token's scope.
    const detail = err instanceof GitHubError ? err.message : 'could not publish';
    return json({ ok: false, error: detail }, 502);
  }

  return json({
    ok: true,
    files: files.length,
    patched: patches.length,
    deleted: deletes.length,
  });
};
