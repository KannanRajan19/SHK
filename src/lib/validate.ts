export type ContactInput = { name: string; email: string; message: string };
export type ContactResult = { ok: true } | { ok: false; errors: Record<string, string> };

export const MAX_MESSAGE = 5000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Shared by the page and the Function on purpose: if the browser and the
 * server disagreed about what counts as valid, a message could pass the form
 * and then be silently rejected by the endpoint.
 */
export function validateContact(input: ContactInput): ContactResult {
  const errors: Record<string, string> = {};
  if (!input.name?.trim()) errors.name = 'please add your name';
  if (!input.email?.trim()) errors.email = 'please add your email';
  else if (!EMAIL.test(input.email.trim())) errors.email = "that email doesn't look right";
  if (!input.message?.trim()) errors.message = 'please write a message';
  else if (input.message.length > MAX_MESSAGE) errors.message = 'that message is too long';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}
