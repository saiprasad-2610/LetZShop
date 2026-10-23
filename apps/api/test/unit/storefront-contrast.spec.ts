import { FOUNDATIONAL_THEMES } from '../../../../packages/ui/src/themes';
import { storefrontColors, readableColor } from '../../../../packages/ui/src/storefront-colors';
import { getContrastRatio } from '../../../../packages/ui/src/tokens';

describe('storefront semantic contrast', () => {
  it.each(Object.keys(FOUNDATIONAL_THEMES))('%s has readable defaults and merchant overrides', key => {
    for (const custom of [{}, { background: '#111111', primary: '#111111', text: '#121212', muted: '#333333' }, { background: '#FFFFFF', primary: '#FFFF00', text: '#EEEEEE', muted: '#CCCCCC' }, { background: '#777777', primary: '#777777', accent: '#777777' }]) {
      const c = storefrontColors(FOUNDATIONAL_THEMES[key].palette, custom);
      for (const [text, bg] of [
        ['--store-text-primary', '--store-bg'], ['--store-text-secondary', '--store-bg'],
        ['--store-text-muted', '--store-bg'], ['--store-heading', '--store-bg'],
        ['--store-surface-text', '--store-surface'], ['--store-surface-muted', '--store-surface'],
        ['--store-button-text', '--store-button-bg'], ['--store-accent-foreground', '--store-accent'],
      ]) expect(getContrastRatio(c[text as keyof typeof c], c[bg as keyof typeof c])).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('preserves readable branding', () => { expect(readableColor('#205090', '#FFFFFF')).toBe('#205090'); });
  it('covers all twelve active archetypes', () => { expect(Object.keys(FOUNDATIONAL_THEMES)).toHaveLength(12); });
});
