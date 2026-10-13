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
  UserCheck,
  PackageCheck,
  UserPlus,
  Phone,
  Trash2,
  Star,
  MessageSquare,
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

  // Delivery & Shipping State (Self-Delivery vs Shiprocket)
  const [deliveryMode, setDeliveryMode] = useState<'self' | 'shiprocket'>('self');
  const [isSelfDelivery, setIsSelfDelivery] = useState(false);
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

  // Delivery Partners & Riders Directory State
  const [deliveryPartners, setDeliveryPartners] = useState<
    Array<{
      id: string;
      name: string;
      phone: string;
      vehicle?: string;
      notes?: string;
      isDefault?: boolean;
    }>
  >([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [savingPartner, setSavingPartner] = useState(false);
  const [partnerSaveMsg, setPartnerSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddPartnerForm, setShowAddPartnerForm] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerVehicle, setPartnerVehicle] = useState('Motorcycle');
  const [partnerNotes, setPartnerNotes] = useState('');
  const [partnerIsDefault, setPartnerIsDefault] = useState(false);

  useEffect(() => {
    if (authLoading && !token) return;
    loadSettings();
    loadPaymentSettings();
    loadDeliveryRates();
    loadShippingSettings();
    loadDeliveryPartners();
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
        const selfActive = Boolean(data.isSelfDelivery || data.deliveryMode === 'self');
        setIsSelfDelivery(selfActive);
        setDeliveryMode(selfActive ? 'self' : (data.connected ? 'shiprocket' : 'self'));
        setShiprocketConnected(Boolean(data.connected && !selfActive));
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

  const loadDeliveryPartners = async () => {
    setLoadingPartners(true);
    try {
      const res = await api.deliveryPartners.list();
      if (res?.data && Array.isArray(res.data)) {
        setDeliveryPartners(res.data);
      }
    } catch (err) {
      console.error('Failed to load delivery partners', err);
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim() || !partnerPhone.trim()) {
      setPartnerSaveMsg({ type: 'error', text: 'Partner name and contact number are required.' });
      return;
    }
    const cleanNumber = partnerPhone.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 10) {
      setPartnerSaveMsg({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    setSavingPartner(true);
    setPartnerSaveMsg(null);
    try {
      await api.deliveryPartners.save({
        name: partnerName.trim(),
        phone: cleanNumber,
        vehicle: partnerVehicle.trim(),
        notes: partnerNotes.trim(),
        isDefault: partnerIsDefault || deliveryPartners.length === 0,
      });
      setPartnerSaveMsg({ type: 'success', text: `Delivery partner "${partnerName.trim()}" saved to directory!` });
      setPartnerName('');
      setPartnerPhone('');
      setPartnerNotes('');
      setPartnerIsDefault(false);
      setShowAddPartnerForm(false);
      await loadDeliveryPartners();
    } catch (err: any) {
      setPartnerSaveMsg({ type: 'error', text: err.message || 'Failed to save delivery partner.' });
    } finally {
      setSavingPartner(false);
    }
  };

  const handleDeletePartner = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from your delivery partners directory?`)) return;
    try {
      await api.deliveryPartners.delete(id);
      await loadDeliveryPartners();
    } catch (err: any) {
      alert(err.message || 'Failed to delete partner.');
    }
  };

  const handleSetDefaultPartner = async (partner: any) => {
    try {
      await api.deliveryPartners.save({ ...partner, isDefault: true });
      await loadDeliveryPartners();
    } catch (err: any) {
      alert(err.message || 'Failed to set default partner.');
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

    setSavingShipping(true);
    try {
      if (deliveryMode === 'self') {
        await api.shippingSettings.save({
          isSelfDelivery: true,
          deliveryMode: 'self',
          isEnabled: true,
        });
        setShippingSaveMsg({
          type: 'success',
          text: 'Self-delivery mode saved! You fulfill and deliver orders directly without 3rd-party logistics.',
        });
        setIsSelfDelivery(true);
        setShiprocketConnected(false);
      } else {
        if (!shiprocketEmail.trim()) {
          setShippingSaveMsg({ type: 'error', text: 'Shiprocket API User Email is required.' });
          setSavingShipping(false);
          return;
        }

        if (!shiprocketPasswordConfigured && !shiprocketPassword.trim()) {
          setShippingSaveMsg({ type: 'error', text: 'Shiprocket API User Password is required for first-time configuration.' });
          setSavingShipping(false);
          return;
        }

        await api.shippingSettings.save({
          isSelfDelivery: false,
          deliveryMode: 'shiprocket',
          email: shiprocketEmail.trim(),
          password: shiprocketPassword.trim() || '__KEEP_EXISTING__',
          pickupLocation: shiprocketPickupLocation.trim() || 'Primary',
          isEnabled: shiprocketEnabled,
        });
        setShippingSaveMsg({
          type: 'success',
          text: 'Shiprocket logistics settings saved! Your placed orders will now be dispatched and tracked via Shiprocket.',
        });
        setIsSelfDelivery(false);
        setShiprocketConnected(true);
        setShiprocketPasswordConfigured(true);
        setShiprocketPassword('');
      }
      await loadShippingSettings();
    } catch (err: any) {
      setShippingSaveMsg({ type: 'error', text: err.message || 'Failed to save delivery settings.' });
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
          <h1 className="text-2xl font-bold text-[var(--merchant-text)] tracking-tight">Store Settings</h1>
          <p className="text-sm text-[var(--merchant-text-muted)]">
            Configure your business profile, payment gateways, and logistics integrations
          </p>
        </div>

        {/* Top Store Setup Requirements Status Banner */}
        {(!razorpayConnected || (!isSelfDelivery && !shiprocketConnected)) ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <div className="flex items-start sm:items-center gap-2.5 text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold text-amber-200 block sm:inline">Store Setup Notice:</span>{' '}
                <span className="text-amber-300/90">
                  {!razorpayConnected && (!isSelfDelivery && !shiprocketConnected)
                    ? 'Payment gateway and Delivery fulfillment require configuration.'
                    : !razorpayConnected
                    ? 'Payment gateway requires Razorpay credentials. (✓ Delivery setup is complete).'
                    : 'Delivery fulfillment requires configuration. (✓ Payment setup is complete).'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                razorpayConnected
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                Payments: {razorpayConnected ? '✓ Done' : 'Pending'}
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                (isSelfDelivery || shiprocketConnected)
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                Delivery: {(isSelfDelivery || shiprocketConnected) ? '✓ Done' : 'Pending'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs flex items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-medium">
                <strong className="text-emerald-200">Store Setup Complete:</strong> Payments and Delivery fulfillment are fully configured and ready for customer orders.
              </span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
              ✓ All Ready
            </span>
          </div>
        )}

        {/* SECTION 1: Business Profile */}
        <form onSubmit={handleSaveSettings} className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
              <Building className="w-5 h-5 text-[var(--merchant-primary)]" /> Business Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
                Business / Brand Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm focus:border-[var(--merchant-primary)] focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
                Industry / Category
              </label>
              <input
                type="text"
                value={category}
                disabled
                className="w-full px-3 py-2 bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] rounded-lg text-sm text-[var(--merchant-text-muted)] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
                Contact Mobile (WhatsApp Support)
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm font-mono focus:border-[var(--merchant-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm focus:border-[var(--merchant-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
              Storefront Web Slug
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--merchant-text-muted)] font-mono">simply.in/store/</span>
              <input
                type="text"
                disabled
                value={store?.slug || ''}
                className="w-full px-3 py-1.5 bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] rounded text-xs font-mono text-[var(--merchant-text-muted)] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-lg text-sm font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* SECTION 2: Cash on Delivery (COD) Control */}
        <div className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-500" /> Cash on Delivery (COD)
              </h2>
              <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                Allow customers to pay in cash upon doorstep delivery or store pickup.
              </p>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                codEnabled
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : 'bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)] border border-[var(--merchant-border)]'
              }`}
            >
              {codEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--merchant-surface-muted)] rounded-xl border border-[var(--merchant-border)]">
            <div className="space-y-0.5 pr-4">
              <p className="text-xs font-semibold text-[var(--merchant-text)]">
                Accept Cash on Delivery Orders
              </p>
              <p className="text-[11px] text-[var(--merchant-text-muted)]">
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
              <div className="w-11 h-6 bg-[var(--merchant-input-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--merchant-primary)] peer-disabled:opacity-50"></div>
            </label>
          </div>

          {codSaveMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                codSaveMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {codSaveMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <p className="font-medium">{codSaveMsg.text}</p>
            </div>
          )}
        </div>

        {/* SECTION 3: Razorpay Payment Gateway Setup */}
        <form onSubmit={handleSavePaymentSettings} className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-5 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--merchant-primary)]" /> Razorpay Payment Gateway
              </h2>
              {razorpayConnected ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Not Configured
                </span>
              )}
            </div>

            {/* Info banner */}
            <div className="p-3 bg-[var(--merchant-primary-soft)] border border-[var(--merchant-border)] rounded-xl text-xs text-[var(--merchant-text)] flex gap-2">
              <Info className="w-4 h-4 text-[var(--merchant-primary)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Your own Razorpay account — money goes directly to you</p>
                <p className="text-[var(--merchant-text-muted)] mt-0.5">
                  Enter your Razorpay API credentials below. Every customer payment will settle directly into your verified bank account linked to your Razorpay account. We never touch your sales proceeds.
                </p>
              </div>
            </div>

            {/* Warning: not configured */}
            {!razorpayConnected && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400 flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <p>Online payments are <strong>disabled</strong> until you add your Razorpay credentials. Customers will not be able to pay online.</p>
              </div>
            )}

            {/* Key ID */}
            <div>
              <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">
                Razorpay Key ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="rzp_live_xxxxxxxxxxxxxxxx or rzp_test_xxxxxxxxxxxxxxxx"
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-lg text-sm font-mono focus:border-[var(--merchant-primary)] focus:outline-none transition"
              />
              <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">
                Found in Razorpay Dashboard → Settings → API Keys. Use <code className="bg-[var(--merchant-surface-muted)] px-1 rounded border border-[var(--merchant-border)]">rzp_live_</code> for production, <code className="bg-[var(--merchant-surface-muted)] px-1 rounded border border-[var(--merchant-border)]">rzp_test_</code> for testing.
              </p>
            </div>

            {/* Key Secret */}
            <div>
              <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">
                Razorpay Key Secret {!razorpaySecretConfigured && <span className="text-rose-500">*</span>}
                {razorpaySecretConfigured && (
                  <span className="ml-2 text-emerald-500 font-normal">(already configured — leave blank to keep existing)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder={razorpaySecretConfigured ? '••••••••••••••••••••' : 'Enter your Razorpay Key Secret'}
                  value={razorpayKeySecret}
                  onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-lg text-sm font-mono focus:border-[var(--merchant-primary)] focus:outline-none transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)]"
                  tabIndex={-1}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">
                Never share your Key Secret with anyone. It is stored securely on our servers and never displayed again after saving.
              </p>
            </div>

            {/* Supported rails */}
            <div className="border border-[var(--merchant-border)] rounded-xl p-3 bg-[var(--merchant-surface-muted)] flex flex-wrap gap-2">
              {['UPI (GPay / PhonePe)', 'RuPay', 'Visa / Mastercard', 'Net Banking', 'Wallets', 'EMI'].map((rail) => (
                <span key={rail} className="px-2.5 py-1 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-full text-[11px] font-medium text-[var(--merchant-text-secondary)] shadow-xs">
                  {rail}
                </span>
              ))}
            </div>

            {/* Save feedback */}
            {paymentSaveMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                paymentSaveMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
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
                className="px-6 py-2.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] disabled:opacity-60 text-white rounded-lg text-sm font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
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
          <form onSubmit={handleSaveDeliveryRates} className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-5 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[var(--merchant-primary)]" /> Customer Delivery Charges & Free Shipping Rules
                </h2>
                <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                  Set standard delivery charges, and configure an automatic 100% Free Delivery threshold on larger orders.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {freeDeliveryEnabled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Free Delivery Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)] border border-[var(--merchant-border)]">
                    Flat Delivery Only
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              {/* Standard Delivery Charge */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--merchant-text-secondary)] uppercase tracking-wide">
                  Standard Delivery Charges (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-[var(--merchant-text-muted)]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={deliveryChargeRupees}
                    onChange={(e) => setDeliveryChargeRupees(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="e.g. 50"
                    className="w-full pl-8 pr-3 py-2.5 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm font-mono font-bold focus:border-[var(--merchant-primary)] focus:outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-[var(--merchant-text-muted)]">
                  Standard fee charged when cart total is below the free delivery limit (Enter <code className="bg-[var(--merchant-surface-muted)] px-1 rounded border border-[var(--merchant-border)]">0</code> for free delivery on all orders).
                </p>
              </div>

              {/* Free Delivery Threshold */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--merchant-text-secondary)] uppercase tracking-wide">
                    Free Delivery Threshold (₹)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[var(--merchant-primary)]">
                    <input
                      type="checkbox"
                      checked={freeDeliveryEnabled}
                      onChange={(e) => setFreeDeliveryEnabled(e.target.checked)}
                      className="rounded text-[var(--merchant-primary)] h-3.5 w-3.5 cursor-pointer"
                    />
                    Enable Free Delivery
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-[var(--merchant-text-muted)]">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    disabled={!freeDeliveryEnabled}
                    value={freeDeliveryThresholdRupees}
                    onChange={(e) => setFreeDeliveryThresholdRupees(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    placeholder="e.g. 499"
                    className="w-full pl-8 pr-3 py-2.5 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm font-mono font-bold focus:border-[var(--merchant-primary)] focus:outline-none transition disabled:opacity-50"
                  />
                </div>
                <p className="text-[11px] text-[var(--merchant-text-muted)]">
                  Orders equal to or above this cart value automatically unlock <strong>100% Free Delivery</strong> for the buyer.
                </p>
              </div>
            </div>

            {/* Live Visual Summary Card */}
            <div className="p-3.5 rounded-xl bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] text-xs text-[var(--merchant-text-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-[var(--merchant-text)] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[var(--merchant-primary)]" /> Buyer Checkout Delivery Summary:
                </span>
                <p className="text-[11px] text-[var(--merchant-text-muted)]">
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
                <div className="px-3 py-1.5 bg-[var(--merchant-primary-soft)] border border-[var(--merchant-border)] rounded-lg text-[11px] font-bold text-[var(--merchant-primary)] shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Increases Average Order Value (AOV)
                </div>
              )}
            </div>

            {/* Feedback message */}
            {deliveryRatesSaveMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                deliveryRatesSaveMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {deliveryRatesSaveMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                )}
                <span>{deliveryRatesSaveMsg.text}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={savingDeliveryRates}
                className="px-6 py-2.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] disabled:opacity-60 text-white rounded-lg text-sm font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                {savingDeliveryRates ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Delivery Rates</>
                )}
              </button>
            </div>
          </form>

          {/* SECTION 5: Logistics & Order Delivery Fulfillment */}
          <form onSubmit={handleSaveShippingSettings} className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-5 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-500" /> Logistics & Order Delivery Fulfillment
                </h2>
                <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                  Choose how orders are delivered to buyers — deliver orders yourself or automate via 3rd-party Shiprocket couriers.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {deliveryMode === 'self' || isSelfDelivery ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Self-Delivery Active
                  </span>
                ) : shiprocketConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Shiprocket Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Not Configured
                  </span>
                )}

                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-1" title="Toggle Shipping Fulfillment Active">
                  <input
                    type="checkbox"
                    checked={shiprocketEnabled}
                    onChange={(e) => handleToggleShipping(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[var(--merchant-input-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {/* TOP SHIPPING REQUIREMENT MESSAGE / BANNER */}
            {deliveryMode === 'self' || isSelfDelivery ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-1.5 transition-all">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Shipping Details Complete — Store Owner Self-Delivery Active</span>
                </div>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed pl-6">
                  You have selected to manage delivery by yourself and not depend on third-party delivery partners. All incoming orders will by default be delivered by you directly. You do not need to enter any Shiprocket account details.
                </p>
              </div>
            ) : shiprocketConnected ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-1.5 transition-all">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Shipping Details Complete — Shiprocket Logistics Connected</span>
                </div>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed pl-6">
                  Shiprocket API User integration is active. Automated courier allocation, doorstep pickup, and tracking are configured for placed orders.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1.5 transition-all">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Shipping Requirement Incomplete: Delivery Configuration Required</span>
                </div>
                <p className="text-[11px] text-amber-300/90 leading-relaxed pl-6">
                  Select <strong>"Manage delivery by myself"</strong> below to deliver orders directly without 3rd-party logistics, or enter your Shiprocket API details to automate courier shipping.
                </p>
              </div>
            )}

            {/* FULFILLMENT MODE SELECTION CARDS */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--merchant-text-secondary)] uppercase tracking-wide">
                Select Order Delivery Option
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* OPTION 1: Self Delivery */}
                <div
                  onClick={() => setDeliveryMode('self')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    deliveryMode === 'self'
                      ? 'bg-emerald-500/10 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/30'
                      : 'bg-[var(--merchant-surface-muted)]/50 border-[var(--merchant-border)] hover:border-[var(--merchant-border-strong)]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          id="mode-self"
                          name="deliveryMode"
                          checked={deliveryMode === 'self'}
                          onChange={() => setDeliveryMode('self')}
                          className="text-emerald-500 h-4 w-4 cursor-pointer focus:ring-emerald-500"
                        />
                        <label htmlFor="mode-self" className="text-sm font-bold text-[var(--merchant-text)] cursor-pointer">
                          Manage delivery by myself
                        </label>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Self Delivery
                      </span>
                    </div>
                    <p className="text-xs text-[var(--merchant-text-muted)] leading-relaxed pl-6.5">
                      Fulfill and deliver orders directly without depending on 3rd-party delivery partners. <strong>No Shiprocket account or credentials needed.</strong>
                    </p>
                  </div>
                  {deliveryMode === 'self' && (
                    <div className="mt-3 pl-6.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Shipping details are complete with this option
                    </div>
                  )}
                </div>

                {/* OPTION 2: Shiprocket Couriers */}
                <div
                  onClick={() => setDeliveryMode('shiprocket')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    deliveryMode === 'shiprocket'
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-xs ring-1 ring-amber-500/30'
                      : 'bg-[var(--merchant-surface-muted)]/50 border-[var(--merchant-border)] hover:border-[var(--merchant-border-strong)]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          id="mode-shiprocket"
                          name="deliveryMode"
                          checked={deliveryMode === 'shiprocket'}
                          onChange={() => setDeliveryMode('shiprocket')}
                          className="text-amber-500 h-4 w-4 cursor-pointer focus:ring-amber-500"
                        />
                        <label htmlFor="mode-shiprocket" className="text-sm font-bold text-[var(--merchant-text)] cursor-pointer">
                          Shiprocket Logistics & Courier
                        </label>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        3rd-Party Courier
                      </span>
                    </div>
                    <p className="text-xs text-[var(--merchant-text-muted)] leading-relaxed pl-6.5">
                      Automate courier allocation, AWB generation, doorstep pickup, and live tracking across Delhivery, Blue Dart, DTDC, Shadowfax across India.
                    </p>
                  </div>
                  {deliveryMode === 'shiprocket' && (
                    <div className="mt-3 pl-6.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                      <Truck className="w-3.5 h-3.5" /> Requires Shiprocket API User email & password
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CONDITIONAL CONTENT BASED ON MODE */}
            {deliveryMode === 'self' ? (
              /* SELF DELIVERY DETAILS CARD */
              <div className="p-4.5 rounded-xl bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--merchant-text)]">
                  <Store className="w-4 h-4 text-emerald-500" />
                  Owner Self-Delivery Active Settings
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-lg space-y-1">
                    <span className="font-semibold text-[var(--merchant-text)] flex items-center gap-1.5 text-[11px]">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Default Order Fulfillment
                    </span>
                    <p className="text-[11px] text-[var(--merchant-text-muted)]">
                      All new customer orders will by default be delivered by the store owner without courier dependency.
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-lg space-y-1">
                    <span className="font-semibold text-[var(--merchant-text)] flex items-center gap-1.5 text-[11px]">
                      <Tag className="w-3.5 h-3.5 text-[var(--merchant-primary)]" /> Customer Delivery Charges
                    </span>
                    <p className="text-[11px] text-[var(--merchant-text-muted)]">
                      Standard delivery charges and free delivery threshold configured in Section 4 above will apply at checkout.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--merchant-text-muted)] italic">
                  Note: You do not need to register or enter any Shiprocket API credentials. Orders can be marked "Out for Delivery" and "Delivered" directly from your Orders drawer.
                </p>
              </div>
            ) : (
              /* SHIPROCKET CREDENTIALS FORM */
              <div className="space-y-4 pt-1">
                {/* Shiprocket Quick Setup Guide Banner */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-2">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-400" />
                      How to get your Shiprocket API User Credentials
                    </span>
                    <a
                      href="https://app.shiprocket.in/api-user"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-300 hover:text-amber-200 font-semibold inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      Shiprocket Panel <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-300/90 leading-relaxed font-medium">
                    <li>Log in to your <strong>Shiprocket Panel</strong> & navigate to <strong>Settings → API</strong> on the left menu.</li>
                    <li>Click <strong>"Configure"</strong> and select <strong>"Create an API User"</strong>.</li>
                    <li>Enter a dedicated <strong>Email ID</strong> (different from your main Shiprocket registered login) and password.</li>
                    <li>Enter those credentials below and click <strong>Test Connection</strong> to verify before saving.</li>
                  </ol>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">
                    Shiprocket API User Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required={deliveryMode === 'shiprocket'}
                    placeholder="e.g. api_shipping@mystore.in"
                    value={shiprocketEmail}
                    onChange={(e) => setShiprocketEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-lg text-sm font-mono focus:border-[var(--merchant-primary)] focus:outline-none transition"
                  />
                  <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">
                    Must match the API User email created under Shiprocket Settings → API (valid for 10-day token generation).
                  </p>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">
                    Shiprocket API User Password {!shiprocketPasswordConfigured && <span className="text-rose-500">*</span>}
                    {shiprocketPasswordConfigured && (
                      <span className="ml-2 text-emerald-500 font-normal">(configured — leave blank to keep existing password)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showShiprocketPassword ? 'text' : 'password'}
                      placeholder={shiprocketPasswordConfigured ? '••••••••••••••••••••' : 'Enter API user password'}
                      value={shiprocketPassword}
                      onChange={(e) => setShiprocketPassword(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-lg text-sm font-mono focus:border-[var(--merchant-primary)] focus:outline-none transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowShiprocketPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)]"
                      tabIndex={-1}
                    >
                      {showShiprocketPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">
                    Your password is safely encrypted and used to authenticate with the Shiprocket REST API.
                  </p>
                </div>

                {/* Pickup Location Field */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">
                    Pickup Location Nickname / Warehouse Code
                  </label>
                  <input
                    type="text"
                    placeholder="Primary"
                    value={shiprocketPickupLocation}
                    onChange={(e) => setShiprocketPickupLocation(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-lg text-sm font-mono focus:border-[var(--merchant-primary)] focus:outline-none transition"
                  />
                  <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">
                    The exact nickname of your pickup warehouse configured in <strong>Shiprocket Settings → Pickup Addresses</strong> (default: <code className="bg-[var(--merchant-surface-muted)] px-1 rounded border border-[var(--merchant-border)]">Primary</code>).
                  </p>
                </div>

                {/* Supported Couriers */}
                <div className="border border-[var(--merchant-border)] rounded-xl p-3 bg-[var(--merchant-surface-muted)] space-y-1.5">
                  <span className="text-[11px] font-semibold text-[var(--merchant-text-muted)] uppercase tracking-wider block">
                    Integrated Carrier Networks (Auto-Allocated)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Delhivery', 'Blue Dart', 'DTDC', 'Xpressbees', 'Shadowfax', 'Ecom Express', 'Ekart'].map((carrier) => (
                      <span key={carrier} className="px-2.5 py-1 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-lg text-[11px] font-medium text-[var(--merchant-text-secondary)] shadow-2xs">
                        {carrier}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Test connection feedback */}
            {shippingTestMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                shippingTestMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {shippingTestMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                )}
                <span>{shippingTestMsg.text}</span>
              </div>
            )}

            {/* Save feedback */}
            {shippingSaveMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                shippingSaveMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {shippingSaveMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                )}
                <span>{shippingSaveMsg.text}</span>
              </div>
            )}

            {/* BOTTOM SHIPPING REQUIREMENT MESSAGE */}
            {deliveryMode === 'self' || isSelfDelivery ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span className="text-[11px]">
                    <strong>Shipping details are complete:</strong> All customer orders will be fulfilled by you directly. No 3rd-party logistics account is required.
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                  ✓ Complete
                </span>
              </div>
            ) : (
              <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 ${
                shiprocketConnected
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  {shiprocketConnected ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  ) : (
                    <Info className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  )}
                  <span className="text-[11px]">
                    {shiprocketConnected
                      ? 'Shipping details are complete: Shiprocket logistics account verified.'
                      : 'Shipping requirement incomplete: Enter Shiprocket API email and password to complete setup.'}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                  shiprocketConnected
                    ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                    : 'text-amber-400 bg-amber-500/20 border-amber-500/30'
                }`}>
                  {shiprocketConnected ? '✓ Complete' : 'Action Required'}
                </span>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              {deliveryMode === 'shiprocket' ? (
                <>
                  <button
                    type="button"
                    onClick={handleTestShipping}
                    disabled={testingShipping || savingShipping}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[var(--merchant-surface-muted)] hover:bg-[var(--merchant-surface-raised)] text-[var(--merchant-text)] border border-[var(--merchant-border)] rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {testingShipping ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> Verifying with Shiprocket...</>
                    ) : (
                      <><Truck className="w-3.5 h-3.5 text-amber-500" /> Test Shiprocket Connection</>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={savingShipping || testingShipping}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] disabled:opacity-60 text-white rounded-lg text-sm font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {savingShipping ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Shiprocket Credentials</>
                    )}
                  </button>
                </>
              ) : (
                <div className="w-full flex justify-end">
                  <button
                    type="submit"
                    disabled={savingShipping}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg text-sm font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {savingShipping ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Self-Delivery Mode</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* SECTION 6: Delivery Partners & Riders Directory */}
          <div className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-5 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-500" /> Delivery Partners & Riders Directory
                </h2>
                <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                  Save your in-house riders or store staff. When fulfilling an order, select who is delivering with 1-click and the buyer will be automatically notified with their name and phone number.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddPartnerForm(!showAddPartnerForm);
                  setPartnerSaveMsg(null);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showAddPartnerForm ? 'Cancel' : '+ Add Delivery Partner'}
              </button>
            </div>

            {/* Partner Save Feedback Message */}
            {partnerSaveMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  partnerSaveMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {partnerSaveMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <p className="font-medium">{partnerSaveMsg.text}</p>
              </div>
            )}

            {/* ADD PARTNER INLINE FORM */}
            {showAddPartnerForm && (
              <form onSubmit={handleSavePartner} className="p-4 rounded-xl bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] space-y-3.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--merchant-text)] uppercase tracking-wider">
                    New Delivery Partner Profile
                  </h3>
                  <span className="text-[10px] text-[var(--merchant-text-muted)]">
                    Directly linked to order fulfillment drawer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--merchant-text-secondary)] mb-1">
                      Partner / Rider Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-xs focus:border-[var(--merchant-primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--merchant-text-secondary)] mb-1">
                      Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={partnerPhone}
                      onChange={(e) => setPartnerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-xs font-mono focus:border-[var(--merchant-primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--merchant-text-secondary)] mb-1">
                      Vehicle / Mode
                    </label>
                    <select
                      value={partnerVehicle}
                      onChange={(e) => setPartnerVehicle(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-xs focus:border-[var(--merchant-primary)] focus:outline-none"
                    >
                      <option value="Motorcycle">Motorcycle / Bike</option>
                      <option value="Scooter">Scooter / Moped</option>
                      <option value="Electric Bike">EV / Electric Scooter</option>
                      <option value="Store Van">Van / Auto</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Store Staff">Store Staff (Walking)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--merchant-text-secondary)] mb-1">
                      Notes / Area (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Local Area / Daytime delivery"
                      value={partnerNotes}
                      onChange={(e) => setPartnerNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-xs focus:border-[var(--merchant-primary)] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="partner-default"
                      checked={partnerIsDefault}
                      onChange={(e) => setPartnerIsDefault(e.target.checked)}
                      className="h-4 w-4 text-emerald-500 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="partner-default" className="text-xs text-[var(--merchant-text)] font-medium cursor-pointer">
                      Set as default rider for self-delivery orders
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-[var(--merchant-border)]">
                  <button
                    type="button"
                    onClick={() => setShowAddPartnerForm(false)}
                    className="px-3.5 py-1.5 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] text-[var(--merchant-text)] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPartner}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {savingPartner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Rider to Directory
                  </button>
                </div>
              </form>
            )}

            {/* SAVED PARTNERS LIST / DIRECTORY */}
            {loadingPartners ? (
              <div className="p-6 text-center text-xs text-[var(--merchant-text-muted)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                Loading delivery partners...
              </div>
            ) : deliveryPartners.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-[var(--merchant-border)] text-center space-y-2 bg-[var(--merchant-surface-muted)]/30">
                <Truck className="w-8 h-8 text-[var(--merchant-text-muted)] mx-auto opacity-50" />
                <p className="text-xs font-bold text-[var(--merchant-text)]">No Delivery Partners Saved Yet</p>
                <p className="text-[11px] text-[var(--merchant-text-muted)] max-w-md mx-auto">
                  Add your delivery boys or staff members above. Once saved, they appear in your order drawer so you can assign orders in 1 click and automatically pass their details to the buyer.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {deliveryPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className={`p-4 rounded-xl border transition-all space-y-2.5 flex flex-col justify-between ${
                      partner.isDefault
                        ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : 'bg-[var(--merchant-surface-muted)] border-[var(--merchant-border)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[var(--merchant-text)] truncate">
                            {partner.name}
                          </h4>
                          <p className="text-xs text-[var(--merchant-text-secondary)] font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            {partner.phone}
                          </p>
                        </div>
                        {partner.isDefault ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultPartner(partner)}
                            className="text-[10px] text-[var(--merchant-text-muted)] hover:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        <span className="px-2 py-0.5 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded text-[10px] font-medium text-[var(--merchant-text-muted)]">
                          {partner.vehicle || 'Motorcycle'}
                        </span>
                        {partner.notes && (
                          <span className="px-2 py-0.5 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded text-[10px] font-medium text-[var(--merchant-text-muted)] truncate max-w-[140px]">
                            {partner.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--merchant-border)] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${partner.phone}`}
                          className="p-1.5 bg-[var(--merchant-surface)] hover:bg-[var(--merchant-surface-muted)] text-[var(--merchant-text)] rounded border border-[var(--merchant-border)] text-[10px] inline-flex items-center gap-1"
                          title="Call partner"
                        >
                          <Phone className="w-3 h-3 text-merchant-primary" /> Call
                        </a>
                        <a
                          href={`https://wa.me/91${partner.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-600 dark:text-emerald-400 rounded border border-[#25D366]/30 text-[10px] inline-flex items-center gap-1"
                          title="Message on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-[#25D366]" /> WA
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePartner(partner.id, partner.name)}
                        className="p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                        title="Delete partner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 5: Additional Store Configurations */}
          <div className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-4 transition-colors">
            <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--merchant-accent)]" /> Additional Store Configurations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <Link
                href="/coupons"
                className="p-4 rounded-xl border border-[var(--merchant-border)] hover:border-[var(--merchant-border-strong)] bg-[var(--merchant-surface-muted)]/50 hover:bg-[var(--merchant-surface-muted)] transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Tag className="w-5 h-5 text-[var(--merchant-primary)]" />
                    <ChevronRight className="w-4 h-4 text-[var(--merchant-text-muted)] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-[var(--merchant-text)]">Coupons & Promo Codes</h3>
                  <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">Configure discounts and checkout promotions</p>
                </div>
              </Link>

              <Link
                href="/subscription"
                className="p-4 rounded-xl border border-[var(--merchant-border)] hover:border-[var(--merchant-border-strong)] bg-[var(--merchant-surface-muted)]/50 hover:bg-[var(--merchant-surface-muted)] transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="w-5 h-5 text-[var(--merchant-accent)]" />
                    <ChevronRight className="w-4 h-4 text-[var(--merchant-text-muted)] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-[var(--merchant-text)]">Billing & Subscription</h3>
                  <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">Manage plan tier, limits, and invoices</p>
                </div>
              </Link>

              <Link
                href="/brand-studio"
                className="p-4 rounded-xl border border-[var(--merchant-border)] hover:border-[var(--merchant-border-strong)] bg-[var(--merchant-surface-muted)]/50 hover:bg-[var(--merchant-surface-muted)] transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="w-5 h-5 text-[var(--merchant-primary)]" />
                    <ChevronRight className="w-4 h-4 text-[var(--merchant-text-muted)] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-xs font-bold text-[var(--merchant-text)]">Theme & Brand Studio</h3>
                  <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">Customize colors, logo, and store layout</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
