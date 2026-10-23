import { LANDING_ANCHORS } from './anchors';
import React, { useState } from 'react';
import { Palette, Sparkles, Check, ChevronLeft, ChevronRight, Laptop, Smartphone, Sliders, Type, Image as ImageIcon, LayoutGrid, Layers } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import { FOUNDATIONAL_THEMES, ThemeConfig } from '@simply/ui';

interface Screen6BrandStudioProps {
  sellerUrl: string;
}

export const Screen6BrandStudio: React.FC<Screen6BrandStudioProps> = ({ sellerUrl }) => {
  const { t } = useLandingI18n();

  // Curated list of real foundational themes from FOUNDATIONAL_THEMES
  const themeKeys = ['atelier', 'canvas', 'horizon', 'feast', 'aura', 'habitat', 'pulse', 'vista'];
  const [selectedThemeCode, setSelectedThemeCode] = useState<string>('atelier');

  const currentTheme: ThemeConfig = FOUNDATIONAL_THEMES[selectedThemeCode] || FOUNDATIONAL_THEMES.atelier;

  const brandCapabilities = [
    { label: t('landing.brandCapLogo'), icon: Sparkles, desc: 'Upload custom vector SVG or PNG brand wordmark' },
    { label: t('landing.brandCapColours'), icon: Palette, desc: 'Tailored palette shades for primary, accent & surface' },
    { label: t('landing.brandCapFonts'), icon: Type, desc: 'Curated serif, modern grotesque & sans typography' },
    { label: t('landing.brandCapBanners'), icon: ImageIcon, desc: 'Custom hero headlines, promotions & lifestyle banners' },
    { label: t('landing.brandCapLayout'), icon: LayoutGrid, desc: 'Configure banners, announcement bars & product grids' },
    { label: t('landing.brandCapStyling'), icon: Sliders, desc: 'Pill, rounded or sharp button radii & card shadows' },
  ];

  // Helper for font family inline style
  const getHeadingFont = (heading: string) => {
    switch (heading) {
      case 'Playfair Display':
        return "'Playfair Display', Georgia, serif";
      case 'Space Grotesk':
        return "'Space Grotesk', system-ui, sans-serif";
      case 'DM Serif Display':
        return "'DM Serif Display', Georgia, serif";
      case 'Cinzel':
        return "'Cinzel', Georgia, serif";
      case 'Outfit':
        return "'Outfit', system-ui, sans-serif";
      case 'Plus Jakarta Sans':
        return "'Plus Jakarta Sans', system-ui, sans-serif";
      default:
        return "'Plus Jakarta Sans', system-ui, sans-serif";
    }
  };

  const getBodyFont = (body: string) => {
    switch (body) {
      case 'Inter':
        return "'Inter', system-ui, sans-serif";
      case 'Plus Jakarta Sans':
      default:
        return "'Plus Jakarta Sans', system-ui, sans-serif";
    }
  };

  const getButtonRadiusClass = (btnStyle: string) => {
    switch (btnStyle) {
      case 'sharp-pill':
        return 'rounded-full';
      case 'rounded-heavy':
        return 'rounded-2xl';
      case 'pill-friendly':
        return 'rounded-full';
      case 'square-solid':
        return 'rounded-sm';
      default:
        return 'rounded-xl';
    }
  };

  const getCardRadiusClass = (cardStyle: string) => {
    switch (cardStyle) {
      case 'framed-luxury':
        return 'rounded-2xl border-2';
      case 'elevated-modern':
        return 'rounded-2xl shadow-md border';
      case 'rounded-soft':
        return 'rounded-3xl border';
      case 'spec-sheet-card':
        return 'rounded-md border-2';
      default:
        return 'rounded-2xl border';
    }
  };

  return (
    <section id={LANDING_ANCHORS.customize} className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50/60 border-b border-slate-100 scroll-mt-16">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold tracking-wide">
            <Palette className="w-3.5 h-3.5 text-orange-600" />
            <span>{t('landing.brandEyebrow')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            {t('landing.brandTitle')}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t('landing.brandSupporting')}
          </p>

          <p className="text-xs text-blue-700 font-semibold bg-blue-50/80 py-1.5 px-4 rounded-full inline-block border border-blue-200">
            {t('landing.brandNotice')}
          </p>
        </div>

        {/* Real Foundational Theme Selector Strip */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
            {themeKeys.map((key) => {
              const theme = FOUNDATIONAL_THEMES[key];
              if (!theme) return null;
              const isSelected = selectedThemeCode === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedThemeCode(key)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 shrink-0 w-36 sm:w-40 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-600/20 scale-[1.02]'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-bold text-xs text-slate-900">{theme.name}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>

                  <span className="text-[10px] text-slate-500 line-clamp-1 mb-2 font-medium">
                    {theme.typography.heading}
                  </span>

                  {/* Palette Swatches */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-2xs inline-block"
                      style={{ backgroundColor: theme.palette.primary }}
                      title="Primary"
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-2xs inline-block"
                      style={{ backgroundColor: theme.palette.accent }}
                      title="Accent"
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-2xs inline-block"
                      style={{ backgroundColor: theme.palette.background }}
                      title="Background"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Interactive Preview: Desktop & Mobile Side-by-Side */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8 space-y-8">
          {/* Active Theme Meta Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  Theme: {currentTheme.name}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentTheme.tagline}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Best for: {currentTheme.bestFor}
              </p>
            </div>

            <a
              href={`${sellerUrl}/login?mode=register`}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto shrink-0"
            >
              Start With This Theme →
            </a>
          </div>

          {/* Dual Screen Preview: Desktop View (7 cols) + Mobile View (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Desktop Preview Frame (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-300 shadow-sm overflow-hidden bg-white">
              {/* Desktop Window Title */}
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-800">{t('landing.previewDesktop')}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">aurabotanics.letzshop.store</span>
              </div>

              {/* Dynamic Styled Desktop Canvas */}
              <div
                className="p-5 space-y-4 transition-all duration-300"
                style={{
                  backgroundColor: currentTheme.palette.background,
                  color: currentTheme.palette.text,
                  fontFamily: getBodyFont(currentTheme.typography.body),
                }}
              >
                {/* Store Header in Theme Typography */}
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: currentTheme.palette.border }}>
                  <span
                    className="text-lg font-black tracking-tight"
                    style={{
                      fontFamily: getHeadingFont(currentTheme.typography.heading),
                      color: currentTheme.palette.primary,
                    }}
                  >
                    AURA BOTANICS
                  </span>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="opacity-75">Collections</span>
                    <span className="opacity-75">Our Story</span>
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-bold text-white transition ${getButtonRadiusClass(currentTheme.buttonStyle)}`}
                      style={{ backgroundColor: currentTheme.palette.primary }}
                    >
                      Bag (0)
                    </button>
                  </div>
                </div>

                {/* Hero Showcase in Theme Colors */}
                <div
                  className="p-6 rounded-xl border flex flex-col justify-between space-y-3"
                  style={{
                    backgroundColor: currentTheme.palette.surface,
                    borderColor: currentTheme.palette.border,
                  }}
                >
                  <span
                    className="text-[10px] uppercase font-bold tracking-widest"
                    style={{ color: currentTheme.palette.accent }}
                  >
                    Hand-Extracted Botanical Serum
                  </span>
                  <h4
                    className="text-xl sm:text-2xl font-black leading-tight"
                    style={{
                      fontFamily: getHeadingFont(currentTheme.typography.heading),
                      color: currentTheme.palette.primary,
                    }}
                  >
                    Pure Rosehip & Kumkumadi Radiance Oil
                  </h4>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      className={`px-4 py-2 text-xs font-bold text-white shadow-xs ${getButtonRadiusClass(currentTheme.buttonStyle)}`}
                      style={{ backgroundColor: currentTheme.palette.accent }}
                    >
                      Shop Formulation — ₹890
                    </button>
                    <span className="text-xs font-semibold" style={{ color: currentTheme.palette.muted }}>
                      100% Ayurvedic
                    </span>
                  </div>
                </div>

                {/* Products Grid in Theme */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div
                    className={`p-3 bg-white ${getCardRadiusClass(currentTheme.cardStyle)}`}
                    style={{ borderColor: currentTheme.palette.border }}
                  >
                    <span className="text-xs font-bold block" style={{ color: currentTheme.palette.primary }}>
                      Steam Distilled Rose Mist
                    </span>
                    <span className="text-xs font-extrabold mt-1 block" style={{ color: currentTheme.palette.accent }}>
                      ₹380
                    </span>
                  </div>

                  <div
                    className={`p-3 bg-white ${getCardRadiusClass(currentTheme.cardStyle)}`}
                    style={{ borderColor: currentTheme.palette.border }}
                  >
                    <span className="text-xs font-bold block" style={{ color: currentTheme.palette.primary }}>
                      Saffron & Turmeric Elixir
                    </span>
                    <span className="text-xs font-extrabold mt-1 block" style={{ color: currentTheme.palette.accent }}>
                      ₹640
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Preview Frame (5 cols) */}
            <div className="lg:col-span-5 max-w-xs mx-auto lg:mx-0 w-full rounded-2xl border border-slate-300 shadow-sm overflow-hidden bg-white">
              {/* Mobile Header Bar */}
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-800">{t('landing.previewMobile')}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">iPhone View</span>
              </div>

              {/* Dynamic Styled Mobile Canvas */}
              <div
                className="p-4 space-y-3 transition-all duration-300"
                style={{
                  backgroundColor: currentTheme.palette.background,
                  color: currentTheme.palette.text,
                  fontFamily: getBodyFont(currentTheme.typography.body),
                }}
              >
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: currentTheme.palette.border }}>
                  <span
                    className="text-sm font-black"
                    style={{
                      fontFamily: getHeadingFont(currentTheme.typography.heading),
                      color: currentTheme.palette.primary,
                    }}
                  >
                    AURA BOTANICS
                  </span>
                  <span className="text-[11px] font-bold" style={{ color: currentTheme.palette.accent }}>
                    Cart (0)
                  </span>
                </div>

                <div
                  className="p-3 rounded-xl border text-center space-y-1.5"
                  style={{
                    backgroundColor: currentTheme.palette.surface,
                    borderColor: currentTheme.palette.border,
                  }}
                >
                  <span className="text-[9px] uppercase font-bold" style={{ color: currentTheme.palette.accent }}>
                    Estate Fresh
                  </span>
                  <p
                    className="text-xs font-black leading-tight"
                    style={{
                      fontFamily: getHeadingFont(currentTheme.typography.heading),
                      color: currentTheme.palette.primary,
                    }}
                  >
                    Pure Rosehip & Kumkumadi
                  </p>
                  <button
                    type="button"
                    className={`w-full py-1.5 text-xs font-bold text-white shadow-2xs ${getButtonRadiusClass(currentTheme.buttonStyle)}`}
                    style={{ backgroundColor: currentTheme.palette.accent }}
                  >
                    Buy Now • ₹890
                  </button>
                </div>

                <div
                  className={`p-2.5 bg-white text-xs ${getCardRadiusClass(currentTheme.cardStyle)}`}
                  style={{ borderColor: currentTheme.palette.border }}
                >
                  <p className="font-bold text-[11px]" style={{ color: currentTheme.palette.primary }}>
                    Saffron & Turmeric Elixir
                  </p>
                  <span className="text-[11px] font-black" style={{ color: currentTheme.palette.accent }}>
                    ₹640
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Studio 6 Real Capabilities Grid */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 block">
              Actual Brand Studio Capabilities Built Into LetZshop
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {brandCapabilities.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                      <h4 className="font-bold text-slate-900 text-xs">{item.label}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
