import { useSellerI18n } from "@simply/i18n";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

/** Opt-in verification for legacy PIN accounts. Existing email addresses are never replaced. */
export function AccountEmailVerification() {
  const { t } = useSellerI18n();
  const { user, api, token, store, login } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [until, setUntil] = useState(0);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const tick = () =>
      setSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [until]);
  if (!user || user.email) return null;
  const send = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await api.auth.requestAccountEmailOtp(
        email.trim().toLowerCase(),
      );
      setDestination(result.maskedEmail);
      setUntil(Date.now() + 60000);
      setMessage(result.message);
    } catch (error: any) {
      setMessage(error.message || t("accountEmail.sendError"));
    } finally {
      setBusy(false);
    }
  };
  const verify = async () => {
    setBusy(true);
    setMessage("");
    try {
      await api.auth.verifyAccountEmailOtp(email.trim().toLowerCase(), code);
      setCode("");
      setMessage(t("accountEmail.success"));
      if (token)
        login(
          token,
          { ...user, email: email.trim().toLowerCase() },
          store,
          localStorage.getItem("simply_seller_refresh_token") || undefined,
        );
    } catch (error: any) {
      setMessage(error.message || t("accountEmail.verifyError"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="p-5 rounded-2xl border border-[var(--merchant-border)] bg-[var(--merchant-surface)] space-y-3">
      <h2 className="font-semibold text-[var(--merchant-text)]">
        {t("accountEmail.title")}
      </h2>
      <p className="text-xs text-[var(--merchant-text-muted)]">
        {t("accountEmail.description")}
      </p>
      <label className="block text-xs" htmlFor="account-email">
        {t("accountEmail.email")}
      </label>
      <input
        id="account-email"
        type="email"
        autoComplete="email"
        maxLength={254}
        value={email}
        disabled={Boolean(destination)}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border p-2 bg-[var(--merchant-bg)]"
      />
      {destination && (
        <>
          <label className="block text-xs" htmlFor="account-email-code">
            {t("accountEmail.sent", { email: destination })}
          </label>
          <input
            id="account-email-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="rounded-lg border p-2 bg-[var(--merchant-bg)]"
          />
          <button
            type="button"
            disabled={busy || code.length !== 6}
            onClick={verify}
            className="px-3 py-2 rounded-lg bg-blue-700 text-white disabled:opacity-50"
          >
            {t("accountEmail.verify")}
          </button>
        </>
      )}
      <button
        type="button"
        disabled={busy || seconds > 0 || !email.trim()}
        onClick={send}
        className="px-3 py-2 rounded-lg border disabled:opacity-50"
      >
        {seconds > 0
          ? t("accountEmail.wait", { seconds })
          : destination
            ? t("accountEmail.resend")
            : t("accountEmail.send")}
      </button>
      {destination && (
        <button
          type="button"
          className="ml-3 text-xs underline"
          onClick={() => {
            setDestination("");
            setCode("");
          }}
        >
          {t("accountEmail.change")}
        </button>
      )}
      {message && (
        <p role="status" className="text-xs">
          {message}
        </p>
      )}
    </section>
  );
}
