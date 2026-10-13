import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { RefreshCw, Smartphone, Monitor, Tablet } from 'lucide-react';
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
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentPage, setCurrentPage] = useState<'home' | 'products' | 'about'>(activePage || 'home');
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync internal state if parent controls activePage
  useEffect(() => {
    if (activePage && activePage !== currentPage) {
      setCurrentPage(activePage);
    }
  }, [activePage]);

  const slug = store?.slug || 'sk-general-stores';
  const storefrontUrl = getStorefrontUrl();
  const pagePath =
    currentPage === 'products'
      ? `/store/${slug}/products`
      : currentPage === 'about'
      ? `/store/${slug}/about`
      : `/store/${slug}`;

  const previewIframeUrl = `${storefrontUrl}${pagePath}?preview=true&embedded=true${
    refreshKey > 0 ? `&_t=${refreshKey}` : ''
  }`;

  const handlePageSwitch = (page: 'home' | 'products' | 'about') => {
    setCurrentPage(page);
    onPageChange?.(page);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="w-full rounded-2xl border border-merchant-border overflow-hidden bg-merchant-surface shadow-xs transition-colors duration-150">
      {/* Simulated Browser Header Bar */}
      <div className="bg-merchant-surface-raised px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-merchant-border">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>

        {/* 3 Page Tabs Switcher */}
        <div className="flex items-center bg-merchant-surface p-1 rounded-xl border border-merchant-border text-xs shadow-2xs">
          <button
            type="button"
            id="preview-nav-home"
            onClick={() => handlePageSwitch('home')}
            className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'home'
                ? 'bg-merchant-primary text-white font-bold shadow-xs'
                : 'text-merchant-text-muted hover:text-merchant-text hover:bg-merchant-surface-muted'
            }`}
          >
            <span>🏠 Home</span>
          </button>
          <button
            type="button"
            id="preview-nav-products"
            onClick={() => handlePageSwitch('products')}
            className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'products'
                ? 'bg-merchant-primary text-white font-bold shadow-xs'
                : 'text-merchant-text-muted hover:text-merchant-text hover:bg-merchant-surface-muted'
            }`}
          >
            <span>🛍️ Products</span>
          </button>
          <button
            type="button"
            id="preview-nav-about"
            onClick={() => handlePageSwitch('about')}
            className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'about'
                ? 'bg-merchant-primary text-white font-bold shadow-xs'
                : 'text-merchant-text-muted hover:text-merchant-text hover:bg-merchant-surface-muted'
            }`}
          >
            <span>📖 About Us</span>
          </button>
        </div>

        {/* Device Switcher & Reload */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="preview-device-desktop"
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
              deviceMode === 'desktop'
                ? 'bg-merchant-primary text-white font-semibold shadow-xs'
                : 'text-merchant-text-muted hover:text-merchant-text hover:bg-merchant-surface'
            }`}
            title="Desktop View (100% width)"
            aria-label="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="preview-device-tablet"
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
              deviceMode === 'tablet'
                ? 'bg-merchant-primary text-white font-semibold shadow-xs'
                : 'text-merchant-text-muted hover:text-merchant-text hover:bg-merchant-surface'
            }`}
            title="Tablet View (768px)"
            aria-label="Tablet View"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="preview-device-mobile"
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-merchant-primary text-white font-semibold shadow-xs'
                : 'text-merchant-text-muted hover:text-merchant-text hover:bg-merchant-surface'
            }`}
            title="Mobile View (390px)"
            aria-label="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="preview-device-refresh"
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-merchant-text-muted hover:text-merchant-text hover:bg-merchant-surface transition cursor-pointer"
            title="Refresh Preview"
            aria-label="Refresh Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Buyer Storefront Viewport */}
      <div className="bg-merchant-bg p-2 sm:p-4 flex items-center justify-center min-h-[680px]">
        <div
          className={`transition-all duration-300 w-full ${
            deviceMode === 'mobile'
              ? 'max-w-[390px] h-[720px] rounded-2xl overflow-hidden shadow-2xl border-4 border-merchant-border-strong bg-white'
              : deviceMode === 'tablet'
              ? 'max-w-[768px] h-[720px] rounded-2xl overflow-hidden shadow-2xl border-4 border-merchant-border-strong bg-white'
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
