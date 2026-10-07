import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import {
  Palette,
  Wand2,
  Sparkles,
  LayoutTemplate,
  Eye,
  Save,
  Check,
  Smartphone,
  Monitor,
  Type,
  Layers,
  ArrowUp,
  ArrowDown,
  UploadCloud,
  AlertTriangle,
  Building,
  MapPin,
  Clock,
  Sliders,
  X,
  ExternalLink,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { MiniStorePreview } from '../components/MiniStorePreview';
import { useAuth } from '../context/AuthContext';
import {
  FOUNDATIONAL_THEMES,
  QuickDesigner,
  getContrastRatio,
  isContrastAccessible,
  getSuggestedTextColor,
  getWordmark,
} from '@simply/ui';
import { SafeImage } from '../components/ui/SafeImage';

export default function BrandStudioPage() {
  const { api } = useAuth();
  const [tier, setTier] = useState<'QUICK' | 'BRAND' | 'STUDIO'>('BRAND');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [store, setStore] = useState<any>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Studio Config State
  const [selectedThemeId, setSelectedThemeId] = useState('atelier');
  const [primaryColor, setPrimaryColor] = useState('#1C1917');
  const [accentColor, setAccentColor] = useState('#D4AF37');
  const [backgroundColor, setBackgroundColor] = useState('#FAFAF9');
  const [typographyPreset, setTypographyPreset] = useState('Playfair Display');
  const [announcementText, setAnnouncementText] = useState(
    'Complimentary pan-India insured shipping on all orders'
  );
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);

  // Logo & Banner files
  const [logoUrl, setLogoUrl] = useState('');
  const [heroBannerUrl, setHeroBannerUrl] = useState('');

  // Extended Customization
  const [headerStyle, setHeaderStyle] = useState('minimal-center');
  const [heroStyle, setHeroStyle] = useState('split-editorial');
  const [cardStyle, setCardStyle] = useState('framed-luxury');
  const [buttonStyle, setButtonStyle] = useState('sharp-pill');
  const [imageRatio, setImageRatio] = useState('3/4');

  // Store Story & Physical Store
  const [storeStory, setStoreStory] = useState(
    'Founded by dedicated master craftsmen, our boutique celebrates centuries of authentic Indian design heritage with contemporary elegance.'
  );
  const [physicalStoreAddress, setPhysicalStoreAddress] = useState(
    'Shop 14, Heritage Arcade, MG Road, Pune, Maharashtra 411001'
  );
  const [physicalStoreTimings, setPhysicalStoreTimings] = useState('Mon - Sat: 10:30 AM to 8:30 PM');

  // Sections
  const [sections, setSections] = useState<
    Array<{ id: string; name: string; enabled: boolean }>
  >([
    { id: 'announcement', name: 'Top Announcement Bar', enabled: true },
    { id: 'hero', name: 'Hero Showcase Banner', enabled: true },
    { id: 'categories', name: 'Category Showcase', enabled: true },
    { id: 'featured_products', name: 'Curated Products Grid', enabled: true },
    { id: 'brand_story', name: 'Brand Story & Heritage', enabled: true },
    { id: 'physical_store', name: 'Visit Physical Store & Map', enabled: true },
    { id: 'testimonials', name: 'Customer Testimonials', enabled: true },
    { id: 'contact', name: 'Contact & Inquiry Section', enabled: true },
  ]);

  useEffect(() => {
    loadStudioData();
  }, []);

  const loadStudioData = async () => {
    setLoading(true);
    try {
      const [storeRes, configRes] = await Promise.all([
        api.stores.getMyStore(),
        api.themes.getThemeConfig().catch(() => null),
      ]);
      setStore(storeRes);

      if (storeRes?.branding) {
        if (storeRes.branding.logoUrl) setLogoUrl(storeRes.branding.logoUrl);
        if (storeRes.branding.bannerUrl) setHeroBannerUrl(storeRes.branding.bannerUrl);
        if (storeRes.branding.primaryColor) setPrimaryColor(storeRes.branding.primaryColor);
        if (storeRes.branding.accentColor) setAccentColor(storeRes.branding.accentColor);
      }

      if (configRes) {
        if (configRes.themeId) setSelectedThemeId(configRes.themeId);
        if (configRes.palette?.primary) setPrimaryColor(configRes.palette.primary);
        if (configRes.palette?.accent) setAccentColor(configRes.palette.accent);
        if (configRes.palette?.background) setBackgroundColor(configRes.palette.background);
        if (configRes.typography?.preset) setTypographyPreset(configRes.typography.preset);
        if (configRes.announcement) {
          setAnnouncementText(configRes.announcement.text || '');
          setAnnouncementEnabled(configRes.announcement.enabled ?? true);
        }
        if (configRes.headerStyle) setHeaderStyle(configRes.headerStyle);
        if (configRes.heroStyle) setHeroStyle(configRes.heroStyle);
        if (configRes.cardStyle) setCardStyle(configRes.cardStyle);
        if (configRes.buttonStyle) setButtonStyle(configRes.buttonStyle);
        if (configRes.imageRatio) setImageRatio(configRes.imageRatio);
        if (configRes.storeStory) setStoreStory(configRes.storeStory);
        if (configRes.physicalStoreAddress) setPhysicalStoreAddress(configRes.physicalStoreAddress);
      }
    } catch (err) {
      console.error('Failed to load theme studio data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'UPDATE_THEME_PREVIEW',
          themeConfig: {
            themeId: selectedThemeId,
            palette: {
              primary: primaryColor,
              accent: accentColor,
              background: backgroundColor,
            },
            typography: {
              preset: typographyPreset,
            },
            announcement: {
              enabled: announcementEnabled,
              text: announcementText,
            },
            headerStyle,
            heroStyle,
            cardStyle,
            buttonStyle,
            imageRatio,
            storeStory,
            physicalStoreAddress,
            physicalStoreTimings,
          },
          branding: {
            logoUrl,
            bannerUrl: heroBannerUrl,
            primaryColor,
            accentColor,
          }
        },
        '*'
      );
    }
  }, [
    selectedThemeId, primaryColor, accentColor, backgroundColor, typographyPreset,
    announcementEnabled, announcementText, headerStyle, heroStyle, cardStyle,
    buttonStyle, imageRatio, storeStory, physicalStoreAddress, physicalStoreTimings,
    logoUrl, heroBannerUrl
  ]);

  const handleApplyQuickPreset = (categoryName: string) => {
    const output = QuickDesigner.designForCategory(categoryName, store?.name || 'Our Store');
    setSelectedThemeId(output.themeCode);
    setPrimaryColor(output.primaryColor);
    setAccentColor(output.accentColor);
    setBackgroundColor(output.theme.palette.background);
    setTypographyPreset(output.theme.typography.heading);
    setHeaderStyle(output.theme.headerStyle);
    setHeroStyle(output.theme.heroStyle);
    setCardStyle(output.theme.cardStyle);
    setButtonStyle(output.theme.buttonStyle);
    setImageRatio(output.theme.imageRatio);
    alert(`Applied Quick Design preset tailored for ${categoryName}!`);
  };

  // Image Upload Handlers
  const handleLogoUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setLogoUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setHeroBannerUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Contrast Safety Checks
  const contrastRatio = getContrastRatio(backgroundColor, primaryColor);
  const isAccessible = contrastRatio >= 4.5;

  const fixContrastAutomatically = () => {
    const suggested = getSuggestedTextColor(backgroundColor);
    setPrimaryColor(suggested === '#0F172A' ? '#0F172A' : '#FFFFFF');
  };

  const handleSaveThemeConfig = async () => {
    setSaving(true);
    try {
      await api.themes.updateThemeConfig({
        themeCode: selectedThemeId,
        configJson: {
          themeId: selectedThemeId,
          palette: {
            primary: primaryColor,
            accent: accentColor,
            background: backgroundColor,
          },
          typography: {
            preset: typographyPreset,
          },
          announcement: {
            enabled: announcementEnabled,
            text: announcementText,
          },
          headerStyle,
          heroStyle,
          cardStyle,
          buttonStyle,
          imageRatio,
          storeStory,
          physicalStoreAddress,
          physicalStoreTimings,
        },
        sections: sections.map((s, idx) => ({
          sectionType: s.id,
          title: (s as any).title || s.name,
          isEnabled: s.enabled,
          sortOrder: idx,
          configJson: {},
        })),
      });

      // Update store branding (logo and colors)
      await api.themes.updateBranding({
        primaryColor,
        accentColor,
        logoUrl: logoUrl || undefined,
        bannerUrl: heroBannerUrl || undefined,
      });

      alert('Storefront theme and brand studio design published successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save theme configuration');
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setSections(updated);
  };

  const toggleSection = (id: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const currentThemeObj = FOUNDATIONAL_THEMES[selectedThemeId] || FOUNDATIONAL_THEMES.atelier;
  const wordmark = getWordmark(store?.name || 'Your Store', selectedThemeId);

  // Render controls content
  const renderControls = () => (
    <div className="space-y-6">
      {/* TIER 1: QUICK DESIGN */}
      {tier === 'QUICK' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Instant Category Presets</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              One-click setup: Automatically configures the optimal theme, palette, typography, and section flow for your exact business category.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { name: 'Jewellery & Watches', desc: 'Atelier / Gold & Charcoal', code: 'atelier' },
              { name: 'Streetwear & Apparel', desc: 'Pulse / Electric Pink & Bold', code: 'pulse' },
              { name: 'Sweets & Organic Food', desc: 'Harvest / Forest & Amber', code: 'harvest' },
              { name: 'Manufacturing & Tools', desc: 'Foundry / Industrial Slate', code: 'foundry' },
              { name: 'Furniture & Living', desc: 'Habitat / Terracotta & Linen', code: 'habitat' },
              { name: 'Retail & Superstore', desc: 'Local / Royal Blue & Green', code: 'local' },
            ].map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleApplyQuickPreset(cat.name)}
                className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition group space-y-1"
              >
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 block">
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  {cat.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TIER 2: BRAND IDENTITY */}
      {tier === 'BRAND' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          {/* 6 Foundational Themes Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Foundational Storefront Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.values(FOUNDATIONAL_THEMES).map((th) => (
                <button
                  key={th.code}
                  type="button"
                  onClick={() => {
                    setSelectedThemeId(th.code);
                    setPrimaryColor(th.palette.primary);
                    setAccentColor(th.palette.accent);
                    setBackgroundColor(th.palette.background);
                    setTypographyPreset(th.typography.heading);
                    setHeaderStyle(th.headerStyle);
                    setHeroStyle(th.heroStyle);
                    setCardStyle(th.cardStyle);
                    setButtonStyle(th.buttonStyle);
                    setImageRatio(th.imageRatio);
                  }}
                  className={`text-left p-3 rounded-xl border transition space-y-1 ${
                    selectedThemeId === th.code
                      ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{th.name}</span>
                    {selectedThemeId === th.code && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{th.bestFor}</p>
                  <div className="flex gap-1 pt-1">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: th.palette.primary }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: th.palette.accent }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Logo & Banner Upload */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Store Brand Assets (Logo & Banner)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Upload Box */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Brand Logo
                </span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e.target.files)}
                  className="hidden"
                />
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border border-dashed border-slate-300 rounded-xl p-3 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 transition flex items-center gap-3"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded" />
                  ) : (
                    <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                      <Building className="w-5 h-5" />
                    </div>
                  )}
                  <div className="text-left text-xs min-w-0">
                    <span className="font-semibold text-slate-800 block truncate">
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </span>
                    <span className="text-[10px] text-slate-400">PNG or SVG with transparency</span>
                  </div>
                </div>
              </div>

              {/* Banner Upload Box */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Hero Showcase Banner
                </span>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleBannerUpload(e.target.files)}
                  className="hidden"
                />
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="border border-dashed border-slate-300 rounded-xl p-3 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 transition flex items-center gap-3"
                >
                  {heroBannerUrl ? (
                    <img
                      src={heroBannerUrl}
                      alt="Banner"
                      className="h-10 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-16 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                  )}
                  <div className="text-left text-xs min-w-0">
                    <span className="font-semibold text-slate-800 block truncate">
                      {heroBannerUrl ? 'Change Banner' : 'Upload Banner'}
                    </span>
                    <span className="text-[10px] text-slate-400">High-res photography</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Color Palette & Contrast Validation */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Color Palette & Contrast Safety
              </label>
              {!isAccessible && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Contrast
                </span>
              )}
            </div>

            {!isAccessible && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center justify-between gap-2">
                <span>
                  Primary color has low contrast against the background ({contrastRatio.toFixed(1)}:1 vs 4.5:1 required). Buyers may find it hard to read.
                </span>
                <button
                  type="button"
                  onClick={fixContrastAutomatically}
                  className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg text-[10px] shrink-0"
                >
                  Auto-Fix
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Primary Brand Color
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="text-xs font-mono uppercase px-2 py-1.5 border border-slate-300 rounded-lg w-24"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Accent Color
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="text-xs font-mono uppercase px-2 py-1.5 border border-slate-300 rounded-lg w-24"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Canvas Background
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="text-xs font-mono uppercase px-2 py-1.5 border border-slate-300 rounded-lg w-24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography Preset */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Typography Pairing
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'Playfair Display', name: 'Playfair & Inter', desc: 'Editorial Serif' },
                { id: 'Cabinet Grotesk', name: 'Cabinet Grotesk', desc: 'Punchy Streetwear' },
                { id: 'Space Grotesk', name: 'Space Grotesk', desc: 'Technical & Clean' },
              ].map((ty) => (
                <button
                  key={ty.id}
                  type="button"
                  onClick={() => setTypographyPreset(ty.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition ${
                    typographyPreset === ty.id
                      ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-slate-900">{ty.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{ty.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Announcement Bar */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Top Announcement Bar
              </label>
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
            {announcementEnabled && (
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g. Free pan-India shipping on orders above ₹1,999"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            )}
          </div>
        </div>
      )}

      {/* TIER 3: STUDIO FINE-TUNING */}
      {tier === 'STUDIO' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          {/* Header & Hero Styles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Header Composition
              </label>
              <select
                value={headerStyle}
                onChange={(e) => setHeaderStyle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
              >
                <option value="minimal-center">Minimal Centered (Atelier)</option>
                <option value="sticky-action">Sticky Action (Pulse)</option>
                <option value="warm-friendly">Warm Friendly (Harvest)</option>
                <option value="industrial-meta">Industrial Meta & Phone (Foundry)</option>
                <option value="spacious-lifestyle">Spacious Lifestyle (Habitat)</option>
                <option value="quick-search-bar">Quick Search Bar (Local)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hero Showcase Layout
              </label>
              <select
                value={heroStyle}
                onChange={(e) => setHeroStyle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
              >
                <option value="split-editorial">Split Editorial (Atelier)</option>
                <option value="full-banner">Full Width Drop Banner (Pulse)</option>
                <option value="organic-showcase">Organic Showcase (Harvest)</option>
                <option value="technical-hero">Technical Spec Hero (Foundry)</option>
                <option value="lifestyle-immersive">Lifestyle Room Setting (Habitat)</option>
                <option value="product-mosaic">Product Mosaic & Quick Pills (Local)</option>
              </select>
            </div>
          </div>

          {/* Card & Button Styles & Image Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Card Style</label>
              <select
                value={cardStyle}
                onChange={(e) => setCardStyle(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white"
              >
                <option value="framed-luxury">Framed Luxury</option>
                <option value="elevated-modern">Elevated Modern</option>
                <option value="rounded-soft">Rounded Soft</option>
                <option value="spec-sheet-card">Spec Sheet Card</option>
                <option value="minimal-bleed">Minimal Bleed</option>
                <option value="high-density-buy">High Density Buy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Button Shape</label>
              <select
                value={buttonStyle}
                onChange={(e) => setButtonStyle(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white"
              >
                <option value="sharp-pill">Sharp Pill</option>
                <option value="rounded-heavy">Rounded Heavy</option>
                <option value="pill-friendly">Pill Friendly</option>
                <option value="square-solid">Square Solid</option>
                <option value="underline-refined">Underline Refined</option>
                <option value="quick-add">Quick Add</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Image Ratio</label>
              <select
                value={imageRatio}
                onChange={(e) => setImageRatio(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white"
              >
                <option value="3/4">3:4 Portrait (Editorial/Luxury)</option>
                <option value="1/1">1:1 Square (Modern/Food)</option>
                <option value="4/3">4:3 Landscape (Industrial)</option>
                <option value="4/5">4:5 Lifestyle (Living/Interiors)</option>
                <option value="16/9">16:9 Wide (Banners)</option>
              </select>
            </div>
          </div>

          {/* Section Visibility & Reordering */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Homepage Section Visibility & Flow
            </label>
            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={sec.enabled}
                      onChange={() => toggleSection(sec.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span
                      className={`font-semibold ${
                        sec.enabled ? 'text-slate-900' : 'text-slate-400 line-through'
                      }`}
                    >
                      {sec.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Store Story Content */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Store Heritage Story Text
            </label>
            <textarea
              rows={3}
              value={storeStory}
              onChange={(e) => setStoreStory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          {/* Physical Store Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Physical Store & Workshop Details
            </label>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Store Address
              </label>
              <input
                type="text"
                value={physicalStoreAddress}
                onChange={(e) => setPhysicalStoreAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Operating Hours
              </label>
              <input
                type="text"
                value={physicalStoreTimings}
                onChange={(e) => setPhysicalStoreTimings(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout title="Brand Studio">
      <Head>
        <title>Brand Studio & Visual Identity | Simply Seller</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Brand Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Fine-tune your storefront visual identity, theme, colors, and layout sections
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveThemeConfig}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Publishing Design...' : 'Publish Design'}
            </button>
          </div>
        </div>

        {/* 3 Tier Navigation Tabs */}
        <div className="grid grid-cols-3 bg-slate-200/80 p-1 rounded-xl max-w-lg">
          <button
            onClick={() => setTier('QUICK')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tier === 'QUICK'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Design</span>
          </button>
          <button
            onClick={() => setTier('BRAND')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tier === 'BRAND'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>Brand Identity</span>
          </button>
          <button
            onClick={() => setTier('STUDIO')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tier === 'STUDIO'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Studio Sections</span>
          </button>
        </div>

        {/* Desktop Split View: Controls Left, Live Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (Hidden on small mobile if user toggles to full preview) */}
          <div className="lg:col-span-6 hidden lg:block">{renderControls()}</div>

          {/* Live Storefront Interactive Preview Column */}
          <div className="lg:col-span-6 sticky top-20">
            <div className="bg-slate-950 rounded-2xl p-4 shadow-xl text-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live Storefront Preview ({currentThemeObj.name})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mobile Controls Drawer Trigger for < 1024px */}
                  <button
                    onClick={() => setMobileDrawerOpen(true)}
                    className="lg:hidden px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" /> Customize
                  </button>

                  {/* Device Switcher */}
                  <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1.5 rounded ${
                        previewDevice === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-400'
                      }`}
                      title="Desktop Layout"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1.5 rounded ${
                        previewDevice === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400'
                      }`}
                      title="Mobile PWA Layout"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Rendered Preview Mockup Frame */}
              <div
                className={`mx-auto rounded-xl overflow-hidden shadow-2xl transition-all duration-300 border border-slate-800 ${
                  previewDevice === 'mobile' ? 'max-w-[340px] h-[650px]' : 'w-full h-[650px]'
                }`}
              >
                {store && <MiniStorePreview store={store} iframeRef={iframeRef} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer for Controls (on screens < 1024px) */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl max-h-[85vh] h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <span className="text-sm font-bold text-slate-900">Customize Storefront</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{renderControls()}</div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close & View Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
