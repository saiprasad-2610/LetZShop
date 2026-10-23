import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('letzshop_admin_session')?.value;
  const login = new URL('/login', req.url);
  if (!token) return NextResponse.redirect(login);
  const candidateUrls = [
    process.env.ADMIN_API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://127.0.0.1:4000',
    'http://localhost:4000',
  ]
    .filter(Boolean)
    .map((url) => (url as string).replace(/\/api\/v1\/?$/, '').replace(/\/+$/, ''));

  const uniqueUrls = [...new Set(candidateUrls)];

  for (const base of uniqueUrls) {
    try {
      const response = await fetch(`${base}/admin/session`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const next = NextResponse.next();
        next.headers.set('Cache-Control', 'private, no-store');
        return next;
      }

      if ([401, 403].includes(response.status)) {
        const redirectRes = NextResponse.redirect(login);
        redirectRes.cookies.delete('letzshop_admin_session');
        return redirectRes;
      }
    } catch {
      // Continue to next candidate URL before failing
    }
  }

  return new NextResponse(
    'Admin service temporarily unavailable. Please retry.',
    { status: 503 },
  );
}
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.*|apple-touch-icon.*|icon-.*|manifest.json|images/|login).*)',
  ],
};
