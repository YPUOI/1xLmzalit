import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  ShieldCheck
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
      }, 350);
    } else {
      setErrorMsg(t('errorWrongPass'));
    }
  };

  return (
    <div className="min-h-screen bg-[#06141B] flex flex-col items-center justify-center p-4 relative overflow-hidden text-[#CCD0CF]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Atmosphere */}
      <UclStarsBackground />

      {/* Language Switcher above the card */}
      <div className="mb-4 z-20">
        <LanguageSwitcher variant="gate" />
      </div>

      {/* Main Security Card */}
      <div className="w-full max-w-md ucl-card rounded-2xl p-6 sm:p-8 relative z-10 border border-[#253745] shadow-2xl bg-[#11212D]">
        
        {/* Brand Logo */}
        <div className="flex justify-center mb-6">
          <XlmzalitLogo variant="light" size="xl" className="w-60 sm:w-72" />
        </div>

        {/* Header Text */}
        <div className="text-center mb-6">
          <span className="text-xs font-semibold text-[#9BA8AB] font-mono tracking-wider uppercase block">
            1XLMZALIT v1.0
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 text-[#CCD0CF]">
            {t('gateTitle')}
          </h1>
          <p className="text-xs text-[#9BA8AB] mt-1 leading-relaxed">
            {t('gateSubtitle')}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#CCD0CF]" />
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
                className="w-full bg-[#253745] border border-[#253745] rounded-xl py-3 pl-3.5 pr-11 text-xs sm:text-sm text-[#CCD0CF] font-mono outline-none transition-all duration-200 focus:border-[#4A5C6A] placeholder:text-[#9BA8AB] force-ltr text-left"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BA8AB] hover:text-[#CCD0CF] transition-colors p-1 cursor-pointer"
                title={showPassword ? 'Hide' : 'Show'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Password Toggle */}
          <div 
            onClick={() => setRememberMe(!rememberMe)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
              rememberMe 
                ? 'bg-[#253745] border-[#4A5C6A] text-[#CCD0CF]' 
                : 'bg-[#11212D] border-[#253745] text-[#9BA8AB] hover:border-[#4A5C6A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="remember_friend_pwd"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded accent-[#4A5C6A] cursor-pointer bg-[#253745] border-[#4A5C6A]"
              />
              <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="text-xs font-semibold text-[#CCD0CF] flex items-center gap-1.5">
                  <BookmarkCheck className={`w-3.5 h-3.5 ${rememberMe ? 'text-[#CCD0CF]' : 'text-[#9BA8AB]'}`} />
                  {t('rememberPassword')}
                </span>
                <span className="text-[10px] text-[#9BA8AB] mt-0.5">
                  {t('rememberPasswordDesc')}
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
              rememberMe 
                ? 'bg-[#4A5C6A] text-[#CCD0CF] border-[#4A5C6A]' 
                : 'bg-[#253745] text-[#9BA8AB] border-[#253745]'
            }`}>
              {t('permanentSave')}
            </span>
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full ucl-btn-primary font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-[0.98]"
          >
            <span>{isVerifying ? t('verifying') : t('unlockPlatform')}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer info badge */}
        <div className="mt-5 pt-3.5 border-t border-[#253745] flex items-center justify-between text-[11px] text-[#9BA8AB]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#CCD0CF]" />
            1xlmzalit Friends Gate
          </span>
          <span className="text-[#CCD0CF] text-[10px] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A5C6A]"></span>
            Verified Access
          </span>
        </div>
      </div>
    </div>
  );
};
