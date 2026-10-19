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
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = req.cookies[ADMIN_COOKIE] || bearerToken;
  const parts = req.query.path as string[];
  const isPublicAuth =
    parts?.length === 3 &&
    parts[0] === 'auth' &&
    parts[1] === 'admin' &&
    parts[2] === 'activate';

  if (!isPublicAuth) {
    if (!token) return res.status(401).json({ message: 'Please log in.' });
    if (
      !parts?.length ||
      parts[0] !== 'admin' ||
      parts.some((p) => !p || p === '.' || p === '..' || /[\\/]/.test(p))
    )
      return res.status(404).end();
  }
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
    if (response.status === 401)
      res.setHeader('Set-Cookie', sessionCookie('', 0));

    const contentType = response.headers.get('content-type') || '';
    const isBinary =
      contentType.includes('application/pdf') ||
      contentType.startsWith('image/') ||
      contentType.includes('application/octet-stream');

    if (isBinary) {
      res.setHeader('Content-Type', contentType);
      const disposition = response.headers.get('content-disposition');
      if (disposition) res.setHeader('Content-Disposition', disposition);
      const contentLength = response.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);
      const etag = response.headers.get('etag');
      if (etag) res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'private, no-store');

      const arrayBuffer = await response.arrayBuffer();
      return res.status(response.status).send(Buffer.from(arrayBuffer));
    }

    if (contentType.includes('application/json')) {
      return res.status(response.status).json(await response.json());
    }

    const arrayBuffer = await response.arrayBuffer();
    if (contentType) res.setHeader('Content-Type', contentType);
    return res.status(response.status).send(Buffer.from(arrayBuffer));
  } catch {
    return res
      .status(503)
      .json({ message: 'Admin service is unavailable. Please try again.' });
  }
}
