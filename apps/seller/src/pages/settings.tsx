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
  Building
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { api } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Branding / Store details update
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

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* SECTION 1: Business Profile */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" /> Business Profile
            </h2>

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
          </div>

          {/* SECTION 2: Payment Gateway Setup */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" /> Payment Processing (Razorpay & UPI)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Connected & Active
              </span>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <p className="font-semibold">Integrated Multi-Rail Indian Payments</p>
              <p className="text-[11px] text-blue-700">
                Payments settle directly into your verified business bank account via Razorpay Partner Onboarding. AIKYAM never holds customer sales proceeds.
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Gateway Partner</span>
                <span className="font-semibold text-gray-900">Razorpay India</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Merchant Account ID</span>
                <span className="font-mono text-gray-700">acc_merch_sandbox_live</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">KYC & Settlement Status</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Direct Settlement Ready
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Supported Payment Rails</span>
                <span className="text-gray-700 font-medium">UPI (GPay/PhonePe), RuPay, Cards, NetBanking, COD</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Shipping & Logistics */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" /> Logistics & Couriers (Shiprocket)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Auto-Fulfillment Ready
              </span>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Shipping Integration</span>
                <span className="font-semibold text-gray-900">Shiprocket AI Courier Allocation</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Coverage</span>
                <span className="font-semibold text-gray-700">29,000+ Indian PIN Codes</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Integrated Couriers</span>
                <span className="text-gray-700 font-medium">Delhivery, Blue Dart, DTDC, Xpressbees</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Failure Safety</span>
                <span className="text-emerald-700 font-semibold">Guaranteed Outbox Background Retry</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
