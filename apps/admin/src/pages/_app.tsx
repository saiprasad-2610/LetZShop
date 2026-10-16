import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { AdminThemeProvider } from '../context/AdminThemeContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AdminThemeProvider>
      <AdminAuthProvider>
        <Head>
          <title>LetzShop Admin</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Component {...pageProps} />
      </AdminAuthProvider>
    </AdminThemeProvider>
  );
}
