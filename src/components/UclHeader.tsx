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
  Wrench
} from 'lucide-react';
import { AppUser } from '../types';
import { XlmzalitLogo } from './XlmzalitLogo';

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
  return (
    <header className="ucl-header-bg border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-2xl shadow-2xl shadow-black/80">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5 flex flex-wrap justify-between items-center gap-4" dir="ltr">
        
        {/* Brand Group at Top Left: First photo on the left, Second photo next to it from the right */}
        <div 
          className="flex items-center gap-3 sm:gap-4 cursor-pointer select-none group" 
          onClick={() => onSelectTab('matches')}
          title="1xlmzalit - بطولة دوري أبطال أوروبا"
        >
          {/* First Photo: Exact 1xlmzalit Brand Vector Logo on Top Left */}
          <XlmzalitLogo variant="light" size="lg" className="shrink-0 hover:scale-105 transition-transform" />

          {/* Second Photo: Next to it from the right ([v1.0] badge on left + بطولة دوري أبطال أوروبا on right) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 bg-slate-900/40 px-2.5 py-1.5 rounded-xl border border-slate-800/50">
            {/* v1.0 Badge matching photo */}
            <div className="bg-[#041E34] border border-[#00E5FF]/60 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.25)]">
              <span className="text-[11px] sm:text-xs font-black text-[#00E5FF] tracking-wider font-mono">
                v1.0
              </span>
            </div>

            {/* بطولة دوري أبطال أوروبا text matching photo */}
            <span className="text-[#E2E8F0] text-xs sm:text-sm md:text-[15px] font-bold tracking-normal font-['Cairo',sans-serif] whitespace-nowrap">
              بطولة دوري أبطال أوروبا
            </span>
          </div>
        </div>

        {/* Action Controls & User Account on the Right */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap" dir="rtl">
          
          {/* UCL 2026/2027 Frosted Glass Badge at the Top Left */}
          <div className="ucl-badge-glass px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center justify-center shrink-0 border border-[#00E5FF]/50 shadow-[0_0_18px_rgba(0,229,255,0.35)] select-none">
            <span className="text-[11px] sm:text-xs font-black tracking-widest text-[#00E5FF] uppercase">
              UCL 2026/2027
            </span>
          </div>
          
          {/* Security & Biometric Settings Button - تحت الصيانة */}
          <button
            onClick={onOpenSecurityModal}
            title="إعدادات الحماية والبصمة (تحت الصيانة)"
            className="bg-[#10172A] hover:bg-[#16213B] text-[#94A3B8] hover:text-amber-300 text-xs font-bold px-3 py-2 rounded-xl border border-amber-500/35 hover:border-amber-400/60 transition flex items-center gap-2 cursor-pointer shadow-sm relative group"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span className="hidden md:inline text-[#E2E8F0]">الحماية والبصمة</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-black shadow-sm">
              تحت الصيانة
            </span>
          </button>

          {/* User Status / Login Buttons */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-[#10172A] border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
              {currentUser.role === 'admin' ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="max-w-[110px] truncate text-[#E2E8F0]">
                {currentUser.username} ({currentUser.role === 'admin' ? 'مدير' : 'عضو'})
              </span>
              <button 
                onClick={onLogout}
                className="text-[#94A3B8] hover:text-rose-400 mr-1 p-0.5 transition" 
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onOpenAuth('login')}
                className="ucl-btn-primary font-black text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>دخول الأعضاء</span>
              </button>
              <button 
                onClick={() => onOpenAuth('signup')}
                className="bg-[#10172A] hover:bg-[#16213B] text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400/60 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">حساب جديد</span>
              </button>
              <button 
                onClick={() => onOpenAuth('admin')}
                className="bg-[#10172A] hover:bg-[#16213B] text-[#94A3B8] hover:text-rose-400 border border-slate-800 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>الآدمن</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role Portal Banner */}
      {currentUser && (
        <div className="max-w-7xl mx-auto px-4 pb-2.5">
          {currentUser.role === 'admin' ? (
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-[#07090E] border border-rose-500/30 text-rose-200 flex items-center justify-between text-xs font-bold shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>أنت الآن في <strong>بوابة إدارة النظام (Admin Portal)</strong> - حساب: {currentUser.username}</span>
              </div>
              <button 
                onClick={() => onSelectTab('admin')} 
                className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black px-3 py-1 rounded-xl transition cursor-pointer"
              >
                لوحة التحكم
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-[#07090E] border border-blue-500/30 text-blue-200 flex items-center justify-between text-xs font-bold shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>أنت الآن في <strong>بوابة المتوقعين (Members Zone)</strong> - أهلاً بك، {currentUser.username}!</span>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                <span>{currentUser.points || 0} نقطة</span>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
