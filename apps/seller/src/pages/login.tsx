import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, apiClient } from '../context/AuthContext';
import { Smartphone, Lock, KeyRound, ArrowRight, Store, RefreshCw, ShieldCheck, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { IndianPhoneInput } from '../components/IndianPhoneInput';
import { isValidIndianPhone, isValidPin } from '@simply/validation';

type AuthMode =
  | 'PIN_LOGIN'
  | 'REGISTER_OTP'
  | 'REGISTER_VERIFY'
  | 'REGISTER_PIN'
  | 'RECOVERY_OTP'
  | 'RECOVERY_VERIFY'
  | 'RECOVERY_PIN';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('PIN_LOGIN');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);

  const { user, store, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const isDev = process.env.NODE_ENV !== 'production';

  // Route protection: authenticated users must not see login or registration again
  useEffect(() => {
    if (!authLoading && user) {
      if (store) {
        router.replace('/');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [authLoading, user, store, router]);

  useEffect(() => {
    if (router.query.mode === 'register') {
      setMode('REGISTER_OTP');
    }
  }, [router.query.mode]);

  // Clean PIN state on mode change
  const resetFormState = (newMode: AuthMode) => {
    setError(null);
    setAccountExists(false);
    setSuccessMsg(null);
    setPin('');
    setConfirmPin('');
    setShowPin(false);
    setShowConfirmPin(false);
    setShowLoginPin(false);
    setMode(newMode);
  };

  const switchToPinLogin = () => {
    resetFormState('PIN_LOGIN');
    setTimeout(() => {
      document.getElementById('login-pin')?.focus();
    }, 50);
  };

  // 1. PIN Login (Returning Seller)
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidIndianPhone(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!isValidPin(pin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiClient.auth.loginWithPin(phone, pin);
      login(data.accessToken, data.user, data.store, data.refreshToken);
      if (!data.store) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      if (err.code === 'PIN_LOCKED') {
        setError(err.message || 'Account temporarily locked due to too many failed attempts. Please use PIN Recovery.');
      } else if (err.code === 'PIN_INVALID') {
        setError(err.message || 'Invalid phone number or PIN. Please verify your credentials.');
      } else {
        setError(err.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP for Registration
  const handleRequestRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidIndianPhone(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.auth.requestRegisterOtp(phone);
      setAccountExists(false);
      setMode('REGISTER_VERIFY');
      setSuccessMsg(`Verification OTP sent to ${phone}`);
    } catch (err: any) {
      if (err.code === 'ACCOUNT_EXISTS' || err.status === 409) {
        setAccountExists(true);
        setError(null);
      } else {
        setAccountExists(false);
        setError(err.message || 'Failed to send registration OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP for Registration
  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.auth.verifyRegisterOtp(phone, otp);
      setTempToken(res.tempToken || null);
      setPin('');
      setConfirmPin('');
      setMode('REGISTER_PIN');
      setSuccessMsg(null);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Setup PIN & Complete Registration
  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidPin(pin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiClient.auth.setupPin(pin, tempToken || undefined);
      login(data.accessToken, data.user, data.store, data.refreshToken);
      if (!data.store) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to setup PIN.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Request OTP for Recovery (Forgot PIN)
  const handleRequestRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidIndianPhone(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.auth.requestRecoveryOtp(phone);
      setMode('RECOVERY_VERIFY');
      setSuccessMsg(`Recovery OTP sent to ${phone}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Verify OTP for Recovery
  const handleVerifyRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.auth.verifyRecoveryOtp(phone, otp);
      setTempToken(res.tempToken || null);
      setPin('');
      setConfirmPin('');
      setMode('RECOVERY_PIN');
      setSuccessMsg(null);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Reset PIN (Recovery)
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidPin(pin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiClient.auth.setupPin(pin, tempToken || undefined);
      login(data.accessToken, data.user, data.store, data.refreshToken);
      if (!data.store) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset PIN.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Logo & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Simply E-Commerce</h1>
          <p className="mt-1 text-sm text-slate-400">Merchant Operations Portal</p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-slate-900 border border-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: Standard PIN Login (Returning Merchant) */}
          {mode === 'PIN_LOGIN' && (
            <form onSubmit={handlePinLogin} className="space-y-4">
              <IndianPhoneInput
                id="login-phone"
                label="Registered Mobile Number"
                value={phone}
                onChange={(canonical, raw10, valid) => {
                  setPhone(canonical);
                  setPhoneValid(valid);
                }}
                required
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-pin" className="block text-xs font-medium text-slate-300">
                    Security PIN (6 Digits)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      resetFormState('RECOVERY_OTP');
                    }}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Forgot PIN?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-pin"
                    type={showLoginPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPin(!showLoginPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    aria-label={showLoginPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pin.length > 0 && pin.length < 6 && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">PIN must be exactly 6 digits.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isValidIndianPhone(phone) || !isValidPin(pin)}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm mt-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Log In to Dashboard'}
              </button>

              <div className="pt-4 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  New seller?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      resetFormState('REGISTER_OTP');
                    }}
                    className="text-blue-400 font-semibold hover:underline"
                  >
                    Register with Mobile OTP
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* MODE 2: Registration - Enter Mobile */}
          {mode === 'REGISTER_OTP' && (
            <form onSubmit={handleRequestRegisterOtp} className="space-y-4">
              {accountExists && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-white space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Account already exists</h3>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                        An account is already registered with this mobile number. Log in with your 6-digit PIN.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={switchToPinLogin}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm text-center"
                    >
                      Log In with PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => resetFormState('RECOVERY_OTP')}
                      className="py-2 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors text-center"
                    >
                      Forgot PIN?
                    </button>
                  </div>
                </div>
              )}

              <div>
                <IndianPhoneInput
                  id="register-phone"
                  label="Mobile Number for Registration"
                  value={phone}
                  onChange={(canonical, raw10, valid) => {
                    setPhone(canonical);
                    setPhoneValid(valid);
                    if (accountExists) setAccountExists(false);
                  }}
                  required
                />
                <p className="mt-1.5 text-[11px] text-slate-500">A one-time verification code will be sent to your mobile.</p>
              </div>

              <button
                type="submit"
                disabled={loading || !isValidIndianPhone(phone)}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Send Verification OTP'}
              </button>

              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    resetFormState('PIN_LOGIN');
                  }}
                  className="text-xs text-slate-400 hover:underline"
                >
                  ← Back to PIN Login
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: Registration - Verify OTP */}
          {mode === 'REGISTER_VERIFY' && (
            <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Enter 6-Digit OTP sent to {phone}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white tracking-widest text-center font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {isDev && (
                  <div className="mt-2.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                    <span className="text-slate-300 font-medium">Development code:</span>
                    <span className="font-mono font-bold tracking-wider text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded">123456</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Verify Code'}
              </button>

              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    resetFormState('REGISTER_OTP');
                  }}
                  className="text-xs text-slate-400 hover:underline"
                >
                  Change Mobile Number
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: Registration - Create Security PIN */}
          {mode === 'REGISTER_PIN' && (
            <form onSubmit={handleSetupPin} className="space-y-4">
              <div className="text-left mb-2">
                <h2 className="text-base font-bold text-white mb-1">Add PIN for easy access</h2>
                <p className="text-xs text-slate-400">
                  Create a 6-digit PIN. You&apos;ll use this for quick merchant login.
                </p>
              </div>

              {/* PIN Field */}
              <div>
                <label htmlFor="register-pin" className="block text-xs font-medium text-slate-300 mb-1.5">
                  PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="register-pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setPin(clean);
                    }}
                    placeholder="••••••"
                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pin.length > 0 && pin.length < 6 && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">PIN must be exactly 6 digits.</p>
                )}
              </div>

              {/* Confirm PIN Field */}
              <div>
                <label htmlFor="register-confirm-pin" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="register-confirm-pin"
                    type={showConfirmPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setConfirmPin(clean);
                    }}
                    placeholder="••••••"
                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    aria-label={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPin.length > 0 && confirmPin !== pin && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">PINs do not match.</p>
                )}
                {confirmPin.length > 0 && confirmPin === pin && confirmPin.length < 6 && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">PIN must be exactly 6 digits.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || pin.length !== 6 || confirmPin.length !== 6 || pin !== confirmPin}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm mt-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Set PIN'}
              </button>
            </form>
          )}

          {/* MODE 5: Recovery - Enter Mobile */}
          {mode === 'RECOVERY_OTP' && (
            <form onSubmit={handleRequestRecoveryOtp} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white mb-1">Reset Your Security PIN</h2>
                <p className="text-xs text-slate-400 mb-3">
                  Enter your registered mobile number. We will send an OTP to verify your identity.
                </p>
                <IndianPhoneInput
                  id="recovery-phone"
                  label="Registered Mobile Number"
                  value={phone}
                  onChange={(canonical, raw10, valid) => {
                    setPhone(canonical);
                    setPhoneValid(valid);
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !isValidIndianPhone(phone)}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Send Recovery OTP'}
              </button>

              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    resetFormState('PIN_LOGIN');
                  }}
                  className="text-xs text-slate-400 hover:underline"
                >
                  ← Back to PIN Login
                </button>
              </div>
            </form>
          )}

          {/* MODE 6: Recovery - Verify OTP */}
          {mode === 'RECOVERY_VERIFY' && (
            <form onSubmit={handleVerifyRecoveryOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Enter 6-Digit Recovery OTP sent to {phone}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white tracking-widest text-center font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {isDev && (
                  <div className="mt-2.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                    <span className="text-slate-300 font-medium">Development code:</span>
                    <span className="font-mono font-bold tracking-wider text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded">123456</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Verify Recovery OTP'}
              </button>

              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    resetFormState('RECOVERY_OTP');
                  }}
                  className="text-xs text-slate-400 hover:underline"
                >
                  Change Mobile Number
                </button>
              </div>
            </form>
          )}

          {/* MODE 7: Recovery - Create New Security PIN */}
          {mode === 'RECOVERY_PIN' && (
            <form onSubmit={handleResetPin} className="space-y-4">
              <div className="text-left mb-2">
                <h2 className="text-base font-bold text-white mb-1">Reset Your Security PIN</h2>
                <p className="text-xs text-slate-400">
                  Create a new 6-digit PIN for your merchant account.
                </p>
              </div>

              {/* PIN Field */}
              <div>
                <label htmlFor="recovery-pin" className="block text-xs font-medium text-slate-300 mb-1.5">
                  PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="recovery-pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setPin(clean);
                    }}
                    placeholder="••••••"
                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pin.length > 0 && pin.length < 6 && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">PIN must be exactly 6 digits.</p>
                )}
              </div>

              {/* Confirm PIN Field */}
              <div>
                <label htmlFor="recovery-confirm-pin" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="recovery-confirm-pin"
                    type={showConfirmPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setConfirmPin(clean);
                    }}
                    placeholder="••••••"
                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    aria-label={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPin.length > 0 && confirmPin !== pin && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">PINs do not match.</p>
                )}
                {confirmPin.length > 0 && confirmPin === pin && confirmPin.length < 6 && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">PIN must be exactly 6 digits.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || pin.length !== 6 || confirmPin.length !== 6 || pin !== confirmPin}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm mt-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Set New PIN & Log In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
