import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ShoppingBag, 
  ArrowRight, 
  Star, 
  CheckCircle, 
  ShieldCheck, 
  Sparkles,
  Lock,
  ExternalLink,
  MessageSquare,
  Plus,
  Check,
  Truck,
  Award,
  Zap,
  Clock,
  FileText,
  Layers,
  Search
} from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { ThemeWrapper } from '../../../components/ThemeWrapper';
import { StoreHeader } from '../../../components/StoreHeader';
import { StoreFooter } from '../../../components/StoreFooter';
import { SafeImage } from '../../../components/ui/SafeImage';
import { formatPaise } from '@simply/ui';

export default function StoreHomePage() {
  const router = useRouter();
  const { slug, preview } = router.query;
  const { setStoreId, api, addItem } = useCart();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    loadStorefront(String(slug), preview ? String(preview) : undefined);
  }, [slug, preview]);

  const loadStorefront = async (storeSlug: string, previewSecret?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.stores.getPublicStorefront(storeSlug, previewSecret);
      setStoreData(res);
      if (res.store?.id) {
        setStoreId(res.store.id);
      }
    } catch (err: any) {
      console.error('Failed to load storefront', err);
      setErrorMsg(err.message || 'Store unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      router.push(`/store/${slug}/product/${product.id}`);
      return;
    }
    setAddingId(product.id);
    try {
      await addItem(variantId, 1);
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 2000);
    } catch (err) {
      console.error('Quick add failed', err);
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-600 font-mono">Loading storefront experience...</p>
        </div>
      </div>
    );
  }

  // Handle subscription-gated or offline stores
  if (errorMsg || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Storefront Temporarily Unpublished</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            {errorMsg || 'This digital store is currently in private setup mode or updating its catalog. Please check back shortly.'}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition"
            >
              Return to Simply Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { store, products = [], categories = [], themeConfig } = storeData;
  const isPrivatePreview = storeData.isPreview;
  const themeCode = themeConfig?.themeId || 'atelier';

  // Filter products by active category
  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter((p: any) => p.categoryId === activeCategory);

  return (
    <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
      <Head>
        <title>{store.name} | Official Storefront</title>
        <meta name="description" content={`Discover authentic products from ${store.name}. Pan-India delivery and direct merchant service.`} />
      </Head>

      {/* Private Preview Banner */}
      {isPrivatePreview && (
        <div className="bg-amber-500 text-amber-950 font-bold text-xs py-2 px-4 text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <span>PRIVATE MERCHANT PREVIEW — Storefront is currently unpublished and accessible only via active authenticated merchant session.</span>
        </div>
      )}

      <StoreHeader store={store} themeConfig={themeConfig} />

      <main className="space-y-16 pb-20">
        {/* =========================================================================
            1. HERO COMPOSITION (GENUINELY DISTINCT ACROSS 6 THEMES)
        ========================================================================= */}

        {/* --- ATELIER: Luxury Editorial Split-Hero --- */}
        {themeCode === 'atelier' && (
          <section className="relative overflow-hidden bg-stone-900 text-stone-100 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-amber-900/40">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-mono tracking-[0.2em] uppercase text-amber-300 border border-amber-500/40">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Artisanal Atelier • Hallmarked & Certified</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-serif tracking-tight leading-[1.1] text-stone-100">
                  Timeless Elegance by <span className="text-amber-300 italic">{store.name}</span>
                </h1>

                <p className="text-sm sm:text-base text-stone-300 max-w-xl font-light leading-relaxed">
                  Every creation embodies heritage craftsmanship, hand-selected materials, and immaculate proportion. Designed for collectors of fine distinction.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <a
                    href="#products"
                    className="px-8 py-3.5 bg-amber-400 text-stone-950 font-semibold text-xs tracking-widest uppercase hover:bg-amber-300 transition shadow-lg flex items-center gap-2"
                  >
                    <span>Explore Haute Collection</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <a
                    href={`https://wa.me/919822012345?text=Hello%20${encodeURIComponent(store.name)}%2C%20I%20would%20like%20to%20inquire%20about%20a%20bespoke%20piece`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3.5 border border-stone-600 text-stone-200 text-xs font-semibold tracking-widest uppercase hover:border-amber-400 hover:text-amber-300 transition"
                  >
                    Bespoke Consultation
                  </a>
                </div>
              </div>

              {/* Atelier Visual Frame / Mosaic */}
              <div className="lg:col-span-5 relative">
                <div className="aspect-[3/4] rounded-sm overflow-hidden border border-amber-500/30 shadow-2xl relative bg-stone-950">
                  {store.bannerUrl || products?.[0]?.images?.[0]?.url ? (
                    <SafeImage
                      src={store.bannerUrl || products?.[0]?.images?.[0]?.url}
                      alt={store.name}
                      className="w-full h-full object-cover"
                      fallbackTitle={store.name}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                      <span className="font-serif text-3xl text-amber-300/80 italic">{store.name}</span>
                      <p className="text-xs text-stone-400 font-mono tracking-widest uppercase">Excellence In Every Detail</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 p-4 border border-amber-500/20 bg-stone-950/70 backdrop-blur-sm">
                    <p className="text-[11px] font-serif tracking-wider text-amber-200 text-center uppercase">Verified 100% Authentic • Certified Craftsmanship</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- PULSE: High Voltage Drop Hero --- */}
        {themeCode === 'pulse' && (
          <section className="relative overflow-hidden bg-slate-950 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b-4 border-pink-500">
            <div className="max-w-6xl mx-auto space-y-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500 text-white font-black text-xs uppercase tracking-widest shadow-md">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>NEW DROP ACTIVE • LIMITED QUANTITIES</span>
              </div>

              <h1 className="text-4xl sm:text-7xl font-black uppercase tracking-tighter leading-none">
                {store.name} <span className="text-pink-500 block sm:inline">ONLINE DROP</span>
              </h1>

              <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-medium">
                High-octane apparel, trending accessories, and limited releases. Once sold out, they never restock.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a
                  href="#products"
                  className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white font-black text-sm uppercase tracking-wider transition shadow-lg transform hover:-translate-y-0.5"
                >
                  SHOP THE DROP NOW
                </a>
                <Link
                  href={`/store/${slug}/search`}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-black text-sm uppercase tracking-wider border border-white/20 transition"
                >
                  EXPLORE ARCHIVE
                </Link>
              </div>

              {/* Ticker Stats */}
              <div className="grid grid-cols-3 max-w-lg mx-auto pt-6 border-t border-slate-800 text-center">
                <div>
                  <div className="font-black text-lg text-pink-500">EXPRESS</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">24-48H DISPATCH</div>
                </div>
                <div>
                  <div className="font-black text-lg text-white">GENUINE</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">100% VERIFIED</div>
                </div>
                <div>
                  <div className="font-black text-lg text-pink-500">SECURE</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">INSTANT CHECKOUT</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- HARVEST: Warm Organic Showcase Hero --- */}
        {themeCode === 'harvest' && (
          <section className="relative overflow-hidden bg-amber-50/70 border-b border-amber-200 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center space-y-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span>🌿 Farm-Fresh & Handcrafted Daily</span>
              </span>

              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
                Authentic Homemade Delicacies from <span className="text-amber-800 underline decoration-amber-300">{store.name}</span>
              </h1>

              <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
                Made using traditional recipes, pure ingredients, and zero artificial preservatives. Fresh batches prepared daily and vacuum-sealed for doorstep delivery.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a
                  href="#products"
                  className="px-6 py-3 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  <span>Order Fresh Batch</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/919822012345?text=Hello%20${encodeURIComponent(store.name)}%2C%20what%20is%20today%27s%20fresh%20batch%3F`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-full bg-white border border-stone-300 text-stone-800 font-semibold text-sm hover:bg-stone-50 transition shadow-sm flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Ask Today&apos;s Fresh Batch</span>
                </a>
              </div>

              {/* Harvest Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-stone-700 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> 100% Pure Ghee & Natural
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Zero Chemical Additives
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Safe Food-Grade Packaging
                </span>
              </div>
            </div>
          </section>
        )}

        {/* --- FOUNDRY: Technical B2B Industrial Hero --- */}
        {themeCode === 'foundry' && (
          <section className="relative overflow-hidden bg-slate-900 text-slate-100 py-14 sm:py-18 px-4 sm:px-6 lg:px-8 border-b-2 border-slate-700 font-mono">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-6 relative">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="inline-flex items-center gap-2 text-xs text-sky-400 font-bold uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                  <span>OEM / B2B INDUSTRIAL SUPPLY DIVISION</span>
                </div>
                <div className="text-xs text-slate-400">
                  STANDARD: <span className="text-white font-bold">ISO 9001:2015</span> | QC: <span className="text-emerald-400 font-bold">PASS 100%</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight leading-tight">
                {store.name} <span className="text-sky-400 block sm:inline">// INDUSTRIAL COMPONENTS</span>
              </h1>

              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                Direct factory manufacturing, precision engineering components, and bulk industrial wholesale. Technical specifications compliant with domestic and export standards.
              </p>

              {/* Technical Specifications Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="bg-slate-800/80 p-3 border border-slate-700 rounded-sm">
                  <div className="text-slate-400 text-[10px]">SUPPLY CAPABILITY</div>
                  <div className="font-bold text-white mt-1">Direct Factory Pricing</div>
                </div>
                <div className="bg-slate-800/80 p-3 border border-slate-700 rounded-sm">
                  <div className="text-slate-400 text-[10px]">MIN ORDER QUANTITY</div>
                  <div className="font-bold text-sky-300 mt-1">Flexible B2B MOQs</div>
                </div>
                <div className="bg-slate-800/80 p-3 border border-slate-700 rounded-sm">
                  <div className="text-slate-400 text-[10px]">DISPATCH TIMELINE</div>
                  <div className="font-bold text-white mt-1">3-5 Business Days</div>
                </div>
                <div className="bg-slate-800/80 p-3 border border-slate-700 rounded-sm">
                  <div className="text-slate-400 text-[10px]">DOCUMENTATION</div>
                  <div className="font-bold text-emerald-400 mt-1">MTC & GST Invoicing</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href="#products"
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition shadow flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Browse Technical Catalog</span>
                </a>
                <a
                  href={`https://wa.me/919822012345?text=Hello%20${encodeURIComponent(store.name)}%2C%20we%20require%20a%20commercial%20quotation%20for%20bulk%20supplies`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-600 rounded-sm transition flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Direct RFQ Desk (WhatsApp)</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* --- HABITAT: Spacious Lifestyle & Interior Sanctuary Hero --- */}
        {themeCode === 'habitat' && (
          <section className="relative overflow-hidden bg-stone-100 text-stone-900 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-stone-200">
            <div className="max-w-5xl mx-auto text-center space-y-6">
              <span className="text-[11px] font-serif uppercase tracking-[0.25em] text-stone-500 block">
                Contemporary Interior Architecture & Furnishings
              </span>

              <h1 className="text-4xl sm:text-6xl font-serif text-stone-900 tracking-tight leading-tight">
                Designed for Intentional Living with <span className="italic font-normal">{store.name}</span>
              </h1>

              <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed font-light">
                Handcrafted solid wood furniture, bespoke living objects, and organic textures. Curated to bring harmony, warmth, and enduring beauty into your sanctuary.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                <a
                  href="#products"
                  className="px-8 py-3.5 bg-stone-900 text-stone-50 font-serif text-xs uppercase tracking-widest hover:bg-stone-800 transition"
                >
                  View Living Pieces
                </a>
                <Link
                  href={`/store/${slug}/search?category=living`}
                  className="px-8 py-3.5 border border-stone-400 text-stone-800 font-serif text-xs uppercase tracking-widest hover:bg-white transition"
                >
                  Shop by Room
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* --- LOCAL: High Density Instant Commerce Hero --- */}
        {themeCode === 'local' && (
          <section className="bg-blue-900 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-b border-blue-800">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 bg-blue-800 px-3 py-1 rounded text-xs font-semibold text-blue-200">
                  <Truck className="w-3.5 h-3.5 text-green-400" />
                  <span>Fast Neighborhood Dispatch • Same-Day Delivery</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  {store.name} Superstore
                </h1>
                <p className="text-xs sm:text-sm text-blue-200 max-w-xl">
                  Order daily groceries, FMCG provisions, and household essentials. Direct from your trusted local merchant at true wholesale rates.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/20 space-y-2.5 min-w-[280px]">
                <div className="text-xs font-bold text-white">Need it immediately?</div>
                <p className="text-[11px] text-blue-200">Send your shopping list or tap below to chat directly with store staff.</p>
                <a
                  href={`https://wa.me/919822012345?text=Hello%20${encodeURIComponent(store.name)}%2C%20here%20is%20my%20order%20list:`}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition shadow"
                >
                  ⚡ Send List on WhatsApp
                </a>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            2. CATEGORIES PRESENTATION (THEME DISTINCT)
        ========================================================================= */}
        {categories.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg sm:text-xl font-bold text-gray-900 ${
                  themeCode === 'atelier' ? 'font-serif text-2xl tracking-wide' :
                  themeCode === 'foundry' ? 'font-mono uppercase text-base' :
                  themeCode === 'pulse' ? 'font-black uppercase tracking-tight' : ''
                }`}>
                  {themeCode === 'foundry' ? '// COMPONENT CATEGORIES' :
                   themeCode === 'habitat' ? 'Shop by Space' :
                   themeCode === 'pulse' ? 'DROP CATEGORIES' : 'Featured Collections'}
                </h2>
                <p className="text-xs text-gray-500">
                  {themeCode === 'foundry' ? 'Select equipment classification' : 'Explore products by category'}
                </p>
              </div>

              {/* Clear Filter / All Link */}
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Show All ({products.length})
                </button>
              )}
            </div>

            {/* Category Cards / Pills Layout */}
            <div className={`grid gap-3 ${
              themeCode === 'harvest' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' :
              themeCode === 'foundry' ? 'grid-cols-2 sm:grid-cols-4 font-mono' :
              themeCode === 'pulse' ? 'grid-cols-2 sm:grid-cols-4' :
              themeCode === 'local' ? 'flex flex-wrap gap-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            }`}>
              {/* Category Pill: All Products */}
              {themeCode === 'local' ? (
                <>
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                      activeCategory === 'all'
                        ? 'bg-blue-900 text-white shadow'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Items ({products.length})
                  </button>
                  {categories.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(c.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                        activeCategory === c.id
                          ? 'bg-blue-900 text-white shadow'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {c.name} ({c._count?.products ?? 0})
                    </button>
                  ))}
                </>
              ) : (
                categories.map((c: any) => {
                  const isSelected = activeCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(isSelected ? 'all' : c.id)}
                      className={`p-4 transition text-left space-y-1 relative border ${
                        isSelected
                          ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                          : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900'
                      } ${
                        themeCode === 'atelier' ? 'rounded-none' :
                        themeCode === 'pulse' ? 'rounded-none skew-x-[-2deg]' :
                        themeCode === 'foundry' ? 'rounded-sm font-mono' :
                        themeCode === 'harvest' ? 'rounded-2xl bg-amber-50/40 border-amber-200' : 'rounded-xl'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-sm block line-clamp-1 ${
                          themeCode === 'atelier' ? 'font-serif' : ''
                        }`}>
                          {c.name}
                        </span>
                        <span className={`text-[10px] font-mono block ${
                          isSelected ? 'text-gray-300' : 'text-gray-400'
                        }`}>
                          {c._count?.products ?? 0}
                        </span>
                      </div>
                      <span className={`text-[11px] block line-clamp-1 ${
                        isSelected ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {themeCode === 'foundry' ? 'Industrial Grade' : 'View Collection'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* =========================================================================
            3. PRODUCT CARDS & GRID (GENUINELY DISTINCT THEME COMPOSITIONS)
        ========================================================================= */}
        <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold text-gray-900 ${
                themeCode === 'atelier' ? 'font-serif tracking-wide text-2xl' :
                themeCode === 'foundry' ? 'font-mono uppercase text-lg' :
                themeCode === 'pulse' ? 'font-black uppercase tracking-tight' : ''
              }`}>
                {themeCode === 'foundry' ? '// ACTIVE INVENTORY & SPECIFICATIONS' :
                 themeCode === 'pulse' ? 'CURRENT DROP CATALOG' :
                 themeCode === 'harvest' ? 'Freshly Harvested & Prepared' :
                 themeCode === 'habitat' ? 'Sanctuary Collection' : 'Curated Selection'}
              </h2>
              <p className="text-xs text-gray-500">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} ready for dispatch
              </p>
            </div>

            <Link
              href={`/store/${slug}/search`}
              className="text-xs font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
              style={{ color: 'var(--theme-accent, #D97706)' }}
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-500 text-sm space-y-2">
              <p className="font-semibold text-gray-700">No products found in this category.</p>
              <button
                onClick={() => setActiveCategory('all')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Reset filter and view all products
              </button>
            </div>
          ) : (
            <div className={`grid gap-4 sm:gap-6 ${
              themeCode === 'foundry' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
              themeCode === 'local' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
              themeCode === 'atelier' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
              'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            }`}>
              {filteredProducts.map((p: any) => {
                const title = p.name || p.title || 'Product';
                const primaryVariant = p.variants?.[0];
                const pricePaise = p.basePricePaise ?? primaryVariant?.pricePaise ?? 0;
                const comparePaise = p.compareAtPricePaise ?? primaryVariant?.compareAtPricePaise;
                const primaryMedia = p.media?.find((m: any) => m.isPrimary) || p.media?.[0];
                const coverImage =
                  primaryMedia?.publicUrl ||
                  (primaryMedia?.storageKey ? `/api/v1/media/file/${primaryMedia.storageKey}` : undefined) ||
                  p.images?.[0]?.url;
                const isEnquiryOnly = p.productType === 'ENQUIRY_ONLY';
                const hasVariants = p.variants && p.variants.length > 0;
                const isAdded = addedId === p.id;
                const isAdding = addingId === p.id;

                {/* --- A. ATELIER LUXURY CARD (3:4 Framed Portrait) --- */}
                if (themeCode === 'atelier') {
                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                    >
                      <Link
                        href={`/store/${slug}/product/${p.id}`}
                        className="block relative aspect-[3/4] bg-stone-100 overflow-hidden"
                      >
                        <SafeImage
                          src={coverImage}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          fallbackTitle={title}
                        />
                        <span className="absolute top-3 left-3 bg-stone-900/90 text-amber-200 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1">
                          Haute Creation
                        </span>
                      </Link>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3 bg-stone-50/50">
                        <div>
                          {p.category?.name && (
                            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-1">
                              {p.category.name}
                            </span>
                          )}
                          <Link
                            href={`/store/${slug}/product/${p.id}`}
                            className="font-serif text-base text-stone-900 hover:text-amber-800 transition line-clamp-2 leading-snug font-medium"
                          >
                            {title}
                          </Link>
                        </div>

                        <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                          <div>
                            <div className="font-serif text-base font-semibold text-stone-900">
                              {formatPaise(pricePaise)}
                            </div>
                            {comparePaise && (
                              <div className="text-[11px] text-stone-400 font-mono line-through">
                                {formatPaise(comparePaise)}
                              </div>
                            )}
                          </div>

                          <Link
                            href={`/store/${slug}/product/${p.id}`}
                            className="text-xs font-semibold text-stone-900 hover:text-amber-700 flex items-center gap-1 uppercase tracking-wider"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                {/* --- B. PULSE STREETWEAR CARD (1:1 Elevated Modern) --- */}
                if (themeCode === 'pulse') {
                  return (
                    <div
                      key={p.id}
                      className="bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-lg hover:border-pink-500 transition-all flex flex-col group relative"
                    >
                      <Link
                        href={`/store/${slug}/product/${p.id}`}
                        className="block relative aspect-square bg-slate-950 overflow-hidden"
                      >
                        <SafeImage
                          src={coverImage}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallbackTitle={title}
                        />
                        <span className="absolute top-2 left-2 bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 shadow">
                          DROP 01
                        </span>
                      </Link>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-slate-900">
                        <div>
                          <Link
                            href={`/store/${slug}/product/${p.id}`}
                            className="font-black text-sm uppercase tracking-tight text-white hover:text-pink-400 transition line-clamp-1"
                          >
                            {title}
                          </Link>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="font-black text-base text-pink-400 font-mono">
                              {formatPaise(pricePaise)}
                            </span>
                            {comparePaise && (
                              <span className="text-xs text-slate-500 font-mono line-through">
                                {formatPaise(comparePaise)}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleQuickAdd(e, p)}
                          disabled={isAdding}
                          className="w-full py-2 bg-white hover:bg-pink-500 hover:text-white text-slate-950 font-black text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-1.5"
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>IN BAG</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{isAdding ? 'ADDING...' : 'QUICK BAG'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }

                {/* --- C. HARVEST ARTISANAL CARD (1:1 Rounded Soft with Quick-Add) --- */}
                if (themeCode === 'harvest') {
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group relative"
                    >
                      <Link
                        href={`/store/${slug}/product/${p.id}`}
                        className="block relative aspect-square bg-amber-50/50 overflow-hidden"
                      >
                        <SafeImage
                          src={coverImage}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallbackTitle={title}
                        />
                        <span className="absolute top-2 left-2 bg-emerald-700 text-white text-[10px] font-bold rounded-full px-2.5 py-0.5 shadow">
                          Fresh Batch
                        </span>
                      </Link>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {p.category?.name && (
                            <span className="text-[10px] font-semibold text-amber-800 uppercase block mb-1">
                              {p.category.name}
                            </span>
                          )}
                          <Link
                            href={`/store/${slug}/product/${p.id}`}
                            className="font-serif font-bold text-sm text-stone-900 hover:text-emerald-800 transition line-clamp-2"
                          >
                            {title}
                          </Link>
                          <div className="text-[11px] text-stone-500 mt-1">
                            Vacuum-sealed 500g pack
                          </div>
                        </div>

                        <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-2">
                          <div className="font-bold text-sm text-stone-900 font-mono">
                            {formatPaise(pricePaise)}
                          </div>

                          <button
                            onClick={(e) => handleQuickAdd(e, p)}
                            disabled={isAdding}
                            className="px-3.5 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                {/* --- D. FOUNDRY B2B SPEC-SHEET CARD (4:3 Technical with MOQ & RFQ) --- */}
                if (themeCode === 'foundry') {
                  return (
                    <div
                      key={p.id}
                      className="bg-slate-800 border border-slate-700 rounded-sm overflow-hidden shadow-md font-mono flex flex-col group relative"
                    >
                      <Link
                        href={`/store/${slug}/product/${p.id}`}
                        className="block relative aspect-[4/3] bg-slate-900 overflow-hidden border-b border-slate-700"
                      >
                        <SafeImage
                          src={coverImage}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallbackTitle={title}
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/90 text-sky-400 text-[10px] font-bold px-2 py-0.5 border border-sky-500/40">
                          SPEC: INDUSTRIAL GRADE
                        </div>
                      </Link>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-slate-200">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>PART ID: #PRD-{p.id.slice(0, 6).toUpperCase()}</span>
                            <span className="text-emerald-400 font-bold">IN STOCK</span>
                          </div>

                          <Link
                            href={`/store/${slug}/product/${p.id}`}
                            className="font-bold text-sm text-white hover:text-sky-300 transition line-clamp-2 block"
                          >
                            {title}
                          </Link>

                          {/* Technical Specification Matrix */}
                          <div className="bg-slate-900 p-2.5 rounded-sm border border-slate-700/80 space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Standard MOQ:</span>
                              <span className="text-white font-bold">25 Units</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Lead Time:</span>
                              <span className="text-white font-bold">3-5 Business Days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Unit Base:</span>
                              <span className="text-sky-400 font-bold">{formatPaise(pricePaise)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Dual Action: Instant RFQ on WhatsApp & Product Page */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                          <a
                            href={`https://wa.me/919822012345?text=RFQ%20Inquiry%20for%20Item%3A%20${encodeURIComponent(title)}%20(SKU%3A%20PRD-${p.id.slice(0, 6).toUpperCase()})`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold text-center rounded-sm transition flex items-center justify-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>RFQ Quote</span>
                          </a>

                          <Link
                            href={`/store/${slug}/product/${p.id}`}
                            className="px-2.5 py-2 bg-sky-700 hover:bg-sky-600 text-white text-[11px] font-bold text-center rounded-sm transition flex items-center justify-center gap-1"
                          >
                            <span>Full Spec</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                {/* --- E. HABITAT LIFESTYLE CARD (4:5 Minimal Bleed) --- */}
                if (themeCode === 'habitat') {
                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group relative"
                    >
                      <Link
                        href={`/store/${slug}/product/${p.id}`}
                        className="block relative aspect-[4/5] bg-stone-100 overflow-hidden"
                      >
                        <SafeImage
                          src={coverImage}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          fallbackTitle={title}
                        />
                        <span className="absolute top-3 left-3 bg-stone-900/80 text-white text-[10px] font-serif uppercase tracking-wider px-2 py-0.5">
                          Living Sanctuary
                        </span>
                      </Link>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <Link
                            href={`/store/${slug}/product/${p.id}`}
                            className="font-serif text-sm font-semibold text-stone-900 hover:text-stone-600 transition line-clamp-1"
                          >
                            {title}
                          </Link>
                          <div className="text-[11px] text-stone-500">
                            Solid Wood • Hand-Finished
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                          <div className="font-serif text-sm font-bold text-stone-900">
                            {formatPaise(pricePaise)}
                          </div>
                          <Link
                            href={`/store/${slug}/product/${p.id}`}
                            className="text-xs font-serif uppercase tracking-wider text-stone-800 hover:underline"
                          >
                            Explore Piece
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                {/* --- F. LOCAL HIGH-DENSITY CARD (Fast Commerce with 1-Tap Buy) --- */}
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group relative"
                  >
                    <Link
                      href={`/store/${slug}/product/${p.id}`}
                      className="block relative aspect-square bg-gray-100 overflow-hidden"
                    >
                      <SafeImage
                        src={coverImage}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        fallbackTitle={title}
                      />
                      {comparePaise && comparePaise > pricePaise && (
                        <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                          Save ₹{Math.round((comparePaise - pricePaise) / 100)}
                        </span>
                      )}
                    </Link>

                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        {p.category?.name && (
                          <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                            {p.category.name}
                          </span>
                        )}
                        <Link
                          href={`/store/${slug}/product/${p.id}`}
                          className="font-bold text-xs text-gray-900 hover:text-blue-700 transition line-clamp-2 leading-snug"
                        >
                          {title}
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                        <div>
                          <div className="font-mono font-bold text-xs text-gray-900">
                            {formatPaise(pricePaise)}
                          </div>
                          {comparePaise && (
                            <div className="text-[10px] text-gray-400 font-mono line-through">
                              {formatPaise(comparePaise)}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => handleQuickAdd(e, p)}
                          disabled={isAdding}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] transition shadow-sm flex items-center gap-1"
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3 text-green-300" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================================================================
            4. THEME-SPECIFIC DISTINCT HOMEPAGE SECTIONS
        ========================================================================= */}

        {/* --- ATELIER: Editorial Lookbook & Heritage Strip --- */}
        {themeCode === 'atelier' && (
          <section className="bg-stone-900 text-stone-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-amber-900/40">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300">
                The Artisanal Benchmark
              </span>
              <h3 className="text-2xl sm:text-4xl font-serif font-light text-stone-100 leading-snug">
                &ldquo;True luxury resides in the quiet integrity of the materials and the patience of the artisan.&rdquo;
              </h3>
              <p className="text-xs sm:text-sm text-stone-400 max-w-2xl mx-auto leading-relaxed font-light">
                Each piece dispatched by {store.name} carries a registered hallmark of authenticity. We accommodate private appointments and custom bridal commissions.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-8 text-xs font-serif text-amber-200/90 tracking-wider">
                <span>✦ Hallmarked 100% Certified</span>
                <span>✦ Insured Air Courier</span>
                <span>✦ Private Concierge Support</span>
              </div>
            </div>
          </section>
        )}

        {/* --- FOUNDRY: Plant Infrastructure & Quality Assurance --- */}
        {themeCode === 'foundry' && (
          <section className="bg-slate-900 text-slate-200 py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-700 font-mono">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs text-sky-400 font-bold">// MANUFACTURING INFRASTRUCTURE & ASSURANCE</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">Direct Factory Sourcing Capabilities</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-800/60 p-5 border border-slate-700 rounded-sm space-y-2">
                  <div className="text-sky-400 font-bold text-xs">01. PRECISION TOLERANCE</div>
                  <h4 className="text-sm font-bold text-white">CNC Machining & Testing</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Components machined to strict microns. Batch test certificates (MTC) provided with dispatch consignments.
                  </p>
                </div>
                <div className="bg-slate-800/60 p-5 border border-slate-700 rounded-sm space-y-2">
                  <div className="text-sky-400 font-bold text-xs">02. COMMERCIAL LOGISTICS</div>
                  <h4 className="text-sm font-bold text-white">Bulk Freight Pan-India</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Dedicated commercial freight partnerships for palleted transport, road lines, and expedited shipments.
                  </p>
                </div>
                <div className="bg-slate-800/60 p-5 border border-slate-700 rounded-sm space-y-2">
                  <div className="text-sky-400 font-bold text-xs">03. TAX & COMPLIANCE</div>
                  <h4 className="text-sm font-bold text-white">GST Invoicing & Credit</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Automated B2B GST tax invoices with HSN / SAC breakdown to ensure complete input tax credit for your firm.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- HARVEST: Purity Commitment & Farm Kitchen Story --- */}
        {themeCode === 'harvest' && (
          <section className="bg-amber-100/40 border-y border-amber-200 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Our Purity Commitment</span>
              <h3 className="text-xl sm:text-3xl font-serif font-bold text-stone-900">
                Fresh From Our Kitchen to Your Table
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl mx-auto">
                At {store.name}, we refuse shortcuts. Every recipe starts with raw ingredients sourced directly from verified farmers. Cooked in small daily batches so you get pure taste and peak nutrition.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-stone-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> FSSAI Compliant Kitchen
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Eco-Friendly Safe Packaging
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> 100% Satisfaction Guarantee
                </span>
              </div>
            </div>
          </section>
        )}

        {/* --- HABITAT / LOCAL / PULSE Default Brand Strip --- */}
        {(themeCode === 'habitat' || themeCode === 'local' || themeCode === 'pulse') && (
          <section className="bg-gray-50 border-y border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Direct From {store.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
                Every item in our storefront is meticulously verified before dispatch. We take pride in building direct relationships with our buyers across India.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> 100% Genuine Quality
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Fast Courier Tracking
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Dedicated WhatsApp Support
                </span>
              </div>
            </div>
          </section>
        )}
      </main>

      <StoreFooter store={store} />
    </ThemeWrapper>
  );
}
