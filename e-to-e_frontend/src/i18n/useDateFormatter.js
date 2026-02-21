import { useTranslation } from 'react-i18next';
import {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatRelativeTime,
  formatTime,
  formatMonthYear,
  getDateFormatPattern,
} from './dateFormatter';

/**
 * React hook for locale-aware date formatting
 * Automatically uses the current i18n language
 * 
 * @returns {Object} Date formatting functions
 * 
 * @example
 * const { formatDate, formatDateTime } = useDateFormatter();
 * const formattedDate = formatDate(new Date());
 * const formattedDateTime = formatDateTime(new Date());
 */
export const useDateFormatter = () => {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;

  return {
    /**
     * Format a date according to the current locale
     * @param {Date|string|number} date - The date to format
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date string
     */
    formatDate: (date, options) => formatDate(date, currentLocale, options),

    /**
     * Format a date as short format
     * @param {Date|string|number} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDateShort: (date) => formatDateShort(date, currentLocale),

    /**
     * Format a date with time
     * @param {Date|string|number} date - The date to format
     * @returns {string} Formatted date and time string
     */
    formatDateTime: (date) => formatDateTime(date, currentLocale),

    /**
     * Format a relative time (e.g., "2 hours ago")
     * @param {Date|string|number} date - The date to format
     * @returns {string} Relative time string
     */
    formatRelativeTime: (date) => formatRelativeTime(date, currentLocale),

    /**
     * Format a time only (HH:MM)
     * @param {Date|string|number} date - The date to format
     * @returns {string} Formatted time string
     */
    formatTime: (date) => formatTime(date, currentLocale),

    /**
     * Format a month and year
     * @param {Date|string|number} date - The date to format
     * @returns {string} Formatted month and year string
     */
    formatMonthYear: (date) => formatMonthYear(date, currentLocale),

    /**
     * Get the date format pattern for the current locale
     * @returns {string} Date format pattern
     */
    getDateFormatPattern: () => getDateFormatPattern(currentLocale),

    /**
     * Current locale code
     */
    locale: currentLocale,
  };
};

export default useDateFormatter;
