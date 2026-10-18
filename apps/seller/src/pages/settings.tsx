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
  Globe,
  ShieldCheck,
  Upload,
  FileCheck,
  FileText,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type {
  AdminBusinessVerification,
  BusinessType,
  MerchantDocumentType,
  MerchantDocumentStatus,
} from '@simply/api-contracts';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useSellerI18n, LOCALE_REGISTRY, SUPPORTED_LOCALES, ACTIVE_LOCALES, isActiveLocale, type SupportedLocale } from '@simply/i18n';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, api, token, loading: authLoading } = useAuth();
  const { locale: currentLocale, setLocale, t } = useSellerI18n();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Localization settings state
  const [merchantLocale, setMerchantLocale] = useState<SupportedLocale>(currentLocale);
  const [storefrontDefaultLocale, setStorefrontDefaultLocale] = useState<SupportedLocale>('en-IN');
  const [enabledStorefrontLocales, setEnabledStorefrontLocales] = useState<SupportedLocale[]>([
    'en-IN',
    'mr-IN',
    'hi-IN',
  ]);
  const [savingLocalization, setSavingLocalization] = useState(false);
  const [localizationSaveMsg, setLocalizationSaveMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerVehicle, setPartnerVehicle] = useState('Motorcycle');
  const [partnerNotes, setPartnerNotes] = useState('');
  const [partnerIsDefault, setPartnerIsDefault] = useState(false);

  // Business Verification & Documents State
  const [verificationData, setVerificationData] = useState<AdminBusinessVerification | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>('SOLE_PROPRIETORSHIP');
  const [gstRegistered, setGstRegistered] = useState(false);
  const [gstin, setGstin] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [udyamNumber, setUdyamNumber] = useState('');
  const [savingVerificationProfile, setSavingVerificationProfile] = useState(false);
  const [verificationProfileMsg, setVerificationProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingDocType, setUploadingDocType] = useState<MerchantDocumentType | null>(null);
  const [docFeedbackMsg, setDocFeedbackMsg] = useState<{ docType: string; type: 'success' | 'error'; text: string } | null>(null);
  const [docNumbers, setDocNumbers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading && !token) return;
    loadSettings();
    loadPaymentSettings();
    loadDeliveryRates();
    loadShippingSettings();
    loadDeliveryPartners();
    loadVerification();
  }, [authLoading, token]);

  const loadVerification = async () => {
    setLoadingVerification(true);
    try {
      const data = await api.verification.getVerification();
      setVerificationData(data);
      if (data.businessType) {
        setBusinessType(data.businessType as BusinessType);
      }
      setGstRegistered(Boolean(data.gstRegistered));
      if (data.gstin) setGstin(data.gstin);
      if (data.panNumberMasked) setPanNumber(data.panNumberMasked);
      if (data.udyamNumber) setUdyamNumber(data.udyamNumber);
    } catch (err: any) {
      console.error('Failed to load business verification:', err);
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleSaveVerificationProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVerificationProfile(true);
    setVerificationProfileMsg(null);
    try {
      const updated = await api.verification.updateProfile({
        businessType,
        gstRegistered,
        gstin: gstRegistered ? gstin.trim() : undefined,
        panNumber: panNumber.trim() || undefined,
        udyamNumber: udyamNumber.trim() || undefined,
      });
      setVerificationData(updated);
      setVerificationProfileMsg({
        type: 'success',
        text: 'Business verification profile updated successfully! Document requirements adjusted.',
      });
    } catch (err: any) {
      setVerificationProfileMsg({
        type: 'error',
        text: err?.message || 'Failed to update business profile.',
      });
    } finally {
      setSavingVerificationProfile(false);
    }
  };

  const handleDocumentUpload = async (type: MerchantDocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setDocFeedbackMsg({
        docType: type,
        type: 'error',
        text: 'File size must be 10 MB or less.',
      });
      return;
    }

    const validMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validMimes.includes(file.type)) {
      setDocFeedbackMsg({
        docType: type,
        type: 'error',
        text: 'Only PDF, JPEG, and PNG files are accepted.',
      });
      return;
    }

    setUploadingDocType(type);
    setDocFeedbackMsg(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        await api.verification.uploadDocument({
          type,
          documentNumber: docNumbers[type]?.trim() || undefined,
          filename: file.name,
          mimeType: file.type,
          base64Data,
        });
        setDocFeedbackMsg({
          docType: type,
          type: 'success',
          text: `${file.name} uploaded successfully and submitted for Super Admin review.`,
        });
        await loadVerification();
      } catch (err: any) {
        setDocFeedbackMsg({
          docType: type,
          type: 'error',
          text: err?.message || 'Failed to upload document.',
        });
      } finally {
        setUploadingDocType(null);
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      setUploadingDocType(null);
      setDocFeedbackMsg({
        docType: type,
        type: 'error',
        text: 'Error reading file. Please try again.',
      });
    };
    reader.readAsDataURL(file);
  };

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
      if (s.storefrontDefaultLocale && isActiveLocale(s.storefrontDefaultLocale)) {
        setStorefrontDefaultLocale(s.storefrontDefaultLocale as SupportedLocale);
      }
      if (Array.isArray(s.enabledStorefrontLocales) && s.enabledStorefrontLocales.length > 0) {
        const activeOnly = (s.enabledStorefrontLocales as SupportedLocale[]).filter(isActiveLocale);
        setEnabledStorefrontLocales(activeOnly.length > 0 ? activeOnly : ['en-IN', 'mr-IN', 'hi-IN']);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocalization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLocalization(true);
    setLocalizationSaveMsg(null);
    try {
      await api.stores.updateStore({
        storefrontDefaultLocale,
        enabledStorefrontLocales,
      });

      await setLocale(merchantLocale);

      setLocalizationSaveMsg({
        type: 'success',
        text: 'Language and storefront localization settings saved successfully!',
      });
    } catch (err: any) {
      setLocalizationSaveMsg({
        type: 'error',
        text: err?.message || 'Failed to save localization settings.',
      });
    } finally {
      setSavingLocalization(false);
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
      const res: any = await api.deliveryPartners.list();
      const list: any[] = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const uniqueMap = new Map();
      for (const p of list) {
        const key = `${(p.name || '').trim().toLowerCase()}_${(p.phone || '').replace(/[^0-9]/g, '')}`;
        if (!uniqueMap.has(key) || p.isDefault) {
          uniqueMap.set(key, p);
        }
      }
      setDeliveryPartners(Array.from(uniqueMap.values()));
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
        email: partnerEmail.trim() || undefined,
        vehicle: partnerVehicle.trim(),
        notes: partnerNotes.trim(),
        isDefault: partnerIsDefault || deliveryPartners.length === 0,
      });
      setPartnerSaveMsg({ type: 'success', text: `Delivery partner "${partnerName.trim()}" saved to directory!` });
      setPartnerName('');
      setPartnerPhone('');
      setPartnerEmail('');
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
    <Layout title={t('settings.storeSettings')}>
      <Head>
        <title>{t('settings.storeSettings')} | Simply Seller</title>
      </Head>

      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--merchant-text)] tracking-tight">{t('settings.storeSettings')}</h1>
          <p className="text-sm text-[var(--merchant-text-muted)]">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Top Store Setup Requirements Status Banner */}
        {(!razorpayConnected || (!isSelfDelivery && !shiprocketConnected)) ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <div className="flex items-start sm:items-center gap-2.5 text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold text-amber-200 block sm:inline">{t('settings.storeSetupNotice')}</span>{' '}
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
                {razorpayConnected ? t('settings.paymentsConfigured') : t('settings.paymentsPending')}
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                (isSelfDelivery || shiprocketConnected)
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {(isSelfDelivery || shiprocketConnected) ? t('settings.deliveryConfigured') : t('settings.deliveryPending')}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs flex items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-medium">
                {t('settings.storeSetupComplete')}
              </span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
              {t('settings.allReady')}
            </span>
          </div>
        )}

        {/* SECTION 1: Business Profile */}
        <form onSubmit={handleSaveSettings} className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
              <Building className="w-5 h-5 text-[var(--merchant-primary)]" /> {t('settings.businessProfile')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
                {t('settings.businessName')} *
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
                {t('settings.industry')}
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
                {t('settings.contactMobile')}
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
                {t('settings.contactEmail')}
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
              {t('settings.storeSlug')}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--merchant-text-muted)] font-mono">letzshop.store/store/</span>
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
              {saving ? t('settings.savingProfile') : t('settings.saveProfile')}
            </button>
          </div>
        </form>

        {/* SECTION 2: Business Verification & Documents */}
        <div className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--merchant-border)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--merchant-primary)]" />
                Business Verification & Documents
              </h2>
              <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                Upload business proof & tax documents for platform merchant verification
              </p>
            </div>

            {/* Overall Verification Status Pill */}
            <div>
              {verificationData?.overallStatus === 'VERIFIED' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              ) : verificationData?.overallStatus === 'PENDING_REVIEW' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  Pending Review
                </span>
              ) : verificationData?.overallStatus === 'NEEDS_CHANGES' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Needs Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                  Incomplete
                </span>
              )}
            </div>
          </div>

          {/* Form Message Banner */}
          {verificationProfileMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                verificationProfileMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {verificationProfileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{verificationProfileMsg.text}</span>
            </div>
          )}

          {/* Entity Profile Form */}
          <form onSubmit={handleSaveVerificationProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Business Type */}
              <div>
                <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
                  Business Entity Type *
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm focus:border-[var(--merchant-primary)] focus:outline-none"
                >
                  <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                  <option value="PARTNERSHIP">Partnership Firm</option>
                  <option value="LLP">LLP</option>
                  <option value="PRIVATE_LIMITED">Private Limited</option>
                  <option value="PUBLIC_LIMITED">Public Limited</option>
                  <option value="OTHER">Other</option>
                </select>
                <span className="text-[11px] text-[var(--merchant-text-muted)] mt-1 block">
                  Document requirements dynamically adapt based on selected entity type.
                </span>
              </div>

              {/* GST Registered */}
              <div>
                <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
                  GST Registered? *
                </label>
                <select
                  value={gstRegistered ? 'YES' : 'NO'}
                  onChange={(e) => setGstRegistered(e.target.value === 'YES')}
                  className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm focus:border-[var(--merchant-primary)] focus:outline-none"
                >
                  <option value="NO">No — Not GST Registered</option>
                  <option value="YES">Yes — GST Registered</option>
                </select>
                <span className="text-[11px] text-[var(--merchant-text-muted)] mt-1 block">
                  If Yes, GSTIN & certificate will be required.
                </span>
              </div>
            </div>

            {/* GSTIN (Conditional) */}
            {gstRegistered && (
              <div>
                <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
                  GST Identification Number (GSTIN) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm font-mono focus:border-[var(--merchant-primary)] focus:outline-none uppercase"
                  required={gstRegistered}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PAN Number */}
              <div>
                <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
                  Entity / Business PAN
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm font-mono focus:border-[var(--merchant-primary)] focus:outline-none uppercase"
                />
              </div>

              {/* Udyam Registration */}
              <div>
                <label className="block text-xs font-medium text-[var(--merchant-text-secondary)] mb-1">
                  Udyam Registration Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UDYAM-MH-01-0012345"
                  value={udyamNumber}
                  onChange={(e) => setUdyamNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm font-mono focus:border-[var(--merchant-primary)] focus:outline-none uppercase"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingVerificationProfile}
                className="px-5 py-2 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingVerificationProfile ? 'Saving Profile...' : 'Save Verification Profile'}</span>
              </button>
            </div>
          </form>

          {/* DOCUMENT REQUIREMENTS & UPLOAD TABLE */}
          <div className="space-y-3 pt-4 border-t border-[var(--merchant-border)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--merchant-text-secondary)]">
              Required Business Documents
            </h3>

            {/* Document Specific Feedback */}
            {docFeedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  docFeedbackMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}
              >
                {docFeedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{docFeedbackMsg.text}</span>
              </div>
            )}

            <div className="space-y-3">
              {(verificationData?.requirements || [
                { type: 'PAN', title: 'PAN', required: true, description: 'PAN card of business or proprietor' },
                { type: 'OWNER_ID', title: 'Owner Identity', required: true, description: 'Identity document of proprietor or authorized signatory' },
                { type: 'UDYAM', title: 'Udyam Registration', required: false, description: 'MSME / Udyam registration certificate if registered' },
                { type: 'GST_CERTIFICATE', title: 'GST Certificate', required: gstRegistered, description: 'GST certificate if registered' },
              ]).map((req) => {
                const doc = verificationData?.documents?.find(
                  (d) => d.type === req.type && d.isCurrent,
                );
                const isUploading = uploadingDocType === req.type;

                return (
                  <div
                    key={req.type}
                    className="p-4 rounded-xl border border-[var(--merchant-border)] bg-[var(--merchant-surface-muted)]/30 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--merchant-text)]">
                            {req.title}
                          </span>
                          {req.required ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Mandatory
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-500/15 text-zinc-400">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                          {req.description}
                        </p>
                      </div>

                      {/* Status Pill */}
                      <div className="shrink-0">
                        {!doc ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-500/15 text-zinc-400 border border-zinc-500/20">
                            Not Uploaded
                          </span>
                        ) : doc.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : doc.status === 'PENDING_REVIEW' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Needs Changes
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rejection Notice if any */}
                    {doc?.rejectionReason && (
                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                        <strong className="block font-bold">Feedback from Administrator:</strong>
                        <span>{doc.rejectionReason}</span>
                      </div>
                    )}

                    {/* Upload Controls Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--merchant-border)]/50 text-xs">
                      {doc ? (
                        <div className="text-[11px] text-[var(--merchant-text-muted)]">
                          <span>Current file: </span>
                          <strong className="text-[var(--merchant-text)] font-mono">{doc.originalFilename}</strong>
                          {doc.documentNumberMasked && (
                            <span className="ml-2 font-mono">({doc.documentNumberMasked})</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 max-w-xs">
                          <input
                            type="text"
                            placeholder={
                              req.type === 'OWNER_ID'
                                ? 'Last 4 digits / Masked ID'
                                : 'Document number (Optional)'
                            }
                            value={docNumbers[req.type] || ''}
                            onChange={(e) =>
                              setDocNumbers({ ...docNumbers, [req.type]: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded text-xs"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white text-xs font-semibold shadow-xs transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Uploading...' : doc ? 'Replace File' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            disabled={isUploading}
                            onChange={(e) => handleDocumentUpload(req.type as MerchantDocumentType, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION: Multilingual & Internationalization Settings */}
        <form
          onSubmit={handleSaveLocalization}
          className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[var(--merchant-primary)]" />
                {t('settings.storefrontLanguage')}
              </h2>
              <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                Configure your merchant dashboard language and shopper storefront languages independently.
              </p>
            </div>
            {localizationSaveMsg && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                  localizationSaveMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}
              >
                {localizationSaveMsg.text}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--merchant-text)] mb-1">
                {t('settings.merchantLanguage')}
              </label>
              <p className="text-[11px] text-[var(--merchant-text-muted)] mb-2">
                Language for your seller dashboard, inventory, orders, and analytics.
              </p>
              <select
                value={merchantLocale}
                onChange={(e) => setMerchantLocale(e.target.value as SupportedLocale)}
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm focus:border-[var(--merchant-primary)] focus:outline-none"
              >
                {ACTIVE_LOCALES.map((loc) => {
                  const info = LOCALE_REGISTRY[loc];
                  return (
                    <option key={loc} value={loc}>
                      {info.nativeName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--merchant-text)] mb-1">
                {t('settings.defaultLanguage')}
              </label>
              <p className="text-[11px] text-[var(--merchant-text-muted)] mb-2">
                The default language shown to visitors when opening your online store.
              </p>
              <select
                value={storefrontDefaultLocale}
                onChange={(e) => setStorefrontDefaultLocale(e.target.value as SupportedLocale)}
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-sm focus:border-[var(--merchant-primary)] focus:outline-none"
              >
                {ACTIVE_LOCALES.map((loc) => {
                  const info = LOCALE_REGISTRY[loc];
                  return (
                    <option key={loc} value={loc}>
                      {info.nativeName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-[var(--merchant-text)] mb-1">
              {t('settings.enabledLanguages')}
            </label>
            <p className="text-[11px] text-[var(--merchant-text-muted)] mb-3">
              Select which language choices are available in the storefront language switcher for your customers.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ACTIVE_LOCALES.map((loc) => {
                const info = LOCALE_REGISTRY[loc];
                const isChecked = enabledStorefrontLocales.includes(loc);
                return (
                  <label
                    key={loc}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-[var(--merchant-primary-soft)] border-[var(--merchant-primary)]/40 text-[var(--merchant-text)] font-semibold'
                        : 'bg-[var(--merchant-surface-muted)] border-[var(--merchant-border)] text-[var(--merchant-text-muted)] hover:border-[var(--merchant-primary)]/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEnabledStorefrontLocales([...enabledStorefrontLocales, loc]);
                        } else {
                          if (enabledStorefrontLocales.length > 1) {
                            setEnabledStorefrontLocales(
                              enabledStorefrontLocales.filter((l) => l !== loc)
                            );
                          }
                        }
                      }}
                      className="rounded border-gray-300 text-[var(--merchant-primary)] focus:ring-[var(--merchant-primary)]"
                    />
                    <div className="truncate">
                      <span className="block truncate font-medium">{info.nativeName}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingLocalization}
              className="px-6 py-2.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-lg text-sm font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingLocalization ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>

        {/* SECTION 2: Cash on Delivery (COD) Control */}
        <div className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-500" /> {t('settings.codTitle')}
              </h2>
              <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                {t('settings.codDescription')}
              </p>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                codEnabled
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : 'bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)] border border-[var(--merchant-border)]'
              }`}
            >
              {codEnabled ? t('settings.codEnabledBadge') : t('settings.codDisabledBadge')}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--merchant-surface-muted)] rounded-xl border border-[var(--merchant-border)]">
            <div className="space-y-0.5 pr-4">
              <p className="text-xs font-semibold text-[var(--merchant-text)]">
                {t('settings.codTitle')}
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
                <CreditCard className="w-5 h-5 text-[var(--merchant-primary)]" /> {t('settings.razorpayTitle')}
              </h2>
              {razorpayConnected ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('settings.razorpayConnectedBadge')}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> {t('settings.razorpayNotConnectedBadge')}
                </span>
              )}
            </div>

            {/* Info banner */}
            <div className="p-3 bg-[var(--merchant-primary-soft)] border border-[var(--merchant-border)] rounded-xl text-xs text-[var(--merchant-text)] flex gap-2">
              <Info className="w-4 h-4 text-[var(--merchant-primary)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('settings.razorpayDescription')}</p>
                <p className="text-[var(--merchant-text-muted)] mt-0.5">
                  Enter your Razorpay API credentials below. Every customer payment will settle directly into your verified bank account linked to your Razorpay account.
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
                {t('settings.razorpayKeyIdLabel')} <span className="text-rose-500">*</span>
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
                {t('settings.razorpayKeySecretLabel')} {!razorpaySecretConfigured && <span className="text-rose-500">*</span>}
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
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('settings.savingRazorpayBtn')}</>
                ) : (
                  <><Save className="w-4 h-4" /> {t('settings.saveRazorpayBtn')}</>
                )}
              </button>
            </div>
          </form>

          {/* SECTION 4: Customer Delivery Charges & Free Delivery Threshold Rules */}
          <form onSubmit={handleSaveDeliveryRates} className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-5 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[var(--merchant-primary)]" /> {t('settings.deliveryChargesTitle')}
                </h2>
                <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                  {t('settings.deliveryRulesSubtitle')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {freeDeliveryEnabled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {t('settings.freeDeliveryActive')}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)] border border-[var(--merchant-border)]">
                    {t('settings.flatDeliveryOnly')}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              {/* Standard Delivery Charge */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--merchant-text-secondary)] uppercase tracking-wide">
                  {t('settings.standardDeliveryCharges')}
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
                  {t('settings.standardDeliveryFeeHelp')}
                </p>
              </div>

              {/* Free Delivery Threshold */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--merchant-text-secondary)] uppercase tracking-wide">
                    {t('settings.freeDeliveryThreshold')}
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[var(--merchant-primary)]">
                    <input
                      type="checkbox"
                      checked={freeDeliveryEnabled}
                      onChange={(e) => setFreeDeliveryEnabled(e.target.checked)}
                      className="rounded text-[var(--merchant-primary)] h-3.5 w-3.5 cursor-pointer"
                    />
                    {t('settings.enableFreeDelivery')}
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
                  {t('settings.freeDeliveryHelp')}
                </p>
              </div>
            </div>

            {/* Live Visual Summary Card */}
            <div className="p-3.5 rounded-xl bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] text-xs text-[var(--merchant-text-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-[var(--merchant-text)] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[var(--merchant-primary)]" /> {t('settings.buyerSummary')}
                </span>
                <p className="text-[11px] text-[var(--merchant-text-muted)]">
                  {freeDeliveryEnabled ? (
                    t('settings.ordersBelowPay', { threshold: freeDeliveryThresholdRupees, fee: deliveryChargeRupees })
                  ) : (
                    t('settings.allOrdersFlat', { fee: deliveryChargeRupees })
                  )}
                </p>
              </div>

              {freeDeliveryEnabled && (
                <div className="px-3 py-1.5 bg-[var(--merchant-primary-soft)] border border-[var(--merchant-border)] rounded-lg text-[11px] font-bold text-[var(--merchant-primary)] shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> {t('settings.increasesAov')}
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
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('settings.savingDeliveryRatesBtn')}</>
                ) : (
                  <><Save className="w-4 h-4" /> {t('settings.saveDeliveryRatesBtn')}</>
                )}
              </button>
            </div>
          </form>

          {/* SECTION 5: Logistics & Order Delivery Fulfillment */}
          <form onSubmit={handleSaveShippingSettings} className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-5 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-500" /> {t('settings.logisticsTitle')}
                </h2>
                <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                  {t('settings.logisticsSubtitle')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {deliveryMode === 'self' || isSelfDelivery ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('settings.selfDeliveryActive')}
                  </span>
                ) : shiprocketConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('settings.shiprocketConnected')}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> {t('settings.notConfigured')}
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
                  <span>{t('settings.selfDeliveryCompleteTitle')}</span>
                </div>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed pl-6">
                  {t('settings.selfDeliveryCompleteDesc')}
                </p>
              </div>
            ) : shiprocketConnected ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-1.5 transition-all">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{t('settings.shiprocketCompleteTitle')}</span>
                </div>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed pl-6">
                  {t('settings.shiprocketCompleteDesc')}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1.5 transition-all">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{t('settings.shippingActionRequiredTitle')}</span>
                </div>
                <p className="text-[11px] text-amber-300/90 leading-relaxed pl-6">
                  {t('settings.shippingActionRequiredDesc')}
                </p>
              </div>
            )}

            {/* FULFILLMENT MODE SELECTION CARDS */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--merchant-text-secondary)] uppercase tracking-wide">
                {t('settings.selectDeliveryOption')}
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
                          {t('settings.manageMyself')}
                        </label>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {t('settings.manageMyselfBadge')}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--merchant-text-muted)] leading-relaxed pl-6.5">
                      {t('settings.manageMyselfDesc')}
                    </p>
                  </div>
                  {deliveryMode === 'self' && (
                    <div className="mt-3 pl-6.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('settings.shippingCompleteWithOption')}
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
                          {t('settings.shiprocketCourierTitle')}
                        </label>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {t('settings.shiprocketCourierBadge')}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--merchant-text-muted)] leading-relaxed pl-6.5">
                      {t('settings.shiprocketCourierDesc')}
                    </p>
                  </div>
                  {deliveryMode === 'shiprocket' && (
                    <div className="mt-3 pl-6.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                      <Truck className="w-3.5 h-3.5" /> {t('settings.requiresShiprocketCreds')}
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
                  {t('settings.ownerSelfDeliveryActiveSettings')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-lg space-y-1">
                    <span className="font-semibold text-[var(--merchant-text)] flex items-center gap-1.5 text-[11px]">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> {t('settings.defaultOrderFulfillment')}
                    </span>
                    <p className="text-[11px] text-[var(--merchant-text-muted)]">
                      {t('settings.defaultOrderFulfillmentDesc')}
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-lg space-y-1">
                    <span className="font-semibold text-[var(--merchant-text)] flex items-center gap-1.5 text-[11px]">
                      <Tag className="w-3.5 h-3.5 text-[var(--merchant-primary)]" /> {t('settings.standardDeliveryCharges')}
                    </span>
                    <p className="text-[11px] text-[var(--merchant-text-muted)]">
                      {t('settings.selfDeliveryChargesNote')}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--merchant-text-muted)] italic">
                  {t('settings.selfDeliveryNote')}
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
                      {t('settings.shiprocketGuideTitle')}
                    </span>
                    <a
                      href="https://app.shiprocket.in/api-user"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-300 hover:text-amber-200 font-semibold inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      {t('settings.shiprocketPanel')} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-300/90 leading-relaxed font-medium">
                    <li>{t('settings.shiprocketStep1')}</li>
                    <li>{t('settings.shiprocketStep2')}</li>
                    <li>{t('settings.shiprocketStep3')}</li>
                    <li>{t('settings.shiprocketStep4')}</li>
                  </ol>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">
                    {t('settings.shiprocketEmailLabel')} <span className="text-rose-500">*</span>
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
                    {t('settings.shiprocketEmailHelp')}
                  </p>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">
                    {t('settings.shiprocketPasswordLabel')} {!shiprocketPasswordConfigured && <span className="text-rose-500">*</span>}
                    {shiprocketPasswordConfigured && (
                      <span className="ml-2 text-emerald-500 font-normal">{t('settings.shiprocketPasswordConfigured')}</span>
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
                    {t('settings.shiprocketPasswordHelp')}
                  </p>
                </div>

                {/* Pickup Location Field */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">
                    {t('settings.pickupLocationLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder="Primary"
                    value={shiprocketPickupLocation}
                    onChange={(e) => setShiprocketPickupLocation(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-lg text-sm font-mono focus:border-[var(--merchant-primary)] focus:outline-none transition"
                  />
                  <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">
                    {t('settings.pickupLocationHelp')}
                  </p>
                </div>

                {/* Supported Couriers */}
                <div className="border border-[var(--merchant-border)] rounded-xl p-3 bg-[var(--merchant-surface-muted)] space-y-1.5">
                  <span className="text-[11px] font-semibold text-[var(--merchant-text-muted)] uppercase tracking-wider block">
                    {t('settings.integratedCarriers')}
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
                    {t('settings.shippingCompleteBanner')}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                  {t('settings.statusComplete')}
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
                      ? t('settings.shippingCompleteShiprocket')
                      : t('settings.shippingActionRequired')}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                  shiprocketConnected
                    ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                    : 'text-amber-400 bg-amber-500/20 border-amber-500/30'
                }`}>
                  {shiprocketConnected ? t('settings.statusComplete') : t('settings.statusActionRequired')}
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
                      <><Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> {t('settings.verifyingShiprocket')}</>
                    ) : (
                      <><Truck className="w-3.5 h-3.5 text-amber-500" /> {t('settings.testShiprocketBtn')}</>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={savingShipping || testingShipping}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] disabled:opacity-60 text-white rounded-lg text-sm font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {savingShipping ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {t('settings.savingProfile')}</>
                    ) : (
                      <><Save className="w-4 h-4" /> {t('settings.saveShiprocketBtn')}</>
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
                      <><Loader2 className="w-4 h-4 animate-spin" /> {t('settings.savingProfile')}</>
                    ) : (
                      <><Save className="w-4 h-4" /> {t('settings.saveSelfDeliveryBtn')}</>
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
                  <UserCheck className="w-5 h-5 text-emerald-500" /> {t('settings.deliveryPartnersTitle')}
                </h2>
                <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                  {t('settings.deliveryPartnersSubtitle')}
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
                {showAddPartnerForm ? t('settings.cancel') : t('settings.addPartner')}
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
                    {t('settings.newPartnerProfile')}
                  </h3>
                  <span className="text-[10px] text-[var(--merchant-text-muted)]">
                    {t('settings.linkedToFulfillment')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--merchant-text-secondary)] mb-1">
                      {t('settings.partnerNameLabel')} <span className="text-rose-500">*</span>
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
                      {t('settings.mobileNumberLabel')} <span className="text-rose-500">*</span>
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
                      {t('settings.emailAddressOptional')}
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rider@example.com"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-xs focus:border-[var(--merchant-primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--merchant-text-secondary)] mb-1">
                      {t('settings.vehicleModeLabel')}
                    </label>
                    <select
                      value={partnerVehicle}
                      onChange={(e) => setPartnerVehicle(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-lg text-xs focus:border-[var(--merchant-primary)] focus:outline-none"
                    >
                      <option value="Motorcycle">{t('settings.vehicleMotorcycle')}</option>
                      <option value="Scooter">{t('settings.vehicleScooter')}</option>
                      <option value="Electric Bike">{t('settings.vehicleEv')}</option>
                      <option value="Store Van">{t('settings.vehicleVan')}</option>
                      <option value="Bicycle">{t('settings.vehicleBicycle')}</option>
                      <option value="Store Staff">{t('settings.vehicleStaff')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--merchant-text-secondary)] mb-1">
                      {t('settings.notesAreaOptional')}
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
                      {t('settings.setDefaultRider')}
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-[var(--merchant-border)]">
                  <button
                    type="button"
                    onClick={() => setShowAddPartnerForm(false)}
                    className="px-3.5 py-1.5 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] text-[var(--merchant-text)] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {t('settings.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={savingPartner}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {savingPartner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {t('settings.saveRiderBtn')}
                  </button>
                </div>
              </form>
            )}

            {/* SAVED PARTNERS LIST / DIRECTORY */}
            {loadingPartners ? (
              <div className="p-6 text-center text-xs text-[var(--merchant-text-muted)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                {t('settings.loadingPartners')}
              </div>
            ) : deliveryPartners.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-[var(--merchant-border)] text-center space-y-2 bg-[var(--merchant-surface-muted)]/30">
                <Truck className="w-8 h-8 text-[var(--merchant-text-muted)] mx-auto opacity-50" />
                <p className="text-xs font-bold text-[var(--merchant-text)]">{t('settings.noPartnersSaved')}</p>
                <p className="text-[11px] text-[var(--merchant-text-muted)] max-w-md mx-auto">
                  {t('settings.noPartnersDesc')}
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
                            <Star className="w-2.5 h-2.5 fill-current" /> {t('settings.defaultBadge')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultPartner(partner)}
                            className="text-[10px] text-[var(--merchant-text-muted)] hover:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                          >
                            {t('settings.setDefaultBtn')}
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
                          <Phone className="w-3 h-3 text-merchant-primary" /> {t('settings.callBtn')}
                        </a>
                        <a
                          href={`https://wa.me/91${partner.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-600 dark:text-emerald-400 rounded border border-[#25D366]/30 text-[10px] inline-flex items-center gap-1"
                          title="Message on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-[#25D366]" /> {t('settings.waBtn')}
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePartner(partner.id, partner.name)}
                        className="p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                        title={t('settings.deletePartnerTooltip')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 7: Additional Store Configurations */}
          <div className="bg-[var(--merchant-surface)] p-6 rounded-2xl border border-[var(--merchant-border)] shadow-xs space-y-4 transition-colors">
            <h2 className="text-base font-bold text-[var(--merchant-text)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--merchant-accent)]" /> {t('settings.additionalConfigsTitle')}
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
                  <h3 className="text-xs font-bold text-[var(--merchant-text)]">{t('settings.couponsPromoTitle')}</h3>
                  <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">{t('settings.couponsPromoDesc')}</p>
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
                  <h3 className="text-xs font-bold text-[var(--merchant-text)]">{t('settings.billingSubTitle')}</h3>
                  <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">{t('settings.billingSubDesc')}</p>
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
                  <h3 className="text-xs font-bold text-[var(--merchant-text)]">{t('settings.themeStudioTitle')}</h3>
                  <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">{t('settings.themeStudioDesc')}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
