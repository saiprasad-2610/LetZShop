import React, { useMemo } from 'react';
import Head from 'next/head';
import { FOUNDATIONAL_THEMES, ThemeConfig, normalizeHexColor, getContrastRatio, storefrontColors, STOREFRONT_FONT_FAMILIES, resolveStorefrontFont } from '@simply/ui';

interface ThemeWrapperProps {
  themeConfig?: any;
  branding?: any;
  children: React.ReactNode;
}

const FONT_FAMILIES = STOREFRONT_FONT_FAMILIES;

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({
  themeConfig,
  branding,
  children,
}) => {
  const themeCode = themeConfig?.themeId || 'atelier';
  const themeArchetype: ThemeConfig = FOUNDATIONAL_THEMES[themeCode] || FOUNDATIONAL_THEMES.atelier;

  const primary = normalizeHexColor(themeConfig?.palette?.primary) || normalizeHexColor(branding?.primaryColor) || themeArchetype.palette.primary;
  const accent = normalizeHexColor(themeConfig?.palette?.accent) || normalizeHexColor(branding?.accentColor) || themeArchetype.palette.accent;
  const background = normalizeHexColor(themeConfig?.palette?.background) || themeArchetype.palette.background;
  const onPrimary = getContrastRatio(primary, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#000000';
  const onAccent = getContrastRatio(accent, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#000000';
  const colors = useMemo(() => storefrontColors(themeArchetype.palette, { ...themeConfig?.palette, primary, accent, background }), [themeCode, primary, accent, background, themeConfig?.palette?.surface, themeConfig?.palette?.text, themeConfig?.palette?.muted, themeConfig?.palette?.border]);

  // Resolve typography: vendor selected preset > vendor custom heading/body > theme default
  const selectedPreset = resolveStorefrontFont(themeConfig?.typography?.preset || themeConfig?.typography?.fontHeading || '');
  const presetFont = FONT_FAMILIES[selectedPreset];

  const fontHeadingMap: Record<string, string> = {
    atelier: "'Playfair Display', Georgia, serif",
    pulse: "'Space Grotesk', system-ui, sans-serif",
    harvest: "'DM Serif Display', Georgia, serif",
    foundry: "'Space Grotesk', monospace, system-ui",
    habitat: "'Cinzel', Garamond, Georgia, serif",
    local: "'Inter', system-ui, sans-serif",
    feast: "'Playfair Display', Georgia, serif",
    aura: "'Playfair Display', Georgia, serif",
    noir: "'Space Grotesk', system-ui, sans-serif",
    vista: "'DM Serif Display', Georgia, serif",
    horizon: "'Plus Jakarta Sans', system-ui, sans-serif",
    canvas: "'Outfit', system-ui, sans-serif",
  };

  const fontBodyMap: Record<string, string> = {
    atelier: "'Plus Jakarta Sans', system-ui, sans-serif",
    pulse: "'Inter', system-ui, sans-serif",
    harvest: "'Plus Jakarta Sans', system-ui, sans-serif",
    foundry: "'Inter', system-ui, sans-serif",
    habitat: "'Plus Jakarta Sans', system-ui, sans-serif",
    local: "'Inter', system-ui, sans-serif",
    feast: "'Plus Jakarta Sans', system-ui, sans-serif",
    aura: "'Plus Jakarta Sans', system-ui, sans-serif",
    noir: "'Inter', system-ui, sans-serif",
    vista: "'Plus Jakarta Sans', system-ui, sans-serif",
    horizon: "'Inter', system-ui, sans-serif",
    canvas: "'Plus Jakarta Sans', system-ui, sans-serif",
  };

  const headingFont = presetFont?.heading || themeConfig?.typography?.fontHeading || fontHeadingMap[themeCode] || fontHeadingMap.atelier;
  const bodyFont = presetFont?.body || themeConfig?.typography?.fontBody || fontBodyMap[themeCode] || fontBodyMap.atelier;

  // Resolve dynamic button shape
  const buttonStyle = themeConfig?.buttonStyle || themeArchetype.buttonStyle || 'rounded-heavy';
  let btnRadius = '12px';
  if (buttonStyle === 'sharp-pill' || buttonStyle === 'pill-friendly' || buttonStyle === 'quick-add') {
    btnRadius = '9999px';
  } else if (buttonStyle === 'square-solid') {
    btnRadius = '2px';
  } else {
    btnRadius = '12px';
  }

  // Resolve dynamic card styling & radius
  const cardStyle = themeConfig?.cardStyle || themeArchetype.cardStyle || 'elevated-modern';
  let cardRadius = '16px';
  let cardShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
  let cardBorder = '1px solid rgba(0, 0, 0, 0.08)';

  if (cardStyle === 'rounded-soft') {
    cardRadius = '24px';
    cardShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.06)';
  } else if (cardStyle === 'framed-luxury') {
    cardRadius = '6px';
    cardShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
    cardBorder = '1.5px solid rgba(0, 0, 0, 0.15)';
  } else if (cardStyle === 'minimal-bleed') {
    cardRadius = '0px';
    cardShadow = 'none';
    cardBorder = '1px solid rgba(0, 0, 0, 0.1)';
  } else if (cardStyle === 'spec-sheet-card') {
    cardRadius = '2px';
    cardShadow = 'none';
    cardBorder = '1px solid rgba(0, 0, 0, 0.2)';
  }

  // Resolve announcement bar bottom-edge shape
  const announcementBarStyle = themeConfig?.announcementBarStyle || 'square';
  let announcementBorderRadius = '0';
  if (announcementBarStyle === 'soft') announcementBorderRadius = '0 0 8px 8px';
  else if (announcementBarStyle === 'rounded') announcementBorderRadius = '0 0 16px 16px';
  else if (announcementBarStyle === 'pill') announcementBorderRadius = '0 0 9999px 9999px';

  const styleVariables = {
    ...colors,
    '--theme-primary': primary,
    '--theme-accent': accent,
    '--theme-background': background,
    '--theme-on-primary': onPrimary,
    '--theme-on-accent': onAccent,
    '--theme-font-heading': headingFont,
    '--theme-font-body': bodyFont,
    // Sync Tailwind font-serif / font-sans utilities with selected theme font
    // Without this, elements using font-serif/font-sans classes ignore the merchant's choice
    '--font-serif': headingFont,
    '--font-sans': bodyFont,
    '--theme-btn-radius': btnRadius,
    '--theme-card-radius': cardRadius,
    '--theme-card-shadow': cardShadow,
    '--theme-card-border': cardBorder,
    '--theme-announcement-radius': announcementBorderRadius,
  } as React.CSSProperties;

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Serif+Display&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@400;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div
        data-store-theme={themeCode}
        data-custom-primary={primary.toUpperCase() !== themeArchetype.palette.primary.toUpperCase() || undefined}
        data-custom-accent={accent.toUpperCase() !== themeArchetype.palette.accent.toUpperCase() || undefined}
        data-custom-background={background.toUpperCase() !== themeArchetype.palette.background.toUpperCase() || undefined}
        data-custom-typography={Boolean(presetFont) || undefined}
        style={{
          ...styleVariables,
          backgroundColor: 'var(--theme-background)',
          color: 'var(--store-text-primary)',
        }}
        className={`min-h-screen transition-colors duration-200 theme-${themeCode} font-theme-body`}
      >
        {children}
      </div>
    </>
  );
};
