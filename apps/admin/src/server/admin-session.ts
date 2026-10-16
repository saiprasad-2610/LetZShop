import type { NextApiRequest, NextApiResponse } from 'next';

export const ADMIN_COOKIE = 'letzshop_admin_session';
export const backendUrl = (
  process.env.ADMIN_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000'
)
  .replace(/\/api\/v1\/?$/, '')
  .replace(/\/+$/, '');
export function sessionCookie(token: string, maxAge = 900) {
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function allowMutation(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;
  const secFetchSite = req.headers['sec-fetch-site'];

  let sameOrigin = false;
  if (secFetchSite === 'same-origin') {
    sameOrigin = true;
  } else if (origin) {
    try {
      sameOrigin = Boolean(new URL(origin).host === host);
    } catch {}
  } else if (referer) {
    try {
      sameOrigin = Boolean(new URL(referer).host === host);
    } catch {}
  }

  if (!sameOrigin) {
    res.status(403).json({ message: 'Same-origin request required.' });
    return false;
  }
  return true;
}
export async function backend(
  path: string,
  token?: string,
  options: RequestInit = {},
) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${backendUrl}/${path}`, {
    ...options,
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
}
