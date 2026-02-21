import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Initialize i18next with plugins and configuration
i18n
  // Load translation files via HTTP
  .use(HttpBackend)
  // Detect user language from localStorage or browser
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language when translation is missing
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['en', 'hi', 'mr', 'te', 'kn'],
    
    // Default namespace to use
    defaultNS: 'common',
    
    // Available namespaces
    ns: ['common', 'navigation', 'forms', 'errors', 'dashboard'],
    
    // Language detection configuration
    detection: {
      // Order of detection methods: localStorage first, then browser navigator
      order: ['localStorage', 'navigator'],
      
      // Cache user language preference in localStorage
      caches: ['localStorage'],
      
      // localStorage key name
      lookupLocalStorage: 'i18nextLng',
    },
    
    // HTTP backend configuration for lazy loading
    backend: {
      // Path to translation files
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      
      // Request options
      requestOptions: {
        cache: 'default',
      },
    },
    
    // Interpolation configuration
    interpolation: {
      // React already escapes values, so we don't need i18next to do it
      escapeValue: false,
    },
    
    // Save missing translation keys (useful in development)
    saveMissing: process.env.NODE_ENV === 'development',
    
    // Handle missing translation keys
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      // Log warnings in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `Missing translation: ${ns}:${key} for languages: ${lngs.join(', ')}`
        );
      }
    },
    
    // React specific options
    react: {
      // Use Suspense for async loading
      useSuspense: false,
    },
  });

// Error handling for translation file loading failures
i18n.on('failedLoading', (lng, ns, msg) => {
  console.error(`Failed to load ${lng}/${ns}: ${msg}`);
  
  // Fallback to English if loading fails for another language
  if (lng !== 'en' && i18n.language !== 'en') {
    console.warn(`Falling back to English due to loading failure`);
    i18n.changeLanguage('en');
  }
});

// Log successful initialization in development
if (process.env.NODE_ENV === 'development') {
  i18n.on('initialized', (options) => {
    console.log('i18next initialized with language:', i18n.language);
  });
}

export default i18n;
