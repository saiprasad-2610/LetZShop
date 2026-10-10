import React, { useState } from 'react';
import Head from 'next/head';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  Server, 
  AlertCircle,
  Database
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const [identifier, setIdentifier] = useState('admin@shopongo.com');
  const [secret, setSecret] = useState('Admin@ShopOnGo2026!');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError('Please enter your administrator email or mobile number.');
      return;
    }
    if (!secret.trim()) {
      setError('Please enter your administrator password or PIN.');
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), secret.trim());
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(
        err.message || 'Authentication failed. Please verify administrator credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (type: 'email' | 'phone') => {
    if (type === 'email') {
      setIdentifier('admin@shopongo.com');
      setSecret('Admin@ShopOnGo2026!');
    } else {
      setIdentifier('+919800000000');
      setSecret('123456');
    }
    setError(null);
  };

  return (
    <>
      <Head>
        <title>SuperAdmin Login | ShopOnGo SaaS Control Plane</title>
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          {/* Logo & Identity */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-2xl shadow-emerald-500/20 mb-4 animate-in fade-in zoom-in duration-500">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Platform SuperAdmin Control Plane
            </div>

            <h1 className="text-3xl font-black text-white tracking-tight">
              Shop<span className="text-emerald-400">On</span>Go
            </h1>
            <p className="mt-2 text-xs text-slate-400 max-w-sm">
              Master SaaS governance, multi-tenant database telemetry, and cross-merchant commerce orchestration
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
            
            {/* Quick Demo Credentials Pill */}
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Quick SuperAdmin Auto-Fill:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Dev / QA Mode</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickFill('email')}
                  className="px-2.5 py-1.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition text-center"
                >
                  Fill Email & Password
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('phone')}
                  className="px-2.5 py-1.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition text-center"
                >
                  Fill Mobile & PIN
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Administrator Identifier
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@shopongo.com or +919800000000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Security Password / PIN
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Enter administrator password or 6-digit PIN"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating Control Plane...</span>
                  </>
                ) : (
                  <>
                    <span>Enter SuperAdmin Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Zero-Trust Security Footnote */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>PostgreSQL RLS Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span>Monorepo Multi-Tenant</span>
              </div>
            </div>
          </div>

          {/* Footer Backlink */}
          <div className="mt-6 text-center text-xs text-slate-500">
            <span>Looking for the merchant dashboard? </span>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-semibold"
            >
              Open Seller Portal →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
