import { requireSession, json } from '../lib/guard';
import { putFile, safeUploadName, GitHubError } from '../lib/github';

interface Env {
  SESSION_SECRET?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
}

/** 5MB after the browser has already downscaled; a raw phone photo is larger. */
const MAX_BYTES = 5 * 1024 * 1024;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await requireSession(request, env.SESSION_SECRET))) {
    return json({ ok: false, error: 'not signed in' }, 401);
  }
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return json({ ok: false, error: 'not configured' }, 503);
  }

  let body: { filename?: string; data?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'bad request' }, 400);
  }

  const data = body.data ?? '';
  if (!data) return json({ ok: false, error: 'no image' }, 400);

  // base64 is 4 characters per 3 bytes; check before decoding anything.
  if (Math.floor((data.length * 3) / 4) > MAX_BYTES) {
    return json({ ok: false, error: 'that image is too big' }, 413);
  }

  // The filename is rebuilt from scratch rather than sanitised, and svg/html
  // are refused -- these files are served from the site's own origin.
  const name = safeUploadName(body.filename ?? '', Date.now());
  if (!name) return json({ ok: false, error: 'unsupported image type' }, 415);

  const path = `public/uploads/${name}`;

  try {
    await putFile({
      token: env.GITHUB_TOKEN,
      repo: env.GITHUB_REPO,
      branch: env.GITHUB_BRANCH || 'main',
      path,
      content: data,
      message: `content: upload ${name}`,
    });
  } catch (err) {
    const detail = err instanceof GitHubError ? err.message : 'could not upload';
    return json({ ok: false, error: detail }, 502);
  }

  // The public URL, which is where the page will read it from.
  return json({ ok: true, url: `/uploads/${name}` });
};
