import { requireSession, json } from '../lib/guard';
import { putFile, deleteFile, toBase64, isAllowedPath, GitHubError } from '../lib/github';

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

  let body: { files?: FileWrite[]; deletes?: string[]; message?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'bad request' }, 400);
  }

  const files = body.files ?? [];
  const deletes = body.deletes ?? [];

  if (files.length === 0 && deletes.length === 0) {
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

  return json({ ok: true, files: files.length, deleted: deletes.length });
};
