import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ExternalLink, Palette, Share2, ShieldAlert, Sparkles, Check, Globe } from 'lucide-react';
import { getWordmark } from '@simply/ui';
import { SafeImage } from './ui/SafeImage';

interface MiniStorePreviewProps {
  store: any;
  products?: any[];
}

export const MiniStorePreview: React.FC<MiniStorePreviewProps> = ({ store, products = [] }) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const isLive = store?.status === 'LIVE' || store?.status === 'ACTIVE';
  const isExpired = store?.status === 'EXPIRED' || store?.status === 'SUSPENDED';
  const isPrivate = !isLive && !isExpired;

  const publicUrl = store?.slug
    ? isLive
      ? `http://localhost:3000/store/${store.slug}`
      : `http://localhost:3000/store/${store.slug}?preview=true`
    : '#';

  const handleShare = () => {
    if (!store?.slug) return;
    if (navigator.share && isLive) {
      navigator.share({ title: store.name, url: publicUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const wordmark = getWordmark(store?.name || 'Your Store');

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Digital Storefront Preview
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {store?.name || 'Your Store'}
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isLive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isExpired
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {isLive ? 'LIVE' : isExpired ? 'EXPIRED' : 'PRIVATE PREVIEW'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push('/brand-studio')}
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Palette className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Customize Design
          </button>

          {!isLive && (
            <button
              onClick={() => router.push('/subscription')}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Publish Storefront
            </button>
          )}

          {store?.slug && (
            <button
              onClick={handleShare}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  Copied Link
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Share Store
                </>
              )}
            </button>
          )}

          {store?.slug && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Mini Mockup Window */}
      <div className="mt-4 rounded-xl border border-slate-200/90 overflow-hidden bg-slate-900 shadow-inner">
        {/* Browser Header Bar */}
        <div className="bg-slate-800/90 px-3 py-2 flex items-center justify-between border-b border-slate-700/80">
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-[11px] font-mono text-slate-300 bg-slate-950/80 px-4 py-0.5 rounded-md truncate max-w-xs flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>simply.in/store/{store?.slug || 'my-store'}</span>
          </div>
          <div className="w-8" />
        </div>

        {/* Live Miniature Viewport */}
        <div className="p-5 bg-slate-50 min-h-[170px] flex flex-col justify-between relative select-none">
          {isPrivate && (
            <div className="absolute top-2 right-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              Private Merchant Preview
            </div>
          )}

          {isExpired && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10">
              <ShieldAlert className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs font-semibold text-white">Storefront Private / Paused</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Subscribe to activate public shopping across India
              </p>
              <button
                onClick={() => router.push('/subscription')}
                className="mt-2.5 px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
              >
                Renew Subscription
              </button>
            </div>
          )}

          {/* Mini Nav */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              {store?.branding?.logoUrl && !logoFailed ? (
                <img
                  src={store.branding.logoUrl}
                  alt={store.name}
                  onError={() => setLogoFailed(true)}
                  className="h-5 w-auto max-w-[80px] object-contain"
                />
              ) : (
                <span
                  className="font-bold text-xs tracking-tight"
                  style={{ color: store?.branding?.primaryColor || '#1E3A8A' }}
                >
                  {wordmark.text}
                </span>
              )}
            <div className="flex gap-2.5 text-[10px] text-slate-500 font-medium">
              <span>Home</span>
              <span>Catalog</span>
              <span>About</span>
            </div>
          </div>

          {/* Mini Hero */}
          <div className="my-3 py-4 px-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {store?.branding?.announcement || `Welcome to ${store?.name || 'Our Boutique'}`}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                Authentic items • Fast pan-India delivery
              </p>
            </div>
            <button
              style={{ backgroundColor: store?.branding?.primaryColor || '#1E3A8A' }}
              className="text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-2xs shrink-0"
            >
              Shop Now
            </button>
          </div>

          {/* Mini Product Cards */}
          <div className="grid grid-cols-3 gap-2">
            {(products.length > 0 ? products.slice(0, 3) : [1, 2, 3]).map((p: any, i: number) => {
              const title = typeof p === 'object' ? p.name || p.title : `Product #${i + 1}`;
              const price = typeof p === 'object' ? (p.basePricePaise ? `₹${p.basePricePaise / 100}` : '₹999') : '₹999';
              const mediaUrl = typeof p === 'object' && p.images?.[0]?.url ? p.images[0].url : null;

              return (
                <div key={i} className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {mediaUrl ? (
                      <SafeImage src={mediaUrl} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        Item {i + 1}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-800 truncate">{title}</p>
                  <p className="text-[9px] font-mono font-semibold text-slate-500">{price}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
