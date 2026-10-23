import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { SellerLocaleProvider, type SupportedLocale } from '@simply/i18n';
import '../styles/globals.css';

function SellerI18nWrapper({ children }: { children: React.ReactNode }) {
  const { user, api } = useAuth();

  const handleLocaleChange = async (newLocale: SupportedLocale) => {
    try {
      if (user) {
        await api.seller.updatePreferences({ preferredLocale: newLocale });
      }
    } catch {
      // Non-blocking
    }
  };

  return (
    <SellerLocaleProvider
      userLocale={user?.preferredLocale}
      onLocaleChange={handleLocaleChange}
    >
      {children}
    </SellerLocaleProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register PWA service worker safely
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
      });
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </Head>
      <ThemeProvider>
        <AuthProvider>
          <SellerI18nWrapper>
            <Component {...pageProps} />
          </SellerI18nWrapper>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
