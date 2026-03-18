import { ru } from './ru';
import { kz } from './kz';
import { en } from './en';

export const TRANSLATIONS = { ru, kz, en };

export function t(key, lang, vars = {}) {
  const str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['ru']?.[key] ?? key;
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), str);
}