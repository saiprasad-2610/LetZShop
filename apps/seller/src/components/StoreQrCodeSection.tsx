import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Printer,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStorefrontUrl } from '../utils/config';
import { getPublicStoreUrl } from '@simply/types';

interface StoreQrCodeSectionProps {
  className?: string;
  variant?: 'card' | 'embedded';
}

export const StoreQrCodeSection: React.FC<StoreQrCodeSectionProps> = ({
  className = '',
  variant = 'card',
}) => {
  const { store, api, token } = useAuth();
  const [qrDetails, setQrDetails] = useState<any>(null);
  const [qrImageBlobUrl, setQrImageBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [printMenuOpen, setPrintMenuOpen] = useState<boolean>(false);
  const [canNativeShare, setCanNativeShare] = useState<boolean>(false);

  const shareRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const storeId = store?.id;
  const storeSlug = store?.slug || 'my-store';
  const storeSubdomain = store?.subdomain;
  const storeCustomDomain = store?.customDomain;
  const storeName = store?.name || 'My Store';

  // Compute canonical active storefront URL (custom domain -> subdomain -> path)
  const baseStorefrontUrl = getStorefrontUrl();
  const activeStorefrontUrl = getPublicStoreUrl(
    storeSubdomain || storeSlug,
    baseStorefrontUrl,
    storeCustomDomain
  );

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setShareOpen(false);
      }
      if (printRef.current && !printRef.current.contains(event.target as Node)) {
        setPrintMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch QR details and preview image
  useEffect(() => {
    let active = true;
    let objectUrlToRevoke: string | null = null;

    async function loadQrData() {
      if (!storeId) return;
      try {
        setLoading(true);
        // 1. Get QR metadata
        const details = await api.stores.getQrCode(storeId);
        if (!active) return;
        setQrDetails(details);

        // 2. Fetch authenticated preview image blob
        const previewUrl = api.stores.getQrCodePreviewUrl(storeId);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(previewUrl, { headers });
        if (res.ok && active) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          objectUrlToRevoke = url;
          setQrImageBlobUrl(url);
        }
      } catch (err) {
        console.error('Failed to load store QR code:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadQrData();

    return () => {
      active = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [storeId, api, token]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeStorefrontUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
    setShareOpen(false);
  };

  const handleShareWhatsApp = () => {
    const text = `Order directly from our official store ${storeName}: ${activeStorefrontUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setShareOpen(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Visit ${storeName}'s official store on LetZShop`,
          url: activeStorefrontUrl,
        });
      } catch {}
    }
    setShareOpen(false);
  };

  const handleDownload = async (format: 'png' | 'svg', size = 1200, label = 'Standard PNG') => {
    if (!storeId) return;
    try {
      setDownloading(label);
      const downloadUrl = api.stores.getQrCodeDownloadUrl(storeId, format, size);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(downloadUrl, { headers });
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `letzshop-qr-${storeSubdomain || storeSlug}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download QR code:', err);
    } finally {
      setDownloading(null);
      setPrintMenuOpen(false);
    }
  };

  const cardClasses =
    variant === 'card'
      ? 'bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl p-5 sm:p-6 shadow-xs'
      : 'w-full';

  return (
    <div className={`${cardClasses} ${className}`}>
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
        {/* Left: Scannable QR Code Frame */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center w-52 h-52 sm:w-60 sm:h-60 transition-all hover:shadow-md">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--merchant-primary)]" />
                <span className="text-xs font-medium">Generating QR...</span>
              </div>
            ) : qrImageBlobUrl ? (
              <img
                src={qrImageBlobUrl}
                alt={`${storeName} Permanent Store QR Code`}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400 text-center p-4">
                <QrCode className="w-10 h-10 text-slate-300" />
                <span className="text-xs font-medium">QR unavailable</span>
              </div>
            )}

            {/* Permanent badge overlay */}
            <div className="absolute -bottom-2.5 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-700 shadow-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Permanent QR</span>
            </div>
          </div>

          <p className="text-[11px] text-[var(--merchant-text-muted)] text-center mt-4 max-w-[220px]">
            Scan with any smartphone camera or UPI scanner to test
          </p>
        </div>

        {/* Right: Store Details, Active URL & Actions */}
        <div className="flex-1 space-y-4 text-center lg:text-left min-w-0">
          <div>
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <h3 className="text-xl font-bold text-[var(--merchant-text)] tracking-tight">
                Your Store QR Code
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5" /> High-Res
              </span>
            </div>
            <p className="text-xs text-[var(--merchant-text-muted)] mt-1">
              Print this code on your shop counter, product boxes, business cards, and banners.
            </p>
          </div>

          {/* Active Storefront URL Bar */}
          <div className="bg-[var(--merchant-surface-raised)] border border-[var(--merchant-border)] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-left min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--merchant-text-muted)] block">
                Active Storefront URL
              </span>
              <a
                href={activeStorefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs sm:text-sm font-mono font-medium text-[var(--merchant-primary)] hover:underline truncate block"
                title={activeStorefrontUrl}
              >
                {activeStorefrontUrl}
              </a>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                id="btn-qr-copy-store-link"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--merchant-surface)] border border-[var(--merchant-border)] hover:bg-[var(--merchant-surface-muted)] text-[var(--merchant-text)] transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <a
                href={activeStorefrontUrl}
                target="_blank"
                rel="noreferrer"
                id="btn-qr-open-storefront"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--merchant-surface)] border border-[var(--merchant-border)] hover:bg-[var(--merchant-surface-muted)] text-[var(--merchant-text)] transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </a>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
            {/* 1. Download QR Code (PNG) */}
            <button
              type="button"
              id="btn-download-qr-png"
              disabled={loading || Boolean(downloading)}
              onClick={() => handleDownload('png', 1200, 'PNG')}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {downloading === 'PNG' ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              Download QR Code (PNG)
            </button>

            {/* 2. Download Print QR (SVG / 2048px PNG) Popover */}
            <div className="relative" ref={printRef}>
              <button
                type="button"
                id="btn-download-print-qr"
                disabled={loading || Boolean(downloading)}
                onClick={() => setPrintMenuOpen((prev) => !prev)}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--merchant-surface)] border border-[var(--merchant-border)] hover:bg-[var(--merchant-surface-muted)] text-[var(--merchant-text)] transition-colors shadow-2xs disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5 text-[var(--merchant-text-muted)]" />
                Download Print QR
                <ChevronDown className="w-3 h-3 ml-1 text-[var(--merchant-text-muted)]" />
              </button>

              {printMenuOpen && (
                <div className="absolute left-0 lg:left-auto lg:right-0 mt-2 w-56 bg-[var(--merchant-surface-raised)] rounded-xl shadow-lg border border-[var(--merchant-border)] py-1.5 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => handleDownload('svg', 1200, 'SVG')}
                    className="w-full px-3.5 py-2 text-left hover:bg-[var(--merchant-surface-muted)] flex items-center justify-between text-[var(--merchant-text)] font-medium transition-colors"
                  >
                    <span>Vector SVG (Scalable Print)</span>
                    <span className="text-[10px] text-emerald-500 font-bold">Vector</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload('png', 2048, 'PNG Ultra')}
                    className="w-full px-3.5 py-2 text-left hover:bg-[var(--merchant-surface-muted)] flex items-center justify-between text-[var(--merchant-text)] font-medium transition-colors border-t border-[var(--merchant-border)]"
                  >
                    <span>Ultra HD PNG (2048 × 2048)</span>
                    <span className="text-[10px] text-[var(--merchant-text-muted)] font-mono">300 DPI</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Share Store Popover */}
            <div className="relative" ref={shareRef}>
              <button
                type="button"
                id="btn-share-qr-store"
                onClick={() => setShareOpen((prev) => !prev)}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--merchant-surface)] border border-[var(--merchant-border)] hover:bg-[var(--merchant-surface-muted)] text-[var(--merchant-text)] transition-colors shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5 text-[var(--merchant-text-muted)]" />
                Share Store
                <ChevronDown className="w-3 h-3 ml-1 text-[var(--merchant-text-muted)]" />
              </button>

              {shareOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[var(--merchant-surface-raised)] rounded-xl shadow-lg border border-[var(--merchant-border)] py-1.5 z-30 text-xs">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full px-3.5 py-2 text-left hover:bg-[var(--merchant-surface-muted)] flex items-center justify-between text-[var(--merchant-text)] font-medium transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-[var(--merchant-text-muted)]" />
                      {copied ? 'Link Copied!' : 'Copy Store Link'}
                    </span>
                    {copied && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full px-3.5 py-2 text-left hover:bg-[var(--merchant-surface-muted)] flex items-center gap-2 text-[var(--merchant-text)] font-medium transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Share via WhatsApp
                  </button>
                  {canNativeShare && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="w-full px-3.5 py-2 text-left hover:bg-[var(--merchant-surface-muted)] flex items-center gap-2 text-[var(--merchant-text)] font-medium transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[var(--merchant-primary)]" />
                      More Options...
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Critical Guarantee Status Note */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 text-[11px] text-[var(--merchant-text-muted)] bg-[var(--merchant-surface-raised)] px-3 py-1.5 rounded-lg border border-[var(--merchant-border)] text-left">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                Your permanent store QR code remains the same even if your store address changes.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
