import { validateContact } from '../../src/lib/validate';

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_RECIPIENT?: string;
  CONTACT_SENDER?: string;
}

/*
 * Mail failures answer 200 with ok:false, not 5xx.
 *
 * Cloudflare's proxy replaces an origin 5xx with its own branded error page,
 * discarding the response body -- so a carefully worded explanation reaches
 * the browser on the .pages.dev host and is thrown away on the custom domain,
 * exactly where it matters. The client contract is the ok flag, not the
 * status, so the message survives.
 */
const MAIL_FAILED = 200;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { name: string; email: string; message: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'bad request' }, 400);
  }

  const result = validateContact(body);
  if (!result.ok) return json(result, 422);

  // Until the mail provider is configured the honest answer is "not
  // available", never a fake success -- the page falls back to showing the
  // direct email address.
  if (!env.RESEND_API_KEY || !env.CONTACT_RECIPIENT || !env.CONTACT_SENDER) {
    return json({ ok: false, error: 'not configured' }, 503);
  }

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_SENDER,
        // Resend wants an array for multiple recipients, so a comma-separated
        // variable has to be split -- passed whole it reads as one malformed
        // address and the whole send is rejected. Splitting a single address
        // yields a one-element array, which is equally valid.
        to: env.CONTACT_RECIPIENT.split(',')
          .map((address) => address.trim())
          .filter(Boolean),
        reply_to: body.email,
        subject: `paper sky — message from ${body.name}`,
        text: `from: ${body.name} <${body.email}>\n\n${body.message}`,
      }),
    });
  } catch {
    // An unhandled throw here surfaces as a bare Cloudflare 502 with no JSON
    // and no explanation -- the same opacity as an uncaught 1101.
    return json({ ok: false, error: 'could not reach the mail service' }, MAIL_FAILED);
  }

  if (!res.ok) {
    // The provider's body can name the sender domain and the key's state, so
    // it is never echoed back. The status alone distinguishes the setup
    // mistakes that actually happen.
    const reason =
      res.status === 403
        ? 'the sender address is not verified with the mail service'
        : res.status === 401
          ? 'the mail service rejected the api key'
          : res.status === 422
            ? 'the mail service rejected the sender or recipient address'
            : `the mail service returned ${res.status}`;

    /*
     * Resend's own message names the offending domain, which is the one fact
     * that makes a rejection diagnosable. It is carried in a separate `detail`
     * field rather than the visitor-facing `error`, truncated, and never the
     * whole body -- that can echo back the request including the sender
     * configuration.
     */
    let detail = '';
    try {
      const payload = (await res.json()) as { message?: string; name?: string };
      detail = String(payload.message ?? payload.name ?? '').slice(0, 200);
    } catch {
      /* a non-JSON body tells us nothing worth surfacing */
    }

    return json({ ok: false, error: reason, detail }, MAIL_FAILED);
  }

  return json({ ok: true });
};
