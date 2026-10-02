import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth, apiClient } from '../context/AuthContext';
import { Smartphone, KeyRound, ArrowRight, ShieldCheck, Store, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('+919876543210');
  const [code, setCode] = useState('123456');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const { login } = useAuth();
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient.auth.sendOtp(phone);
      setStep('OTP');
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiClient.auth.verifyOtp(phone, code);
      login(data.accessToken, data.user, data.store);

      // If user does not have a store yet, redirect to onboarding
      if (!data.store) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Logo & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Simply E-Commerce</h1>
          <p className="mt-1 text-sm text-slate-400">Seller & Merchant Operations Portal</p>
        </div>

        {/* Dev Mode Banner */}
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong className="font-semibold block text-amber-200">Development Mode Active</strong>
            Mock OTP Provider is enabled. Pre-filled with seed merchant number. Use default code{' '}
            <code className="bg-amber-950 px-1.5 py-0.5 rounded text-amber-200 font-mono font-bold">
              123456
            </code>
            .
          </div>
        </div>

        {/* Card */}
        <div className="mt-6 bg-slate-900 border border-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mobile Number (India)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Enter your 10-digit mobile number starting with +91</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <>
                    Send Verification OTP
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Enter 6-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('PHONE')}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white tracking-widest text-center font-mono font-bold placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1.5 text-center text-xs text-slate-400">
                  Sent to <span className="font-semibold text-slate-200">{phone}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Verify & Enter Dashboard'}
              </button>
            </form>
          )}

          {/* Quick Login Seeds */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-2">Or quick login with seeded accounts:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  setPhone('+919876543210');
                  setCode('123456');
                  setStep('OTP');
                }}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Tenant A (Aurelia - Paid)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhone('+919876543211');
                  setCode('123456');
                  setStep('OTP');
                }}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Tenant B (Patil - Unpaid)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
