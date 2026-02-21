import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = ({ variant = 'dropdown', showLabels = true }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' }
  ];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setCurrentLanguage(languageCode);
    setIsOpen(false);
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  if (variant === 'dropdown') {
    return (
      <div className="language-switcher">
        <button
          className="language-switcher__button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select language"
          aria-expanded={isOpen}
        >
          {showLabels ? getCurrentLanguage().nativeName : getCurrentLanguage().code.toUpperCase()}
          <span className={`language-switcher__arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>
        
        {isOpen && (
          <div className="language-switcher__dropdown">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`language-switcher__option ${
                  currentLanguage === language.code ? 'active' : ''
                }`}
                onClick={() => handleLanguageChange(language.code)}
                aria-label={`Switch to ${language.name}`}
              >
                {language.nativeName}
                {currentLanguage === language.code && (
                  <span className="language-switcher__checkmark">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default LanguageSwitcher;
