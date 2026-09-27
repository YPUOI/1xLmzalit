import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

interface ThemeToggleProps {
  variant?: 'mobile' | 'desktop';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'desktop',
  className = ''
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`h-[30px] w-[30px] min-w-[30px] sm:h-[32px] sm:w-[32px] sm:min-w-[32px] bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745] hover:border-[#4A5C6A] rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer select-none shrink-0 active:scale-95 ${className}`}
        title={isDark ? t('themeToggle') + ' (' + t('themeLight') + ')' : t('themeToggle') + ' (' + t('themeDark') + ')'}
        aria-label={t('themeToggle')}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-[#CCD0CF] shrink-0" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`h-[36px] px-3 bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white border border-[#253745] hover:border-[#4A5C6A] rounded-xl flex items-center gap-2 text-xs font-semibold transition-all duration-200 cursor-pointer select-none shrink-0 active:scale-[0.98] ${className}`}
      title={isDark ? t('themeToggle') + ' (' + t('themeLight') + ')' : t('themeToggle') + ' (' + t('themeDark') + ')'}
      aria-label={t('themeToggle')}
    >
      {isDark ? (
        <>
          <Moon className="w-3.5 h-3.5 text-[#CCD0CF] shrink-0" />
          <span className="font-semibold text-xs capitalize">{t('themeDark')}</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold text-xs capitalize">{t('themeLight')}</span>
        </>
      )}
    </button>
  );
};
