import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth, apiClient } from '../context/AuthContext';
import {
  Store,
  ArrowRight,
  CheckCircle,
  Building2,
  Tag,
  Phone,
  Upload,
  Eye,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES = [
  'Fashion',
  'Jewellery',
  'Beauty',
  'Food',
  'Grocery',
  'Furniture',
  'Manufacturing / Industrial',
  'Electronics',
  'General Retail',
  'Other',
];

export default function OnboardingPage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Fashion');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+91');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdStore, setCreatedStore] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.stores.onboard({
        businessName,
        category,
        logoUrl: logoUrl || undefined,
        contactPhone,
        contactEmail: contactEmail || undefined,
        address: address || undefined,
      });

      // Update auth session with the new tenant and store tokens
      login(res.accessToken, res.user, res.store);
      setCreatedStore(res.store);
      setStep(5); // "Your Store Is Ready" screen
    } catch (err: any) {
      setError(err.message || 'Failed to complete store setup. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Your Digital Store</h1>
          <p className="text-sm text-slate-400 mt-1">Get your business online in under 60 seconds</p>
        </div>

        {/* Step Progress Indicators */}
        {step < 5 && (
          <div className="mb-6 flex items-center justify-between px-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-0.5 w-12 sm:w-20 transition-colors ${
                      step > s ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: Business Name */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Step 1 of 4</span>
                <h2 className="text-lg font-bold text-white mt-1">What is your Business Name?</h2>
                <p className="text-xs text-slate-400 mt-1">
                  This will appear on your storefront, orders, and customer receipts.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Business Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Royal Silk Emporium"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!businessName.trim()}
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
              >
                Continue to Category
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}

          {/* STEP 2: Business Category */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Step 2 of 4</span>
                <h2 className="text-lg font-bold text-white mt-1">Select Your Primary Category</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Our Brand Studio will automatically select the perfect theme for your industry.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      category === cat
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 mb-1.5 text-blue-400" />
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 px-4 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-2/3 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  Continue to Logo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Logo Upload (Optional) */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Step 3 of 4</span>
                <h2 className="text-lg font-bold text-white mt-1">Add Business Logo (Optional)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  If you don't have a logo yet, we will generate an elegant typography wordmark.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Logo URL or Image Link</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Upload className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png (or leave blank for wordmark)"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block mb-1">Preview Wordmark:</span>
                <span className="text-lg font-bold tracking-wider text-slate-100 uppercase font-serif">
                  {businessName || 'Your Brand'}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-2.5 px-4 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-2/3 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  Continue to Contact Info
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Business Contact Information */}
          {step === 4 && (
            <form onSubmit={handleSubmitOnboarding} className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Step 4 of 4</span>
                <h2 className="text-lg font-bold text-white mt-1">Contact Information</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Shown in your storefront footer and customer invoices.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contact Email (Optional)</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@yourbusiness.com"
                  className="block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City & State</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Surat, Gujarat"
                  className="block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-1/3 py-2.5 px-4 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Create My Store Now'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: Store Ready Instant Preview */}
          {step === 5 && (
            <div className="text-center space-y-5 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
                <CheckCircle className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-bold text-white">Your Store Is Ready!</h2>
              <p className="text-sm text-slate-300 max-w-sm mx-auto">
                <span className="font-semibold text-white">{businessName}</span> has been configured with the{' '}
                <span className="text-emerald-400 font-semibold">{category}</span> theme preset.
              </p>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Store Status:</span>
                  <span className="font-semibold text-blue-400">PRIVATE PREVIEW</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Store Slug:</span>
                  <span className="font-mono text-slate-200">{createdStore?.slug}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Public Visibility:</span>
                  <span className="text-amber-400">Available after plan subscription</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/brand-studio')}
                  className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Customize Brand Studio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
