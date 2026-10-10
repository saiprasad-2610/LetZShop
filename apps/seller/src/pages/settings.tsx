import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Settings, 
  Store, 
  CreditCard, 
  Truck, 
  Shield, 
  Check, 
  Save, 
  AlertTriangle,
  Building,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Banknote,
  Tag,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function SettingsPage() {
  const { api, token, loading: authLoading } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store Form State
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');

  // Payment Methods State (COD & Razorpay)
  const [codEnabled, setCodEnabled] = useState(true);
  const [savingCod, setSavingCod] = useState(false);
  const [codSaveMsg, setCodSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [razorpayConnected, setRazorpayConnected] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpaySecretConfigured, setRazorpaySecretConfigured] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSaveMsg, setPaymentSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Shiprocket Shipping State
  const [shiprocketConnected, setShiprocketConnected] = useState(false);
  const [shiprocketEmail, setShiprocketEmail] = useState('');
  const [shiprocketPassword, setShiprocketPassword] = useState('');
  const [shiprocketPasswordConfigured, setShiprocketPasswordConfigured] = useState(false);
  const [shiprocketPickupLocation, setShiprocketPickupLocation] = useState('Primary');
  const [shiprocketEnabled, setShiprocketEnabled] = useState(true);
  const [showShiprocketPassword, setShowShiprocketPassword] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);
  const [testingShipping, setTestingShipping] = useState(false);
  const [shippingSaveMsg, setShippingSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [shippingTestMsg, setShippingTestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delivery Charges & Free Delivery Threshold State
  const [deliveryChargeRupees, setDeliveryChargeRupees] = useState<number>(0);
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState<boolean>(true);
  const [freeDeliveryThresholdRupees, setFreeDeliveryThresholdRupees] = useState<number>(499);
  const [savingDeliveryRates, setSavingDeliveryRates] = useState<boolean>(false);
  const [deliveryRatesSaveMsg, setDeliveryRatesSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (authLoading && !token) return;
    loadSettings();
    loadPaymentSettings();
    loadDeliveryRates();
    loadShippingSettings();
  }, [authLoading, token]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const s = await api.stores.getMyStore();
      setStore(s);
      setBusinessName(s.name || '');
      setCategory(s.category || '');
      setContactPhone(s.contactPhone || '');
      setContactEmail(s.contactEmail || '');
      setAddress(s.address || '');
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const res = await api.paymentSettings.get();
      const data = res?.data || res;
      if (data) {
        const isConn = Boolean(data.connected && data.keyId && data.keyId !== 'pending_setup');
        setRazorpayConnected(isConn);
        setRazorpayKeyId(data.keyId === 'pending_setup' ? '' : (data.keyId || ''));
        setRazorpaySecretConfigured(Boolean(data.secretConfigured));
        if (typeof data.codEnabled === 'boolean') {
          setCodEnabled(data.codEnabled);
        }
      }
    } catch (err) {
      console.error('Failed to load payment settings', err);
    }
  };

  const handleToggleCod = async (nextVal: boolean) => {
    setCodEnabled(nextVal);
    setSavingCod(true);
    setCodSaveMsg(null);
    try {
      await api.paymentSettings.toggleCod(nextVal);
      setCodSaveMsg({
        type: 'success',
        text: `Cash on Delivery is now ${nextVal ? 'ENABLED' : 'DISABLED'} for your customers.`,
      });
    } catch (err: any) {
      setCodEnabled(!nextVal); // revert on failure
      setCodSaveMsg({
        type: 'error',
        text: err.message || 'Failed to update COD setting.',
      });
    } finally {
      setSavingCod(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.themes.updateBranding({
        storeName: businessName,
      });
      alert('Store settings updated successfully!');
      loadSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const loadDeliveryRates = async () => {
    try {
      const res = await api.deliveryRates.get();
      const data = res?.data || res;
      if (data) {
        if (typeof data.deliveryChargeRupees === 'number') {
          setDeliveryChargeRupees(data.deliveryChargeRupees);
        }
        if (typeof data.freeDeliveryEnabled === 'boolean') {
          setFreeDeliveryEnabled(data.freeDeliveryEnabled);
        }
        if (typeof data.freeDeliveryThresholdRupees === 'number' && data.freeDeliveryThresholdRupees > 0) {
          setFreeDeliveryThresholdRupees(data.freeDeliveryThresholdRupees);
        }
      }
    } catch (err) {
      console.error('Failed to load delivery rates', err);
    }
  };

  const handleSaveDeliveryRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDeliveryRates(true);
    setDeliveryRatesSaveMsg(null);
    try {
      await api.deliveryRates.save({
        deliveryChargeRupees: Number(deliveryChargeRupees) || 0,
        freeDeliveryEnabled,
        freeDeliveryThresholdRupees: freeDeliveryEnabled ? (Number(freeDeliveryThresholdRupees) || 0) : null,
      });
      setDeliveryRatesSaveMsg({
        type: 'success',
        text: 'Delivery charges & Free Delivery threshold saved successfully!',
      });
      setTimeout(() => setDeliveryRatesSaveMsg(null), 5000);
    } catch (err: any) {
      setDeliveryRatesSaveMsg({
        type: 'error',
        text: err.message || 'Failed to save delivery rates',
      });
    } finally {
      setSavingDeliveryRates(false);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSaveMsg(null);

    if (!razorpayKeyId.trim()) {
      setPaymentSaveMsg({ type: 'error', text: 'Razorpay Key ID is required.' });
      return;
    }

    // If account is already configured, allow saving with blank secret (keep existing)
    if (!razorpaySecretConfigured && !razorpayKeySecret.trim()) {
      setPaymentSaveMsg({ type: 'error', text: 'Razorpay Key Secret is required for first-time setup.' });
      return;
    }

    setSavingPayment(true);
    try {
      await api.paymentSettings.save({
        keyId: razorpayKeyId.trim(),
        keySecret: razorpayKeySecret.trim() || '__KEEP_EXISTING__',
        isEnabled: true,
      });
      setPaymentSaveMsg({ type: 'success', text: 'Razorpay credentials saved! Customers can now pay directly to your account.' });
      setRazorpayConnected(true);
      setRazorpaySecretConfigured(true);
      setRazorpayKeySecret(''); // Clear the secret field after saving
    } catch (err: any) {
      setPaymentSaveMsg({ type: 'error', text: err.message || 'Failed to save Razorpay credentials.' });
    } finally {
      setSavingPayment(false);
    }
  };

  const loadShippingSettings = async () => {
    try {
      const res = await api.shippingSettings.get();
      const data = res?.data || res;
      if (data) {
        setShiprocketConnected(Boolean(data.connected));
        setShiprocketEmail(data.email || '');
        setShiprocketPickupLocation(data.pickupLocation || 'Primary');
        setShiprocketPasswordConfigured(Boolean(data.passwordConfigured));
        if (typeof data.isEnabled === 'boolean') {
          setShiprocketEnabled(data.isEnabled);
        }
      }
    } catch (err) {
      console.error('Failed to load shipping settings', err);
    }
  };

  const handleTestShipping = async () => {
    if (!shiprocketEmail.trim()) {
      setShippingTestMsg({ type: 'error', text: 'Please enter your Shiprocket API User Email first.' });
      return;
    }
    if (!shiprocketPasswordConfigured && !shiprocketPassword.trim()) {
      setShippingTestMsg({ type: 'error', text: 'Please enter your Shiprocket API User Password to test.' });
      return;
    }

    setTestingShipping(true);
    setShippingTestMsg(null);
    try {
      const res = await api.shippingSettings.test({
        email: shiprocketEmail.trim(),
        password: shiprocketPassword.trim() || '__KEEP_EXISTING__'
      });
      if (res.success) {
        setShippingTestMsg({
          type: 'success',
          text: res.message || 'Shiprocket authentication successful! Credentials verified.'
        });
      } else {
        setShippingTestMsg({
          type: 'error',
          text: res.message || 'Shiprocket authentication failed. Please verify email and password.'
        });
      }
    } catch (err: any) {
      setShippingTestMsg({
        type: 'error',
        text: err.message || 'Failed to connect to Shiprocket API.'
      });
    } finally {
      setTestingShipping(false);
    }
  };

  const handleSaveShippingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setShippingSaveMsg(null);

    if (!shiprocketEmail.trim()) {
      setShippingSaveMsg({ type: 'error', text: 'Shiprocket API User Email is required.' });
      return;
    }

    if (!shiprocketPasswordConfigured && !shiprocketPassword.trim()) {
      setShippingSaveMsg({ type: 'error', text: 'Shiprocket API User Password is required for first-time configuration.' });
      return;
    }

    setSavingShipping(true);
    try {
      await api.shippingSettings.save({
        email: shiprocketEmail.trim(),
        password: shiprocketPassword.trim() || '__KEEP_EXISTING__',
        pickupLocation: shiprocketPickupLocation.trim() || 'Primary',
        isEnabled: shiprocketEnabled,
      });
      setShippingSaveMsg({
        type: 'success',
        text: 'Shiprocket logistics settings saved! Your placed orders will now be dispatched and tracked via Shiprocket.',
      });
      setShiprocketConnected(true);
      setShiprocketPasswordConfigured(true);
      setShiprocketPassword('');
    } catch (err: any) {
      setShippingSaveMsg({ type: 'error', text: err.message || 'Failed to save Shiprocket settings.' });
    } finally {
      setSavingShipping(false);
    }
  };

  const handleToggleShipping = async (nextVal: boolean) => {
    setShiprocketEnabled(nextVal);
    try {
      await api.shippingSettings.toggle(nextVal);
    } catch (err: any) {
      setShiprocketEnabled(!nextVal);
      alert(err.message || 'Failed to toggle shipping setting');
    }
  };


  return (
    <Layout>
      <Head>
        <title>Store Settings | Simply Seller</title>
      </Head>

      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Store Settings</h1>
          <p className="text-sm text-gray-500">
            Configure your business profile, payment gateways, and logistics integrations
          </p>
        </div>

        {/* SECTION 1: Business Profile */}
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" /> Business Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Business / Brand Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Industry / Category
              </label>
              <input
                type="text"
                value={category}
                disabled
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contact Mobile (WhatsApp Support)
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Storefront Web Slug
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">simply.in/store/</span>
              <input
                type="text"
                disabled
                value={store?.slug || ''}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs font-mono text-gray-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* SECTION 2: Cash on Delivery (COD) Control */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" /> Cash on Delivery (COD)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Allow customers to pay in cash upon doorstep delivery or store pickup.
              </p>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                codEnabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {codEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-200/90">
            <div className="space-y-0.5 pr-4">
              <p className="text-xs font-semibold text-gray-900">
                Accept Cash on Delivery Orders
              </p>
              <p className="text-[11px] text-gray-500">
                {codEnabled
                  ? 'Active: Customers can choose Cash on Delivery at storefront checkout.'
                  : 'Disabled: Customers must pay online via Razorpay (UPI, Cards, Netbanking) to complete orders.'}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={codEnabled}
                disabled={savingCod}
                onChange={(e) => handleToggleCod(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          {codSaveMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                codSaveMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {codSaveMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <p className="font-medium">{codSaveMsg.text}</p>
            </div>
          )}
        </div>

        {/* SECTION 3: Razorpay Payment Gateway Setup */}
        <form onSubmit={handleSavePaymentSettings} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" /> Razorpay Payment Gateway
              </h2>
              {razorpayConnected ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Not Configured
                </span>
              )}
            </div>

            {/* Info banner */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex gap-2">
              <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Your own Razorpay account — money goes directly to you</p>
                <p className="text-indigo-700 mt-0.5">
                  Enter your Razorpay API credentials below. Every customer payment will settle directly into your verified bank account linked to your Razorpay account. We never touch your sales proceeds.
                </p>
              </div>
            </div>

            {/* Warning: not configured */}
            {!razorpayConnected && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <p>Online payments are <strong>disabled</strong> until you add your Razorpay credentials. Customers will not be able to pay online.</p>
              </div>
            )}

            {/* Key ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Razorpay Key ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="rzp_live_xxxxxxxxxxxxxxxx or rzp_test_xxxxxxxxxxxxxxxx"
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Found in Razorpay Dashboard → Settings → API Keys. Use <code className="bg-gray-100 px-1 rounded">rzp_live_</code> for production, <code className="bg-gray-100 px-1 rounded">rzp_test_</code> for testing.
              </p>
            </div>

            {/* Key Secret */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Razorpay Key Secret {!razorpaySecretConfigured && <span className="text-red-500">*</span>}
                {razorpaySecretConfigured && (
                  <span className="ml-2 text-emerald-600 font-normal">(already configured — leave blank to keep existing)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder={razorpaySecretConfigured ? '••••••••••••••••••••' : 'Enter your Razorpay Key Secret'}
                  value={razorpayKeySecret}
                  onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Never share your Key Secret with anyone. It is stored securely on our servers and never displayed again after saving.
              </p>
            </div>

            {/* Supported rails */}
            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 flex flex-wrap gap-2">
              {['UPI (GPay / PhonePe)', 'RuPay', 'Visa / Mastercard', 'Net Banking', 'Wallets', 'EMI'].map((rail) => (
                <span key={rail} className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-[11px] font-medium text-gray-600 shadow-sm">
                  {rail}
                </span>
              ))}
            </div>

            {/* Save feedback */}
            {paymentSaveMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                paymentSaveMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {paymentSaveMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                )}
                {paymentSaveMsg.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPayment}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2"
              >
                {savingPayment ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Razorpay Credentials</>
                )}
              </button>
            </div>
          </form>

          {/* SECTION 4: Customer Delivery Charges & Free Delivery Threshold Rules */}
          <form onSubmit={handleSaveDeliveryRates} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" /> Customer Delivery Charges & Free Shipping Rules
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set standard delivery charges, and configure an automatic 100% Free Delivery threshold on larger orders.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {freeDeliveryEnabled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Free Delivery Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    Flat Delivery Only
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              {/* Standard Delivery Charge */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Standard Delivery Charges (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={deliveryChargeRupees}
                    onChange={(e) => setDeliveryChargeRupees(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="e.g. 50"
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  Standard fee charged when cart total is below the free delivery limit (Enter <code className="bg-gray-100 px-1 rounded text-gray-600">0</code> for free delivery on all orders).
                </p>
              </div>

              {/* Free Delivery Threshold */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Free Delivery Threshold (₹)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-700">
                    <input
                      type="checkbox"
                      checked={freeDeliveryEnabled}
                      onChange={(e) => setFreeDeliveryEnabled(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    Enable Free Delivery
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    disabled={!freeDeliveryEnabled}
                    value={freeDeliveryThresholdRupees}
                    onChange={(e) => setFreeDeliveryThresholdRupees(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    placeholder="e.g. 499"
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  Orders equal to or above this cart value automatically unlock <strong>100% Free Delivery</strong> for the buyer.
                </p>
              </div>
            </div>

            {/* Live Visual Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" /> Buyer Checkout Delivery Summary:
                </span>
                <p className="text-[11px] text-slate-500">
                  {freeDeliveryEnabled ? (
                    <>
                      Orders below <strong>₹{freeDeliveryThresholdRupees}</strong> pay <strong>₹{deliveryChargeRupees}</strong> • Orders <strong>₹{freeDeliveryThresholdRupees}+</strong> qualify for <strong>FREE DELIVERY (₹0)</strong>
                    </>
                  ) : (
                    <>
                      All orders will be charged flat <strong>₹{deliveryChargeRupees}</strong> delivery fee.
                    </>
                  )}
                </p>
              </div>

              {freeDeliveryEnabled && (
                <div className="px-3 py-1.5 bg-emerald-100/80 border border-emerald-200 rounded-lg text-[11px] font-bold text-emerald-800 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Increases Average Order Value (AOV)
                </div>
              )}
            </div>

            {/* Feedback message */}
            {deliveryRatesSaveMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                deliveryRatesSaveMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {deliveryRatesSaveMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                )}
                <span>{deliveryRatesSaveMsg.text}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={savingDeliveryRates}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2"
              >
                {savingDeliveryRates ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Delivery Rates</>
                )}
              </button>
            </div>
          </form>

          {/* SECTION 5: Shiprocket Logistics & Courier Delivery */}
          <form onSubmit={handleSaveShippingSettings} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" /> Shiprocket Logistics & Courier Delivery
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automate courier allocation, AWB generation, doorstep pickup, and real-time tracking for all placed orders.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {shiprocketConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Not Configured
                  </span>
                )}

                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-1" title="Toggle Shiprocket Auto-fulfillment">
                  <input
                    type="checkbox"
                    checked={shiprocketEnabled}
                    onChange={(e) => handleToggleShipping(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>

            {/* Shiprocket Quick Setup Guide Banner */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center justify-between font-bold text-amber-950">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  How to get your Shiprocket API User Credentials
                </span>
                <a
                  href="https://app.shiprocket.in/api-user"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800 hover:text-amber-950 font-semibold inline-flex items-center gap-1 underline underline-offset-2"
                >
                  Shiprocket Panel <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900 leading-relaxed font-medium">
                <li>Log in to your <strong>Shiprocket Panel</strong> & navigate to <strong>Settings → API</strong> on the left menu.</li>
                <li>Click <strong>"Configure"</strong> and select <strong>"Create an API User"</strong>.</li>
                <li>Enter a dedicated <strong>Email ID</strong> (different from your main Shiprocket registered login) and password.</li>
                <li>Enter those credentials below and click <strong>Test Connection</strong> to verify before saving.</li>
              </ol>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Shiprocket API User Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. api_shipping@mystore.in"
                value={shiprocketEmail}
                onChange={(e) => setShiprocketEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Must match the API User email created under Shiprocket Settings → API (valid for 10-day token generation).
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Shiprocket API User Password {!shiprocketPasswordConfigured && <span className="text-red-500">*</span>}
                {shiprocketPasswordConfigured && (
                  <span className="ml-2 text-emerald-600 font-normal">(configured — leave blank to keep existing password)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showShiprocketPassword ? 'text' : 'password'}
                  placeholder={shiprocketPasswordConfigured ? '••••••••••••••••••••' : 'Enter API user password'}
                  value={shiprocketPassword}
                  onChange={(e) => setShiprocketPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowShiprocketPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showShiprocketPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Your password is safely encrypted and used to authenticate with the Shiprocket REST API.
              </p>
            </div>

            {/* Pickup Location Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Pickup Location Nickname / Warehouse Code
              </label>
              <input
                type="text"
                placeholder="Primary"
                value={shiprocketPickupLocation}
                onChange={(e) => setShiprocketPickupLocation(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                The exact nickname of your pickup warehouse configured in <strong>Shiprocket Settings → Pickup Addresses</strong> (default: <code className="bg-gray-100 px-1 rounded">Primary</code>).
              </p>
            </div>

            {/* Supported Couriers */}
            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 space-y-1.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Integrated Carrier Networks (Auto-Allocated)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Delhivery', 'Blue Dart', 'DTDC', 'Xpressbees', 'Shadowfax', 'Ecom Express', 'Ekart'].map((carrier) => (
                  <span key={carrier} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-medium text-gray-700 shadow-2xs">
                    {carrier}
                  </span>
                ))}
              </div>
            </div>

            {/* Test connection feedback */}
            {shippingTestMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                shippingTestMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {shippingTestMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                )}
                <span>{shippingTestMsg.text}</span>
              </div>
            )}

            {/* Save feedback */}
            {shippingSaveMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                shippingSaveMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {shippingSaveMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                )}
                <span>{shippingSaveMsg.text}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestShipping}
                disabled={testingShipping || savingShipping}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testingShipping ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" /> Verifying with Shiprocket...</>
                ) : (
                  <><Truck className="w-3.5 h-3.5 text-amber-700" /> Test Shiprocket Connection</>
                )}
              </button>

              <button
                type="submit"
                disabled={savingShipping || testingShipping}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2"
              >
                {savingShipping ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Shiprocket Credentials</>
                )}
              </button>
            </div>
          </form>

          {/* SECTION 5: Additional Store Configurations */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" /> Additional Store Configurations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <Link
                href="/coupons"
                className="p-4 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Tag className="w-5 h-5 text-emerald-600" />
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-900">Coupons & Promo Codes</h3>
                  <p className="text-[11px] text-gray-500 mt-1">Configure discounts and checkout promotions</p>
                </div>
              </Link>

              <Link
                href="/subscription"
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-900">Billing & Subscription</h3>
                  <p className="text-[11px] text-gray-500 mt-1">Manage plan tier, limits, and invoices</p>
                </div>
              </Link>

              <Link
                href="/brand-studio"
                className="p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-900">Theme & Brand Studio</h3>
                  <p className="text-[11px] text-gray-500 mt-1">Customize colors, logo, and store layout</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
