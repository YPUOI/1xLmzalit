import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  ShieldAlert, 
  KeyRound, 
  User, 
  Eye, 
  EyeOff, 
  Lock, 
  AlertCircle,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { AppUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialRole: 'user' | 'admin';
  users: AppUser[];
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  onRegisterUser: (newUser: AppUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialRole,
  users,
  onClose,
  onLoginSuccess,
  onRegisterUser
}) => {
  const [role, setRole] = useState<'user' | 'admin'>(initialRole);
  const [username, setUsername] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [statusAlert, setStatusAlert] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  useEffect(() => {
    setRole(initialRole);
    setStatusAlert(null);
    setUsername('');
    setMemberPassword('');
    setAdminPasscode('');
    setShowMemberPassword(false);
    setShowAdminPasscode(false);
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusAlert(null);

    // 1. ADMIN LOGIN - STRICTLY requires the Admin Secret Code (05082007)
    if (role === 'admin') {
      if (adminPasscode.trim() !== '05082007') {
        setStatusAlert({
          type: 'error',
          text: 'رمز سر الآدمن غير صحيح! يرجى إدخال الرمز السري الصحيح للإدارة.'
        });
        return;
      }

      // Mark admin session as validated with secret code
      sessionStorage.setItem('cl_admin_verified', '05082007');

      // Find existing admin or initialize default admin
      let adminUser = users.find(u => u.role === 'admin');
      if (!adminUser) {
        adminUser = {
          username: 'الآدمن (Admin)',
          role: 'admin',
          points: 0,
          status: 'approved'
        };
        onRegisterUser(adminUser);
      }

      onLoginSuccess(adminUser);
      onClose();
      return;
    }

    // 2. MEMBER LOGIN / REGISTRATION
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setStatusAlert({ type: 'error', text: 'الرجاء إدخال اسم المستخدم!' });
      return;
    }

    // PREVENT BYPASS: Reject any attempt to access or register admin via the member portal
    const lowerName = cleanUsername.toLowerCase();
    if (
      lowerName === 'admin' ||
      lowerName === 'administrator' ||
      lowerName.includes('آدمن') ||
      lowerName.includes('ادمن') ||
      lowerName.includes('مدير')
    ) {
      setStatusAlert({
        type: 'error',
        text: 'هذا الاسم مخصص لإدارة النظام حصراً! لا يمكن تسجيل الدخول أو التسجيل كآدمن من هنا. يرجى استخدام "بوابة الآدمن" وإدخال الرمز السري للإدارة.'
      });
      return;
    }

    if (!memberPassword.trim()) {
      setStatusAlert({ type: 'error', text: 'الرجاء إدخال كلمة المرور لحسابك!' });
      return;
    }

    const cleanPassword = memberPassword.trim();
    const existingUser = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    const deviceUser = localStorage.getItem('cl_device_user');

    if (existingUser) {
      // PREVENT BYPASS: If existing user is admin, block login via member portal!
      if (existingUser.role === 'admin') {
        setStatusAlert({
          type: 'error',
          text: 'هذا الحساب مخصص للإدارة! لا يمكن الدخول إليه من بوابة الأعضاء. يرجى التوجه إلى "بوابة الآدمن" وإدخال الرمز السري للإدارة.'
        });
        return;
      }

      // User exists: verify their password strictly
      if (existingUser.password && existingUser.password !== cleanPassword) {
        setStatusAlert({
          type: 'error',
          text: 'اسم المستخدم هذا مسجل مسبقاً! كلمة المرور غير صحيحة، يرجى إدخال كلمتك الصحيحة أو اختيار اسم مستخدم فريد غير مكرر.'
        });
        return;
      }

      // If user had no password previously, set it now
      if (!existingUser.password) {
        existingUser.password = cleanPassword;
      }

      // Check member approval status
      if (existingUser.status === 'pending') {
        setStatusAlert({
          type: 'info',
          text: 'عذراً، طلب حسابك قيد المراجعة حالياً. يرجى الانتظار حتى موافقة الآدمن على عضويتك لتتمكن من التوقع.'
        });
        return;
      }

      // Successful member login
      onLoginSuccess(existingUser);
      onClose();
    } else {
      // New member registration
      if (cleanPassword.length < 3) {
        setStatusAlert({
          type: 'error',
          text: 'كلمة المرور يجب أن تكون 3 خانات أو أكثر لحماية حسابك.'
        });
        return;
      }

      // Device lock check (1 account per device)
      if (deviceUser && deviceUser.toLowerCase() !== cleanUsername.toLowerCase()) {
        setStatusAlert({
          type: 'error',
          text: `عذراً، تم الوصول للحد الأقصى! يُسمح بإنشاء حساب واحد فقط لكل جهاز (الحساب المسجل على هذا الجهاز: ${deviceUser}).`
        });
        return;
      }

      const newUser: AppUser = {
        username: cleanUsername,
        password: cleanPassword,
        role: 'user',
        points: 0,
        status: 'pending'
      };

      localStorage.setItem('cl_device_user', cleanUsername);
      onRegisterUser(newUser);
      setStatusAlert({
        type: 'success',
        text: `تم تسجيل حسابك (${cleanUsername}) بنجاح بكلمة المرور الخاصة بك! تم إرسال الطلب إلى الآدمن للموافقة عليه.`
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="ucl-card p-5 sm:p-7 rounded-3xl max-w-md w-full border border-yellow-500/30 ucl-gold-glow relative text-right shadow-2xl my-auto max-h-[94vh] flex flex-col justify-between">
        
        {/* Top bar with Close Button */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-black text-slate-300">تسجيل الدخول / الأمان</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
            title="إغلاق"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Switch Tabs */}
        <div className="flex border-b border-slate-800 mb-4 gap-2">
          <button 
            type="button" 
            onClick={() => { setRole('user'); setStatusAlert(null); }}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-t-xl border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer select-none min-h-[44px] ${
              role === 'user' 
                ? 'border-yellow-400 text-yellow-400 bg-slate-900/80 shadow-sm' 
                : 'border-transparent text-slate-400 hover:text-yellow-400'
            }`}
          >
            <User className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>بوابة الأعضاء</span>
          </button>

          <button 
            type="button" 
            onClick={() => { setRole('admin'); setStatusAlert(null); }}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-t-xl border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer select-none min-h-[44px] ${
              role === 'admin' 
                ? 'border-rose-500 text-rose-400 bg-rose-950/40 shadow-sm' 
                : 'border-transparent text-slate-400 hover:text-rose-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>بوابة الآدمن</span>
          </button>
        </div>

        {/* Header Titles */}
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl font-black mb-1 flex items-center gap-2">
            {role === 'admin' ? (
              <>
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-rose-400">بوابة الإدارة والتحكم</span>
              </>
            ) : (
              <>
                <UserCheck className="w-5 h-5 text-yellow-400 shrink-0" />
                <span className="text-yellow-400">دخول وتسجيل الأعضاء</span>
              </>
            )}
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            {role === 'admin'
              ? 'الرجاء إدخال رمز سر الآدمن فقط للدخول المباشر إلى لوحة الإدارة.'
              : 'أدخل اسم المستخدم وكلمة المرور الخاصة بك. الأسماء فريدة ومحمية ولا تتكرر.'}
          </p>
        </div>

        {/* Status Alerts */}
        {statusAlert && (
          <div className={`mb-4 p-3 rounded-2xl border text-xs font-bold leading-relaxed flex items-start gap-2.5 ${
            statusAlert.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : statusAlert.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/90 border-amber-500/50 text-amber-200'
          }`}>
            {statusAlert.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{statusAlert.text}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* MEMBER FORM: Ask for Username AND Password */}
          {role === 'user' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-yellow-400" />
                  <span>اسم المستخدم (فريد وغير مكرر)</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم..."
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3.5 text-white text-base sm:text-sm outline-none focus:border-yellow-400 transition placeholder:text-slate-600 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-yellow-400" />
                  <span>كلمة المرور لحسابك</span>
                </label>
                <div className="relative">
                  <input
                    type={showMemberPassword ? 'text' : 'password'}
                    required
                    value={memberPassword}
                    onChange={(e) => setMemberPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3.5 pl-12 text-white text-base sm:text-sm outline-none focus:border-yellow-400 transition placeholder:text-slate-600 min-h-[48px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMemberPassword(!showMemberPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-2 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                    title={showMemberPassword ? 'إخفاء' : 'إظهار'}
                  >
                    {showMemberPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  إذا كان الحساب جديداً ستصبح هذه كلمته، وإذا كان مسجلاً أدخل كلمتك للدخول.
                </span>
              </div>
            </>
          ) : (
            /* ADMIN FORM: STRICTLY asks for Admin Secret Code ONLY */
            <div>
              <label className="block text-xs font-bold text-rose-400 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                <span>رمز سر الآدمن (Admin Secret Code)</span>
              </label>
              <div className="relative">
                <input
                  type={showAdminPasscode ? 'text' : 'password'}
                  required
                  autoFocus
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="أدخل الرمز السري للإدارة..."
                  className="w-full bg-slate-900 border border-rose-500/60 rounded-2xl p-3.5 pl-12 text-white text-base sm:text-sm outline-none focus:border-rose-400 transition shadow-inner placeholder:text-slate-600 min-h-[48px]"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-2 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                  title={showAdminPasscode ? 'إخفاء' : 'إظهار'}
                >
                  {showAdminPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                الدخول كآدمن لا يتطلب أي اسم مستخدم، فقط الرمز السري المعتمد للإدارة.
              </span>
            </div>
          )}

          <button
            type="submit"
            className={`w-full font-black py-3.5 rounded-2xl transition shadow-lg mt-2 text-sm cursor-pointer active:scale-[0.99] min-h-[48px] flex items-center justify-center ${
              role === 'admin'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/25'
                : 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-slate-950 shadow-yellow-500/25'
            }`}
          >
            {role === 'admin' ? 'التحقق والدخول المباشر كآدمن' : 'تسجيل الدخول / إنشاء حساب'}
          </button>
        </form>

        {/* Security badge at bottom */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            حماية الحسابات
          </span>
          <span className="text-slate-400">حساب واحد لكل جهاز</span>
        </div>
      </div>
    </div>
  );
};
