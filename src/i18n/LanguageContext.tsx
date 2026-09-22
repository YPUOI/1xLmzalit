import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, LANGUAGES, translations, TranslationKey } from './translations';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: 'rtl' | 'ltr';
  isRtl: boolean;
  currentMeta: typeof LANGUAGES[Language];
}

const STORAGE_KEY = 'cl_app_language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved && (saved === 'ar' || saved === 'fr' || saved === 'en')) {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    return 'ar'; // Default language is Arabic
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    const dir = LANGUAGES[language].dir;
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: TranslationKey): string => {
    const langDict = translations[language] || translations.ar;
    return langDict[key] || translations.ar[key] || key;
  };

  const dir = LANGUAGES[language].dir;
  const isRtl = dir === 'rtl';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir,
        isRtl,
        currentMeta: LANGUAGES[language]
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
