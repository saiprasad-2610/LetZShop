import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Globe, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { getStorefrontUrl } from '../utils/config';

interface MiniStorePreviewProps {
  store: any;
  products?: any[];
}

export const MiniStorePreview: React.FC<MiniStorePreviewProps> = ({ store }) => {
  const router = useRouter();
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  const slug = store?.slug || 'sk-general-stores';
  const storefrontUrl = getStorefrontUrl();
  const previewIframeUrl = `${storefrontUrl}/store/${slug}?preview=true&embedded=true`;

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 overflow-hidden bg-slate-900 shadow-sm">
      {/* Simulated Browser Header Bar */}
      <div className="bg-slate-800/95 px-4 py-2.5 flex items-center justify-between border-b border-slate-700/80">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>

        {/* Address Bar */}
        <div className="text-[11px] font-mono text-slate-300 bg-slate-950/80 px-4 py-1 rounded-md truncate max-w-sm flex items-center gap-1.5 shadow-inner">
          <Globe className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">simply.in/store/{slug}</span>
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
            key={refreshKey}
            src={previewIframeUrl}
            className="w-full h-full border-0 bg-white"
            title="Storefront Interactive Buyer Preview"
          />
        </div>
      </div>
    </div>
  );
};
