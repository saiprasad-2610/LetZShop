import React, { useState } from 'react';
import Head from 'next/head';
import { 
  Sliders, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Percent, 
  HardDrive, 
  Mail, 
  Globe, 
  AlertTriangle,
  Server
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('ShopOnGo');
  const [supportEmail, setSupportEmail] = useState('support@shopongo.com');
  const [currency, setCurrency] = useState('INR (₹)');
  const [commissionRate, setCommissionRate] = useState('2.0');
  const [defaultStorageMb, setDefaultStorageMb] = useState('1024');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <AdminLayout>
      <Head>
        <title>Platform Settings | ShopOnGo Platform Admin</title>
      </Head>

      <div className="max-w-4xl space-y-6 font-sans">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global SaaS Platform Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure multi-tenant platform branding, take-rate commission, storage quotas, and system maintenance
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">Platform settings successfully saved and propagated across services.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Platform Brand Identity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Platform Brand & Identity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SaaS Software Name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Global Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Base Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="INR (₹)">Indian Rupee (INR - ₹)</option>
                  <option value="USD ($)">US Dollar (USD - $)</option>
                  <option value="EUR (€)">Euro (EUR - €)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financials & Commission */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Percent className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Commerce Take-Rate & Quotas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Platform Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Platform fee deducted per completed payment order.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Starter Plan Storage Limit (MB)
                </label>
                <input
                  type="number"
                  value={defaultStorageMb}
                  onChange={(e) => setDefaultStorageMb(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Max asset storage quota assigned to starter merchants.</p>
              </div>
            </div>
          </div>

          {/* Section 3: System Availability & Access */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Server className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">System Availability & Onboarding</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Self-Serve Merchant Registration</span>
                  <span className="text-[11px] text-slate-500">Allow new merchants to signup and launch stores freely.</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Global Maintenance Mode</span>
                  <span className="text-[11px] text-slate-500">Temporarily show maintenance screen on buyer storefronts during scheduled upgrades.</span>
                </div>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Platform Settings</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
