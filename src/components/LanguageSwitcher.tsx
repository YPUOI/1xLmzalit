import React, { useState, useRef, useEffect } from 'react';
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
      className={`inline-flex items-center justify-center min-w-[30px] h-[20px] px-1.5 rounded-md font-mono font-black text-[10px] tracking-wider leading-none transition-all ${
        isSelected
          ? 'bg-[#00E5FF] text-[#050B14] font-black shadow-[0_0_8px_rgba(0,229,255,0.4)]'
          : 'bg-[#0A162B] text-[#00E5FF] border border-[#00E5FF]/40'
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const languageList: Language[] = ['ar', 'fr', 'en'];

  // Mobile Header button variant
  if (variant === 'header-mobile') {
    return (
      <div className={`relative inline-block ${className}`} ref={containerRef} dir="ltr">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-[34px] px-2.5 bg-[#071324] hover:bg-[#0c1f38] text-[#00E5FF] border border-[#00E5FF]/40 rounded-xl flex items-center gap-1.5 text-xs font-black transition cursor-pointer select-none shrink-0 active:scale-95 shadow-sm"
          title="Select Language / اختيار اللغة"
          aria-label="Select Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
          {renderLangBadge(currentMeta.code, false)}
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop to guarantee touch outside works on all mobile browsers */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown positioned clearly on mobile */}
            <div className="fixed top-14 right-2 sm:right-4 w-56 bg-[#081224] border border-[#00E5FF]/50 rounded-2xl shadow-2xl shadow-black/95 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
              <div className="px-2.5 py-1.5 text-[11px] font-black uppercase text-[#94A3B8] tracking-wider border-b border-slate-800/80 mb-1.5 flex items-center justify-between">
                <span>Select Language</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-md"
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer select-none active:scale-98 min-h-[44px] ${
                        isSelected
                          ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {renderLangBadge(meta.code, isSelected)}
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-white leading-tight">{meta.nativeName}</span>
                          <span className="text-[10px] text-slate-400">{meta.name}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Gate variant (in SecurityGate)
  if (variant === 'gate') {
    return (
      <div className={`relative inline-block ${className}`} ref={containerRef} dir="ltr">
        <div className="flex items-center gap-1.5 bg-[#061020]/90 p-1.5 rounded-2xl border border-slate-800/90 shadow-lg backdrop-blur-md">
          {languageList.map((code) => {
            const meta = LANGUAGES[code];
            const isSelected = language === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer select-none active:scale-95 ${
                  isSelected
                    ? 'bg-[#00E5FF] text-slate-950 shadow-[0_0_12px_rgba(0,229,255,0.4)] font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
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

  // Desktop Header variant (default)
  return (
    <div className={`relative inline-block ${className}`} ref={containerRef} dir="ltr">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-[36px] px-3 bg-[#071324] hover:bg-[#0c1f38] text-slate-200 hover:text-white border border-slate-700 hover:border-[#00E5FF]/60 rounded-full flex items-center gap-2 text-xs font-bold transition-all cursor-pointer select-none shrink-0 shadow-sm active:scale-95"
        title="تغيير اللغة / Switch Language / Changer de langue"
        aria-label="Switch Language"
      >
        <Globe className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
        {renderLangBadge(currentMeta.code, false)}
        <span className="font-semibold">{currentMeta.nativeName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-[#081224]/95 border border-[#00E5FF]/40 rounded-2xl shadow-2xl shadow-black/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase text-[#94A3B8] tracking-wider border-b border-slate-800/80 mb-1 flex items-center justify-between">
            <span>Language / اللغة</span>
            <Globe className="w-3 h-3 text-[#00E5FF]" />
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {renderLangBadge(meta.code, isSelected)}
                    <div className="flex flex-col text-left">
                      <span className="leading-tight text-white font-bold">{meta.nativeName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{meta.name}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
