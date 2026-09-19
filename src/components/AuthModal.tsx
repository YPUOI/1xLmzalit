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
  Shield,
  Mail,
  UserPlus,
  LogIn,
  Info
} from 'lucide-react';
import { AppUser } from '../types';

export type AuthSlide = 'login' | 'signup' | 'admin';

interface AuthModalProps {
  isOpen: boolean;
  initialRole?: 'user' | 'admin';
  initialTab?: AuthSlide;
  users: AppUser[];
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  onRegisterUser: (newUser: AppUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialRole = 'user',
  initialTab,
  users,
  onClose,
  onLoginSuccess,
  onRegisterUser
}) => {
  // Current active slide: 'login' | 'signup' | 'admin'
  const [activeSlide, setActiveSlide] = useState<AuthSlide>(
    initialTab || (initialRole === 'admin' ? 'admin' : 'login')
  );

  // Login form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up form states
  const [signupUsername, setSignupUsername] = useState('');
  const [signupGmail, setSignupGmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Admin form states
  const [adminPasscode, setAdminPasscode] = useState('');
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);

  // Notification / Alert message
  const [statusAlert, setStatusAlert] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveSlide(initialTab);
    } else {
      setActiveSlide(initialRole === 'admin' ? 'admin' : 'login');
    }
    setStatusAlert(null);
    setLoginUsername('');
    setLoginPassword('');
    setSignupUsername('');
    setSignupGmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setAdminPasscode('');
    setShowLoginPassword(false);
    setShowSignupPassword(false);
    setShowSignupConfirmPassword(false);
    setShowAdminPasscode(false);
  }, [initialRole, initialTab, isOpen]);

  if (!isOpen) return null;

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusAlert(null);

    const cleanUsername = loginUsername.trim();
    if (!cleanUsername) {
      setStatusAlert({ type: 'error', text: 'الرجاء إدخال اسم المستخدم!' });
      return;
    }

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
        text: 'هذا الاسم مخصص لإدارة النظام! يرجى استخدام بوابة الآدمن للدخول.'
      });
      return;
    }

    if (!loginPassword.trim()) {
      setStatusAlert({ type: 'error', text: 'الرجاء إدخال كلمة المرور لحسابك!' });
      return;
    }

    const cleanPassword = loginPassword.trim();
    const existingUser = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

    if (!existingUser) {
      setStatusAlert({
        type: 'error',
        text: `اسم المستخدم (${cleanUsername}) غير مسجل! إذا كنت عضواً جديداً، يرجى الانتقال إلى قسم "إنشاء حساب".`
      });
      return;
    }

    if (existingUser.role === 'admin') {
      setStatusAlert({
        type: 'error',
        text: 'هذا الحساب مخصص للإدارة! يرجى التوجه إلى "بوابة الآدمن" وإدخال الرمز السري.'
      });
      return;
    }

    // Verify password if recorded
    if (existingUser.password && existingUser.password !== cleanPassword) {
      setStatusAlert({
        type: 'error',
        text: 'كلمة المرور غير صحيحة! يرجى التأكد من كلمة المرور الخاصة بحسابك.'
      });
      return;
    }

    // Check approval status
    if (existingUser.status === 'pending') {
      setStatusAlert({
        type: 'info',
        text: 'طلب حسابك قيد المراجعة حالياً من قبل الآدمن. يرجى الانتظار حتى تتم الموافقة لتتمكن من التوقع.'
      });
      return;
    }

    // Successful login
    onLoginSuccess(existingUser);
    onClose();
  };

  // Handle Sign Up submission
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusAlert(null);

    const cleanUsername = signupUsername.trim();
    const cleanGmail = signupGmail.trim().toLowerCase();
    const cleanPassword = signupPassword.trim();
    const cleanConfirm = signupConfirmPassword.trim();

    // 1. Username validations
    if (!cleanUsername) {
      setStatusAlert({ type: 'error', text: 'الرجاء إدخال اسم المستخدم!' });
      return;
    }

    if (cleanUsername.length < 3) {
      setStatusAlert({ type: 'error', text: 'اسم المستخدم يجب أن يتكون من 3 أحرف أو أكثر!' });
      return;
    }

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
        text: 'لا يمكن اختيار اسم يحتوي على مسميات الإدارة! يرجى اختيار اسم شخصي فريد.'
      });
      return;
    }

    // Check username uniqueness
    const userExists = users.some(u => u.username.toLowerCase() === lowerName);
    if (userExists) {
      setStatusAlert({
        type: 'error',
        text: `اسم المستخدم (${cleanUsername}) محجوز ومسجل مسبقاً! يرجى اختيار اسم مستخدم آخر.`
      });
      return;
    }

    // 2. Gmail validation (Must end with @gmail.com)
    if (!cleanGmail) {
      setStatusAlert({ type: 'error', text: 'الرجاء إدخال بريد Gmail الخاص بك!' });
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(cleanGmail)) {
      setStatusAlert({
        type: 'error',
        text: 'يرجى إدخال بريد Gmail صالح ينتهي بـ @gmail.com (مثال: name@gmail.com) لتوثيق الحساب!'
      });
      return;
    }

    // Check Gmail uniqueness among existing users
    const emailExists = users.some(u => u.email && u.email.toLowerCase() === cleanGmail);
    if (emailExists) {
      setStatusAlert({
        type: 'error',
        text: 'هذا البريد (Gmail) مرتبط بحساب مسجل مسبقاً! يرجى استخدام بريد Gmail الخاص بك أو تسجيل الدخول.'
      });
      return;
    }

    // 3. Password validations
    if (!cleanPassword) {
      setStatusAlert({ type: 'error', text: 'الرجاء إدخال كلمة المرور لحسابك!' });
      return;
    }

    if (cleanPassword.length < 3) {
      setStatusAlert({ type: 'error', text: 'كلمة المرور يجب أن تتكون من 3 خانات أو أكثر لحماية حسابك.' });
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setStatusAlert({ type: 'error', text: 'كلمتا المرور غير متطابقتين! يرجى التأكد من إعادة كتابة كلمة المرور بدقة.' });
      return;
    }

    // 4. Device lock check (1 account per device)
    const deviceUser = localStorage.getItem('cl_device_user');
    if (deviceUser && deviceUser.toLowerCase() !== lowerName) {
      setStatusAlert({
        type: 'error',
        text: `تنبيه: يُسمح بإنشاء حساب واحد فقط لكل جهاز (الحساب المسجل على هذا الجهاز: ${deviceUser}).`
      });
      return;
    }

    // Register new member
    const newUser: AppUser = {
      username: cleanUsername,
      email: cleanGmail,
      password: cleanPassword,
      role: 'user',
      points: 0,
      status: 'pending'
    };

    localStorage.setItem('cl_device_user', cleanUsername);
    onRegisterUser(newUser);

    setStatusAlert({
      type: 'success',
      text: `تم إنشاء حسابك (${cleanUsername}) وربطه بـ (${cleanGmail}) بنجاح! تم إرسال طلب الانضمام إلى الآدمن للموافقة عليه قبل بدء التوقع.`
    });
  };

  // Handle Admin Passcode submission
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusAlert(null);

    if (adminPasscode.trim() !== '05082007') {
      setStatusAlert({
        type: 'error',
        text: 'رمز سر الآدمن غير صحيح! يرجى إدخال الرمز السري الصحيح المعتمد للإدارة.'
      });
      return;
    }

    // Mark admin session as validated
    sessionStorage.setItem('cl_admin_verified', '05082007');

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
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="ucl-card p-5 sm:p-7 rounded-3xl max-w-md w-full border border-slate-800 relative text-right shadow-2xl my-auto max-h-[95vh] flex flex-col justify-between">
        
        {/* Top bar with Close Button */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-xs font-black text-slate-300">منظومة الحسابات والأمان</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#94A3B8] hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
            title="إغلاق"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Slides Tabs Navigation */}
        <div className="flex bg-[#080C19] p-1 rounded-2xl border border-slate-800/80 mb-5 gap-1">
          {/* Slide 1: Login */}
          <button 
            type="button" 
            onClick={() => { setActiveSlide('login'); setStatusAlert(null); }}
            className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none min-h-[42px] ${
              activeSlide === 'login' 
                ? 'bg-[#10172A] text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.25)] border border-[#00E5FF]/30' 
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>تسجيل الدخول</span>
          </button>

          {/* Slide 2: Sign Up */}
          <button 
            type="button" 
            onClick={() => { setActiveSlide('signup'); setStatusAlert(null); }}
            className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none min-h-[42px] ${
              activeSlide === 'signup' 
                ? 'bg-[#10172A] text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)] border border-amber-400/30' 
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>إنشاء حساب</span>
          </button>

          {/* Slide 3: Admin */}
          <button 
            type="button" 
            onClick={() => { setActiveSlide('admin'); setStatusAlert(null); }}
            className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none min-h-[42px] ${
              activeSlide === 'admin' 
                ? 'bg-rose-950/60 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)] border border-rose-500/40' 
                : 'text-[#94A3B8] hover:text-rose-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>الآدمن</span>
          </button>
        </div>

        {/* Slide Header Titles */}
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl font-black mb-1 flex items-center gap-2">
            {activeSlide === 'login' && (
              <>
                <UserCheck className="w-5 h-5 text-[#00E5FF] shrink-0" />
                <span className="text-[#00E5FF]">تسجيل دخول الأعضاء</span>
              </>
            )}
            {activeSlide === 'signup' && (
              <>
                <UserPlus className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-amber-400">إنشاء حساب عضو جديد</span>
              </>
            )}
            {activeSlide === 'admin' && (
              <>
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-rose-400">بوابة الإدارة والتحكم (Admin)</span>
              </>
            )}
          </h3>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {activeSlide === 'login' && 'أدخل اسم المستخدم وكلمة المرور الخاصة بحسابك لمتابعة وتعديل توقعاتك.'}
            {activeSlide === 'signup' && 'قم بإنشاء حسابك وتعيين بريد Gmail الرسمي لحفظ وتوثيق نتائجك في البطولة.'}
            {activeSlide === 'admin' && 'أدخل رمز سر الآدمن المعتمد حصراً للوصول المباشر إلى لوحة التحكم.'}
          </p>
        </div>

        {/* Status Alert Notification */}
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
            ) : statusAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{statusAlert.text}</div>
          </div>
        )}

        {/* SLIDE 1: LOGIN FORM */}
        {activeSlide === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>اسم المستخدم</span>
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم..."
                autoFocus
                className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3.5 text-white text-base sm:text-sm outline-none focus:border-[#00E5FF] transition placeholder:text-slate-600 min-h-[48px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>كلمة المرور</span>
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور..."
                  className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3.5 pl-12 text-white text-base sm:text-sm outline-none focus:border-[#00E5FF] transition placeholder:text-slate-600 min-h-[48px]"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-2 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                  title={showLoginPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full font-black py-3.5 rounded-2xl transition shadow-lg mt-2 text-sm cursor-pointer active:scale-[0.99] min-h-[48px] flex items-center justify-center bg-gradient-to-r from-cyan-500 to-[#00E5FF] hover:from-cyan-400 hover:to-cyan-300 text-slate-950 shadow-cyan-500/20"
            >
              تسجيل الدخول
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setActiveSlide('signup'); setStatusAlert(null); }}
                className="text-xs text-[#00E5FF] hover:underline cursor-pointer font-bold inline-flex items-center gap-1"
              >
                <span>ليس لديك حساب؟ اضغط هنا لإنشاء حساب جديد</span>
              </button>
            </div>
          </form>
        )}

        {/* SLIDE 2: SIGN UP FORM (Asks for Gmail, Username, and Password) */}
        {activeSlide === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>اسم المستخدم (فريد)</span>
              </label>
              <input
                type="text"
                required
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                placeholder="مثال: يوسف، أحمد..."
                autoFocus
                className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3 text-white text-sm outline-none focus:border-amber-400 transition placeholder:text-slate-600 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>بريد Gmail (مطلوب لتوثيق العضوية)</span>
              </label>
              <input
                type="email"
                required
                value={signupGmail}
                onChange={(e) => setSignupGmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3 text-white text-sm outline-none focus:border-amber-400 transition placeholder:text-slate-600 font-sans min-h-[44px]"
                dir="ltr"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                يجب أن يكون بريداً صالحاً ينتهي بـ @gmail.com
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>كلمة المرور</span>
              </label>
              <div className="relative">
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="كلمة المرور (3 خانات فأكثر)..."
                  className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3 pl-10 text-white text-sm outline-none focus:border-amber-400 transition placeholder:text-slate-600 min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1.5 cursor-pointer"
                  title={showSignupPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>تأكيد كلمة المرور</span>
              </label>
              <div className="relative">
                <input
                  type={showSignupConfirmPassword ? 'text' : 'password'}
                  required
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور..."
                  className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3 pl-10 text-white text-sm outline-none focus:border-amber-400 transition placeholder:text-slate-600 min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1.5 cursor-pointer"
                  title={showSignupConfirmPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full font-black py-3.5 rounded-2xl transition shadow-lg mt-2 text-sm cursor-pointer active:scale-[0.99] min-h-[48px] flex items-center justify-center bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20"
            >
              إنشاء الحساب وإرسال للموافقة
            </button>

            <div className="text-center pt-1.5">
              <button
                type="button"
                onClick={() => { setActiveSlide('login'); setStatusAlert(null); }}
                className="text-xs text-amber-400 hover:underline cursor-pointer font-bold inline-flex items-center gap-1"
              >
                <span>لديك حساب مسجل بالفعل؟ تسجيل الدخول</span>
              </button>
            </div>
          </form>
        )}

        {/* SLIDE 3: ADMIN FORM (Passcode only) */}
        {activeSlide === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
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
                  className="w-full bg-[#080C19] border border-rose-500/60 rounded-2xl p-3.5 pl-12 text-white text-base sm:text-sm outline-none focus:border-rose-400 transition shadow-inner placeholder:text-slate-600 min-h-[48px]"
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

            <button
              type="submit"
              className="w-full font-black py-3.5 rounded-2xl transition shadow-lg mt-2 text-sm cursor-pointer active:scale-[0.99] min-h-[48px] flex items-center justify-center bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/25"
            >
              التحقق والدخول المباشر كآدمن
            </button>
          </form>
        )}

        {/* Security badge at bottom */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#00E5FF]" />
            حماية الحسابات
          </span>
          <span>حساب موثق واحد لكل جهاز</span>
        </div>
      </div>
    </div>
  );
};
