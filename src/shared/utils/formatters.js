import * as Localization from 'expo-localization';

/**
 * Get current locale (e.g. 'tr-TR', 'en-US')
 * Uses expo-localization to dynamically detect locale.
 */
const getCurrentLocale = () => {
  return Localization.getLocales()[0]?.languageTag || 'tr-TR';
};

/**
 * Formats a number as currency based on the current locale.
 * Defaults to TRY if the locale is Turkish, otherwise USD.
 *
 * @param {number} value The number to format
 * @param {string} [currencyCode] The currency code (e.g. 'TRY', 'USD'). Auto-detected if not provided.
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (value, currencyCode) => {
  const locale = getCurrentLocale();
  const defaultCurrency = locale.startsWith('tr') ? 'TRY' : 'USD';
  const currency = currencyCode || defaultCurrency;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * Formats a date based on the current locale.
 *
 * @param {Date | string | number} date The date to format
 * @param {Intl.DateTimeFormatOptions} [options] Formatting options
 * @returns {string} The formatted date string
 */
export const formatDate = (date, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
  const locale = getCurrentLocale();
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};
