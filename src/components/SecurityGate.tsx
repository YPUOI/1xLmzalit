import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  BookmarkCheck
} from 'lucide-react';
import { 
  getSecurityConfig, 
  verifyFriendPassword, 
  setFriendAuthenticated,
  applySyncedFriendPassword,
  getRememberedFriendPassword
} from '../utils/security';
import { subscribeSecurityConfig, getLatestFriendPassword } from '../lib/firebase';
import { SecurityConfig } from '../types';
import { UclStarsBackground } from './UclStarsBackground';
import { XlmzalitLogo } from './XlmzalitLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SecurityGateProps {
  onUnlock: () => void;
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ onUnlock }) => {
  const { t, isRtl } = useLanguage();
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return getRememberedFriendPassword().remember;
  });
  const [password, setPassword] = useState<string>(() => {
    return getRememberedFriendPassword().password || '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncedPassword, setSyncedPassword] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [, setConfig] = useState<SecurityConfig>(getSecurityConfig());

  useEffect(() => {
    setConfig(getSecurityConfig());
    
    // Immediate fetch of latest cloud password
    getLatestFriendPassword().then(pass => {
      if (pass) {
        setSyncedPassword(pass);
        applySyncedFriendPassword(pass);
        setConfig(getSecurityConfig());
      }
    });

    // Listen for real-time changes to the friend password in Firestore across all members
    const unsub = subscribeSecurityConfig((data) => {
      if (data.friendPassword) {
        setSyncedPassword(data.friendPassword);
        applySyncedFriendPassword(data.friendPassword);
        setConfig(getSecurityConfig());
      }
    });
    return () => unsub();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const input = password.trim();
    if (!input) {
      setErrorMsg(t('errorEmptyPass'));
      return;
    }

    setIsVerifying(true);

    // Check against memory-synced password or local storage config
    let isValid = (syncedPassword && input.toLowerCase() === syncedPassword.trim().toLowerCase()) 
      || verifyFriendPassword(input);

    // If not matching, query live Firestore directly in real-time
    if (!isValid) {
      const livePass = await getLatestFriendPassword();
      if (livePass) {
        setSyncedPassword(livePass);
        applySyncedFriendPassword(livePass);
        if (input.toLowerCase() === livePass.trim().toLowerCase()) {
          isValid = true;
        }
      }
    }

    setIsVerifying(false);

    if (isValid) {
      setSuccessMsg(t('verifySuccess'));
      setTimeout(() => {
        setFriendAuthenticated(true, rememberMe, input);
        onUnlock();
      }, 400);
    } else {
      setErrorMsg(t('errorWrongPass'));
    }
  };

  return (
    <div className="min-h-screen ucl-theme-bg flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-100" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Eye-Friendly Glowing UEFA Champions League Stars & Atmosphere Background */}
      <UclStarsBackground />

      {/* Background Lighting Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher at Top of Card */}
      <div className="mb-4 z-20">
        <LanguageSwitcher variant="gate" />
      </div>

      {/* Main Security Card */}
      <div className="w-full max-w-md ucl-card rounded-3xl p-6 sm:p-8 ucl-card-glow relative z-10 border border-blue-500/30 shadow-2xl">
        
        {/* Official 1xlmzalit Logo without white box filling the hero area */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <XlmzalitLogo variant="light" size="xl" className="w-64 sm:w-80" />
            <div className="absolute -bottom-2 -left-2 bg-[#00E5FF] text-slate-950 p-2 rounded-xl border border-cyan-300 shadow-lg">
              <Lock className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Header Text */}
        <div className="text-center mb-6">
          <span className="text-[12px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-[#00E5FF] to-blue-400 font-sans">
            1xLmzalit v1.0
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1 text-white tracking-wide">
            {t('gateTitle')}
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {t('gateSubtitle')}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
                {t('gatePassLabel')}
              </span>
            </label>
            <div className="relative" dir="ltr">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('gatePassPlaceholder')}
                autoFocus
                dir="ltr"
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-yellow-400 rounded-2xl py-3.5 pl-4 pr-12 text-sm text-white font-mono font-medium outline-none transition shadow-inner placeholder:text-slate-600 force-ltr text-left"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                title={showPassword ? 'Hide' : 'Show'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Friend Password Toggle Button */}
          <div 
            onClick={() => setRememberMe(!rememberMe)}
            className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
              rememberMe 
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="remember_friend_pwd"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded accent-amber-400 cursor-pointer bg-slate-950 border-slate-700 focus:ring-0"
              />
              <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BookmarkCheck className={`w-3.5 h-3.5 ${rememberMe ? 'text-amber-400' : 'text-slate-500'}`} />
                  {t('rememberPassword')}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {t('rememberPasswordDesc')}
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
              rememberMe 
                ? 'bg-amber-500/25 text-amber-300 border-amber-500/50' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {t('permanentSave')}
            </span>
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-slate-950 font-black py-3.5 rounded-2xl transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-[0.99]"
          >
            <span>{isVerifying ? t('verifying') : t('unlockPlatform')}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer info badge */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
            1xlmzalit Security
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SSL Protected
          </span>
        </div>
      </div>
    </div>
  );
};
