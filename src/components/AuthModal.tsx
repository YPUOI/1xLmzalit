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
  Info,
  BookmarkCheck
} from 'lucide-react';
import { AppUser } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export type AuthSlide = 'login' | 'signup' | 'admin';

interface AuthModalProps {
  isOpen: boolean;
  initialRole?: 'user' | 'admin';
  initialTab?: AuthSlide;
  users: AppUser[];
  onClose: () => void;
  onLoginSuccess: (user: AppUser, remember?: boolean) => void;
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
  const { t, isRtl, language } = useLanguage();
  
  // Current active slide: 'login' | 'signup' | 'admin'
  const [activeSlide, setActiveSlide] = useState<AuthSlide>(
    initialTab || (initialRole === 'admin' ? 'admin' : 'login')
  );

  // Login form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cl_remember_login') === 'true';
    } catch {
      return true;
    }
  });

  // Prepopulate saved credentials if user previously checked "Remember Me"
  useEffect(() => {
    if (isOpen) {
      try {
        const isRemembered = localStorage.getItem('cl_remember_login') === 'true';
        if (isRemembered) {
          const savedUser = localStorage.getItem('cl_remembered_username') || '';
          const savedPass = localStorage.getItem('cl_remembered_password') || '';
          if (savedUser) setLoginUsername(savedUser);
          if (savedPass) setLoginPassword(savedPass);
          setRememberLogin(true);
        }
      } catch {
        // Ignore storage access errors
      }
    }
  }, [isOpen]);

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
      setStatusAlert({ 
        type: 'error', 
        text: language === 'ar' ? 'الرجاء إدخال اسم المستخدم!' : language === 'fr' ? 'Veuillez saisir un nom d\'utilisateur !' : 'Please enter your username!' 
      });
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
        text: language === 'ar' 
          ? 'هذا الاسم مخصص لإدارة النظام! يرجى استخدام بوابة الآدمن للدخول.' 
          : language === 'fr' 
          ? 'Cet identifiant est réservé à l\'administration ! Utilisez le portail admin.' 
          : 'This username is reserved for system admins! Please use the Admin tab.'
      });
      return;
    }

    if (!loginPassword.trim()) {
      setStatusAlert({ 
        type: 'error', 
        text: language === 'ar' ? 'الرجاء إدخال كلمة المرور لحسابك!' : language === 'fr' ? 'Veuillez saisir votre mot de passe !' : 'Please enter your password!' 
      });
      return;
    }

    const cleanPassword = loginPassword.trim();
    const existingUser = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

    if (!existingUser) {
      setStatusAlert({
        type: 'error',
        text: language === 'ar'
          ? `اسم المستخدم (${cleanUsername}) غير مسجل! إذا كنت عضواً جديداً، يرجى الانتقال إلى قسم "إنشاء حساب".`
          : language === 'fr'
          ? `L'utilisateur (${cleanUsername}) n'existe pas ! Veuillez créer un compte.`
          : `Username (${cleanUsername}) not found! If you are new, please use Sign Up.`
      });
      return;
    }

    if (existingUser.role === 'admin') {
      setStatusAlert({
        type: 'error',
        text: language === 'ar'
          ? 'هذا الحساب مخصص للإدارة! يرجى التوجه إلى "بوابة الآدمن" وإدخال الرمز السري.'
          : language === 'fr'
          ? 'Ce compte est administrateur ! Accédez à l\'onglet Admin avec le code secret.'
          : 'This account is an admin! Please access the Admin portal with the passcode.'
      });
      return;
    }

    // Verify password if recorded
    if (existingUser.password && existingUser.password !== cleanPassword) {
      setStatusAlert({
        type: 'error',
        text: t('authWrongPassword')
      });
      return;
    }

    // Check approval status
    if (existingUser.status === 'pending') {
      setStatusAlert({
        type: 'info',
        text: t('authApprovalPending')
      });
      return;
    }

    // Save or clear remembered credentials based on user's choice
    try {
      if (rememberLogin) {
        localStorage.setItem('cl_remember_login', 'true');
        localStorage.setItem('cl_remembered_username', cleanUsername);
        localStorage.setItem('cl_remembered_password', cleanPassword);
      } else {
        localStorage.removeItem('cl_remember_login');
        localStorage.removeItem('cl_remembered_username');
        localStorage.removeItem('cl_remembered_password');
      }
    } catch {
      // Ignore storage access errors
    }

    // Successful login
    onLoginSuccess(existingUser, rememberLogin);
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
      setStatusAlert({ type: 'error', text: t('authMustEnterUsername') });
      return;
    }

    if (cleanUsername.length < 3) {
      setStatusAlert({ 
        type: 'error', 
        text: language === 'ar' ? 'اسم المستخدم يجب أن يتكون من 3 أحرف أو أكثر!' : language === 'fr' ? 'Le nom d\'utilisateur doit contenir au moins 3 caractères !' : 'Username must be at least 3 characters!' 
      });
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
        text: language === 'ar' 
          ? 'لا يمكن اختيار اسم يحتوي على مسميات الإدارة! يرجى اختيار اسم شخصي فريد.' 
          : language === 'fr' 
          ? 'Impossible d\'utiliser des termes réservés à l\'administration !' 
          : 'Reserved admin words cannot be used as username!'
      });
      return;
    }

    // Check username uniqueness
    const userExists = users.some(u => u.username.toLowerCase() === lowerName);
    if (userExists) {
      setStatusAlert({
        type: 'error',
        text: t('authUsernameTaken')
      });
      return;
    }

    // 2. Gmail validation (Must end with @gmail.com)
    if (!cleanGmail) {
      setStatusAlert({ type: 'error', text: t('authMustEnterGmail') });
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(cleanGmail)) {
      setStatusAlert({
        type: 'error',
        text: t('authMustEnterGmail')
      });
      return;
    }

    // Check Gmail uniqueness among existing users
    const emailExists = users.some(u => u.email && u.email.toLowerCase() === cleanGmail);
    if (emailExists) {
      setStatusAlert({
        type: 'error',
        text: language === 'ar'
          ? 'هذا البريد (Gmail) مرتبط بحساب مسجل مسبقاً! يرجى استخدام بريدك أو تسجيل الدخول.'
          : language === 'fr'
          ? 'Cet email Gmail est déjà associé à un compte enregistré !'
          : 'This Gmail address is already registered to an account!'
      });
      return;
    }

    // 3. Password validations
    if (!cleanPassword) {
      setStatusAlert({ type: 'error', text: t('authMustEnterPassword') });
      return;
    }

    if (cleanPassword.length < 3) {
      setStatusAlert({ 
        type: 'error', 
        text: language === 'ar' ? 'كلمة المرور يجب أن تتكون من 3 خانات أو أكثر لحماية حسابك.' : language === 'fr' ? 'Le mot de passe doit comporter au moins 3 caractères.' : 'Password must be at least 3 characters.' 
      });
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setStatusAlert({ type: 'error', text: t('authPasswordMismatch') });
      return;
    }

    // 4. Device lock check (1 account per device)
    const deviceUser = localStorage.getItem('cl_device_user');
    if (deviceUser && deviceUser.toLowerCase() !== lowerName) {
      setStatusAlert({
        type: 'error',
        text: language === 'ar'
          ? `تنبيه: يُسمح بإنشاء حساب واحد فقط لكل جهاز (الحساب المسجل على هذا الجهاز: ${deviceUser}).`
          : language === 'fr'
          ? `Attention : un seul compte autorisé par appareil (Compte existant : ${deviceUser}).`
          : `Note: Only one account is permitted per device (Current device user: ${deviceUser}).`
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
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('cl_device_user', cleanUsername);
    onRegisterUser(newUser);

    setStatusAlert({
      type: 'success',
      text: t('authAccountCreatedSuccess')
    });
  };

  // Handle Admin Passcode submission
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusAlert(null);

    if (adminPasscode.trim() !== '05082007') {
      setStatusAlert({
        type: 'error',
        text: t('authAdminWrongCode')
      });
      return;
    }

    sessionStorage.setItem('cl_admin_verified', '05082007');

    let adminUser = users.find(u => u.role === 'admin');
    if (!adminUser) {
      adminUser = {
        username: language === 'fr' ? 'Admin Système' : language === 'en' ? 'Master Admin' : 'الآدمن (Admin)',
        role: 'admin',
        points: 0,
        status: 'approved'
      };
    }

    onLoginSuccess(adminUser, false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="ucl-card w-full max-w-md rounded-3xl p-5 sm:p-7 shadow-2xl relative border border-slate-700/80 text-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row: Close Button & Language Switcher */}
        <div className="flex items-center justify-between mb-4">
          <LanguageSwitcher variant="header-mobile" />

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title={t('closeModal')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Mode Toggle Bar (Login | Sign Up | Admin) */}
        <div className="flex p-1 bg-[#080C19] rounded-2xl border border-slate-800 mb-5 gap-1">
          {/* Slide 1: Login */}
          <button 
            type="button" 
            onClick={() => { setActiveSlide('login'); setStatusAlert(null); }}
            className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none min-h-[42px] ${
              activeSlide === 'login' 
                ? 'bg-[#00E5FF] text-slate-950 shadow-[0_0_12px_rgba(0,229,255,0.35)]' 
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>{t('tabLogin')}</span>
          </button>

          {/* Slide 2: Sign Up */}
          <button 
            type="button" 
            onClick={() => { setActiveSlide('signup'); setStatusAlert(null); }}
            className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none min-h-[42px] ${
              activeSlide === 'signup' 
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.35)]' 
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>{t('tabSignup')}</span>
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
            <span>{t('tabAdminPortal')}</span>
          </button>
        </div>

        {/* Slide Header Titles */}
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl font-black mb-1 flex items-center gap-2">
            {activeSlide === 'login' && (
              <>
                <UserCheck className="w-5 h-5 text-[#00E5FF] shrink-0" />
                <span className="text-[#00E5FF]">
                  {language === 'ar' ? 'تسجيل دخول الأعضاء' : language === 'fr' ? 'Connexion des Membres' : 'Member Login'}
                </span>
              </>
            )}
            {activeSlide === 'signup' && (
              <>
                <UserPlus className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-amber-400">
                  {language === 'ar' ? 'إنشاء حساب عضو جديد' : language === 'fr' ? 'Créer un Compte Membre' : 'Create Member Account'}
                </span>
              </>
            )}
            {activeSlide === 'admin' && (
              <>
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-rose-400">
                  {language === 'ar' ? 'بوابة الإدارة والتحكم (Admin)' : language === 'fr' ? 'Portail Administration (Admin)' : 'Admin Management Portal'}
                </span>
              </>
            )}
          </h3>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {activeSlide === 'login' && (
              language === 'ar' ? 'أدخل اسم المستخدم وكلمة المرور الخاصة بحسابك لمتابعة وتعديل توقعاتك.' :
              language === 'fr' ? 'Entrez vos identifiants pour soumettre et modifier vos pronostics.' :
              'Enter your username and password to make or edit your predictions.'
            )}
            {activeSlide === 'signup' && (
              language === 'ar' ? 'قم بإنشاء حسابك وتعيين بريد Gmail الرسمي لحفظ وتوثيق نتائجك في البطولة.' :
              language === 'fr' ? 'Créez votre compte et enregistrez votre Gmail pour sauvegarder vos points.' :
              'Register your account and official Gmail to record your tournament points.'
            )}
            {activeSlide === 'admin' && (
              language === 'ar' ? 'أدخل رمز سر الآدمن المعتمد حصراً للوصول المباشر إلى لوحة التحكم.' :
              language === 'fr' ? 'Saisissez le code secret administrateur pour accéder au panneau.' :
              'Enter the admin passcode to access tournament settings and match controls.'
            )}
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

        {/* ========================================================================= */}
        {/* SLIDE 1: LOGIN FORM                                                      */}
        {/* ========================================================================= */}
        {activeSlide === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>{t('username')}</span>
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="alex, john, user1..."
                autoFocus
                className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3.5 text-white text-base sm:text-sm outline-none focus:border-[#00E5FF] transition placeholder:text-slate-600 min-h-[48px] force-ltr text-left font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>{t('password')}</span>
              </label>
              <div className="relative" dir="ltr">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  dir="ltr"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3.5 pr-12 pl-4 text-white text-base sm:text-sm outline-none focus:border-[#00E5FF] transition placeholder:text-slate-600 min-h-[48px] force-ltr text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-2 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                  title={showLoginPassword ? 'Hide' : 'Show'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* Remember Login Credentials Toggle Button */}
            <div 
              onClick={() => setRememberLogin(!rememberLogin)}
              className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                rememberLogin 
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200 shadow-[0_0_12px_rgba(0,229,255,0.15)]' 
                  : 'bg-[#080C19] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="remember_login_cb"
                  checked={rememberLogin}
                  onChange={(e) => setRememberLogin(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded accent-[#00E5FF] cursor-pointer bg-slate-950 border-slate-700 focus:ring-0"
                />
                <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BookmarkCheck className={`w-3.5 h-3.5 ${rememberLogin ? 'text-[#00E5FF]' : 'text-slate-500'}`} />
                    {t('rememberLogin')}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {t('rememberLoginDesc')}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                rememberLogin 
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500/50' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {t('permanentSave')}
              </span>
            </div>

            <button
              type="submit"
              className="w-full font-black py-3.5 rounded-2xl transition shadow-lg mt-2 text-sm cursor-pointer active:scale-[0.99] min-h-[48px] flex items-center justify-center bg-gradient-to-r from-cyan-500 to-[#00E5FF] hover:from-cyan-400 hover:to-cyan-300 text-slate-950 shadow-cyan-500/20"
            >
              {t('submitLogin')}
            </button>

            <div className="text-center pt-2 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => { setActiveSlide('signup'); setStatusAlert(null); }}
                className="text-xs text-[#00E5FF] hover:underline cursor-pointer font-bold inline-flex items-center gap-1"
              >
                <span>{t('tabSignup')}</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveSlide('admin'); setStatusAlert(null); }}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer font-bold inline-flex items-center gap-1.5 py-1 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 transition mt-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>{t('adminLoginQuickPrompt')}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 2: SIGN UP FORM                                                    */}
        {/* ========================================================================= */}
        {activeSlide === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('authUsernameUnique')}</span>
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                placeholder="alex, yassine, sam..."
                autoFocus
                className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3 text-white text-sm outline-none focus:border-amber-400 transition placeholder:text-slate-600 min-h-[44px] force-ltr text-left font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('authGmailRequired')}</span>
              </label>
              <input
                type="email"
                required
                dir="ltr"
                value={signupGmail}
                onChange={(e) => setSignupGmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3 text-white text-sm outline-none focus:border-amber-400 transition placeholder:text-slate-600 min-h-[44px] force-ltr text-left font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {language === 'ar' ? 'يجب أن يكون بريداً صالحاً ينتهي بـ @gmail.com' : language === 'fr' ? 'Doit être une adresse se terminant par @gmail.com' : 'Must be a valid email ending with @gmail.com'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('authPasswordMin')}</span>
              </label>
              <div className="relative" dir="ltr">
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  dir="ltr"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3 pr-10 pl-3 text-white text-sm outline-none focus:border-amber-400 transition placeholder:text-slate-600 min-h-[44px] force-ltr text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1.5 cursor-pointer"
                  title={showSignupPassword ? 'Hide' : 'Show'}
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('authConfirmPassword')}</span>
              </label>
              <div className="relative" dir="ltr">
                <input
                  type={showSignupConfirmPassword ? 'text' : 'password'}
                  required
                  dir="ltr"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#080C19] border border-slate-700 rounded-2xl p-3 pr-10 pl-3 text-white text-sm outline-none focus:border-amber-400 transition placeholder:text-slate-600 min-h-[44px] force-ltr text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1.5 cursor-pointer"
                  title={showSignupConfirmPassword ? 'Hide' : 'Show'}
                >
                  {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full font-black py-3.5 rounded-2xl transition shadow-lg mt-2 text-sm cursor-pointer active:scale-[0.99] min-h-[48px] flex items-center justify-center bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20"
            >
              {t('submitSignup')}
            </button>

            <div className="text-center pt-1.5">
              <button
                type="button"
                onClick={() => { setActiveSlide('login'); setStatusAlert(null); }}
                className="text-xs text-amber-400 hover:underline cursor-pointer font-bold inline-flex items-center gap-1"
              >
                <span>{t('hasAccountLink')}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 3: ADMIN FORM                                                      */}
        {/* ========================================================================= */}
        {activeSlide === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-rose-400 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                <span>{t('authAdminGatePassLabel')}</span>
              </label>
              <div className="relative" dir="ltr">
                <input
                  type={showAdminPasscode ? 'text' : 'password'}
                  required
                  dir="ltr"
                  autoFocus
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#080C19] border border-rose-500/60 rounded-2xl p-3.5 pr-12 pl-4 text-white text-base sm:text-sm outline-none focus:border-rose-400 transition shadow-inner placeholder:text-slate-600 min-h-[48px] force-ltr text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-2 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                  title={showAdminPasscode ? 'Hide' : 'Show'}
                >
                  {showAdminPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                {t('adminPasscodeHint')}
              </span>
            </div>

            <button
              type="submit"
              className="w-full font-black py-3.5 rounded-2xl transition shadow-lg mt-2 text-sm cursor-pointer active:scale-[0.99] min-h-[48px] flex items-center justify-center bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/25"
            >
              {t('submitAdmin')}
            </button>
          </form>
        )}

        {/* Security badge at bottom */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#00E5FF]" />
            {t('accountProtection')}
          </span>
          <span>{t('oneAccountPerDevice')}</span>
        </div>
      </div>
    </div>
  );
};
