import { validateContact } from '../../src/lib/validate';

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_RECIPIENT?: string;
  CONTACT_SENDER?: string;
}

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

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_SENDER,
      to: env.CONTACT_RECIPIENT,
      reply_to: body.email,
      subject: `paper sky — message from ${body.name}`,
      text: `from: ${body.name} <${body.email}>\n\n${body.message}`,
    }),
  });

  // The provider's error body can leak configuration detail, so it is never
  // echoed back to the browser.
  if (!res.ok) return json({ ok: false, error: 'could not send' }, 502);
  return json({ ok: true });
};
