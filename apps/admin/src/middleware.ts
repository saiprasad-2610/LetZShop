import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('letzshop_admin_session')?.value;
  const login = new URL('/login', req.url);
  if (!token) return NextResponse.redirect(login);
  try {
    const base = (
      process.env.ADMIN_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4000'
    )
      .replace(/\/api\/v1\/?$/, '')
      .replace(/\/+$/, '');
    const response = await fetch(`${base}/admin/session`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (response.ok) {
      const next = NextResponse.next();
      next.headers.set('Cache-Control', 'private, no-store');
      return next;
    }
    if (![401, 403].includes(response.status))
      return new NextResponse(
        'Admin service temporarily unavailable. Please retry.',
        { status: 503 },
      );
  } catch {
    return new NextResponse(
      'Admin service temporarily unavailable. Please retry.',
      { status: 503 },
    );
  }
  const response = NextResponse.redirect(login);
  response.cookies.delete('letzshop_admin_session');
  return response;
}
export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|login).*)'],
};
