import React from 'react';
import Head from 'next/head';
import { FOUNDATIONAL_THEMES, ThemeConfig } from '@simply/ui';

interface ThemeWrapperProps {
  themeConfig?: any;
  branding?: any;
  children: React.ReactNode;
}

const FONT_FAMILIES: Record<string, { heading: string; body: string }> = {
  'Playfair Display': {
    heading: "'Playfair Display', Georgia, serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  'Plus Jakarta Sans': {
    heading: "'Plus Jakarta Sans', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  'Inter': {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },
  'Space Grotesk': {
    heading: "'Space Grotesk', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },
  'DM Serif Display': {
    heading: "'DM Serif Display', Georgia, serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  'Cinzel': {
    heading: "'Cinzel', Garamond, Georgia, serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  'Outfit': {
    heading: "'Outfit', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },
  'Montserrat': {
    heading: "'Montserrat', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },
  'Cabinet Grotesk': {
    heading: "'Space Grotesk', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },
};

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({
  themeConfig,
  branding,
  children,
}) => {
  const themeCode = themeConfig?.themeId || 'atelier';
  const themeArchetype: ThemeConfig = FOUNDATIONAL_THEMES[themeCode] || FOUNDATIONAL_THEMES.atelier;

  const primary = themeConfig?.palette?.primary || branding?.primaryColor || themeArchetype.palette.primary;
  const accent = themeConfig?.palette?.accent || branding?.accentColor || themeArchetype.palette.accent;
  const background = themeConfig?.palette?.background || themeArchetype.palette.background;

  // Resolve typography: vendor selected preset > vendor custom heading/body > theme default
  const selectedPreset = themeConfig?.typography?.preset || themeConfig?.typography?.fontHeading || '';
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

  const styleVariables = {
    '--theme-primary': primary,
    '--theme-accent': accent,
    '--theme-background': background,
    '--theme-font-heading': headingFont,
    '--theme-font-body': bodyFont,
  } as React.CSSProperties;

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Serif+Display&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div
        style={{
          ...styleVariables,
          backgroundColor: 'var(--theme-background)',
          color: 'var(--theme-primary)',
        }}
        className={`min-h-screen transition-colors duration-200 theme-${themeCode} font-theme-body`}
      >
        {children}
      </div>
    </>
  );
};
