/**
 * next-intl Configuration
 *
 * Internationalization configuration for multiple languages
 * Supports: English, German, French, Spanish, Italian
 */

export const locales = ["en", "de", "fr", "es", "it"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
};

export const localeRegions: Record<Locale, string> = {
  en: "US",
  de: "DE",
  fr: "FR",
  es: "ES",
  it: "IT",
};

export const localeCurrencies: Record<Locale, string> = {
  en: "USD",
  de: "EUR",
  fr: "EUR",
  es: "EUR",
  it: "EUR",
};

/**
 * Get locale flag emoji
 */
export function getLocaleFlag(locale: Locale): string {
  const flags: Record<Locale, string> = {
    en: "🇺🇸",
    de: "🇩🇪",
    fr: "🇫🇷",
    es: "🇪🇸",
    it: "🇮🇹",
  };
  return flags[locale];
}

/**
 * Get locale name with flag
 */
export function getLocaleLabel(locale: Locale): string {
  const flag = getLocaleFlag(locale);
  const name = localeNames[locale];
  return `${flag} ${name}`;
}

/**
 * Get supported locales for select
 */
export function getSupportedLocales(): Array<{
  value: Locale;
  label: string;
  flag: string;
}> {
  return locales.map((locale) => ({
    value: locale,
    label: localeNames[locale],
    flag: getLocaleFlag(locale),
  }));
}

/**
 * Get RTL (right-to-left) locales
 */
export function isRTL(locale: Locale): boolean {
  return false; // None of our target languages are RTL
}

/**
 * Get locale direction
 */
export function getLocaleDirection(locale: Locale): "ltr" | "rtl" {
  return isRTL(locale) ? "rtl" : "ltr";
}
