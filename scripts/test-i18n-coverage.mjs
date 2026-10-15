import { validateAllLocalesCoverage, SUPPORTED_LOCALES } from '../packages/i18n/dist/index.js';

console.log('==================================================');
console.log('LETZSHOP I18N TRANSLATION COVERAGE AUDIT');
console.log('==================================================\n');

const results = validateAllLocalesCoverage();
let hasErrors = false;

for (const locale of SUPPORTED_LOCALES) {
  const r = results[locale];
  console.log(`Locale: ${locale.padEnd(8)} | Coverage: ${String(r.coveragePercentage).padStart(3)}% (${r.translatedKeys}/${r.totalKeys} keys)`);
  if (r.missingKeys.length > 0 && (locale === 'en-IN' || locale === 'mr-IN' || locale === 'hi-IN')) {
    console.warn(`  ⚠️ Missing in ${locale}:`, r.missingKeys.slice(0, 10));
    hasErrors = true;
  }
}

console.log('\n==================================================');
if (hasErrors) {
  console.error('❌ Coverage check failed for core locales.');
  process.exit(1);
} else {
  console.log('✅ Core locales have 100% key coverage with fallback safety.');
  process.exit(0);
}
