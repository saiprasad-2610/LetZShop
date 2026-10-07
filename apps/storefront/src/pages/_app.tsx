import type { AppProps } from 'next/app';
import Head from 'next/head';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../components/ui/Toast';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <CartProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <link rel="manifest" href="/manifest.json" />
        </Head>
        <Component {...pageProps} />
      </CartProvider>
    </ToastProvider>
  );
}
