import { requireSession, json } from '../lib/guard';

interface Env {
  SESSION_SECRET?: string;
}

/**
 * Whether the caller holds a valid editing session.
 *
 * The edit UI on public pages asks this before rendering anything. A marker
 * cookie alone is not trusted -- it only decides whether to bother asking.
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) =>
  json({ ok: await requireSession(request, env.SESSION_SECRET) });
