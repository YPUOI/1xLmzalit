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
  ArrowLeft
} from 'lucide-react';
import { 
  getSecurityConfig, 
  verifyFriendPassword, 
  setFriendAuthenticated,
  applySyncedFriendPassword
} from '../utils/security';
import { subscribeSecurityConfig } from '../lib/firebase';
import { SecurityConfig } from '../types';

interface SecurityGateProps {
  onUnlock: () => void;
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [, setConfig] = useState<SecurityConfig>(getSecurityConfig());

  useEffect(() => {
    setConfig(getSecurityConfig());
    // Listen for real-time changes to the friend password in Firestore
    const unsub = subscribeSecurityConfig((data) => {
      if (data.friendPassword) {
        applySyncedFriendPassword(data.friendPassword);
        setConfig(getSecurityConfig());
      }
    });
    return () => unsub();
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password.trim()) {
      setErrorMsg('الرجاء إدخال كلمة مرور الأصدقاء للدخول.');
      return;
    }

    const isValid = verifyFriendPassword(password);
    if (isValid) {
      setSuccessMsg('تم التحقق بنجاح! جاري فتح المنصة...');
      setTimeout(() => {
        setFriendAuthenticated(true);
        onUnlock();
      }, 500);
    } else {
      setErrorMsg('كلمة المرور غير صحيحة! هذه المنصة مخصصة للأصدقاء فقط.');
    }
  };

  return (
    <div className="min-h-screen ucl-theme-bg starball-bg flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-100">
      {/* Background Lighting Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Security Card */}
      <div className="w-full max-w-md ucl-card rounded-3xl p-6 sm:p-8 ucl-card-glow relative z-10 border border-blue-500/30 shadow-2xl">
        
        {/* Official 1xLmzalit Logo & Lock Badge */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/25 border-2 border-[#00E5FF]/60 p-1 bg-[#080C19] transform hover:scale-105 transition flex items-center justify-center">
              <img 
                src="/xlmzalit_emblem.png" 
                alt="1xLmzalit Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
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
            بوابة دخول الأصدقاء
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            المنصة محمية ومخصصة للأصدقاء فقط. يرجى إدخال كلمة المرور المعتمدة للمتابعة.
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
                كلمة مرور الأصدقاء (Friends Password)
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة مرور الأصدقاء..."
                autoFocus
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-yellow-400 rounded-2xl py-3.5 pr-4 pl-12 text-sm text-white font-medium outline-none transition shadow-inner placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                title={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
            <Lock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="leading-tight">حماية فورية: يُطلب الرمز دائماً عند كل دخول أو تحديث للصفحة.</span>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-slate-950 font-black py-3.5 rounded-2xl transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-[0.99]"
          >
            <span>فتح المنصة والدخول</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info badge */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
            نظام حماية المزاليط
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            مشفّر ومؤمن
          </span>
        </div>
      </div>
    </div>
  );
};
