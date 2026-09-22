import React from 'react';
import { 
  Trophy, 
  RotateCw, 
  User, 
  UserPlus,
  ShieldAlert, 
  LogOut, 
  Sliders, 
  Star,
  Sparkles,
  Fingerprint
} from 'lucide-react';
import { AppUser } from '../types';
import { XlmzalitLogo } from './XlmzalitLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface UclHeaderProps {
  currentUser: AppUser | null;
  onOpenAuth: (roleOrTab: 'user' | 'admin' | 'login' | 'signup') => void;
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
    <header className="ucl-header-bg border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-2xl shadow-2xl shadow-black/80">
      
      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (< md): Compact, single-row layout tailored for smartphones */}
      {/* ========================================================================= */}
      <div className="flex md:hidden justify-between items-center w-full px-2.5 sm:px-3 py-2 gap-2" dir="ltr">
        {/* Brand Group at Left: 1xlmzalit Logo + v1.0 badge + دوري أبطال أوروبا */}
        <div 
          className="flex items-center gap-1.5 cursor-pointer select-none shrink-0 min-w-0" 
          onClick={() => onSelectTab('home')}
          title="1xlmzalit"
        >
          <XlmzalitLogo variant="light" size="md" className="shrink-0" />
          <div className="bg-[#041E34] border border-[#00E5FF]/60 px-1.5 py-0.5 rounded-md flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-[10px] font-black text-[#00E5FF] tracking-wider font-mono">
              v1.0
            </span>
          </div>
          <span className="hidden xs:inline text-[#E2E8F0] text-xs font-bold whitespace-nowrap">
            {t('appSubtitle')}
          </span>
        </div>

        {/* Action Controls & Badges on Right in single line */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap shrink-0 overflow-x-auto no-scrollbar py-0.5" dir={isRtl ? 'rtl' : 'ltr'}>
          {currentUser ? (
            <div className="flex items-center gap-1 bg-[#071324] border border-slate-800 px-2 py-1 rounded-xl text-xs font-bold shrink-0">
              {currentUser.role === 'admin' ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="max-w-[70px] truncate text-[#E2E8F0]">{currentUser.username}</span>
              <button onClick={onLogout} className="text-[#94A3B8] hover:text-rose-400 p-0.5" title={t('logout')}>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
              <button 
                onClick={() => onOpenAuth('login')}
                className="bg-[#00E5FF] hover:bg-[#38bdf8] text-[#04101e] font-black text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm active:scale-95 transition"
              >
                <span>{t('quickLogin')}</span>
                <User className="w-3.5 h-3.5 text-[#04101e] shrink-0" />
              </button>
              <button 
                onClick={() => onOpenAuth('signup')}
                title={t('newAccount')}
                className="bg-[#071324] hover:bg-[#0c1f38] text-amber-400 border border-amber-500/70 p-1.5 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          )}

          {/* Language Switcher on mobile */}
          <LanguageSwitcher variant="header-mobile" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PC / DESKTOP LAYOUT (md:flex): Exact 2-row aligned layout requested by user */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col gap-2 max-w-7xl mx-auto px-4 py-2.5" dir="ltr">
        
        {/* Row 1: Top Row (1xlmzalit + v1.0 on Left, Tournament Title on Right) */}
        <div className="flex justify-between items-center w-full" dir="ltr">
          {/* Top Left: 1xlmzalit Brand Vector Logo + v1.0 App Version Tag */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none group min-w-0 shrink-0" 
            onClick={() => onSelectTab('home')}
            title="1xlmzalit - v1.0"
          >
            <XlmzalitLogo variant="light" size="lg" className="shrink-0 hover:scale-105 transition-transform" />

            <div className="bg-[#041E34] border border-[#00E5FF]/60 px-2 py-0.5 rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.25)] shrink-0 select-none">
              <span className="text-xs font-black text-[#00E5FF] tracking-wider font-mono">
                v1.0
              </span>
            </div>
          </div>

          {/* Top Right: Tournament Title */}
          <div 
            onClick={() => onSelectTab('home')}
            className="bg-[#061527]/90 hover:bg-[#0c1f36] border border-slate-800/90 hover:border-[#00E5FF]/40 px-4 py-1 rounded-2xl transition shadow-sm cursor-pointer flex items-center justify-center shrink-0 select-none"
            title={t('tournamentTitle')}
          >
            <span className="text-white text-sm font-bold tracking-wide whitespace-nowrap">
              {t('tournamentTitle')}
            </span>
          </div>
        </div>

        {/* Row 2: In the EXACT same line with the EXACT same height without changing places */}
        <div className="flex justify-between items-center w-full gap-2" dir="ltr">
          
          {/* Left Side: Auth Controls / User Status */}
          {currentUser ? (
            <div className="h-[34px] flex items-center gap-2 bg-[#071324] border border-slate-800 px-3 rounded-full text-xs font-bold shadow-sm shrink-0 whitespace-nowrap" dir={isRtl ? 'rtl' : 'ltr'}>
              {currentUser.role === 'admin' ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="max-w-[130px] truncate text-[#E2E8F0]">
                {currentUser.username} ({currentUser.role === 'admin' ? t('adminBadge') : t('memberBadge')})
              </span>
              <button 
                onClick={onLogout}
                className="text-[#94A3B8] hover:text-rose-400 mr-1 p-0.5 transition shrink-0" 
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
                className="h-[34px] bg-[#00E5FF] hover:bg-[#38bdf8] text-[#04101e] font-black text-xs px-4 rounded-full transition-all shadow-[0_0_14px_rgba(0,229,255,0.35)] flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
              >
                <span>{t('memberLogin')}</span>
                <User className="w-4 h-4 text-[#04101e] shrink-0" />
              </button>

              {/* Button 2: Sign Up */}
              <button 
                onClick={() => onOpenAuth('signup')}
                title={t('newAccount')}
                className="h-[34px] bg-[#071324] hover:bg-[#0c1f38] text-amber-400 hover:text-amber-300 border border-amber-500 hover:border-amber-400 font-bold text-xs px-3.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap active:scale-95 shadow-sm"
              >
                <span>{t('newAccount')}</span>
                <UserPlus className="w-4 h-4 text-amber-400 shrink-0" />
              </button>

              {/* Button 3: Admin */}
              <button 
                onClick={() => onOpenAuth('admin')}
                className="h-[34px] bg-[#071324] hover:bg-[#0c1f38] text-[#CBD5E1] hover:text-rose-400 border border-slate-800 hover:border-rose-500/50 font-bold text-xs px-3.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap active:scale-95 shadow-sm"
              >
                <span>{t('admin')}</span>
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              </button>
            </div>
          )}

          {/* Right Side: [Language Switcher] [Fingerprint Button] [UCL 2026/2027 Badge] */}
          <div className="flex items-center gap-2 shrink-0 select-none" dir="ltr">
            {/* Language Switcher - exactly matching height h-[34px] */}
            <LanguageSwitcher variant="header-desktop" />

            {/* Fingerprint Button - exactly same height h-[34px] */}
            <button
              onClick={onOpenSecurityModal}
              title={t('securitySettingsTitle')}
              aria-label={t('securitySettingsTitle')}
              className="h-[34px] px-3 bg-[#0b1424] hover:bg-[#12203a] text-amber-400 hover:text-amber-300 rounded-full border border-amber-500 hover:border-amber-400 transition flex items-center justify-center shrink-0 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]"
            >
              <Fingerprint className="w-4.5 h-4.5 text-amber-400 shrink-0" />
            </button>
          </div>

        </div>

      </div>

      {/* Role Portal Banner */}
      {currentUser && (
        <div className="max-w-7xl mx-auto px-4 pb-2.5">
          {currentUser.role === 'admin' ? (
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-[#07090E] border border-rose-500/30 text-rose-200 flex items-center justify-between text-xs font-bold shadow-lg" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>{t('adminPortalActive')} - {currentUser.username}</span>
              </div>
              <button 
                onClick={() => onSelectTab('admin')} 
                className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black px-3 py-1 rounded-xl transition cursor-pointer"
              >
                {t('controlPanelBtn')}
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-[#07090E] border border-blue-500/30 text-blue-200 flex items-center justify-between text-xs font-bold shadow-lg" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>{t('membersZoneActive')} - {t('welcomeMember')} {currentUser.username}!</span>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                <span>{currentUser.points || 0} {t('pointsCount')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
