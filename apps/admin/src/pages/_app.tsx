import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { AdminThemeProvider } from '../context/AdminThemeContext';
import { AdminAttentionProvider } from '../context/AdminAttentionContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AdminThemeProvider>
      <AdminAuthProvider>
        <AdminAttentionProvider>
          <Head>
            <title>LetzShop Admin</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" sizes="any" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          </Head>
          <Component {...pageProps} />
        </AdminAttentionProvider>
      </AdminAuthProvider>
    </AdminThemeProvider>
  );
}
