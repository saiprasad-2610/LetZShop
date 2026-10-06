import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { MiniStorePreview } from '../components/MiniStorePreview';
import { getStoreCustomerPreviewUrl, getStorePublicShareUrl } from '../utils/config';
import {
  ExternalLink,
  Palette,
  Sparkles,
  Share2,
  Check,
  Globe,
  Copy,
  AlertCircle,
  MessageCircle,
  ChevronDown,
} from 'lucide-react';

export default function StorePreviewPage() {
  const { store, api } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const isLive = store?.status === 'LIVE' || store?.status === 'ACTIVE';
  const isExpired = store?.status === 'EXPIRED' || store?.status === 'SUSPENDED';
  const hasActivePlan = Boolean(
    store?.subscription?.status === 'ACTIVE' ||
    store?.subscriptionStatus === 'ACTIVE' ||
    store?.subscriptionPlan
  );

  const storeSlug = store?.slug || 'sk-general-stores';
  const storeName = store?.name || 'SK General Stores';
  const customerPreviewUrl = getStoreCustomerPreviewUrl(storeSlug);
  const publicShareUrl = getStorePublicShareUrl(storeSlug, isLive);
  const displayUrl = `simply.in/store/${storeSlug}`;

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setShareOpen(false);
      }
    }
    if (shareOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return undefined;
  }, [shareOpen]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await api.catalog.getProducts();
        setProducts(res?.items || res || []);
      } catch (err) {
        console.error('Failed to fetch products for store preview:', err);
      } finally {
        setLoading(false);
      }
    }
    if (store) {
      fetchProducts();
    }
  }, [store, api]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(publicShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
    setShareOpen(false);
  };

  const handleShareWhatsApp = () => {
    const text = `Check out our store ${storeName}: ${publicShareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setShareOpen(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Visit ${storeName} on Simply`,
          url: publicShareUrl,
        });
      } catch {
        // User cancelled share
      }
    }
    setShareOpen(false);
  };

  const handlePublish = async () => {
    if (isLive) {
      setNotification('Storefront is already live and public across India.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (!hasActivePlan || isExpired) {
      setNotification('Choose a subscription plan to publish your store live.');
      setTimeout(() => {
        router.push('/subscription');
      }, 1500);
      return;
    }

    setNotification('Storefront is ready and published!');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <Layout>
      <Head>
        <title>My Store Preview | Simply Seller</title>
      </Head>

      <div className="w-full max-w-[1240px] mx-auto space-y-5 pb-12">
        {/* =========================================================================
            SECTION 1: PAGE HEADER
            Left: Title + Subtitle
            Right: Exactly 2 actions: [ Preview as Customer ] [ Customize Store ]
        ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Store Preview</h1>
            <p className="text-sm text-slate-500 mt-0.5">What your customers actually see</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={customerPreviewUrl}
              target="_blank"
              rel="noreferrer"
              id="btn-preview-store-as-customer"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Preview as Customer
            </a>

            <button
              type="button"
              onClick={() => router.push('/brand-studio')}
              id="btn-customize-store"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
            >
              <Palette className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Customize Store
            </button>
          </div>
        </div>

        {/* Global Feedback Banner if triggered */}
        {notification && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{notification}</span>
            </div>
            {(!hasActivePlan || isExpired) && (
              <button
                type="button"
                onClick={() => router.push('/subscription')}
                className="text-xs font-bold underline hover:text-amber-900 ml-4 shrink-0"
              >
                View Plans →
              </button>
            )}
          </div>
        )}

        {/* =========================================================================
            SECTION 2: STORE STATUS / ACTION BAR
            Directly below header. Single compact horizontal bar.
            Left: Dynamic Store Name, Status Badge, Store URL with copy icon.
            Right: Exactly 2 actions: [ Publish Storefront ] [ Share Store ].
        ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left side: Store Details */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                  {storeName}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    isLive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isExpired
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {isLive ? 'LIVE' : isExpired ? 'SUBSCRIPTION REQUIRED' : 'PRIVATE PREVIEW'}
                </span>
              </div>

              {/* Single Store URL with small copy icon */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{displayUrl}</span>
                <button
                  type="button"
                  id="btn-copy-store-url"
                  onClick={handleCopyLink}
                  title="Copy Store URL"
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                {copied && (
                  <span className="text-[10px] text-emerald-600 font-sans font-medium">Copied!</span>
                )}
              </div>
            </div>

            {/* Right side: Actions [ Publish Storefront ] [ Share Store ] */}
            <div className="flex items-center gap-2.5 shrink-0 relative">
              {/* Publish Action */}
              {isLive ? (
                <button
                  type="button"
                  id="btn-publish-storefront"
                  disabled
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Live Storefront
                </button>
              ) : !hasActivePlan || isExpired ? (
                <button
                  type="button"
                  id="btn-publish-storefront"
                  onClick={handlePublish}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs"
                  title="Subscription required to publish"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  Subscribe to Publish
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-publish-storefront"
                  onClick={handlePublish}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Publish Storefront
                </button>
              )}

              {/* Compact Share Store Popover */}
              <div className="relative" ref={shareRef}>
                <button
                  type="button"
                  id="btn-share-store"
                  onClick={() => setShareOpen((prev) => !prev)}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Share Store
                  <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
                </button>

                {shareOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-xs">
                    <button
                      type="button"
                      id="opt-share-copy"
                      onClick={handleCopyLink}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        {copied ? 'Link Copied!' : 'Copy Link'}
                      </span>
                      {copied && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                    <button
                      type="button"
                      id="opt-share-whatsapp"
                      onClick={handleShareWhatsApp}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp
                    </button>
                    {canNativeShare && (
                      <button
                        type="button"
                        id="opt-share-native"
                        onClick={handleNativeShare}
                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                      >
                        <Share2 className="w-3.5 h-3.5 text-blue-600" />
                        Native Share
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3: STOREFRONT PREVIEW FRAME
            Directly renders MiniStorePreview.
            No second toolbar, no duplicate cards, no repeated merchant headings.
        ========================================================================= */}
        <div className="w-full">
          <MiniStorePreview store={store} products={products} />
        </div>
      </div>
    </Layout>
  );
}
