import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Check, ChevronDown, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Language, LANGUAGES } from '../i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'header' | 'header-desktop' | 'header-mobile' | 'gate' | 'compact';
  className?: string;
}

/**
 * Standardized language badge component - identical sleek styling across ALL languages
 */
export const renderLangBadge = (code: Language, isSelected: boolean = false, className = '') => {
  const label = code.toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[28px] h-[19px] px-1 rounded-md font-mono font-bold text-[9px] tracking-wider leading-none transition-all duration-200 ${
        isSelected
          ? 'bg-[#CCD0CF] text-[#06141B] font-bold'
          : 'bg-[#11212D] text-[#CCD0CF] border border-[#253745]'
      } ${className}`}
    >
      {label}
    </span>
  );
};

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'header-desktop',
  className = ''
}) => {
  const { language, setLanguage, currentMeta } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);

  // Update coords when opening
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 6,
        right: Math.max(10, window.innerWidth - rect.right)
      });
    }
    setIsOpen(prev => !prev);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) || 
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const languageList: Language[] = ['ar', 'fr', 'en'];

  // Gate variant (in SecurityGate) - renders inline
  if (variant === 'gate') {
    return (
      <div className={`relative inline-block ${className}`} dir="ltr">
        <div className="flex items-center gap-1.5 bg-[#11212D] p-1.5 rounded-xl border border-[#253745] shadow-lg">
          {languageList.map((code) => {
            const meta = LANGUAGES[code];
            const isSelected = language === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#CCD0CF] text-[#06141B] font-bold'
                    : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#253745]'
                }`}
              >
                {renderLangBadge(meta.code, isSelected)}
                <span>{meta.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Mobile Header button variant
  if (variant === 'header-mobile') {
    return (
      <div className={`relative inline-block shrink-0 ${className}`} dir="ltr">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className="h-[32px] px-2 bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745] hover:border-[#4A5C6A] rounded-xl flex items-center gap-1 text-[11px] font-bold transition-all duration-200 cursor-pointer select-none shrink-0 active:scale-95"
          title="Select Language / اختيار اللغة"
          aria-label="Select Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#CCD0CF] shrink-0" />
          <ChevronDown className={`w-2.5 h-2.5 text-[#9BA8AB] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && typeof document !== 'undefined' && createPortal(
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[99998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Floating Selection Sheet / Modal */}
            <div 
              ref={dropdownRef}
              className="fixed top-14 right-2 sm:right-4 w-64 max-w-[calc(100vw-16px)] bg-[#11212D] border border-[#253745] rounded-2xl shadow-2xl p-3 z-[99999] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
              dir="ltr"
            >
              <div className="px-1 py-1 text-[11px] font-bold uppercase text-[#9BA8AB] tracking-wider border-b border-[#253745] mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#CCD0CF]">
                  <Globe className="w-3.5 h-3.5 text-[#CCD0CF]" />
                  <span>Language / اللغة</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#9BA8AB] hover:text-[#CCD0CF] rounded-lg hover:bg-[#253745] cursor-pointer transition-colors duration-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                {languageList.map((code) => {
                  const meta = LANGUAGES[code];
                  const isSelected = language === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleSelect(code)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
                        isSelected
                          ? 'bg-[#4A5C6A] text-[#CCD0CF] border border-[#4A5C6A]'
                          : 'text-[#CCD0CF] hover:bg-[#253745] hover:text-white border border-[#253745] bg-[#06141B]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {renderLangBadge(meta.code, isSelected)}
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-[#CCD0CF] text-xs leading-tight">{meta.nativeName}</span>
                          <span className="text-[10px] text-[#9BA8AB]">{meta.name}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#CCD0CF] flex items-center justify-center text-[#06141B]">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    );
  }

  // Desktop Header variant (default)
  return (
    <div className={`relative inline-block ${className}`} dir="ltr">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="h-[36px] px-3 bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white border border-[#253745] hover:border-[#4A5C6A] rounded-xl flex items-center gap-2 text-xs font-semibold transition-all duration-200 cursor-pointer select-none shrink-0 active:scale-[0.98]"
        title="تغيير اللغة / Switch Language / Changer de langue"
        aria-label="Switch Language"
      >
        <Globe className="w-3.5 h-3.5 text-[#CCD0CF] shrink-0" />
        {renderLangBadge(currentMeta.code, false)}
        <span className="font-semibold text-xs text-[#CCD0CF]">{currentMeta.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-[#9BA8AB] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop to capture clicks outside */}
          <div 
            className="fixed inset-0 z-[99998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Desktop dropdown floating menu */}
          <div 
            ref={dropdownRef}
            style={menuCoords ? { top: menuCoords.top, right: menuCoords.right } : { top: 56, right: 24 }}
            className="fixed w-52 bg-[#11212D] border border-[#253745] rounded-xl shadow-2xl p-2 z-[99999] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
            dir="ltr"
          >
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-[#9BA8AB] tracking-wider border-b border-[#253745] mb-1.5 flex items-center justify-between">
              <span>Language / اللغة</span>
              <Globe className="w-3 h-3 text-[#CCD0CF]" />
            </div>
            <div className="space-y-1">
              {languageList.map((code) => {
                const meta = LANGUAGES[code];
                const isSelected = language === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelect(code)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#4A5C6A] text-[#CCD0CF] border border-[#4A5C6A]'
                        : 'text-[#9BA8AB] hover:bg-[#253745] hover:text-[#CCD0CF] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {renderLangBadge(meta.code, isSelected)}
                      <div className="flex flex-col text-left">
                        <span className="leading-tight text-[#CCD0CF] font-semibold text-xs">{meta.nativeName}</span>
                        <span className="text-[10px] text-[#9BA8AB]">{meta.name}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#CCD0CF] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
