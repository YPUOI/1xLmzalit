import React from 'react';
import { 
  Trophy, 
  RotateCw, 
  User, 
  UserPlus,
  ShieldAlert, 
  LogOut, 
  Star,
  Sparkles,
  Fingerprint
} from 'lucide-react';
import { AppUser } from '../types';
import { XlmzalitLogo } from './XlmzalitLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

interface UclHeaderProps {
  currentUser: AppUser | null;
  onOpenAuth: (roleOrTab: 'user' | 'admin' | 'login' | 'signup' | 'forgot') => void;
  onLogout: () => void;
  onLockApp?: () => void;
  onOpenSecurityModal: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const UclHeader: React.FC<UclHeaderProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenSecurityModal,
  activeTab,
  onSelectTab
}) => {
  const { t, isRtl } = useLanguage();

  return (
    <header className="ucl-header-bg sticky top-0 z-40 shadow-xl shadow-black/40 w-full max-w-full">
      
      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (< md): Clean 3-part construction                            */}
      {/* Left: 1xlmzalit v1.0 | Center: User Auth & Language | Right: UCL 26/27    */}
      {/* ========================================================================= */}
      <div 
        className="flex md:hidden justify-between items-center w-full px-3.5 sm:px-4 py-2 gap-1 sm:gap-1.5 max-w-full" 
        dir="ltr"
        style={{
          paddingLeft: 'max(0.875rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(0.875rem, env(safe-area-inset-right, 0px))'
        }}
      >
        {/* Left: 1xlmzalit Logo + v1.0 */}
        <div 
          className="flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none shrink-0" 
          onClick={() => onSelectTab('home')}
          title="1xlmzalit v1.0"
        >
          <XlmzalitLogo variant="light" size="sm" className="shrink-0" />
          <div className="bg-[#253745] border border-[#4A5C6A] px-1.5 py-0.5 rounded-md flex items-center justify-center shrink-0">
            <span className="text-[8.5px] sm:text-[9px] font-bold text-[#CCD0CF] font-mono tracking-wider">
              v1.0
            </span>
          </div>
        </div>

        {/* Center: User Auth Button + Language Switcher (No text name/admin label on mobile per design specs) */}
        <div className="flex items-center gap-1 sm:gap-1.5 justify-center shrink min-w-0">
          {currentUser ? (
            <div 
              className="flex items-center gap-1.5 bg-[#11212D] border border-[#253745] px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 h-[30px] sm:h-[32px] text-[#CCD0CF]"
              title={`${currentUser.username} (${currentUser.role === 'admin' ? t('adminBadge') : t('memberBadge')})`}
            >
              {currentUser.role === 'admin' ? (
                <ShieldAlert className="w-3.5 h-3.5 text-[#CCD0CF] shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-[#CCD0CF] shrink-0" />
              )}
              <button 
                onClick={onLogout} 
                className="text-[#9BA8AB] hover:text-[#CCD0CF] transition-colors p-0.5 cursor-pointer flex items-center justify-center" 
                title={t('logout')}
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onOpenAuth('login')}
              className="bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold text-xs h-[30px] sm:h-[32px] px-2.5 sm:px-3 rounded-full flex items-center gap-1 shrink-0 active:scale-95 transition-all duration-200 cursor-pointer"
              title={t('quickLogin')}
            >
              <User className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-xs font-bold leading-none">+</span>
            </button>
          )}

          {/* Language Switcher Badge */}
          <LanguageSwitcher variant="header-mobile" />

          {/* Theme Mode Toggle (Mobile: Symbol only next to Language selection) */}
          <ThemeToggle variant="mobile" />
        </div>

        {/* Right: UCL 26/27 Tournament Badge (Guaranteed safe margin so it never touches mobile screen edge) */}
        <div 
          onClick={() => onSelectTab('home')}
          className="bg-[#11212D] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-all duration-200 select-none mr-1 sm:mr-0 shadow-sm"
          title="UCL 2026/2027"
        >
          <span className="text-[9.5px] sm:text-[10px] font-bold text-[#CCD0CF] tracking-wider font-mono whitespace-nowrap">
            UCL 26/27
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PC / DESKTOP LAYOUT (md:flex): Exact 2-row layout with polished aesthetics */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col gap-2.5 max-w-7xl mx-auto px-4 py-3" dir="ltr">
        
        {/* Row 1: Brand & Tournament Banner */}
        <div className="flex justify-between items-center w-full" dir="ltr">
          {/* Top Left: 1xlmzalit Brand Vector Logo + v1.0 App Version */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none group min-w-0 shrink-0" 
            onClick={() => onSelectTab('home')}
            title="1xlmzalit - v1.0"
          >
            <XlmzalitLogo variant="light" size="lg" className="shrink-0 group-hover:opacity-90 transition-opacity" />

            <div className="bg-[#253745] border border-[#4A5C6A] px-2 py-0.5 rounded-md flex items-center justify-center shrink-0 select-none">
              <span className="text-xs font-bold text-[#CCD0CF] tracking-wider font-mono">
                v1.0
              </span>
            </div>
          </div>

          {/* Top Right: Tournament Title */}
          <div 
            onClick={() => onSelectTab('home')}
            className="bg-[#11212D] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 select-none"
            title={t('tournamentTitle')}
          >
            <span className="text-[#CCD0CF] text-xs font-semibold tracking-wide whitespace-nowrap">
              {t('tournamentTitle')}
            </span>
          </div>
        </div>

        {/* Row 2: Controls, Auth status, and Language Switcher */}
        <div className="flex justify-between items-center w-full gap-3" dir="ltr">
          
          {/* Left Side: Auth Controls / User Status */}
          {currentUser ? (
            <div className="h-[36px] flex items-center gap-2.5 bg-[#11212D] border border-[#253745] px-3.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap text-[#CCD0CF]" dir={isRtl ? 'rtl' : 'ltr'}>
              {currentUser.role === 'admin' ? (
                <ShieldAlert className="w-4 h-4 text-[#CCD0CF] shrink-0" />
              ) : (
                <User className="w-4 h-4 text-[#CCD0CF] shrink-0" />
              )}
              <span className="max-w-[140px] truncate text-[#CCD0CF]">
                {currentUser.username} <span className="text-[#9BA8AB] font-normal">({currentUser.role === 'admin' ? t('adminBadge') : t('memberBadge')})</span>
              </span>
              <button 
                onClick={onLogout}
                className="text-[#9BA8AB] hover:text-[#CCD0CF] ml-1 p-1 rounded-md hover:bg-[#253745] transition-colors duration-200 shrink-0 cursor-pointer" 
                title={t('logout')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-nowrap shrink-0" dir={isRtl ? 'rtl' : 'ltr'}>
              {/* Button 1: Member Login */}
              <button 
                onClick={() => onOpenAuth('login')}
                className="h-[36px] bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold text-xs px-4 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98]"
              >
                <span>{t('memberLogin')}</span>
                <User className="w-4 h-4 text-[#06141B] shrink-0" />
              </button>

              {/* Button 2: Sign Up */}
              <button 
                onClick={() => onOpenAuth('signup')}
                title={t('newAccount')}
                className="h-[36px] bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745] hover:border-[#4A5C6A] font-semibold text-xs px-3.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98]"
              >
                <span>{t('newAccount')}</span>
                <UserPlus className="w-4 h-4 text-[#CCD0CF] shrink-0" />
              </button>

              {/* Button 3: Admin */}
              <button 
                onClick={() => onOpenAuth('admin')}
                className="h-[36px] bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745] hover:border-[#4A5C6A] font-semibold text-xs px-3.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98]"
              >
                <span>{t('admin')}</span>
                <ShieldAlert className="w-4 h-4 text-[#CCD0CF] shrink-0" />
              </button>
            </div>
          )}

          {/* Right Side: [Theme Toggle] [Language Switcher] [Fingerprint Button] */}
          <div className="flex items-center gap-2 shrink-0 select-none" dir="ltr">
            {/* Theme Mode Toggle (Desktop: Next to Language selector with words) */}
            <ThemeToggle variant="desktop" />

            {/* Language Switcher */}
            <LanguageSwitcher variant="header-desktop" />

            {/* Fingerprint Security Settings */}
            <button
              onClick={onOpenSecurityModal}
              title={t('securitySettingsTitle')}
              aria-label={t('securitySettingsTitle')}
              className="h-[36px] px-3 bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] rounded-xl border border-[#253745] hover:border-[#4A5C6A] transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer active:scale-[0.98]"
            >
              <Fingerprint className="w-4 h-4 text-[#CCD0CF] shrink-0" />
            </button>
          </div>

        </div>

      </div>

      {/* Role Portal Banner */}
      {currentUser && (
        <div className="max-w-7xl mx-auto px-4 pb-2.5">
          {currentUser.role === 'admin' ? (
            <div className="p-2.5 rounded-xl bg-[#11212D] border border-[#253745] text-[#CCD0CF] flex items-center justify-between text-xs font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4A5C6A] animate-pulse" />
                <span>{t('adminPortalActive')} <span className="text-[#9BA8AB]">·</span> {currentUser.username}</span>
              </div>
              <button 
                onClick={() => onSelectTab('admin')} 
                className="bg-[#4A5C6A] hover:bg-[#4A5C6A]/80 text-[#CCD0CF] border border-[#253745] text-[11px] font-bold px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer"
              >
                {t('controlPanelBtn')}
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#11212D] border border-[#253745] text-[#CCD0CF] flex items-center justify-between text-xs font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4A5C6A]" />
                <span>{t('membersZoneActive')} <span className="text-[#9BA8AB]">·</span> {currentUser.username}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#CCD0CF] font-bold">
                <Star className="w-3.5 h-3.5 fill-[#CCD0CF]" />
                <span className="font-mono">{currentUser.points || 0}</span>
                <span className="text-[11px] font-normal text-[#9BA8AB]">{t('pointsCount')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
