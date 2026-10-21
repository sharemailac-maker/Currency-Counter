import { TranslationDictionary, LanguageCode } from '../types';
import { en } from './en';
import { hi } from './hi';
import { gu } from './gu';
import { mr } from './mr';
import { bn } from './bn';
import { ta } from './ta';
import { te } from './te';
import { kn } from './kn';
import { pa } from './pa';
import { es } from './es';
import { fr } from './fr';
import { ar } from './ar';

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en,
  hi,
  gu,
  mr,
  bn,
  ta,
  te,
  kn,
  pa,
  es,
  fr,
  ar,
};

export { en, hi, gu, mr, bn, ta, te, kn, pa, es, fr, ar };
