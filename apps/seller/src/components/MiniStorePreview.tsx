import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Globe, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { getStorefrontUrl } from '../utils/config';

interface MiniStorePreviewProps {
  store: any;
  products?: any[];
  iframeRef?: React.RefObject<HTMLIFrameElement>;
  activePage?: 'home' | 'products' | 'about';
  onPageChange?: (page: 'home' | 'products' | 'about') => void;
}

export const MiniStorePreview: React.FC<MiniStorePreviewProps> = ({
  store,
  iframeRef,
  activePage = 'home',
  onPageChange,
}) => {
  const router = useRouter();
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  const slug = store?.slug || 'sk-general-stores';
  const storefrontUrl = getStorefrontUrl();
  const initialTimestamp = React.useMemo(() => Date.now(), []);

  const pagePath =
    activePage === 'products'
      ? `/store/${slug}/products`
      : activePage === 'about'
      ? `/store/${slug}/about`
      : `/store/${slug}`;

  const previewIframeUrl = `${storefrontUrl}${pagePath}?preview=true&embedded=true&_t=${initialTimestamp}_${refreshKey}`;

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 overflow-hidden bg-slate-900 shadow-sm">
      {/* Simulated Browser Header Bar */}
      <div className="bg-slate-800/95 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>

        {/* 3 Page Tabs Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-700/80 text-xs">
          <button
            type="button"
            onClick={() => onPageChange?.('home')}
            className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
              activePage === 'home'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏠 Home</span>
          </button>
          <button
            type="button"
            onClick={() => onPageChange?.('products')}
            className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
              activePage === 'products'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🛍️ Products</span>
          </button>
          <button
            type="button"
            onClick={() => onPageChange?.('about')}
            className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
              activePage === 'about'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📖 About Us</span>
          </button>
        </div>

        {/* Device Switcher & Reload */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg text-xs transition ${
              deviceMode === 'desktop'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop View (100% width)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-lg text-xs transition ${
              deviceMode === 'mobile'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
            title="Refresh Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Buyer Storefront Viewport */}
      <div className="bg-slate-950/40 p-2 sm:p-4 flex items-center justify-center min-h-[680px]">
        <div
          className={`transition-all duration-300 w-full ${
            deviceMode === 'mobile'
              ? 'max-w-[390px] h-[720px] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-white'
              : 'h-[720px] rounded-xl overflow-hidden shadow-sm bg-white'
          }`}
        >
          <iframe
            ref={iframeRef}
            key={`${pagePath}_${refreshKey}`}
            src={previewIframeUrl}
            className="w-full h-full border-0 bg-white"
            title="Storefront Interactive Buyer Preview"
          />
        </div>
      </div>
    </div>
  );
};
