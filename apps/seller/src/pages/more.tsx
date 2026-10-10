import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import {
  CreditCard,
  Truck,
  Receipt,
  Building2,
  UserCheck,
  ChevronRight,
  LogOut,
  ShieldCheck,
  KeyRound,
  FileText,
  Phone,
  Sparkles,
  ExternalLink,
  PackageCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Tag,
} from 'lucide-react';

export default function MoreSettingsPage() {
  const { user, store, logout } = useAuth();
  const router = useRouter();

  // Redirect canonical navigation from /more to /settings
  React.useEffect(() => {
    router.replace('/settings');
  }, [router]);

  const [codEnabled, setCodEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(false);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out of your merchant account?')) {
      await logout();
      router.push('/login');
    }
  };

  const isLive = store?.status === 'LIVE' || store?.status === 'ACTIVE';

  return (
    <Layout>
      <Head>
        <title>More Settings & Configurations | Simply Seller</title>
      </Head>

      <div className="max-w-4xl space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">More Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure payments, fulfillment, subscriptions, and merchant account policies
          </p>
        </div>

        {/* =========================================================================
            PROMOTIONS & COUPONS
        ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Promotions & Growth</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Promotional Coupons & Discount Codes</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    Checkout Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Create promo codes (e.g. WELCOME10, FESTIVE25), flat rupee or % discounts, and minimum order rules
                </p>
              </div>
              <button
                onClick={() => router.push('/coupons')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition"
              >
                Manage Coupons <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================================
            1. PAYMENTS
        ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Payments & Collections</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
            {/* Payment Setup */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Payment Setup</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    UPI & Cards
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Accept pan-India UPI, credit/debit cards, and netbanking from customers
                </p>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                Configure <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* COD Toggle */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      codEnabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {codEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Allow buyers to pay cash upon doorstep package delivery
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => setCodEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Razorpay Status */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Razorpay Gateway Integration</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Automated settlements directly into your merchant bank account
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-400">Sandbox / Live</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. DELIVERY
        ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Delivery & Logistics</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
            {/* Shipping Config */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Shipping Rates & Zones</h3>
                <p className="text-xs text-slate-500">
                  Flat rate shipping, free shipping thresholds, and regional courier rates
                </p>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Store Pickup */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">In-Store / Warehouse Pickup</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      pickupEnabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pickupEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Allow local customers to collect their orders directly from your store
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={pickupEnabled}
                  onChange={(e) => setPickupEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Shiprocket / Ekart */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Courier Aggregators</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                    Shiprocket / Ekart
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Connect third-party 3PL APIs for automated AWB generation and courier tracking
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">Available in v2</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. BILLING
        ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Billing & Subscription</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
            {/* Current Plan */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Current Subscription</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isLive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isLive ? 'Active Merchant' : 'Subscription Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Store status: {store?.status || 'PRIVATE'} · Zero commissions on customer sales
                </p>
              </div>
              <button
                onClick={() => router.push('/subscription')}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Upgrade / Renew
              </button>
            </div>

            {/* Invoices */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">GST Invoices & History</h3>
                <p className="text-xs text-slate-500">
                  Download monthly subscription tax invoices with GSTIN input
                </p>
              </div>
              <button
                onClick={() => router.push('/subscription')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                View History <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. BUSINESS
        ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span>Business Information & Policies</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
            {/* Business Info */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">{store?.name || 'Business Info'}</h3>
                <p className="text-xs text-slate-500">
                  Category: {store?.category || 'Retail'} · Slug: simply.in/store/{store?.slug || ''}
                </p>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                Edit Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Contact & Support */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Customer Support Contact</h3>
                <p className="text-xs text-slate-500">
                  WhatsApp support number and customer inquiry email displayed on storefront footer
                </p>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                Update <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Policies */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Store Policies</h3>
                <p className="text-xs text-slate-500">
                  Standard return, exchange, privacy, and terms of service policies
                </p>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                Edit Policies <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. ACCOUNT
        ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-slate-700" />
            <span>Account & Security</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
            {/* PIN / Account */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Merchant Phone & PIN</h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    {user?.phone ? `+91 ${user.phone.slice(-10)}` : 'Verified'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Manage your secure 6-digit login PIN and merchant authentication settings
                </p>
              </div>
              <button
                onClick={() => alert('PIN change: Please request an OTP verification on your registered phone number.')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                Change PIN <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Logout Action */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-rose-50/20">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-rose-700">Sign Out of Simply</h3>
                <p className="text-xs text-slate-500">
                  Safely end this session on this browser device
                </p>
              </div>
              <button
                onClick={handleLogout}
                id="btn-more-logout"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors shadow-2xs shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
