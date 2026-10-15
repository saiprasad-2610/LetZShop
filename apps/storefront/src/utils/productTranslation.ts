/**
 * Helper to resolve product translation matching exact locale (e.g. 'mr-IN')
 * or matching base language (e.g. 'mr').
 */
export function getProductTranslation(translations?: any[] | null, locale?: string | null) {
  if (!translations || !translations.length || !locale) return null;
  const target = locale.toLowerCase().replace('_', '-');
  const targetBase = target.split('-')[0];

  return (
    translations.find((tr: any) => {
      if (!tr?.locale) return false;
      const cur = tr.locale.toLowerCase().replace('_', '-');
      return cur === target;
    }) ||
    translations.find((tr: any) => {
      if (!tr?.locale) return false;
      const cur = tr.locale.toLowerCase().replace('_', '-');
      return cur.split('-')[0] === targetBase;
    }) ||
    null
  );
}
