import React, { useState } from 'react';
import Head from 'next/head';
import {
  Store,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Zap,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  Globe,
  Truck,
  Lock,
  BarChart3,
  Layers,
  Eye,
  MessageCircle,
  Check,
  Palette,
  Clock,
  DollarSign,
  Share2
} from 'lucide-react';
import { getSellerUrl } from '../utils/config';

/**
 * Letz Shop Platform Landing Page (Root `/`)
 * Domain: letzshop.store
 * 
 * Next-Gen E-Commerce Operating System for independent merchants,
 * artisanal brands, boutique creators, and growing businesses.
 */
export default function PlatformLandingPage() {
  const sellerUrl = getSellerUrl();
  const [storeHandle, setStoreHandle] = useState('');
  const [activeThemeTab, setActiveThemeTab] = useState<'horizon' | 'canvas' | 'aura' | 'modern'>('horizon');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const cleanHandle = storeHandle
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 30);

  const handleClaimStore = (e: React.FormEvent) => {
    e.preventDefault();
    const query = cleanHandle ? `&storeName=${encodeURIComponent(cleanHandle)}` : '';
    window.location.href = `${sellerUrl}/login?mode=register${query}`;
  };

  const themes = [
    {
      id: 'horizon',
      name: 'Horizon Widescreen',
      tagline: 'Cinematic Widescreen Panorama',
      description: 'Ultra-wide editorial layouts designed for high-fashion, apparel, and lifestyle brands with full-width photography.',
      palette: ['#0f172a', '#3b82f6', '#f8fafc'],
      badge: 'Popular for Fashion & Streetwear',
      features: ['Full-width 16:9 4K hero banners', 'Floating glass action header', 'Edge-to-edge product showcase']
    },
    {
      id: 'canvas',
      name: 'Canvas Atelier',
      tagline: 'Artisanal Heritage & Storytelling',
      description: 'Warm, refined typography and tactile presentation tailored for gourmet tea, artisanal coffee, and crafted goods.',
      palette: ['#451a03', '#d97706', '#fef3c7'],
      badge: 'Crafted for Artisans & Specialty Foods',
      features: ['Luxury serif typography pairings', 'Craft storytelling hero cards', 'Subtle amber & gold accent touches']
    },
    {
      id: 'aura',
      name: 'Aura Noir',
      tagline: 'Ultra-Modern Dark Mode Luxury',
      description: 'Sleek, atmospheric dark aesthetic created for designer accessories, premium tech, and luxury collector items.',
      palette: ['#000000', '#10b981', '#18181b'],
      badge: 'Designed for Tech & Jewelry',
      features: ['OLED deep-black background', 'Vibrant emerald glow indicators', 'Minimalist high-contrast card styling']
    },
    {
      id: 'modern',
      name: 'Neo Clean',
      tagline: 'Rapid Multi-Category Retail',
      description: 'High-density, conversion-optimized grid built for fast grocery, health, beauty, and rapid daily essentials.',
      palette: ['#1e1b4b', '#6366f1', '#e0e7ff'],
      badge: 'Optimized for Fast Moving Goods',
      features: ['Instant add-to-bag with micro-animations', 'Sticky mobile navigation bar', 'Dynamic badge promotion filters']
    }
  ];

  const faqs = [
    {
      question: 'How does my store link work on letzshop.store?',
      answer: 'Every merchant instantly receives a dedicated subdomain at yourbrand.letzshop.store (e.g. sairamtea.letzshop.store) with high-speed global CDN delivery and automatic SSL encryption. You can also connect your own custom root domain (like yourbrand.com) anytime with zero downtime.'
    },
    {
      question: 'Do I need any technical, coding, or graphic design skills?',
      answer: 'Zero coding required! Letz Shop is fully visual. You can upload products, set pricing, adjust store colors, and change hero banners with our built-in Brand Studio in seconds. We automatically validate image resolutions to ensure your storefront looks ultra-crisp.'
    },
    {
      question: 'What payment options do my customers get during checkout?',
      answer: 'Letz Shop supports instant 1-tap checkout with Razorpay, UPI (Google Pay, PhonePe, Paytm, CRED), credit/debit cards, net banking, and Cash on Delivery (COD). Customers can also opt to place orders directly over WhatsApp with pre-filled cart details.'
    },
    {
      question: 'How fast do I receive payments in my bank account?',
      answer: 'Payouts are deposited directly into your linked bank account via standard settlement schedules. There are no surprise deduction fees or arbitrary account freezes.'
    },
    {
      question: 'Can I sell unlimited products and track real-time inventory?',
      answer: 'Yes! Letz Shop features an atomic inventory engine that automatically tracks stock across all variants, prevents overselling during high-traffic drops, and sends you instant low-stock notifications.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans antialiased overflow-x-hidden">
      <Head>
        <title>Letz Shop — Next-Gen Digital Commerce Platform | letzshop.store</title>
        <meta
          name="description"
          content="Launch your online store in 60 seconds with Letz Shop. Ultra-HD themes, 1-tap checkout, instant UPI payments, and your custom domain on letzshop.store."
        />
        <meta property="og:title" content="Letz Shop — Launch Your Online Store in 60 Seconds" />
        <meta property="og:description" content="Sell everywhere with Letz Shop on letzshop.store. High-converting storefronts, zero coding, and direct payouts." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Top Notification Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-600 to-purple-700 text-white text-xs py-2 px-4 text-center font-medium relative z-40 border-b border-indigo-500/20 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Letz Shop v2.0 Live
          </span>
          <span>Claim your brand subdomain on <strong>letzshop.store</strong> today with zero setup fee!</span>
          <a
            href={`${sellerUrl}/login?mode=register`}
            className="underline underline-offset-2 font-bold hover:text-amber-200 transition ml-1"
          >
            Start Free →
          </a>
        </div>
      </div>

      {/* Floating Glass Navigation Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white flex items-center justify-center font-black text-base shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-300">
              <span className="tracking-tighter">LS</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-indigo-300 transition">
                  Letz Shop
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  .store
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Direct Merchant Commerce
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#themes" className="hover:text-white transition">Themes</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <a
              href={`${sellerUrl}/store-preview`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition"
            >
              <span>Live Preview</span>
              <Eye className="w-3.5 h-3.5" />
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <a
              href={`${sellerUrl}/login`}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              Merchant Login
            </a>
            <a
              href={`${sellerUrl}/login?mode=register`}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Create Free Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 overflow-hidden">
          {/* Subtle Ambient Glow Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-2xl pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-medium shadow-md shadow-indigo-950/40 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Ultra-HD Commerce Engine • <strong>letzshop.store</strong></span>
            </div>

            {/* Headline */}
            <div className="space-y-4 max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
                Turn your brand into an{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  online powerhouse.
                </span>
              </h1>
              <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
                Launch your digital store in 60 seconds with <strong>Letz Shop</strong>. Ultra-HD themes,
                1-tap checkout, instant UPI payments, and your dedicated link on{' '}
                <span className="text-indigo-300 font-mono">yourbrand.letzshop.store</span>.
              </p>
            </div>

            {/* Interactive Domain Claimer Bar */}
            <div className="pt-2 max-w-xl mx-auto">
              <form
                onSubmit={handleClaimStore}
                className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl flex flex-col sm:flex-row items-center gap-2 text-left"
              >
                <div className="flex items-center flex-1 w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-sm">
                  <span className="text-slate-500 text-xs font-mono shrink-0 select-none">
                    https://
                  </span>
                  <input
                    type="text"
                    value={storeHandle}
                    onChange={(e) => setStoreHandle(e.target.value)}
                    placeholder="yourbrand"
                    className="w-full bg-transparent px-1.5 py-0.5 text-white font-semibold text-sm placeholder:text-slate-600 focus:outline-none font-mono"
                  />
                  <span className="text-indigo-400 text-xs font-mono font-bold shrink-0 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 select-none">
                    .letzshop.store
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Claim Free Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="pt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> No credit card needed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> 60-second instant setup
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Free SSL & CDN included
                </span>
              </div>
            </div>

            {/* Visual SaaS Showcase & Device Mockups */}
            <div className="pt-10 max-w-5xl mx-auto">
              <div className="relative rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-slate-800/80 via-slate-900/60 to-slate-950/90 border border-slate-700/80 shadow-2xl shadow-indigo-950/80 backdrop-blur-xl">
                {/* Browser Top Window Chrome */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 px-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-mono text-[11px] text-slate-400 hidden sm:inline">
                      https://sairamtea.letzshop.store
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Verified Letz Shop Store</span>
                  </div>
                </div>

                {/* Dashboard & Storefront Dual Mockup */}
                <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
                  {/* Left: Merchant Command Telemetry (7 cols) */}
                  <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          Seller Telemetry Hub
                        </span>
                        <h2 className="text-base font-bold text-white">Live Store Performance</h2>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Sync
                      </span>
                    </div>

                    {/* Stats Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Today's Sales</span>
                        <span className="text-lg font-black text-white">₹1,48,250</span>
                        <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                          ↑ +34.2% vs yesterday
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Orders Placed</span>
                        <span className="text-lg font-black text-white">284</span>
                        <span className="text-[10px] text-indigo-400 font-semibold block mt-0.5">
                          100% UPI & Razorpay
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Active Shoppers</span>
                        <span className="text-lg font-black text-emerald-400">142 Live</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Browsing products now
                        </span>
                      </div>
                    </div>

                    {/* Recent Transaction Activity Stream */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Recent Orders Feed
                      </span>
                      <div className="space-y-1.5">
                        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                              ₹
                            </div>
                            <div>
                              <p className="font-semibold text-white">Royal Darjeeling First Flush (250g)</p>
                              <p className="text-[10px] text-slate-500 font-mono">Order #8942 • Bengaluru, IN</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400">₹890</span>
                            <span className="text-[10px] text-slate-500 block">UPI • Paid</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                              ₹
                            </div>
                            <div>
                              <p className="font-semibold text-white">Artisanal Ceramic Teapot Set</p>
                              <p className="text-[10px] text-slate-500 font-mono">Order #8941 • Mumbai, IN</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400">₹1,950</span>
                            <span className="text-[10px] text-slate-500 block">Card • Paid</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Mobile Storefront Customer View (5 cols) */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950/50 rounded-2xl p-4 border border-indigo-500/30 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-white">Customer Mobile Storefront</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Ultra-HD 16:9</span>
                    </div>

                    {/* Smartphone Preview Visual */}
                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-lg space-y-2 p-2">
                      {/* Store Header Mock */}
                      <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 text-[11px]">
                        <span className="font-bold text-white tracking-tight">SAIRAM TEA CO.</span>
                        <div className="flex items-center gap-2 text-slate-400">
                          <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1 rounded">2</span>
                        </div>
                      </div>

                      {/* Mini Hero Banner */}
                      <div className="relative h-28 rounded-lg overflow-hidden bg-gradient-to-r from-amber-950 via-stone-900 to-slate-900 flex items-center justify-center p-3 text-center border border-slate-800">
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="relative z-10 space-y-1">
                          <span className="text-[8px] font-mono uppercase tracking-widest text-amber-300">
                            Heritage Collection 2026
                          </span>
                          <p className="text-xs font-black text-white leading-tight">
                            Handpicked Estate Teas & Ceramics
                          </p>
                          <span className="inline-block text-[9px] bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-full mt-1">
                            Explore Catalog →
                          </span>
                        </div>
                      </div>

                      {/* Fast Product Card */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="w-full h-14 rounded bg-stone-800/80 mb-1.5 flex items-center justify-center text-slate-500 font-mono text-[9px]">
                            🍵 High-Res Asset
                          </div>
                          <span className="font-bold text-white block truncate">Assam Golden Tip</span>
                          <span className="text-emerald-400 font-bold">₹490</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="w-full h-14 rounded bg-stone-800/80 mb-1.5 flex items-center justify-center text-slate-500 font-mono text-[9px]">
                            🫖 High-Res Asset
                          </div>
                          <span className="font-bold text-white block truncate">Matcha Whisk Set</span>
                          <span className="text-emerald-400 font-bold">₹750</span>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Checkout Bar */}
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px] font-semibold">1-Click WhatsApp Ordering Active</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-200">
                        Enabled
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Social Proof / Category Strip */}
        <section className="py-10 border-y border-slate-800/80 bg-slate-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Powering bold independent brands across India & globally
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300 font-medium">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                🍵 Artisanal Teas & Roasters
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                👗 Boutique Fashion & Streetwear
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                🏺 Handcrafted Ceramics & Decor
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                💎 Designer Jewelry & Accessories
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                🧴 Clean Skincare & Wellness
              </span>
            </div>
          </div>
        </section>

        {/* Why Choose Letz Shop — The Bento Grid Pillars */}
        <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Everything Included
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Engineered for merchants who want to sell without limits.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              We replaced complicated setups and high marketplace fees with a lightning-fast, all-in-one store builder designed for instant sales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Ultra-HD Themes */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Ultra-HD Storefront Themes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                4K widescreen banners (1920 × 1080), adaptive color palettes, and editorial typography. Choose between Horizon, Canvas, Aura, or Neo in 1 click.
              </p>
              <div className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1 pt-1">
                <span>Horizon • Canvas • Aura • Neo</span>
              </div>
            </div>

            {/* Feature 2: 1-Tap Checkout */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Lightning 1-Tap Checkout</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reduce cart drop-off by up to 42%. Auto-saved addresses, instant mobile OTP verification, and high-speed checkout flows that feel instant.
              </p>
              <div className="text-[11px] font-semibold text-purple-400 flex items-center gap-1 pt-1">
                <span>UPI QR • Cards • NetBanking • COD</span>
              </div>
            </div>

            {/* Feature 3: WhatsApp Commerce */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Native WhatsApp Commerce</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customers can place orders directly over WhatsApp with pre-filled cart summaries, or receive automated order tracking links straight to their chat.
              </p>
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 pt-1">
                <span>Instant customer engagement</span>
              </div>
            </div>

            {/* Feature 4: Subdomains on letzshop.store */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Branded Subdomains & SSL</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Launch instantly on <code className="text-blue-300">yourbrand.letzshop.store</code> with free SSL certificates and global edge caching. Custom domains supported.
              </p>
              <div className="text-[11px] font-semibold text-blue-400 flex items-center gap-1 pt-1">
                <span>Zero server config required</span>
              </div>
            </div>

            {/* Feature 5: Atomic Inventory Control */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Atomic Inventory Guard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Never oversell during high-volume sales drops. Dynamic inventory reservation prevents double-booking while tracking stock in real time.
              </p>
              <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 pt-1">
                <span>Automated low-stock alerts</span>
              </div>
            </div>

            {/* Feature 6: Bank-Grade PIN & Direct Payouts */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Fast Daily Bank Payouts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No middleman holding your revenue for weeks. Direct bank settlement, automated GST invoicing, and secure PIN-based merchant access.
              </p>
              <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 pt-1">
                <span>Automated tax & invoice receipts</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Theme Showcase */}
        <section id="themes" className="py-24 px-4 sm:px-6 bg-slate-900/50 border-y border-slate-800/80">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Visual Themes
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                World-class store designs. Zero design fees.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Every theme adapts dynamically to your brand colors, typography, and products in real-time.
              </p>
            </div>

            {/* Theme Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setActiveThemeTab(theme.id as any)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeThemeTab === theme.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>

            {/* Active Theme Preview Card */}
            {(() => {
              const current = themes.find((t) => t.id === activeThemeTab) || themes[0];
              return (
                <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {current.badge}
                      </span>
                      <h3 className="text-2xl font-black text-white mt-2">{current.tagline}</h3>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1">{current.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <span className="text-[10px] text-slate-400 font-mono">Palette:</span>
                        {current.palette.map((c, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border border-white/20 inline-block shadow-xs"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>

                      <a
                        href={`${sellerUrl}/login?mode=register`}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition shadow-sm flex items-center gap-1.5 shrink-0"
                      >
                        <span>Apply to Store</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {current.features.map((feat, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-slate-300">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* How It Works (3 Steps) */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Effortless Launch
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              From zero to your first order in 3 simple steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-indigo-600/30">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Reserve Your Store Link</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up with your mobile number and OTP in under 60 seconds. Choose your store slug on <span className="text-indigo-400 font-mono">letzshop.store</span>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-purple-600/30">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Add Products & Themes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your high-res banners and products with prices and inventory. Brand Studio validates resolution so your photos look razor-sharp.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-emerald-600/30">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Share & Collect Payments</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Put your link on Instagram, WhatsApp, or ads. Accept instant payments via UPI QR, credit cards, or COD with automated notifications.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 px-4 sm:px-6 bg-slate-900/40 border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Got Questions?
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-indigo-300 transition"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180 text-indigo-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* High-Impact Closing Call-to-Action */}
        <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
          <div className="max-w-5xl mx-auto rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 border border-indigo-500/40 shadow-2xl shadow-indigo-950/80 text-center space-y-6 relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Launch Your Store in 60 Seconds</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-2xl mx-auto">
              Ready to take your business to the next level with Letz Shop?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Join hundreds of thriving independent brands selling every day on <strong className="text-white">letzshop.store</strong>.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <a
                href={`${sellerUrl}/login?mode=register`}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-black uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Create My Free Store</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </a>

              <a
                href={`${sellerUrl}/login`}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <span>Merchant Login</span>
              </a>
            </div>

            <div className="text-[11px] text-slate-400 pt-2">
              Free forever starter tier • No credit card required • Instant mobile OTP
            </div>
          </div>
        </section>
      </main>

      {/* Comprehensive Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                LS
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">Letz Shop</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                letzshop.store
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              The high-performance e-commerce platform empowering independent creators, artisans, and modern merchants to sell directly to customers worldwide.
            </p>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Platform</p>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="#features" className="hover:text-white transition">Features & Bento Grid</a></li>
              <li><a href="#themes" className="hover:text-white transition">Ultra-HD Themes</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">3-Step Launch Flow</a></li>
              <li><a href={`${sellerUrl}/store-preview`} target="_blank" rel="noreferrer" className="hover:text-white transition">Live Store Demo</a></li>
            </ul>
          </div>

          {/* Col 3: Merchant Portal */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Merchants</p>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href={`${sellerUrl}/login?mode=register`} className="hover:text-white transition">Create New Store</a></li>
              <li><a href={`${sellerUrl}/login`} className="hover:text-white transition">Merchant PIN Login</a></li>
              <li><a href="#faq" className="hover:text-white transition">Frequently Asked Questions</a></li>
            </ul>
          </div>

          {/* Col 4: Domain & Trust */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Domain & Security</p>
            <p className="text-[11px] text-slate-500">
              Store URL scheme: <code className="text-indigo-400 font-mono">yourbrand.letzshop.store</code>
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bank-Grade Encryption Active</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 Letz Shop Inc. (letzshop.store). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#features" className="hover:text-slate-300 transition">Terms of Service</a>
            <a href="#features" className="hover:text-slate-300 transition">Privacy Policy</a>
            <a href="#faq" className="hover:text-slate-300 transition">Merchant Guidelines</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
