/**
 * Clears the admin session.
 *
 * This has to be a server endpoint: the session cookie is HttpOnly precisely
 * so page scripts cannot touch it, which means the browser cannot clear it
 * either. Only a Set-Cookie from the server can.
 *
 * No session check — logging out when already logged out is not an error, and
 * refusing would leave someone stuck with a cookie they cannot clear.
 */
export const onRequestPost: PagesFunction = async () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Max-Age=0 with the same attributes is what actually removes it.
      'Set-Cookie': 'ps_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    },
  });
