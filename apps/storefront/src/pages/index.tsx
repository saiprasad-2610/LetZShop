import React from 'react';
import Head from 'next/head';
import { ArrowRight, Store, KeyRound, ShieldCheck } from 'lucide-react';
import { getSellerUrl } from '../utils/config';

/**
 * Simply E-Commerce Platform Landing Page (Root `/`)
 * 
 * Flow 01: Merchant Authentication + Onboarding Entry
 * 
 * Functional merchant entry points:
 * - "Create My Store" -> New merchant registration (/login?mode=register)
 * - "Merchant Login" -> Returning merchant PIN login (/login)
 */
export default function PlatformLandingPage() {
  const sellerUrl = getSellerUrl();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between selection:bg-stone-200 font-sans">
      <Head>
        <title>Simply E-Commerce — Merchant Platform</title>
        <meta
          name="description"
          content="The direct commerce platform empowering independent merchants with custom store design, atomic inventory control, and verified seller operations."
        />
      </Head>

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-stone-900 text-stone-50 font-black text-sm flex items-center justify-center tracking-tight shadow-sm">
              S
            </span>
            <span className="font-bold text-lg tracking-tight text-stone-900">
              Simply <span className="text-stone-400 font-normal text-sm">Platform</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`${sellerUrl}/login`}
              className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-950 transition"
            >
              Merchant Login
            </a>
            <a
              href={`${sellerUrl}/login?mode=register`}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <span>Create My Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-3xl mx-auto px-6 py-24 flex-1 flex flex-col justify-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mx-auto shadow-xs">
          <Store className="w-3.5 h-3.5 text-blue-600" />
          <span>Independent Merchant Platform</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-950 tracking-tight leading-[1.15]">
            Start and manage your digital store in seconds.
          </h1>
          <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto leading-relaxed">
            Fast OTP registration, quick PIN login, and a dedicated workspace to launch and scale your online business.
          </p>
        </div>

        {/* Primary Action Card */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto w-full">
          <a
            href={`${sellerUrl}/login?mode=register`}
            className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition shadow-md flex items-center justify-center gap-2"
          >
            <Store className="w-4 h-4" />
            <span>Create My Store</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </a>

          <a
            href={`${sellerUrl}/login`}
            className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 text-sm font-bold transition shadow-xs flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-stone-600" />
            <span>Merchant Login</span>
          </a>
        </div>

        {/* Feature Badges */}
        <div className="pt-8 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <span className="text-xs font-bold text-stone-900 block mb-1">Instant Registration</span>
            <p className="text-xs text-stone-500">Sign up using your mobile number and verified OTP in under a minute.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <span className="text-xs font-bold text-stone-900 block mb-1">Fast PIN Login</span>
            <p className="text-xs text-stone-500">Daily access with a fast 4–6 digit security PIN and account recovery.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-stone-200">
            <span className="text-xs font-bold text-stone-900 block mb-1">Protected Store Creation</span>
            <p className="text-xs text-stone-500">Transactional setup of your business identity and store presence.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 px-6 text-center text-xs text-stone-500">
        <p>© 2026 Simply E-Commerce. All rights reserved.</p>
      </footer>
    </div>
  );
}
