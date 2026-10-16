// Legacy Pulse configurations named an unavailable font; keep their actual
// Space Grotesk rendering and expose the same name in the editor.
export function resolveStorefrontFont(value: string): string {
  return value === 'Cabinet Grotesk' ? 'Space Grotesk' : value;
}

export const STOREFRONT_FONT_FAMILIES: Record<string, { heading: string; body: string }> = {
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
  'Noto Sans Devanagari': {
    heading: "'Noto Sans Devanagari', system-ui, sans-serif",
    body: "'Noto Sans Devanagari', system-ui, sans-serif",
  },
  'Noto Serif Devanagari': {
    heading: "'Noto Serif Devanagari', Georgia, serif",
    body: "'Noto Serif Devanagari', 'Plus Jakarta Sans', system-ui, sans-serif",
  },
};
