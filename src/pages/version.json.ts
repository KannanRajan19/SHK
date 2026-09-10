import type { APIRoute } from 'astro';

/**
 * A static build stamp at /version.json.
 *
 * Cloudflare exposes the commit it built from as CF_PAGES_COMMIT_SHA during
 * the build. Emitting it here makes "is my fix actually deployed?" a question
 * with an answer -- without it, the only way to tell one deployment from
 * another is to guess from behaviour.
 *
 * Nothing secret: the repository is public and the commit is already visible
 * on GitHub.
 */
export const GET: APIRoute = () => {
  const body = {
    commit: process.env.CF_PAGES_COMMIT_SHA ?? 'local',
    branch: process.env.CF_PAGES_BRANCH ?? 'local',
    builtAt: new Date().toISOString(),
  };

  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: {
      'Content-Type': 'application/json',
      // Always revalidate: a cached stamp would defeat the purpose.
      'Cache-Control': 'no-store',
    },
  });
};
