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
  BookmarkCheck,
  Send,
  Loader2,
  ArrowLeft,
  ArrowRight,
  MailCheck
} from 'lucide-react';
import { AppUser } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { syncSaveUser } from '../lib/firebase';

export type AuthSlide = 'login' | 'signup' | 'admin' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  initialRole?: 'user' | 'admin';
  initialTab?: AuthSlide;
  users: AppUser[];
  onClose: () => void;
  onLoginSuccess: (user: AppUser, remember?: boolean) => void;
  onRegisterUser: (newUser: AppUser) => void;
  onUpdateUserPassword?: (username: string, newPassword: string) => Promise<void> | void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialRole = 'user',
  initialTab,
  users,
  onClose,
  onLoginSuccess,
  onRegisterUser,
  onUpdateUserPassword
}) => {
  const { t, isRtl, language } = useLanguage();
  
  // Current active slide: 'login' | 'signup' | 'admin' | 'forgot'
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

  // Direct Password Recovery states ('email' -> 'password' -> 'success')
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'password' | 'success'>('email');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [targetRecoveryUser, setTargetRecoveryUser] = useState<AppUser | null>(null);
  const [newRecoveryPassword, setNewRecoveryPassword] = useState('');
  const [confirmRecoveryPassword, setConfirmRecoveryPassword] = useState('');
  const [showNewRecoveryPassword, setShowNewRecoveryPassword] = useState(false);
  const [showConfirmRecoveryPassword, setShowConfirmRecoveryPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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
    setRecoveryEmail('');
    setRecoveryStep('email');
    setTargetRecoveryUser(null);
    setNewRecoveryPassword('');
    setConfirmRecoveryPassword('');
    setShowNewRecoveryPassword(false);
    setShowConfirmRecoveryPassword(false);
    setIsUpdatingPassword(false);
    setShowLoginPassword(false);
    setShowSignupPassword(false);
    setShowSignupConfirmPassword(false);
    setShowAdminPasscode(false);
  }, [initialRole, initialTab, isOpen]);

  if (!isOpen) return null;

  // Step 1: Check if email exists in records/state and immediately advance to "Set New Password"
  const handleContinueRecoveryEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusAlert(null);

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setStatusAlert({
        type: 'error',
        text: t('errorInvalidRecoveryEmail')
      });
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
    if (!emailPattern.test(cleanEmail)) {
      setStatusAlert({
        type: 'error',
        text: t('errorInvalidRecoveryEmail')
      });
      return;
    }

    // Check if account exists with this email or username
    const matchingUser = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      u.username.toLowerCase() === cleanEmail ||
      (u.originalUsername && u.originalUsername.toLowerCase() === cleanEmail)
    );

    if (!matchingUser) {
      setStatusAlert({
        type: 'error',
        text: t('errorAccountNotFoundWithEmail')
      });
      return;
    }

    // Email exists in records: advance immediately to Set New Password
    setTargetRecoveryUser(matchingUser);
    setRecoveryStep('password');
    setStatusAlert(null);
  };

  // Step 2: Directly update password for that account
  const handleSetNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusAlert(null);

    if (!targetRecoveryUser) {
      setRecoveryStep('email');
      return;
    }

    const cleanPassword = newRecoveryPassword.trim();
    const cleanConfirm = confirmRecoveryPassword.trim();

    if (!cleanPassword) {
      setStatusAlert({
        type: 'error',
        text: t('authMustEnterPassword')
      });
      return;
    }

    if (cleanPassword.length < 3) {
      setStatusAlert({
        type: 'error',
        text: language === 'ar' 
          ? 'كلمة المرور يجب أن تتكون من 3 خانات أو أكثر لحماية حسابك.' 
          : language === 'fr' 
          ? 'Le mot de passe doit comporter au moins 3 caractères.' 
          : 'Password must be at least 3 characters.'
      });
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setStatusAlert({
        type: 'error',
        text: t('authPasswordMismatch')
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (onUpdateUserPassword) {
        await onUpdateUserPassword(targetRecoveryUser.username, cleanPassword);
      } else {
        await syncSaveUser({ ...targetRecoveryUser, password: cleanPassword });
      }

      // Update local storage remembered credentials if this user was remembered
      try {
        const rememberedUser = localStorage.getItem('cl_remembered_username');
        if (
          rememberedUser && 
          (rememberedUser.toLowerCase() === targetRecoveryUser.username.toLowerCase() || 
           (targetRecoveryUser.originalUsername && rememberedUser.toLowerCase() === targetRecoveryUser.originalUsername.toLowerCase()))
        ) {
          localStorage.setItem('cl_remembered_password', cleanPassword);
        }
      } catch {
        // Ignore storage access error
      }

      setRecoveryStep('success');
      setStatusAlert(null);
    } catch (err: any) {
      setStatusAlert({
        type: 'error',
        text: err?.message || 'Error updating password. Please try again.'
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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
    // Allow login with:
    // 1. Current username
    // 2. Old original name put in the first place (originalUsername)
    // 3. Registered Gmail address
    const existingUser = users.find(u => 
      u.username.toLowerCase() === lowerName || 
      (u.originalUsername && u.originalUsername.toLowerCase() === lowerName) ||
      (u.email && u.email.toLowerCase() === lowerName)
    );

    if (!existingUser) {
      setStatusAlert({
        type: 'error',
        text: t('authUserNotFound')
      });
      return;
    }

    if (existingUser.password !== cleanPassword) {
      setStatusAlert({
        type: 'error',
        text: t('authWrongPassword')
      });
      return;
    }

    if (existingUser.status === 'pending') {
      setStatusAlert({
        type: 'error',
        text: t('authApprovalPending')
      });
      return;
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
      originalUsername: cleanUsername,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl relative border border-[#253745] bg-[#11212D] text-[#CCD0CF] max-h-[92vh] overflow-y-auto no-scrollbar"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-4">
          <LanguageSwitcher variant="header-mobile" />

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#253745] hover:bg-[#4A5C6A] text-[#9BA8AB] hover:text-[#CCD0CF] transition-all duration-200 cursor-pointer"
            title={t('closeModal')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Mode Toggle Bar (Login | Sign Up | Admin | Forgot) */}
        {activeSlide === 'forgot' ? (
          <div className="flex items-center justify-between p-2 bg-[#06141B] rounded-xl border border-[#253745] mb-4">
            <button
              type="button"
              onClick={() => {
                setActiveSlide('login');
                setStatusAlert(null);
                setRecoveryStep('email');
              }}
              className="text-xs text-[#CCD0CF] hover:text-white font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#253745] hover:bg-[#4A5C6A] transition-colors cursor-pointer"
            >
              {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{t('backToLoginBtn')}</span>
            </button>
            <span className="text-[11px] text-[#9BA8AB] font-mono px-2">
              {recoveryStep === 'password' ? t('setNewPasswordTitle') : t('forgotPasswordTitle')}
            </span>
          </div>
        ) : (
          <div className="flex p-1 bg-[#06141B] rounded-xl border border-[#253745] mb-4 gap-1">
            {/* Slide 1: Login */}
            <button 
              type="button" 
              onClick={() => { setActiveSlide('login'); setStatusAlert(null); }}
              className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                activeSlide === 'login' 
                  ? 'bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745]' 
                  : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>{t('tabLogin')}</span>
            </button>

            {/* Slide 2: Sign Up */}
            <button 
              type="button" 
              onClick={() => { setActiveSlide('signup'); setStatusAlert(null); }}
              className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                activeSlide === 'signup' 
                  ? 'bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745]' 
                  : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>{t('tabSignup')}</span>
            </button>

            {/* Slide 3: Admin */}
            <button 
              type="button" 
              onClick={() => { setActiveSlide('admin'); setStatusAlert(null); }}
              className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                activeSlide === 'admin' 
                  ? 'bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745]' 
                  : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{t('tabAdminPortal')}</span>
            </button>
          </div>
        )}

        {/* Slide Header Titles */}
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-bold mb-1 flex items-center gap-2 text-[#CCD0CF]">
            {activeSlide === 'login' && (
              <>
                <UserCheck className="w-4 h-4 text-[#CCD0CF] shrink-0" />
                <span>
                  {language === 'ar' ? 'تسجيل دخول الأعضاء' : language === 'fr' ? 'Connexion des Membres' : 'Member Login'}
                </span>
              </>
            )}
            {activeSlide === 'signup' && (
              <>
                <UserPlus className="w-4 h-4 text-[#CCD0CF] shrink-0" />
                <span>
                  {language === 'ar' ? 'إنشاء حساب عضو جديد' : language === 'fr' ? 'Créer un Compte Membre' : 'Create Member Account'}
                </span>
              </>
            )}
            {activeSlide === 'admin' && (
              <>
                <ShieldAlert className="w-4 h-4 text-[#CCD0CF] shrink-0" />
                <span>
                  {language === 'ar' ? 'بوابة الإدارة والتحكم (Admin)' : language === 'fr' ? 'Portail Administration (Admin)' : 'Admin Management Portal'}
                </span>
              </>
            )}
            {activeSlide === 'forgot' && (
              <>
                <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {recoveryStep === 'password' ? t('setNewPasswordTitle') : t('forgotPasswordTitle')}
                </span>
              </>
            )}
          </h3>

          <p className="text-xs text-[#9BA8AB] leading-relaxed">
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
            {activeSlide === 'forgot' && (
              recoveryStep === 'password' ? t('setNewPasswordDesc') : t('forgotPasswordDesc')
            )}
          </p>
        </div>

        {/* Status Alert Notification */}
        {statusAlert && (
          <div className={`mb-3.5 p-2.5 rounded-xl border text-xs font-medium leading-relaxed flex items-start gap-2 ${
            statusAlert.type === 'error'
              ? 'bg-[#253745] border-rose-500/50 text-[#CCD0CF]'
              : statusAlert.type === 'success'
              ? 'bg-[#253745] border-emerald-500/50 text-[#CCD0CF]'
              : 'bg-[#253745] border-[#4A5C6A] text-[#CCD0CF]'
          }`}>
            {statusAlert.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : statusAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-[#9BA8AB] shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{statusAlert.text}</div>
          </div>
        )}

        {/* SLIDE 1: LOGIN FORM */}
        {activeSlide === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#CCD0CF] mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#9BA8AB]" />
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
                className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 text-[#CCD0CF] text-xs sm:text-sm outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all duration-200 placeholder:text-[#9BA8AB]/50 force-ltr text-left font-mono"
              />
              <span className="text-[10.5px] text-[#9BA8AB] mt-1 block">
                {isRtl 
                  ? '💡 يمكنك تسجيل الدخول باسمك الحالي أو بالاسم القديم الذي وضعته أول مرة' 
                  : language === 'fr'
                  ? '💡 Vous pouvez vous connecter avec votre nom actuel ou votre nom d\'inscription d\'origine'
                  : '💡 You can log in with your current name or original registration name'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#CCD0CF] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#9BA8AB]" />
                  <span>{t('password')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSlide('forgot');
                    setStatusAlert(null);
                    setRecoveryStep('email');
                  }}
                  className="text-[11px] text-[#CCD0CF] hover:text-white font-medium hover:underline transition-colors cursor-pointer"
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative" dir="ltr">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  dir="ltr"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 pr-10 pl-3 text-[#CCD0CF] text-xs sm:text-sm outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all duration-200 placeholder:text-[#9BA8AB]/50 force-ltr text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9BA8AB] hover:text-[#CCD0CF] transition p-1.5 cursor-pointer"
                  title={showLoginPassword ? 'Hide' : 'Show'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#9BA8AB]" />}
                </button>
              </div>
            </div>

            {/* Remember Login Credentials */}
            <div 
              onClick={() => setRememberLogin(!rememberLogin)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                rememberLogin 
                  ? 'bg-[#253745] border-[#4A5C6A] text-[#CCD0CF]' 
                  : 'bg-[#06141B] border-[#253745] text-[#9BA8AB] hover:border-[#4A5C6A]'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember_login_cb"
                  checked={rememberLogin}
                  onChange={(e) => setRememberLogin(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded accent-[#4A5C6A] cursor-pointer bg-[#06141B] border-[#253745]"
                />
                <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs font-semibold text-[#CCD0CF] flex items-center gap-1.5">
                    <BookmarkCheck className={`w-3.5 h-3.5 ${rememberLogin ? 'text-[#CCD0CF]' : 'text-[#9BA8AB]'}`} />
                    {t('rememberLogin')}
                  </span>
                  <span className="text-[10px] text-[#9BA8AB]">
                    {t('rememberLoginDesc')}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                rememberLogin 
                  ? 'bg-[#4A5C6A] text-[#CCD0CF] border-[#4A5C6A]' 
                  : 'bg-[#253745] text-[#9BA8AB] border-[#253745]'
              }`}>
                {t('permanentSave')}
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold py-3 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer active:scale-[0.98] flex items-center justify-center mt-2 shadow"
            >
              {t('submitLogin')}
            </button>

            <div className="text-center pt-2 flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setActiveSlide('signup'); setStatusAlert(null); }}
                className="text-xs text-[#CCD0CF] hover:underline cursor-pointer font-semibold inline-flex items-center gap-1"
              >
                <span>{t('tabSignup')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSlide('forgot');
                  setStatusAlert(null);
                  setRecoveryStep('email');
                }}
                className="text-xs text-[#9BA8AB] hover:text-[#CCD0CF] hover:underline cursor-pointer font-medium inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-[#253745]/60 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('forgotPassword')}</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveSlide('admin'); setStatusAlert(null); }}
                className="text-xs text-[#9BA8AB] hover:text-[#CCD0CF] hover:underline cursor-pointer font-medium inline-flex items-center gap-1 py-0.5 px-2.5 rounded-lg bg-[#253745] border border-[#253745] transition-all duration-200 mt-0.5"
              >
                <ShieldAlert className="w-3 h-3 text-[#CCD0CF]" />
                <span>{t('adminLoginQuickPrompt')}</span>
              </button>
            </div>
          </form>
        )}

        {/* SLIDE 2: SIGN UP FORM */}
        {activeSlide === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#CCD0CF] mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#9BA8AB]" />
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
                className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-2.5 sm:p-3 text-[#CCD0CF] text-xs sm:text-sm outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all duration-200 placeholder:text-[#9BA8AB]/50 force-ltr text-left font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD0CF] mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#9BA8AB]" />
                <span>{t('authGmailRequired')}</span>
              </label>
              <input
                type="email"
                required
                dir="ltr"
                value={signupGmail}
                onChange={(e) => setSignupGmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-2.5 sm:p-3 text-[#CCD0CF] text-xs sm:text-sm outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all duration-200 placeholder:text-[#9BA8AB]/50 force-ltr text-left font-mono"
              />
              <span className="text-[10px] text-[#9BA8AB] mt-0.5 block">
                {language === 'ar' ? 'يجب أن يكون بريداً صالحاً ينتهي بـ @gmail.com' : language === 'fr' ? 'Doit être une adresse se terminant par @gmail.com' : 'Must be a valid email ending with @gmail.com'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD0CF] mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#9BA8AB]" />
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
                  className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-2.5 sm:p-3 pr-9 pl-3 text-[#CCD0CF] text-xs sm:text-sm outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all duration-200 placeholder:text-[#9BA8AB]/50 force-ltr text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9BA8AB] hover:text-[#CCD0CF] transition p-1 cursor-pointer"
                  title={showSignupPassword ? 'Hide' : 'Show'}
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD0CF] mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#9BA8AB]" />
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
                  className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-2.5 sm:p-3 pr-9 pl-3 text-[#CCD0CF] text-xs sm:text-sm outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all duration-200 placeholder:text-[#9BA8AB]/50 force-ltr text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9BA8AB] hover:text-[#CCD0CF] transition p-1 cursor-pointer"
                  title={showSignupConfirmPassword ? 'Hide' : 'Show'}
                >
                  {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold py-3 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer active:scale-[0.98] flex items-center justify-center mt-2 shadow"
            >
              {t('submitSignup')}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setActiveSlide('login'); setStatusAlert(null); }}
                className="text-xs text-[#CCD0CF] hover:underline cursor-pointer font-semibold inline-flex items-center gap-1"
              >
                <span>{t('hasAccountLink')}</span>
              </button>
            </div>
          </form>
        )}

        {/* SLIDE 3: ADMIN FORM */}
        {activeSlide === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#9BA8AB]" />
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
                  className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 pr-10 pl-3 text-[#CCD0CF] text-xs sm:text-sm outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all duration-200 placeholder:text-[#9BA8AB]/50 force-ltr text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9BA8AB] hover:text-[#CCD0CF] transition p-1.5 cursor-pointer"
                  title={showAdminPasscode ? 'Hide' : 'Show'}
                >
                  {showAdminPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#9BA8AB]" />}
                </button>
              </div>
              <span className="text-[11px] text-[#9BA8AB] mt-1 block">
                {t('adminPasscodeHint')}
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold py-3 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer active:scale-[0.98] flex items-center justify-center mt-2 shadow"
            >
              {t('submitAdmin')}
            </button>
          </form>
        )}

        {/* SLIDE 4: FORGOT PASSWORD / DIRECT RECOVERY (BYPASS EMAIL DISPATCH) */}
        {activeSlide === 'forgot' && (
          <div className="space-y-4">
            {/* Step 1: Input registered email address & Continue */}
            {recoveryStep === 'email' && (
              <form onSubmit={handleContinueRecoveryEmail} className="space-y-4">
                <div className="bg-[#06141B] p-3.5 rounded-xl border border-[#253745] flex items-start gap-2.5">
                  <KeyRound className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-[#9BA8AB] leading-relaxed">
                    <strong className="text-white block font-semibold mb-0.5">{t('forgotPasswordTitle')}</strong>
                    {t('forgotPasswordDesc')}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#9BA8AB]" />
                    <span>{t('recoveryEmailLabel')}</span>
                  </label>
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={recoveryEmail}
                    onChange={(e) => {
                      setRecoveryEmail(e.target.value);
                      if (statusAlert) setStatusAlert(null);
                    }}
                    placeholder={t('recoveryEmailPlaceholder')}
                    autoFocus
                    className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 text-[#CCD0CF] text-xs sm:text-sm outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all duration-200 placeholder:text-[#9BA8AB]/50 force-ltr text-left font-mono"
                  />
                  <span className="text-[10px] text-[#9BA8AB] mt-1 block">
                    {t('gmailHint')}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={!recoveryEmail.trim()}
                    className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold py-3 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 shadow disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span>{t('continueBtn')}</span>
                    {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlide('login');
                      setStatusAlert(null);
                      setRecoveryStep('email');
                    }}
                    className="w-full py-2.5 px-3 text-xs text-[#9BA8AB] hover:text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                    <span>{t('backToLoginBtn')}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Set New Password Form */}
            {recoveryStep === 'password' && targetRecoveryUser && (
              <form onSubmit={handleSetNewPasswordSubmit} className="space-y-3.5">
                <div className="bg-[#06141B] p-3 rounded-xl border border-[#253745] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#CCD0CF]" />
                    <div className="text-xs">
                      <span className="text-[#9BA8AB] block text-[10px]">{t('updatingForAccount')}</span>
                      <span className="font-bold text-white font-mono">{targetRecoveryUser.username}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#9BA8AB] bg-[#253745] px-2 py-0.5 rounded">
                    {targetRecoveryUser.email}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#9BA8AB]" />
                    <span>{t('newPasswordLabel')}</span>
                  </label>
                  <div className="relative" dir="ltr">
                    <input
                      type={showNewRecoveryPassword ? 'text' : 'password'}
                      required
                      dir="ltr"
                      autoFocus
                      value={newRecoveryPassword}
                      onChange={(e) => {
                        setNewRecoveryPassword(e.target.value);
                        if (statusAlert) setStatusAlert(null);
                      }}
                      placeholder={t('newPasswordPlaceholder')}
                      className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 pr-10 pl-3 text-[#CCD0CF] text-xs sm:text-sm outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all duration-200 placeholder:text-[#9BA8AB]/50 force-ltr text-left font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewRecoveryPassword(!showNewRecoveryPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9BA8AB] hover:text-[#CCD0CF] transition p-1.5 cursor-pointer"
                      title={showNewRecoveryPassword ? 'Hide' : 'Show'}
                    >
                      {showNewRecoveryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#9BA8AB]" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#9BA8AB]" />
                    <span>{t('confirmNewPasswordLabel')}</span>
                  </label>
                  <div className="relative" dir="ltr">
                    <input
                      type={showConfirmRecoveryPassword ? 'text' : 'password'}
                      required
                      dir="ltr"
                      value={confirmRecoveryPassword}
                      onChange={(e) => {
                        setConfirmRecoveryPassword(e.target.value);
                        if (statusAlert) setStatusAlert(null);
                      }}
                      placeholder={t('confirmNewPasswordPlaceholder')}
                      className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 pr-10 pl-3 text-[#CCD0CF] text-xs sm:text-sm outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all duration-200 placeholder:text-[#9BA8AB]/50 force-ltr text-left font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmRecoveryPassword(!showConfirmRecoveryPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9BA8AB] hover:text-[#CCD0CF] transition p-1.5 cursor-pointer"
                      title={showConfirmRecoveryPassword ? 'Hide' : 'Show'}
                    >
                      {showConfirmRecoveryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#9BA8AB]" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !newRecoveryPassword.trim() || !confirmRecoveryPassword.trim()}
                    className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold py-3 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 shadow disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('updatingPassword')}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>{t('updatePasswordBtn')}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlide('login');
                      setStatusAlert(null);
                      setRecoveryStep('email');
                    }}
                    className="w-full py-2.5 px-3 text-xs text-[#9BA8AB] hover:text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                    <span>{t('backToLoginBtn')}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success Confirmation State */}
            {recoveryStep === 'success' && (
              <div className="space-y-4 py-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1.5">
                    {t('resetLinkSentTitle')}
                  </h4>
                  <p className="text-xs text-[#9BA8AB] leading-relaxed max-w-sm mx-auto">
                    {t('passwordUpdatedSuccess')}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (targetRecoveryUser) {
                        setLoginUsername(targetRecoveryUser.username);
                        setLoginPassword(newRecoveryPassword);
                      }
                      setActiveSlide('login');
                      setStatusAlert({
                        type: 'success',
                        text: t('passwordUpdatedSuccess')
                      });
                      setRecoveryStep('email');
                      setRecoveryEmail('');
                      setNewRecoveryPassword('');
                      setConfirmRecoveryPassword('');
                      setTargetRecoveryUser(null);
                    }}
                    className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold py-3 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 shadow"
                  >
                    {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                    <span>{t('backToLoginBtn')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security badge at bottom */}
        <div className="mt-4 pt-3 border-t border-[#253745] flex items-center justify-between text-[11px] text-[#9BA8AB]">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#CCD0CF]" />
            {t('accountProtection')}
          </span>
          <span>{t('oneAccountPerDevice')}</span>
        </div>
      </div>
    </div>
  );
};
