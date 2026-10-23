export const LANDING_ANCHORS = { features: 'features', themes: 'themes', journey: 'how-it-works', customize: 'customize', pricing: 'pricing', faq: 'faq' } as const;

export function scrollToLandingAnchor(hash: string) {
  const target = document.getElementById(hash.replace(/^#/, ''));
  if (!target) return;
  history.replaceState(null, '', hash);
  target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
