/**
 * Locale-aware date formatting utility
 * Formats dates according to the active language's conventions
 */

/**
 * Format a date according to the current locale
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale code (en, hi, mr, te, kn)
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, locale = 'en', options = {}) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Default options for date formatting
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    // Fallback to English if formatting fails
    return new Intl.DateTimeFormat('en', defaultOptions).format(dateObj);
  }
};

/**
 * Format a date as short format (DD/MM/YYYY for Indian locales, MM/DD/YYYY for English)
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale code
 * @returns {string} Formatted date string
 */
export const formatDateShort = (date, locale = 'en') => {
  return formatDate(date, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Format a date with time
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale code
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, locale = 'en') => {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale code
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date, locale = 'en') => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    // Determine the appropriate unit
    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (Math.abs(diffInSeconds) < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (Math.abs(diffInSeconds) < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  } catch (error) {
    console.error('Relative time formatting error:', error);
    // Fallback to simple format
    return formatDate(dateObj, locale);
  }
};

/**
 * Format a time only (HH:MM)
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale code
 * @returns {string} Formatted time string
 */
export const formatTime = (date, locale = 'en') => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Time formatting error:', error);
    return new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  }
};

/**
 * Format a month and year (e.g., "January 2024")
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale code
 * @returns {string} Formatted month and year string
 */
export const formatMonthYear = (date, locale = 'en') => {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'long',
  });
};

/**
 * Get locale-specific date format pattern
 * @param {string} locale - The locale code
 * @returns {string} Date format pattern (e.g., "DD/MM/YYYY" or "MM/DD/YYYY")
 */
export const getDateFormatPattern = (locale = 'en') => {
  // Indian locales use DD/MM/YYYY format
  const indianLocales = ['hi', 'mr', 'te', 'kn'];
  
  if (indianLocales.includes(locale)) {
    return 'DD/MM/YYYY';
  }
  
  // English uses MM/DD/YYYY format
  return 'MM/DD/YYYY';
};

export default {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatRelativeTime,
  formatTime,
  formatMonthYear,
  getDateFormatPattern,
};
