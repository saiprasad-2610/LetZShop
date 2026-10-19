import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ShieldCheck, Eye, EyeOff, Lock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { AdminThemeToggle } from '../context/AdminThemeContext';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function ChangePasswordPage() {
  const { user, setUser, api, logout } = useAdminAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isLengthValid = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = isLengthValid && hasLetter && hasNumber && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please ensure password meets all security requirements and matches confirmation.');
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.admin.changePassword({
        currentPassword: currentPassword ? currentPassword.trim() : undefined,
        newPassword: newPassword.trim(),
      });

      setSuccess(res.message || 'Password changed successfully. Redirecting to dashboard...');
      if (user) {
        setUser({
          ...user,
          mustChangePassword: false,
        });
      }

      setTimeout(() => {
        void router.replace('/');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create New Password — LetzShop Admin</title>
      </Head>
      <main className="min-h-screen flex items-center justify-center bg-admin-bg px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-admin-surface p-8 shadow-2xl border border-admin-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-admin-accent">
              <ShieldCheck className="h-8 w-8" />
              <span className="font-bold tracking-tight text-lg">LetzShop Security</span>
            </div>
            <AdminThemeToggle />
          </div>

          <h1 className="text-xl font-bold text-admin-text tracking-tight">
            Create Your New Password
          </h1>
          <p className="mt-1.5 mb-6 text-xs text-admin-muted leading-relaxed">
            For security, temporary administrator credentials must be replaced with a personalized password before entering the platform administration dashboard.
          </p>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 p-3.5 text-xs flex items-start gap-2 mb-4"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-3.5 text-xs flex items-center gap-2 mb-4"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <div className="flex-1">{success}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold text-admin-secondary">
              Temporary / Current Password
              <div className="relative mt-1">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter temporary password received"
                  disabled={busy}
                  className="admin-input w-full pr-10 text-xs"
                />
                <button
                  type="button"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-admin-muted hover:text-admin-text"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="block text-xs font-semibold text-admin-secondary">
              New Password *
              <div className="relative mt-1">
                <input
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={busy}
                  placeholder="At least 8 alphanumeric characters"
                  className="admin-input w-full pr-10 text-xs"
                />
                <button
                  type="button"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-admin-muted hover:text-admin-text"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="block text-xs font-semibold text-admin-secondary">
              Confirm New Password *
              <div className="relative mt-1">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={busy}
                  placeholder="Re-type your new password"
                  className="admin-input w-full pr-10 text-xs"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-admin-muted hover:text-admin-text"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {/* Checklist */}
            <div className="rounded-xl bg-admin-raised/40 border border-admin-border p-3 space-y-1.5 text-[11px]">
              <div className="font-semibold text-admin-muted uppercase tracking-wider text-[10px] mb-1">
                Password Requirements:
              </div>
              <div className={`flex items-center gap-1.5 ${isLengthValid ? 'text-emerald-500' : 'text-admin-muted'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>At least 8 characters in length</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasLetter && hasNumber ? 'text-emerald-500' : 'text-admin-muted'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Contains both letters and numbers</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-500' : 'text-admin-muted'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !isFormValid}
              className="btn-admin-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {busy ? (
                <span>Updating Password…</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Save Password & Continue</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-admin-border text-center">
            <button
              onClick={() => logout()}
              className="text-xs text-admin-muted hover:text-admin-danger transition-colors"
            >
              Sign out and return later
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
