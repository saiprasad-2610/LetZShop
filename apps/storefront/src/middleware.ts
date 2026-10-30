import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'seller',
  'app',
  'mail',
  'email',
  'support',
  'status',
  'static',
  'assets',
  'cdn',
  'media',
  'help',
  'docs',
  'billing',
  'auth',
  'login',
]);

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // 1. Skip system paths, assets, APIs, and permanent QR redirect paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/q/') ||
    pathname.includes('.') // static files like favicon.ico, images, robots.txt
  ) {
    return NextResponse.next();
  }

  // 2. Extract and sanitize hostname
  const hostHeader = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const hostname = hostHeader.split(':')[0].toLowerCase();

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'letzshop.store';

  // 3. Resolve tenant subdomain or custom domain
  let tenantIdentifier: string | null = null;

  if (hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.replace(`.${rootDomain}`, '');
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
      tenantIdentifier = sub;
    }
  } else if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
      tenantIdentifier = sub;
    }
  } else if (
    hostname !== rootDomain &&
    hostname !== `www.${rootDomain}` &&
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1'
  ) {
    // Custom domain support (e.g. www.sairamtea.com or sairamtea.com)
    tenantIdentifier = hostname;
  }

  // 4. If merchant subdomain or custom domain is detected, route seamlessly
  if (tenantIdentifier) {
    // If the URL contains redundant /store/:slug, redirect to clean root path
    if (pathname.startsWith(`/store/${tenantIdentifier}`)) {
      const cleanPath = pathname.replace(`/store/${tenantIdentifier}`, '') || '/';
      url.pathname = cleanPath;
      return NextResponse.redirect(url, 308);
    }

    // Rewrite clean route into the internal /store/[slug] directory
    // e.g. / -> /store/sairamtea
    // e.g. /cart -> /store/sairamtea/cart
    // e.g. /product/123 -> /store/sairamtea/product/123
    const rewrittenPath = `/store/${tenantIdentifier}${pathname === '/' ? '' : pathname}`;
    const rewriteUrl = new URL(rewrittenPath, req.url);

    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set('x-tenant-identifier', tenantIdentifier);
    response.headers.set('x-content-type-options', 'nosniff');
    return response;
  }

  // 5. Default platform behavior for root domain (letzshop.store / localhost:3000)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
