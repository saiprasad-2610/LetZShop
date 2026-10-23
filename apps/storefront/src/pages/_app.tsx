import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../components/ui/Toast';
import { StorefrontLocaleProvider } from '@simply/i18n';
import '../styles/globals.css';

function StorefrontAppLocaleWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const slug =
    typeof router.query.slug === 'string'
      ? router.query.slug
      : router.asPath.startsWith('/store/')
      ? router.asPath.split('/')[2]?.split('?')[0] || ''
      : '';

  if (router.asPath.startsWith('/store/')) {
    return (
      <StorefrontLocaleProvider storeSlug={slug}>
        {children}
      </StorefrontLocaleProvider>
    );
  }
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <StorefrontAppLocaleWrapper>
        <ToastProvider>
          <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            <link rel="icon" href="/favicon.ico" sizes="any" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
            <link rel="manifest" href="/manifest.json" />
          </Head>
          <Component {...pageProps} />
        </ToastProvider>
      </StorefrontAppLocaleWrapper>
    </CartProvider>
  );
}
