import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Share2, 
  Percent, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  X, 
  AlertCircle,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { formatPaise } from '@simply/ui';

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
    if (confirm('Are you sure you want to delete this promotional coupon code?')) {
      const updated = coupons.filter((c) => c.id !== id);
      saveCoupons(updated);
    }
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      setFormError('Please enter a valid coupon code (letters and numbers only).');
      return;
    }

    if (coupons.some((c) => c.code === cleanCode)) {
      setFormError(`Coupon code "${cleanCode}" already exists. Please choose a unique code.`);
      return;
    }

    const numericVal = parseFloat(valAmount);
    if (isNaN(numericVal) || numericVal <= 0) {
      setFormError('Please enter a valid discount value greater than 0.');
      return;
    }

    if (type === 'PERCENTAGE' && numericVal > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
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
    const storeLink = store ? `http://localhost:3000/store/${store.slug}` : 'our store';
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
        <title>Promotions & Coupons | Simply Seller</title>
      </Head>

      <div className="space-y-6 max-w-5xl pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Tag className="w-6 h-6 text-emerald-600" /> Promotional Coupons & Discounts
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create and manage promo codes, festive discounts, and loyalty offers for your store.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Coupon
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Coupons</span>
            <div className="text-2xl font-black text-slate-900">{activeCount} of {coupons.length}</div>
            <p className="text-xs text-emerald-600 font-medium">Ready for buyer checkout</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Redemptions</span>
            <div className="text-2xl font-black text-slate-900">{totalUsages}</div>
            <p className="text-xs text-slate-500 font-medium">Orders placed with coupon codes</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storefront Sync</span>
            <div className="text-2xl font-black text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-6 h-6" /> Live
            </div>
            <p className="text-xs text-slate-500 font-medium">Auto-validated during checkout</p>
          </div>
        </div>

        {/* Quick Launch Templates */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-amber-300">Quick Campaign Launchers</h2>
          </div>
          <p className="text-xs text-slate-300">
            One-click create proven promotional campaigns designed for Indian festive & seasonal buying:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => applyTemplate('FESTIVE25', 'PERCENTAGE', '25', 'Festive Season 25% Off', '800', '400')}
              className="text-left p-3.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition"
            >
              <div className="text-xs font-bold text-amber-300 font-mono">FESTIVE25</div>
              <div className="text-xs font-semibold text-white mt-1">25% Festive Discount</div>
              <div className="text-[11px] text-slate-400">Min Order ₹800 • Max ₹400 off</div>
            </button>

            <button
              onClick={() => applyTemplate('VIP150', 'FLAT', '150', 'VIP Customer ₹150 Flat Off', '1200')}
              className="text-left p-3.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition"
            >
              <div className="text-xs font-bold text-emerald-300 font-mono">VIP150</div>
              <div className="text-xs font-semibold text-white mt-1">Flat ₹150 Off</div>
              <div className="text-[11px] text-slate-400">Min Order ₹1,200</div>
            </button>

            <button
              onClick={() => applyTemplate('WEEKEND15', 'PERCENTAGE', '15', '15% Weekend Flash Sale', '500', '200')}
              className="text-left p-3.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition"
            >
              <div className="text-xs font-bold text-pink-300 font-mono">WEEKEND15</div>
              <div className="text-xs font-semibold text-white mt-1">15% Flash Sale</div>
              <div className="text-[11px] text-slate-400">Min Order ₹500 • Max ₹200 off</div>
            </button>
          </div>
        </div>

        {/* Coupons List */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Configured Coupons ({coupons.length})</h2>
            <span className="text-xs text-slate-500">Buyer applies code at Cart or Checkout</span>
          </div>

          <div className="divide-y divide-slate-100">
            {coupons.map((c) => {
              const isCopied = copiedCode === c.code;
              const discDisplay = c.type === 'PERCENTAGE' 
                ? `${c.value}% OFF` 
                : c.value === 0 ? 'FREE DELIVERY' : `₹${(c.value / 100).toFixed(0)} FLAT OFF`;

              return (
                <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 tracking-wider">
                        {c.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {discDisplay}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      {c.label}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      {c.minOrderPaise ? (
                        <span>Min Order: <strong className="text-slate-700">{formatPaise(c.minOrderPaise)}</strong></span>
                      ) : (
                        <span>No minimum order</span>
                      )}
                      {c.maxDiscountPaise && (
                        <span>• Max Cap: <strong className="text-slate-700">{formatPaise(c.maxDiscountPaise)}</strong></span>
                      )}
                      <span>• Used: <strong className="text-slate-700">{c.usageCount || 0} times</strong></span>
                      {c.expiresAt && (
                        <span>• Expires: <strong className="text-slate-700">{new Date(c.expiresAt).toLocaleDateString('en-IN')}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <button
                      onClick={() => handleCopyCode(c.code)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
                      title="Copy code"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <a
                      href={getWhatsAppShareUrl(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition flex items-center gap-1"
                      title="Share to WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </a>

                    <button
                      onClick={() => handleToggleStatus(c.id)}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                        c.isActive
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {c.isActive ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CREATE COUPON MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" /> Create Promotional Coupon
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coupon Code * <span className="text-slate-400 font-normal">(Auto-capitalized)</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DIWALI20 or SAVE100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Rupees (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {type === 'PERCENTAGE' ? 'Discount % *' : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={type === 'PERCENTAGE' ? '100' : '50000'}
                    value={valAmount}
                    onChange={(e) => setValAmount(e.target.value)}
                    placeholder={type === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 100'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Promotional Title / Description
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. 15% Off on All Orders this Festive Week"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Minimum Order (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderRupees}
                    onChange={(e) => setMinOrderRupees(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {type === 'PERCENTAGE' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={maxDiscountRupees}
                      onChange={(e) => setMaxDiscountRupees(e.target.value)}
                      placeholder="e.g. 300"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Save & Activate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
