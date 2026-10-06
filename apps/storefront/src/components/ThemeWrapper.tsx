import React from 'react';
import { FOUNDATIONAL_THEMES, ThemeConfig } from '@simply/ui';

interface ThemeWrapperProps {
  themeConfig?: any;
  branding?: any;
  children: React.ReactNode;
}

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

  const fontHeadingMap: Record<string, string> = {
    atelier: "'Playfair Display', Georgia, serif",
    pulse: "'Space Grotesk', system-ui, sans-serif",
    harvest: "'DM Serif Display', Georgia, serif",
    foundry: "'Space Grotesk', monospace, system-ui",
    habitat: "'Cinzel', Garamond, Georgia, serif",
    local: "'Inter', system-ui, sans-serif",
    feast: "'Playfair Display', Georgia, serif",
  };

  const fontBodyMap: Record<string, string> = {
    atelier: "'Plus Jakarta Sans', system-ui, sans-serif",
    pulse: "'Inter', system-ui, sans-serif",
    harvest: "'Plus Jakarta Sans', system-ui, sans-serif",
    foundry: "'Inter', system-ui, sans-serif",
    habitat: "'Plus Jakarta Sans', system-ui, sans-serif",
    local: "'Inter', system-ui, sans-serif",
    feast: "'Plus Jakarta Sans', system-ui, sans-serif",
  };

  const styleVariables = {
    '--theme-primary': primary,
    '--theme-accent': accent,
    '--theme-background': background,
    '--theme-font-heading': fontHeadingMap[themeCode] || fontHeadingMap.atelier,
    '--theme-font-body': fontBodyMap[themeCode] || fontBodyMap.atelier,
  } as React.CSSProperties;

  return (
    <div
      style={styleVariables}
      className={`min-h-screen text-gray-900 transition-colors duration-200 theme-${themeCode} font-theme-body`}
    >
      {children}
    </div>
  );
};
