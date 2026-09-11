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
export const onRequestPost: PagesFunction = async () => {
  // Max-Age=0 with matching attributes is what actually removes a cookie.
  // Both must go, or the marker would keep offering an editor that no longer works.
  const expire = 'Secure; SameSite=Lax; Path=/; Max-Age=0';
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', `ps_session=; HttpOnly; ${expire}`);
  headers.append('Set-Cookie', `ps_editor=; ${expire}`);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};
