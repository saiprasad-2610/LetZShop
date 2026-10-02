import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingBag, ArrowRight, Store, Search, Sparkles, Globe } from 'lucide-react';

export default function StorefrontDirectoryPage() {
  const router = useRouter();
  const [storeSlug, setStoreSlug] = useState('');

  const handleGoToStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSlug.trim()) return;
    router.push(`/store/${storeSlug.trim().toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Head>
        <title>Simply E-Commerce | Storefront Portal</title>
      </Head>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gray-900 text-white font-black text-sm flex items-center justify-center">
              S
            </span>
            <span className="font-bold text-lg text-gray-900 tracking-tight">
              Simply E-Commerce
            </span>
          </div>

          <a
            href="http://localhost:3001"
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
          >
            Seller Dashboard →
          </a>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-8 flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Tenant Indian SaaS Storefront Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Every Business Gets Its Own Digital Identity.
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
          Enter any registered merchant store slug to explore their customized storefront, product catalog, and express checkout.
        </p>

        {/* Store Slug Direct Navigator */}
        <form onSubmit={handleGoToStore} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto w-full">
          <div className="relative flex-1">
            <span className="absolute left-3 top-3 text-xs text-gray-400 font-mono">/store/</span>
            <input
              type="text"
              placeholder="e.g. royal-heritage or urban-threads"
              value={storeSlug}
              onChange={(e) => setStoreSlug(e.target.value)}
              className="w-full pl-16 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>Visit Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Stores Quick Links */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Seeded Demo Stores
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/store/royal-heritage"
              className="px-4 py-2 bg-white border border-gray-300 hover:border-gray-900 rounded-xl text-xs font-semibold text-gray-800 transition shadow-sm flex items-center gap-2"
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Royal Heritage (Jewellery)</span>
            </Link>

            <Link
              href="/store/urban-threads"
              className="px-4 py-2 bg-white border border-gray-300 hover:border-gray-900 rounded-xl text-xs font-semibold text-gray-800 transition shadow-sm flex items-center gap-2"
            >
              <Store className="w-3.5 h-3.5 text-indigo-600" />
              <span>Urban Threads (Fashion)</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-200 bg-white">
        © 2026 Simply E-Commerce Platform. DPDPA 2023 Compliant.
      </footer>
    </div>
  );
}
