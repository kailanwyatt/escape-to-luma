import en from './en.json';

export type TranslationKey = keyof typeof en;
export type TranslationValues = Record<string, string | number | boolean | null | undefined>;
/** English is the initial locale. Interpolation uses a callback so values containing $ are safe. */
export function t(key: TranslationKey, values: TranslationValues = {}): string {
  return en[key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name] ?? '') : placeholder);
}

/** Use at rendering boundaries only. Never localize IDs stored in saves or used by physics. */
export function displayLabel(value: string): string {
  const key = `labels.${value.replace(/ /g, '_')}`;
  return Object.prototype.hasOwnProperty.call(en, key) ? t(key as TranslationKey) : value;
}
