import { SupportedLocale } from '../registry';
import { enIN, TranslationDictionary } from './en-IN';
import { mrIN } from './mr-IN';
import { hiIN } from './hi-IN';
import { guIN } from './gu-IN';
import { knIN } from './kn-IN';
import { taIN } from './ta-IN';
import { teIN } from './te-IN';
import { bnIN } from './bn-IN';
import { mlIN } from './ml-IN';
import { paIN } from './pa-IN';

export * from './en-IN';
export * from './mr-IN';
export * from './hi-IN';
export * from './gu-IN';
export * from './kn-IN';
export * from './ta-IN';
export * from './te-IN';
export * from './bn-IN';
export * from './ml-IN';
export * from './pa-IN';

export const DICTIONARIES: Record<SupportedLocale, TranslationDictionary> = {
  'en-IN': enIN,
  'mr-IN': mrIN,
  'hi-IN': hiIN,
  'gu-IN': guIN,
  'kn-IN': knIN,
  'ta-IN': taIN,
  'te-IN': teIN,
  'bn-IN': bnIN,
  'ml-IN': mlIN,
  'pa-IN': paIN,
};

export function getDictionary(locale: SupportedLocale): TranslationDictionary {
  return DICTIONARIES[locale] || enIN;
}
