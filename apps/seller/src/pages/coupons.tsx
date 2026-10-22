import { getPublicStoreUrl } from '@simply/types';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  X, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useSellerI18n } from '@simply/i18n';
import { formatPaise } from '@simply/ui';
import { getStorefrontUrl } from '../utils/config';

export interface CouponItem {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number; // percentage (e.g. 10) or flat paise (e.g. 5000 for ₹50)
  label: string;
  minOrderPaise?: number;
  maxDiscountPaise?: number;
  isActive: boolean;
  usageCount: number;
  expiresAt?: string;
  createdAt: string;
}

const DEFAULT_COUPONS: CouponItem[] = [
  {
    id: 'c1',
    code: 'WELCOME10',
    type: 'PERCENTAGE',
    value: 10,
    label: '10% Off — Welcome Discount',
    minOrderPaise: 50000, // ₹500
    maxDiscountPaise: 20000, // ₹200
    isActive: true,
    usageCount: 24,
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'c2',
    code: 'FLAT50',
    type: 'FLAT',
    value: 5000, // ₹50
    label: '₹50 Flat Off on Cart',
    minOrderPaise: 30000, // ₹300
    isActive: true,
    usageCount: 18,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'c3',
    code: 'SAVE20',
    type: 'PERCENTAGE',
    value: 20,
    label: '20% Mega Savings Offer',
    minOrderPaise: 100000, // ₹1,000
    maxDiscountPaise: 50000, // ₹500
    isActive: true,
    usageCount: 31,
    createdAt: '2026-02-14T00:00:00.000Z',
  },
  {
    id: 'c4',
    code: 'FIRST100',
    type: 'FLAT',
    value: 10000, // ₹100
    label: '₹100 Off for First-Time Buyers',
    minOrderPaise: 50000, // ₹500
    isActive: true,
    usageCount: 12,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'c5',
    code: 'FREESHIP',
    type: 'FLAT',
    value: 0,
    label: 'Free Express Shipping',
    minOrderPaise: 0,
    isActive: true,
    usageCount: 45,
    createdAt: '2026-03-10T00:00:00.000Z',
  },
];

export default function CouponsManagementPage() {
  const { store } = useAuth();
  const { t, locale } = useSellerI18n();
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [valAmount, setValAmount] = useState(''); // e.g. "15" for 15% or "75" for ₹75
  const [label, setLabel] = useState('');
  const [minOrderRupees, setMinOrderRupees] = useState('');
  const [maxDiscountRupees, setMaxDiscountRupees] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [formError, setFormError] = useState('');

  const storageKey = store?.id ? `simply_coupons_${store.id}` : 'simply_coupons_default';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCoupons(JSON.parse(saved));
      } else {
        setCoupons(DEFAULT_COUPONS);
        localStorage.setItem(storageKey, JSON.stringify(DEFAULT_COUPONS));
      }
    } catch (e) {
      setCoupons(DEFAULT_COUPONS);
    }
  }, [storageKey]);

  const saveCoupons = (newList: CouponItem[]) => {
    setCoupons(newList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newList));
      // Broadcast so storefront cart context can sync custom coupons
      localStorage.setItem('simply_custom_coupons', JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to persist coupons', e);
    }
  };

  const handleCopyCode = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(codeToCopy);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = (id: string) => {
    const updated = coupons.map((c) => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    saveCoupons(updated);
  };

  const handleDeleteCoupon = (id: string) => {
    if (confirm(t('coupons.confirmDelete'))) {
      const updated = coupons.filter((c) => c.id !== id);
      saveCoupons(updated);
    }
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      setFormError(t('coupons.errEnterCode'));
      return;
    }

    if (coupons.some((c) => c.code === cleanCode)) {
      setFormError(t('coupons.errCodeExists', { code: cleanCode }));
      return;
    }

    const numericVal = parseFloat(valAmount);
    if (isNaN(numericVal) || numericVal <= 0) {
      setFormError(t('coupons.errValidValue'));
      return;
    }

    if (type === 'PERCENTAGE' && numericVal > 100) {
      setFormError(t('coupons.errMaxPercent'));
      return;
    }

    const minPaise = minOrderRupees ? Math.round(parseFloat(minOrderRupees) * 100) : undefined;
    const maxPaise = maxDiscountRupees ? Math.round(parseFloat(maxDiscountRupees) * 100) : undefined;

    const newCoupon: CouponItem = {
      id: `c_${Date.now()}`,
      code: cleanCode,
      type,
      value: type === 'PERCENTAGE' ? numericVal : Math.round(numericVal * 100),
      label: label.trim() || `${cleanCode} Special Discount`,
      minOrderPaise: minPaise,
      maxDiscountPaise: maxPaise,
      isActive: true,
      usageCount: 0,
      expiresAt: expiresAt || undefined,
      createdAt: new Date().toISOString(),
    };

    saveCoupons([newCoupon, ...coupons]);
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCode('');
    setType('PERCENTAGE');
    setValAmount('');
    setLabel('');
    setMinOrderRupees('');
    setMaxDiscountRupees('');
    setExpiresAt('');
    setFormError('');
  };

  const applyTemplate = (tCode: string, tType: 'PERCENTAGE' | 'FLAT', tVal: string, tLabel: string, tMin: string, tMax?: string) => {
    setCode(tCode);
    setType(tType);
    setValAmount(tVal);
    setLabel(tLabel);
    setMinOrderRupees(tMin);
    setMaxDiscountRupees(tMax || '');
    setModalOpen(true);
  };

  const getWhatsAppShareUrl = (c: CouponItem) => {
    const storeLink = store ? getPublicStoreUrl(store.slug, getStorefrontUrl()) : 'our store';
    const discStr = c.type === 'PERCENTAGE' ? `${c.value}% OFF` : `₹${(c.value / 100).toFixed(0)} OFF`;
    const minStr = c.minOrderPaise ? ` on orders above ₹${(c.minOrderPaise / 100).toFixed(0)}` : '';
    const text = encodeURIComponent(
      `🎉 Special Offer! Get ${discStr}${minStr} at ${store?.name || 'our online store'}.\n\nUse Coupon Code: *${c.code}* at checkout.\nShop now: ${storeLink}`
    );
    return `https://wa.me/?text=${text}`;
  };

  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalUsages = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);

  return (
    <Layout>
      <Head>
        <title>{t('coupons.title')} | Simply Seller</title>
      </Head>

      <div className="space-y-6 max-w-5xl pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--merchant-border)' }}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--merchant-text)' }}>
              <Tag className="w-6 h-6" style={{ color: 'var(--merchant-primary)' }} />
              <span>{t('coupons.title')}</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--merchant-text-muted)' }}>
              {t('coupons.subtitle')}
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            style={{ backgroundColor: 'var(--merchant-primary)', color: '#ffffff' }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl shadow-xs transition shrink-0 hover:opacity-90 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('coupons.createNewCoupon')}</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="p-5 rounded-2xl border shadow-2xs space-y-1 transition-colors"
            style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)' }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--merchant-text-muted)' }}>
              {t('coupons.activeCoupons')}
            </span>
            <div className="text-2xl font-black" style={{ color: 'var(--merchant-text)' }}>
              {activeCount} of {coupons.length}
            </div>
            <p className="text-xs text-emerald-400 font-medium">{t('coupons.readyForCheckout')}</p>
          </div>

          <div
            className="p-5 rounded-2xl border shadow-2xs space-y-1 transition-colors"
            style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)' }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--merchant-text-muted)' }}>
              {t('coupons.totalRedemptions')}
            </span>
            <div className="text-2xl font-black" style={{ color: 'var(--merchant-text)' }}>{totalUsages}</div>
            <p className="text-xs font-medium" style={{ color: 'var(--merchant-text-muted)' }}>
              {t('coupons.ordersPlacedWithCoupons')}
            </p>
          </div>

          <div
            className="p-5 rounded-2xl border shadow-2xs space-y-1 transition-colors"
            style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)' }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--merchant-text-muted)' }}>
              {t('coupons.storefrontSync')}
            </span>
            <div className="text-2xl font-black text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-6 h-6" /> {t('coupons.liveStatus')}
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--merchant-text-muted)' }}>
              {t('coupons.autoValidated')}
            </p>
          </div>
        </div>

        {/* Quick Launch Templates */}
        <div
          className="p-6 rounded-2xl shadow-sm space-y-4 border"
          style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)', color: 'var(--merchant-text)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-amber-400">
              {t('coupons.quickLaunchers')}
            </h2>
          </div>
          <p className="text-xs" style={{ color: 'var(--merchant-text-secondary)' }}>
            {t('coupons.quickLaunchersDesc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => applyTemplate('FESTIVE25', 'PERCENTAGE', '25', 'Festive Season 25% Off', '800', '400')}
              style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)' }}
              className="text-left p-3.5 rounded-xl border transition hover:opacity-90 cursor-pointer"
            >
              <div className="text-xs font-bold text-amber-400 font-mono">FESTIVE25</div>
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--merchant-text)' }}>25% Festive Discount</div>
              <div className="text-[11px]" style={{ color: 'var(--merchant-text-muted)' }}>Min Order ₹800 • Max ₹400 off</div>
            </button>

            <button
              onClick={() => applyTemplate('VIP150', 'FLAT', '150', 'VIP Customer ₹150 Flat Off', '1200')}
              style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)' }}
              className="text-left p-3.5 rounded-xl border transition hover:opacity-90 cursor-pointer"
            >
              <div className="text-xs font-bold text-emerald-400 font-mono">VIP150</div>
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--merchant-text)' }}>Flat ₹150 Off</div>
              <div className="text-[11px]" style={{ color: 'var(--merchant-text-muted)' }}>Min Order ₹1,200</div>
            </button>

            <button
              onClick={() => applyTemplate('WEEKEND15', 'PERCENTAGE', '15', '15% Weekend Flash Sale', '500', '200')}
              style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)' }}
              className="text-left p-3.5 rounded-xl border transition hover:opacity-90 cursor-pointer"
            >
              <div className="text-xs font-bold text-pink-400 font-mono">WEEKEND15</div>
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--merchant-text)' }}>15% Flash Sale</div>
              <div className="text-[11px]" style={{ color: 'var(--merchant-text-muted)' }}>Min Order ₹500 • Max ₹200 off</div>
            </button>
          </div>
        </div>

        {/* Coupons List */}
        <div
          className="border rounded-2xl shadow-2xs overflow-hidden transition-colors"
          style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)' }}
        >
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--merchant-border)' }}>
            <h2 className="text-base font-bold" style={{ color: 'var(--merchant-text)' }}>
              {t('coupons.activeCouponsList')} ({coupons.length})
            </h2>
            <span className="text-xs" style={{ color: 'var(--merchant-text-muted)' }}>
              {t('coupons.autoValidated')}
            </span>
          </div>

          {coupons.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="w-10 h-10 mx-auto text-[var(--merchant-text-muted)] opacity-40 mb-3" />
              <h3 className="text-sm font-bold text-[var(--merchant-text)]">{t('coupons.noCouponsFound')}</h3>
              <p className="text-xs text-[var(--merchant-text-muted)] mt-1">{t('coupons.noCouponsDesc')}</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--merchant-border)' }}>
              {coupons.map((c) => {
                const isCopied = copiedCode === c.code;
                const discDisplay = c.type === 'PERCENTAGE' 
                  ? t('coupons.percentOff', { percent: c.value }) 
                  : c.value === 0 ? 'FREE DELIVERY' : t('coupons.flatOff', { amount: (c.value / 100).toFixed(0) });

                return (
                  <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--merchant-surface-raised)] transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="px-3 py-1 border rounded-lg text-xs font-mono font-bold tracking-wider"
                          style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)', color: 'var(--merchant-text)' }}
                        >
                          {c.code}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {discDisplay}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            c.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'opacity-60 border'
                          }`}
                          style={!c.isActive ? { backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)', color: 'var(--merchant-text-muted)' } : undefined}
                        >
                          {c.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </div>

                      <p className="text-xs font-medium" style={{ color: 'var(--merchant-text)' }}>
                        {c.label}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'var(--merchant-text-muted)' }}>
                        {c.minOrderPaise ? (
                          <span>{t('coupons.minOrder', { amount: (c.minOrderPaise / 100).toFixed(0) })}</span>
                        ) : (
                          <span>{t('coupons.noMinOrder')}</span>
                        )}
                        {c.maxDiscountPaise && (
                          <span>• {t('coupons.maxDiscount', { amount: (c.maxDiscountPaise / 100).toFixed(0) })}</span>
                        )}
                        <span>• Used: <strong style={{ color: 'var(--merchant-text)' }}>{c.usageCount || 0}</strong></span>
                        {c.expiresAt && (
                          <span>• {t('coupons.expires', { date: new Date(c.expiresAt).toLocaleDateString(locale) })}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <button
                        onClick={() => handleCopyCode(c.code)}
                        style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)', color: 'var(--merchant-text)' }}
                        className="px-2.5 py-1.5 text-xs font-medium border rounded-lg transition flex items-center gap-1 hover:opacity-90 cursor-pointer"
                        title={t('coupons.copyCode')}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? t('coupons.copied') : t('coupons.copyCode')}</span>
                      </button>

                      <a
                        href={getWhatsAppShareUrl(c)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 text-xs font-medium text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        title={t('coupons.shareWhatsApp')}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t('coupons.shareWhatsApp')}</span>
                      </a>

                      <button
                        onClick={() => handleToggleStatus(c.id)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                          c.isActive
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                      >
                        {c.isActive ? t('coupons.deactivate') : t('coupons.activate')}
                      </button>

                      <button
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="p-1.5 opacity-60 hover:opacity-100 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title={t('coupons.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CREATE COUPON MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-scaleUp border"
            style={{ backgroundColor: 'var(--merchant-surface)', borderColor: 'var(--merchant-border)', color: 'var(--merchant-text)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--merchant-border)' }}>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--merchant-text)' }}>
                <Tag className="w-4 h-4" style={{ color: 'var(--merchant-primary)' }} />
                <span>{t('coupons.modalTitle')}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="opacity-60 hover:opacity-100 p-1 cursor-pointer"
                style={{ color: 'var(--merchant-text)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--merchant-text-secondary)' }}>
                  {t('coupons.codeLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={t('coupons.codePlaceholder')}
                  style={{
                    backgroundColor: 'var(--merchant-input-bg)',
                    borderColor: 'var(--merchant-input-border)',
                    color: 'var(--merchant-text)',
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-[var(--merchant-focus-ring)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--merchant-text-secondary)' }}>
                    {t('coupons.typeLabel')} *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    style={{
                      backgroundColor: 'var(--merchant-input-bg)',
                      borderColor: 'var(--merchant-input-border)',
                      color: 'var(--merchant-text)',
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[var(--merchant-focus-ring)] font-medium"
                  >
                    <option value="PERCENTAGE">{t('coupons.percentage')}</option>
                    <option value="FLAT">{t('coupons.flatAmount')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--merchant-text-secondary)' }}>
                    {t('coupons.discountValue')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={type === 'PERCENTAGE' ? '100' : '50000'}
                    value={valAmount}
                    onChange={(e) => setValAmount(e.target.value)}
                    placeholder={type === 'PERCENTAGE' ? t('coupons.valPlaceholderPercent') : t('coupons.valPlaceholderFlat')}
                    style={{
                      backgroundColor: 'var(--merchant-input-bg)',
                      borderColor: 'var(--merchant-input-border)',
                      color: 'var(--merchant-text)',
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-[var(--merchant-focus-ring)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--merchant-text-secondary)' }}>
                  {t('coupons.campaignName')}
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t('coupons.campaignPlaceholder')}
                  style={{
                    backgroundColor: 'var(--merchant-input-bg)',
                    borderColor: 'var(--merchant-input-border)',
                    color: 'var(--merchant-text)',
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[var(--merchant-focus-ring)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--merchant-text-secondary)' }}>
                    {t('coupons.minOrderLabel')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderRupees}
                    onChange={(e) => setMinOrderRupees(e.target.value)}
                    placeholder={t('coupons.minOrderPlaceholder')}
                    style={{
                      backgroundColor: 'var(--merchant-input-bg)',
                      borderColor: 'var(--merchant-input-border)',
                      color: 'var(--merchant-text)',
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-[var(--merchant-focus-ring)]"
                  />
                </div>

                {type === 'PERCENTAGE' ? (
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--merchant-text-secondary)' }}>
                      {t('coupons.maxDiscountLabel')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={maxDiscountRupees}
                      onChange={(e) => setMaxDiscountRupees(e.target.value)}
                      placeholder={t('coupons.maxDiscountPlaceholder')}
                      style={{
                        backgroundColor: 'var(--merchant-input-bg)',
                        borderColor: 'var(--merchant-input-border)',
                        color: 'var(--merchant-text)',
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-[var(--merchant-focus-ring)]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--merchant-text-secondary)' }}>
                      {t('coupons.expiryDateLabel')}
                    </label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      style={{
                        backgroundColor: 'var(--merchant-input-bg)',
                        borderColor: 'var(--merchant-input-border)',
                        color: 'var(--merchant-text)',
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[var(--merchant-focus-ring)]"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t" style={{ borderColor: 'var(--merchant-border)' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ backgroundColor: 'var(--merchant-surface-raised)', borderColor: 'var(--merchant-border)', color: 'var(--merchant-text)' }}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold hover:opacity-90 transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: 'var(--merchant-primary)', color: '#ffffff' }}
                  className="px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:opacity-90 cursor-pointer"
                >
                  {t('coupons.saveCoupon')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
