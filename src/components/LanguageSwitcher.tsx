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
      className={`inline-flex items-center justify-center min-w-[28px] h-[19px] px-1 rounded-md font-mono font-black text-[9px] tracking-wider leading-none transition-all ${
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

  // Mobile Header button variant
  if (variant === 'header-mobile') {
    return (
      <div className={`relative inline-block shrink-0 ${className}`} dir="ltr">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className="h-[30px] px-1.5 sm:px-2 bg-[#071324] hover:bg-[#0c1f38] text-[#00E5FF] border border-[#00E5FF]/40 rounded-xl flex items-center gap-1 text-[11px] font-black transition cursor-pointer select-none shrink-0 active:scale-95 shadow-sm"
          title="Select Language / اختيار اللغة"
          aria-label="Select Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
          <span className="inline-flex items-center justify-center min-w-[26px] h-[18px] px-1 rounded font-mono font-black text-[9px] tracking-wider leading-none bg-[#0A162B] text-[#00E5FF] border border-[#00E5FF]/40">
            {currentMeta.code.toUpperCase()}
          </span>
          <ChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && typeof document !== 'undefined' && createPortal(
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[99998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Floating Selection Sheet / Modal */}
            <div 
              ref={dropdownRef}
              className="fixed top-14 right-2 sm:right-4 w-64 max-w-[calc(100vw-16px)] bg-[#081224] border border-[#00E5FF]/60 rounded-2xl shadow-2xl shadow-black p-3 z-[99999] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
              dir="ltr"
            >
              <div className="px-1 py-1 text-[11px] font-black uppercase text-[#94A3B8] tracking-wider border-b border-slate-800/80 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#00E5FF]">
                  <Globe className="w-4 h-4" />
                  <span>Select Language / اختيار اللغة</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {languageList.map((code) => {
                  const meta = LANGUAGES[code];
                  const isSelected = language === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleSelect(code)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition cursor-pointer select-none active:scale-98 min-h-[48px] ${
                        isSelected
                          ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/60 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                          : 'text-slate-200 hover:bg-slate-800/80 hover:text-white border border-slate-800/80 bg-[#060D1A]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {renderLangBadge(meta.code, isSelected)}
                        <div className="flex flex-col text-left">
                          <span className="font-black text-white text-xs leading-tight">{meta.nativeName}</span>
                          <span className="text-[10px] text-slate-400">{meta.name}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF]">
                          <Check className="w-4 h-4 stroke-[3]" />
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
        className="h-[36px] px-3 bg-[#071324] hover:bg-[#0c1f38] text-slate-200 hover:text-white border border-slate-700 hover:border-[#00E5FF]/60 rounded-full flex items-center gap-2 text-xs font-bold transition-all cursor-pointer select-none shrink-0 shadow-sm active:scale-95"
        title="تغيير اللغة / Switch Language / Changer de langue"
        aria-label="Switch Language"
      >
        <Globe className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
        {renderLangBadge(currentMeta.code, false)}
        <span className="font-semibold">{currentMeta.nativeName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
            className="fixed w-56 bg-[#081224] border border-[#00E5FF]/40 rounded-2xl shadow-2xl shadow-black/95 p-2 z-[99999] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
            dir="ltr"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-black uppercase text-[#94A3B8] tracking-wider border-b border-slate-800/80 mb-1.5 flex items-center justify-between">
              <span>Language / اللغة</span>
              <Globe className="w-3.5 h-3.5 text-[#00E5FF]" />
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer select-none active:scale-98 ${
                      isSelected
                        ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50 shadow-sm'
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
        </>,
        document.body
      )}
    </div>
  );
};
