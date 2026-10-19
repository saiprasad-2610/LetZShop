import type { NextApiRequest, NextApiResponse } from 'next';
import {
  ADMIN_COOKIE,
  allowMutation,
  backend,
  sessionCookie,
} from '../../server/admin-session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end();
  }
  if (!allowMutation(req, res)) return;
  try {
    if (req.method === 'POST') {
      const response = await backend('auth/admin/login', undefined, {
        method: 'POST',
        body: JSON.stringify({
          identifier: req.body?.identifier,
          secret: req.body?.secret,
        }),
      });
      const json = await response.json();
      const data = json.data || json;
      if (!response.ok) return res.status(response.status).json(json);
      if (!data.user?.isPlatformAdmin && data.user?.role !== 'PLATFORM_ADMIN')
        return res
          .status(403)
          .json({ message: 'Platform administrator access required.' });
      res.setHeader(
        'Set-Cookie',
        sessionCookie(data.accessToken, data.expiresIn),
      );
      return res.json({ user: data.user });
    }
    const token = req.cookies[ADMIN_COOKIE];
    if (req.method === 'DELETE') {
      res.setHeader('Set-Cookie', sessionCookie('', 0));
      if (token)
        await backend('auth/logout', token, {
          method: 'POST',
          body: JSON.stringify({}),
        });
      return res.json({ success: true });
    }
    if (!token) return res.status(401).json({ message: 'Please log in.' });
    const response = await backend('admin/session', token);
    const json = await response.json();
    if (response.status === 401)
      res.setHeader('Set-Cookie', sessionCookie('', 0));
    return res.status(response.status).json(json.data || json);
  } catch {
    return res
      .status(503)
      .json({ message: 'Admin service is unavailable. Please try again.' });
  }
}
