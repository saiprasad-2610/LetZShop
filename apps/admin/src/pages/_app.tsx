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
          </Head>
          <Component {...pageProps} />
        </AdminAttentionProvider>
      </AdminAuthProvider>
    </AdminThemeProvider>
  );
}
