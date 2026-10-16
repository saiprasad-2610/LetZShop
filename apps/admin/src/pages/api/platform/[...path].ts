import type { NextApiRequest, NextApiResponse } from 'next';
import {
  ADMIN_COOKIE,
  allowMutation,
  backend,
  sessionCookie,
} from '../../../server/admin-session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'no-store');
  if (!allowMutation(req, res)) return;
  const token = req.cookies[ADMIN_COOKIE];
  if (!token) return res.status(401).json({ message: 'Please log in.' });
  const parts = req.query.path as string[];
  if (
    !parts?.length ||
    parts[0] !== 'admin' ||
    parts.some((p) => !p || p === '.' || p === '..' || /[\\/]/.test(p))
  )
    return res.status(404).end();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query))
    if (key !== 'path' && typeof value === 'string') query.set(key, value);
  try {
    const response = await backend(
      parts.map(encodeURIComponent).join('/') +
        (query.size ? '?' + query.toString() : ''),
      token,
      {
        method: req.method,
        body: ['GET', 'HEAD'].includes(req.method || 'GET')
          ? undefined
          : JSON.stringify(req.body),
      },
    );
    if ([401, 403].includes(response.status))
      res.setHeader('Set-Cookie', sessionCookie('', 0));
    return res.status(response.status).json(await response.json());
  } catch {
    return res
      .status(503)
      .json({ message: 'Admin service is unavailable. Please try again.' });
  }
}
