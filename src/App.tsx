import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home,
  Trophy, 
  Users, 
  ShieldCheck, 
  Lock, 
  ShieldAlert, 
  Award,
  Sparkles
} from 'lucide-react';
import { Team, Match, Prediction, AppUser } from './types';
import { DEFAULT_TEAMS, INITIAL_MATCHES } from './data/defaultData';
import { setFriendAuthenticated, applySyncedFriendPassword, isFriendAuthenticated } from './utils/security';
import { 
  subscribeTeams, 
  syncSaveTeam, 
  syncDeleteTeam,
  subscribeMatches, 
  syncSaveMatch, 
  syncDeleteMatch, 
  subscribePredictions, 
  syncSavePrediction, 
  syncDeletePrediction, 
  subscribeUsers, 
  syncSaveUser,
  subscribeSecurityConfig
} from './lib/firebase';
import { SecurityGate } from './components/SecurityGate';
import { UclHeader } from './components/UclHeader';
import { UclStarsBackground } from './components/UclStarsBackground';
import { HomeSection } from './components/HomeSection';
import { MatchesSection } from './components/MatchesSection';
import { SquadsSection } from './components/SquadsSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { AdminSection } from './components/AdminSection';
import { RulesSlide } from './components/RulesSlide';
import { MembersPredictionsSlide } from './components/MembersPredictionsSlide';
import { AuthModal } from './components/AuthModal';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { ToastContainer, ToastMessage } from './components/ToastContainer';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useLanguage } from './i18n/LanguageContext';

const DB_VERSION = "2026.12_TEAMS_CLEARED";

export type TabType = 'home' | 'matches' | 'members_predictions' | 'leaderboard' | 'rules' | 'admin';

export default function App() {
  const { t, isRtl, language } = useLanguage();
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isFriendAuthenticated());
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Application Data States
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Modals & Toast State
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<'user' | 'admin'>('user');
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'admin'>('login');
  const [securityModalOpen, setSecurityModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [resetDbConfirmOpen, setResetDbConfirmOpen] = useState<boolean>(false);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Initialization
  useEffect(() => {
    // 1. Check friend password authentication status (respected if user selected Remember Me)
    const friendAuth = isFriendAuthenticated();
    setIsUnlocked(friendAuth);

    // 2. Initialize Database and LocalStorage
    const storedVersion = localStorage.getItem('cl_db_version');
    if (storedVersion !== DB_VERSION) {
      // Clear out all teams, players, and existing matches per user directive
      localStorage.setItem('cl_teams', JSON.stringify({}));
      localStorage.setItem('cl_matches', JSON.stringify([]));
      localStorage.setItem('cl_predictions', JSON.stringify({}));
      localStorage.setItem('cl_db_version', DB_VERSION);
      setTeams({});
      setMatches([]);
      setPredictions({});
    } else {
      // Load Teams
      const storedTeams = localStorage.getItem('cl_teams');
      setTeams(storedTeams ? JSON.parse(storedTeams) : {});

      // Load Matches
      const storedMatches = localStorage.getItem('cl_matches');
      setMatches(storedMatches ? JSON.parse(storedMatches) : []);

      // Load Predictions
      const storedPreds = localStorage.getItem('cl_predictions');
      setPredictions(storedPreds ? JSON.parse(storedPreds) : {});
    }

    // Load Users
    const storedUsers = localStorage.getItem('cl_users');
    let loadedUsers: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [];
    // Clean legacy amine
    loadedUsers = loadedUsers.filter(u => u.username.toLowerCase() !== 'amine');
    setUsers(loadedUsers);

    // Load Logged User
    const loggedUser = localStorage.getItem('cl_logged_user') || sessionStorage.getItem('cl_session_logged_user');
    if (loggedUser) {
      try {
        const parsed = JSON.parse(loggedUser);
        if (parsed.role === 'admin') {
          // Verify that the secret code was entered in this session
          const verified = sessionStorage.getItem('cl_admin_verified') === '05082007';
          if (!verified) {
            // Do not allow automatic admin login without entering admin secret code!
            localStorage.removeItem('cl_logged_user');
            sessionStorage.removeItem('cl_session_logged_user');
            setCurrentUser(null);
          } else {
            const found = loadedUsers.find(u => u.username.toLowerCase() === parsed.username.toLowerCase());
            setCurrentUser(found || parsed);
          }
        } else {
          // Regular member user
          const found = loadedUsers.find(u => u.username.toLowerCase() === parsed.username.toLowerCase());
          setCurrentUser(found || parsed);
        }
      } catch {
        setCurrentUser(null);
      }
    }

    // 3. Real-time Firebase Firestore Synchronizers
    const unsubTeams = subscribeTeams((firestoreTeams) => {
      if (firestoreTeams && Object.keys(firestoreTeams).length > 0) {
        setTeams(firestoreTeams);
        localStorage.setItem('cl_teams', JSON.stringify(firestoreTeams));
      }
    });

    const unsubMatches = subscribeMatches((firestoreMatches) => {
      if (firestoreMatches && firestoreMatches.length > 0) {
        setMatches(firestoreMatches);
        localStorage.setItem('cl_matches', JSON.stringify(firestoreMatches));
      }
    });

    const unsubPreds = subscribePredictions((firestorePreds) => {
      if (firestorePreds && Object.keys(firestorePreds).length > 0) {
        setPredictions(firestorePreds);
        localStorage.setItem('cl_predictions', JSON.stringify(firestorePreds));
      }
    });

    const unsubUsers = subscribeUsers((firestoreUsers) => {
      if (firestoreUsers && firestoreUsers.length > 0) {
        const cleanUsers = firestoreUsers.filter(u => u.username.toLowerCase() !== 'amine');
        setUsers(cleanUsers);
        localStorage.setItem('cl_users', JSON.stringify(cleanUsers));
      }
    });

    const unsubSecurity = subscribeSecurityConfig((data) => {
      if (data.friendPassword) {
        applySyncedFriendPassword(data.friendPassword);
      }
    });

    return () => {
      unsubTeams();
      unsubMatches();
      unsubPreds();
      unsubUsers();
      unsubSecurity();
    };
  }, []);

  // Auto-switch to matches if admin tab is somehow active without admin role
  useEffect(() => {
    if (activeTab === 'admin' && currentUser?.role !== 'admin') {
      setActiveTab('matches');
    }
  }, [activeTab, currentUser]);

  // Update handlers with Firestore real-time synchronization
  const handleUpdateUsers = (nextUsers: AppUser[]) => {
    setUsers(nextUsers);
    localStorage.setItem('cl_users', JSON.stringify(nextUsers));
    nextUsers.forEach(u => {
      syncSaveUser(u).catch(err => console.error("Firebase save user error:", err));
    });
    if (currentUser) {
      const updatedCurrent = nextUsers.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
      if (updatedCurrent) {
        setCurrentUser(updatedCurrent);
        if (localStorage.getItem('cl_logged_user')) {
          localStorage.setItem('cl_logged_user', JSON.stringify(updatedCurrent));
        }
        sessionStorage.setItem('cl_session_logged_user', JSON.stringify(updatedCurrent));
      }
    }
  };

  const handleUpdateMatches = (nextMatches: Match[]) => {
    setMatches(nextMatches);
    localStorage.setItem('cl_matches', JSON.stringify(nextMatches));
    nextMatches.forEach(m => {
      syncSaveMatch(m).catch(err => console.error("Firebase save match error:", err));
    });
  };

  const handleUpdateTeams = (nextTeams: Record<string, Team>) => {
    // Find and delete any teams removed in this update from Firestore
    const currentKeys = Object.keys(teams);
    const nextKeys = new Set(Object.keys(nextTeams));
    const deletedKeys = currentKeys.filter(k => !nextKeys.has(k));
    deletedKeys.forEach(id => {
      syncDeleteTeam(id).catch(err => console.error("Firebase delete team error:", err));
    });

    setTeams(nextTeams);
    localStorage.setItem('cl_teams', JSON.stringify(nextTeams));
    Object.entries(nextTeams).forEach(([id, t]) => {
      syncSaveTeam(id, t).catch(err => console.error("Firebase save team error:", err));
    });
  };

  const handleSavePrediction = (pred: Prediction) => {
    // Verify that match deadline has not passed before saving
    const match = matches.find(m => m.id === pred.matchId);
    if (match) {
      const isPastDeadline = new Date() > new Date(match.deadline);
      if (isPastDeadline || match.status === 'SETTLED') {
        addToast('عذراً، لقد انتهى موعد تقديم التوقعات لهذه المباراة (أغلقت المباراة)!', 'error');
        return;
      }
    }
    // Only save the member's latest prediction (overwriting any previous draft/prediction)
    const key = `${pred.username}_${pred.matchId}`;
    const updatedPred: Prediction = {
      ...pred,
      updatedAt: new Date().toISOString()
    };
    const nextPreds = { ...predictions, [key]: updatedPred };
    setPredictions(nextPreds);
    localStorage.setItem('cl_predictions', JSON.stringify(nextPreds));

    // Save to Firebase Firestore
    syncSavePrediction(updatedPred).catch(err => console.error("Firebase save prediction error:", err));

    addToast('تم حفظ وتحديث أحدث توقع لك بنجاح!', 'success');
  };

  const handleRequestDeleteMatch = (match: Match) => {
    setMatchToDelete(match);
  };

  const handleConfirmDeleteMatch = () => {
    if (!matchToDelete) return;
    const matchId = matchToDelete.id;
    const matchTitle = `${matchToDelete.homeTeam} ضد ${matchToDelete.awayTeam}`;
    const nextMatches = matches.filter(m => m.id !== matchId);
    setMatches(nextMatches);
    localStorage.setItem('cl_matches', JSON.stringify(nextMatches));

    // Delete match from Firestore
    syncDeleteMatch(matchId).catch(err => console.error("Firebase delete match error:", err));

    // Cleanup related predictions
    const nextPreds = { ...predictions };
    Object.keys(nextPreds).forEach(k => {
      if (nextPreds[k].matchId === matchId) {
        delete nextPreds[k];
        syncDeletePrediction(k).catch(err => console.error("Firebase delete prediction error:", err));
      }
    });
    setPredictions(nextPreds);
    localStorage.setItem('cl_predictions', JSON.stringify(nextPreds));
    setMatchToDelete(null);
    addToast(`تم حذف مباراة (${matchTitle}) بنجاح!`, 'success');
  };

  const handleResetDatabase = () => {
    setResetDbConfirmOpen(true);
  };

  const handleResetDatabaseConfirmed = () => {
    localStorage.setItem('cl_teams', JSON.stringify({}));
    localStorage.setItem('cl_matches', JSON.stringify([]));
    localStorage.setItem('cl_predictions', JSON.stringify({}));
    localStorage.setItem('cl_db_version', DB_VERSION);
    setTeams({});
    setMatches([]);
    setPredictions({});
    setResetDbConfirmOpen(false);
    addToast('تمت إعادة ضبط قاعدة البيانات (إفراغ كافة الفرق واللاعبين والمباريات)!', 'info');
  };

  const handleResetDeviceLock = () => {
    localStorage.removeItem('cl_device_user');
    addToast('تم إلغاء قيد هذا الجهاز بنجاح! يمكنك الآن تسجيل حساب عضو جديد.', 'info');
  };

  const handleLockApp = () => {
    setFriendAuthenticated(false);
    setIsUnlocked(false);
  };

  const handleOpenAuth = (roleOrTab: 'user' | 'admin' | 'login' | 'signup' = 'login') => {
    if (roleOrTab === 'admin') {
      setAuthModalRole('admin');
      setAuthModalTab('admin');
    } else if (roleOrTab === 'signup') {
      setAuthModalRole('user');
      setAuthModalTab('signup');
    } else {
      setAuthModalRole('user');
      setAuthModalTab('login');
    }
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: AppUser, remember: boolean = true) => {
    setCurrentUser(user);
    if (remember) {
      localStorage.setItem('cl_logged_user', JSON.stringify(user));
      sessionStorage.setItem('cl_session_logged_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cl_logged_user');
      sessionStorage.setItem('cl_session_logged_user', JSON.stringify(user));
    }
    if (user.role === 'admin') {
      sessionStorage.setItem('cl_admin_verified', '05082007');
      setActiveTab('admin');
    } else {
      sessionStorage.removeItem('cl_admin_verified');
      setActiveTab('home');
    }
  };

  const handleRegisterUser = (newUser: AppUser) => {
    const nextUsers = [...users, newUser];
    handleUpdateUsers(nextUsers);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cl_logged_user');
    sessionStorage.removeItem('cl_session_logged_user');
    sessionStorage.removeItem('cl_admin_verified');
    setActiveTab('home');
  };

  // Mobile Tab Swipe Navigation State & Logic
  const [slideDirection, setSlideDirection] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number; isValid: boolean } | null>(null);

  const getAvailableTabs = useCallback((): TabType[] => {
    const tabs: TabType[] = [
      'home',
      'matches',
      'members_predictions',
      'leaderboard',
      'rules'
    ];
    if (currentUser?.role === 'admin') {
      tabs.push('admin');
    }
    return tabs;
  }, [currentUser?.role]);

  const navigateToTab = useCallback((targetTab: TabType, direction?: number) => {
    if (targetTab === 'admin') {
      if (sessionStorage.getItem('cl_admin_verified') === '05082007') {
        if (direction !== undefined) setSlideDirection(direction);
        setActiveTab('admin');
      } else {
        handleOpenAuth('admin');
      }
      return;
    }

    if (direction !== undefined) {
      setSlideDirection(direction);
    } else {
      const tabs = getAvailableTabs();
      const currentIdx = tabs.indexOf(activeTab);
      const targetIdx = tabs.indexOf(targetTab);
      setSlideDirection(targetIdx > currentIdx ? 1 : -1);
    }

    setActiveTab(targetTab);

    // Subtle tactile vibration feedback on mobile when supported
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Safe catch for browsers that disallow vibration
      }
    }
  }, [activeTab, getAvailableTabs]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Disable tab swiping when any modal dialog is open
    if (authModalOpen || securityModalOpen || matchToDelete || resetDbConfirmOpen) {
      touchStartRef.current = null;
      return;
    }

    // Only handle single-finger swipe gestures
    if (e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const target = e.target as HTMLElement | null;
    // Don't trigger if touch originates on input elements, textareas, sliders, or horizontal scroll areas
    if (target && target.closest('input, textarea, select, [data-no-swipe], .overflow-x-auto, [role="slider"]')) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isValid: true
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !touchStartRef.current.isValid) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // If early movement is distinctly vertical, cancel tab swipe (normal page scrolling)
    if (Math.abs(deltaY) > 20 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
      touchStartRef.current.isValid = false;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !touchStartRef.current.isValid) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Must exceed horizontal threshold of 50px, duration under 650ms, and be clearly horizontal
    if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && duration < 650) {
      const tabs = getAvailableTabs();
      const currentIdx = tabs.indexOf(activeTab);

      // Solved: Reversed sliding direction on phone
      // Swiping finger towards Right (deltaX > 0) advances to the next tab
      // Swiping finger towards Left (deltaX < 0) goes back to the previous tab
      if (deltaX > 0) {
        if (currentIdx < tabs.length - 1) {
          navigateToTab(tabs[currentIdx + 1], 1);
        }
      } else {
        if (currentIdx > 0) {
          navigateToTab(tabs[currentIdx - 1], -1);
        }
      }
    }
  };

  // If friend is not authenticated, display the Security Gate
  if (!isUnlocked) {
    return <SecurityGate onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div 
      className="min-h-screen ucl-theme-bg relative text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Eye-Friendly Glowing UEFA Champions League Stars & Atmosphere Background */}
      <UclStarsBackground />

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        <div>
          {/* Navigation & Brand Header */}
        <UclHeader
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
          onLockApp={handleLockApp}
          onOpenSecurityModal={() => setSecurityModalOpen(true)}
          activeTab={activeTab}
          onSelectTab={(t) => setActiveTab(t as any)}
        />

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-3 sm:mt-5 pb-28 md:pb-8">
          
          {/* Desktop & Tablet Tabs Navigation (hidden on mobile) */}
          <div className="hidden md:flex border-b border-slate-800/80 mb-6 gap-2 overflow-x-auto pb-1 select-none">
            {/* 0. Home / الرئيسية (Main Page) */}
            <button
              onClick={() => navigateToTab('home')}
              className={`py-3 px-5 font-bold rounded-t-2xl border-b-2 flex items-center gap-2.5 transition shrink-0 text-xs sm:text-sm cursor-pointer ${
                activeTab === 'home'
                  ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/15 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <Home className="w-4 h-4 text-[#00E5FF]" />
              <span>{t('tabHome')}</span>
            </button>

            {/* 1. Matches and Predictions */}
            <button
              onClick={() => navigateToTab('matches')}
              className={`py-3 px-5 font-bold rounded-t-2xl border-b-2 flex items-center gap-2.5 transition shrink-0 text-xs sm:text-sm cursor-pointer ${
                activeTab === 'matches'
                  ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/15 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>{t('tabMatches')}</span>
            </button>

            {/* 2. Members Predictions */}
            <button
              onClick={() => navigateToTab('members_predictions')}
              className={`py-3 px-5 font-bold rounded-t-2xl border-b-2 flex items-center gap-2.5 transition shrink-0 text-xs sm:text-sm cursor-pointer ${
                activeTab === 'members_predictions'
                  ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/15 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <Users className="w-4 h-4 text-[#00E5FF]" />
              <span>{t('tabMembersPredictions')}</span>
            </button>

            {/* 3. Leaderboard */}
            <button
              onClick={() => navigateToTab('leaderboard')}
              className={`py-3 px-5 font-bold rounded-t-2xl border-b-2 flex items-center gap-2.5 transition shrink-0 text-xs sm:text-sm cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/15 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>{t('tabLeaderboard')}</span>
            </button>

            {/* 4. Rules */}
            <button
              onClick={() => navigateToTab('rules')}
              className={`py-3 px-5 font-bold rounded-t-2xl border-b-2 flex items-center gap-2.5 transition shrink-0 text-xs sm:text-sm cursor-pointer ${
                activeTab === 'rules'
                  ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/15 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#00E5FF]" />
              <span>{t('tabRules')}</span>
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => navigateToTab('admin')}
                className={`py-3 px-5 font-bold rounded-t-2xl border-b-2 flex items-center gap-2.5 transition shrink-0 text-xs sm:text-sm cursor-pointer ${
                  activeTab === 'admin'
                    ? 'border-rose-500 text-rose-400 bg-rose-950/30'
                    : 'border-transparent text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>{t('tabAdmin')}</span>
              </button>
            )}
          </div>

          {/* Mobile Swipe Navigation Hint & Interactive Dots Bar */}
          <div className="md:hidden mb-4 bg-[#080C19]/80 border border-slate-800/80 rounded-2xl p-2.5 flex items-center justify-between text-xs text-slate-300 shadow-inner select-none backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-[11px] leading-tight truncate">
                <span className="font-bold text-white block">{t('swipeHint')}</span>
                <span className="text-slate-400 text-[10px]">{t('swipeSubhint')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 pl-1 shrink-0">
              {getAvailableTabs().map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => navigateToTab(tab)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    activeTab === tab ? 'w-6 bg-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  title={tab}
                  aria-label={tab}
                />
              ))}
            </div>
          </div>

          {/* Tab Views with Touch Swipe & Fluid Animated Transitions */}
          <main
            className="relative min-h-[500px] touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: slideDirection > 0 ? -16 : slideDirection < 0 ? 16 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection > 0 ? 16 : slideDirection < 0 ? -16 : 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {activeTab === 'home' && (
                  <HomeSection
                    currentUser={currentUser}
                    matches={matches}
                    users={users}
                    predictions={predictions}
                    onNavigate={(tab) => navigateToTab(tab)}
                    onOpenAuth={handleOpenAuth}
                  />
                )}

                {activeTab === 'matches' && (
                  <MatchesSection
                    matches={matches}
                    teams={teams}
                    predictions={predictions}
                    currentUser={currentUser}
                    onSavePrediction={handleSavePrediction}
                    onDeleteMatch={handleRequestDeleteMatch}
                    onOpenAuth={() => handleOpenAuth('user')}
                  />
                )}

                {activeTab === 'members_predictions' && (
                  <MembersPredictionsSlide
                    matches={matches}
                    teams={teams}
                    predictions={predictions}
                    users={users}
                  />
                )}

                {activeTab === 'leaderboard' && (
                  <LeaderboardSection
                    users={users}
                    matches={matches}
                    predictions={predictions}
                  />
                )}

                {activeTab === 'rules' && (
                  <RulesSlide onStartPredicting={() => navigateToTab('matches')} />
                )}

                {activeTab === 'admin' && currentUser?.role === 'admin' && (
                  <AdminSection
                    matches={matches}
                    teams={teams}
                    users={users}
                    predictions={predictions}
                    currentUser={currentUser}
                    onUpdateUsers={handleUpdateUsers}
                    onUpdateMatches={handleUpdateMatches}
                    onUpdateTeams={handleUpdateTeams}
                    onResetDeviceLock={handleResetDeviceLock}
                    onResetDatabase={handleResetDatabase}
                    onAdminAuthenticated={handleLoginSuccess}
                    onShowToast={addToast}
                    onRequestDeleteMatch={handleRequestDeleteMatch}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

        {/* Mobile Bottom Navigation Bar (Visible only on phone/mobile screens) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080C19]/95 border-t border-slate-800/80 backdrop-blur-2xl px-1.5 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
          <button
            onClick={() => navigateToTab('home')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-2xl transition cursor-pointer min-w-[50px] min-h-[48px] ${
              activeTab === 'home'
                ? 'text-[#00E5FF] font-black bg-[#00E5FF]/15 border border-[#00E5FF]/30'
                : 'text-[#94A3B8] font-bold hover:text-white'
            }`}
          >
            <Home className="w-5 h-5 text-[#00E5FF]" />
            <span className="text-[10px]">{t('tabHomeShort')}</span>
          </button>

          <button
            onClick={() => navigateToTab('matches')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-2xl transition cursor-pointer min-w-[50px] min-h-[48px] ${
              activeTab === 'matches'
                ? 'text-[#00E5FF] font-black bg-[#00E5FF]/15 border border-[#00E5FF]/30'
                : 'text-[#94A3B8] font-bold hover:text-white'
            }`}
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-[10px]">{t('tabMatchesShort')}</span>
          </button>

          <button
            onClick={() => navigateToTab('members_predictions')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition cursor-pointer min-w-[56px] min-h-[48px] ${
              activeTab === 'members_predictions'
                ? 'text-[#00E5FF] font-black bg-[#00E5FF]/15 border border-[#00E5FF]/30'
                : 'text-[#94A3B8] font-bold hover:text-white'
            }`}
          >
            <Users className="w-5 h-5 text-[#00E5FF]" />
            <span className="text-[10px]">{t('tabMembersPredictionsShort')}</span>
          </button>

          <button
            onClick={() => navigateToTab('leaderboard')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition cursor-pointer min-w-[56px] min-h-[48px] ${
              activeTab === 'leaderboard'
                ? 'text-[#00E5FF] font-black bg-[#00E5FF]/15 border border-[#00E5FF]/30'
                : 'text-[#94A3B8] font-bold hover:text-white'
            }`}
          >
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-[10px]">{t('tabLeaderboardShort')}</span>
          </button>

          <button
            onClick={() => navigateToTab('rules')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition cursor-pointer min-w-[56px] min-h-[48px] ${
              activeTab === 'rules'
                ? 'text-[#00E5FF] font-black bg-[#00E5FF]/15 border border-[#00E5FF]/30'
                : 'text-[#94A3B8] font-bold hover:text-white'
            }`}
          >
            <Sparkles className="w-5 h-5 text-[#00E5FF]" />
            <span className="text-[10px]">{t('tabRulesShort')}</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => navigateToTab('admin')}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition cursor-pointer min-w-[64px] min-h-[48px] ${
                activeTab === 'admin'
                  ? 'text-rose-400 font-black bg-rose-500/20 border border-rose-500/30'
                  : 'text-slate-400 font-bold hover:text-rose-300'
              }`}
            >
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span className="text-[10px]">{t('tabAdminShort')}</span>
            </button>
          )}
        </nav>

      {/* Top Banner Toast Notifications (Works seamlessly on Phone & PC) */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Match Delete Custom Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(matchToDelete)}
        title={language === 'fr' ? 'Confirmer la suppression' : language === 'en' ? 'Confirm Match Deletion' : 'تأكيد حذف المباراة'}
        message={
          matchToDelete
            ? language === 'fr'
              ? `Êtes-vous sûr de vouloir supprimer définitivement le match (${matchToDelete.homeTeam} contre ${matchToDelete.awayTeam}) ? Tous les pronostics associés seront supprimés.`
              : language === 'en'
              ? `Are you sure you want to permanently delete (${matchToDelete.homeTeam} vs ${matchToDelete.awayTeam})? All associated predictions will be removed.`
              : `هل أنت متأكد من حذف مباراة (${matchToDelete.homeTeam} ضد ${matchToDelete.awayTeam}) نهائياً؟ سيتم حذف جميع التوقعات المرتبطة بها.`
            : ''
        }
        confirmText={language === 'fr' ? 'Oui, supprimer le match' : language === 'en' ? 'Yes, Delete Match' : 'نعم، احذف المباراة'}
        cancelText={language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'إلغاء التراجع'}
        isDestructive={true}
        onConfirm={handleConfirmDeleteMatch}
        onCancel={() => setMatchToDelete(null)}
      />

      {/* Reset DB Custom Confirmation Modal */}
      <ConfirmDialog
        isOpen={resetDbConfirmOpen}
        title={language === 'fr' ? 'Réinitialiser la base de données' : language === 'en' ? 'Reset Database' : 'إعادة ضبط قاعدة البيانات'}
        message={
          language === 'fr'
            ? 'Êtes-vous sûr de vouloir réinitialiser toutes les données des clubs, joueurs et matchs ?'
            : language === 'en'
            ? 'Are you sure you want to reset all clubs, players, and match data?'
            : 'هل أنت متأكد من رغبتك في إعادة ضبط بيانات الفرق الافتراضية والـ 36 فريق والمباريات؟'
        }
        confirmText={language === 'fr' ? 'Oui, réinitialiser' : language === 'en' ? 'Yes, Reset Database' : 'نعم، إعادة ضبط'}
        cancelText={language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'إلغاء'}
        isDestructive={true}
        onConfirm={handleResetDatabaseConfirmed}
        onCancel={() => setResetDbConfirmOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialRole={authModalRole}
        initialTab={authModalTab}
        users={users}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={handleRegisterUser}
      />

      {/* Security & Biometrics Settings Modal */}
      <SecuritySettingsModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        isAdmin={currentUser?.role === 'admin'}
      />

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
          <p>{t('footerCopyright')}</p>
        </footer>
      </div>
    </div>
  );
}
