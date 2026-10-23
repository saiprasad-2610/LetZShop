import { getContrastRatio, normalizeHexColor } from './tokens';
import { ThemePalette } from './themes';

/** Preserve a selected color when readable; otherwise use the nearest safe role. */
export function readableColor(candidate: string, background: string, minimum = 4.5): string {
  const color = normalizeHexColor(candidate);
  if (color && getContrastRatio(color, background) >= minimum) return color;
  return getContrastRatio('#FFFFFF', background) >= getContrastRatio('#000000', background) ? '#FFFFFF' : '#000000';
}

// Derived once per palette change by ThemeWrapper, never during a product loop.
export function storefrontColors(palette: ThemePalette, custom: Partial<ThemePalette> = {}) {
  const value = (key: keyof ThemePalette) => normalizeHexColor(custom[key]) || palette[key];
  const background = value('background');
  const isDark = getContrastRatio('#FFFFFF', background) > getContrastRatio('#000000', background);
  const surface = normalizeHexColor(custom.surface) || (custom.background && isDark ? '#18181B' : palette.surface);
  const primary = value('primary'), accent = value('accent');
  const text = readableColor(value('text'), background);
  const muted = readableColor(value('muted'), background);
  return {
    '--store-bg': background, '--store-surface': surface,
    '--store-text-primary': text, '--store-heading': text,
    '--store-text-secondary': muted, '--store-text-muted': muted,
    '--store-surface-text': readableColor(value('text'), surface),
    '--store-surface-muted': readableColor(value('muted'), surface),
    '--store-border': value('border'), '--store-accent': accent,
    '--store-danger-text': readableColor('#B91C1C', surface),
    '--store-accent-foreground': readableColor('#FFFFFF', accent),
    '--store-button-bg': primary, '--store-button-text': readableColor('#FFFFFF', primary),
    '--store-overlay-bg': 'rgba(0, 0, 0, 0.76)', '--store-overlay-text': '#FFFFFF',
    '--store-footer-bg': '#111827', '--store-footer-text': '#FFFFFF', '--store-footer-muted': '#D1D5DB',
  };
}
