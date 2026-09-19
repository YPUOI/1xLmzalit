import React, { useState, useEffect } from 'react';
import { 
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
import { isFriendAuthenticated, setFriendAuthenticated } from './utils/security';
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
  syncSaveUser 
} from './lib/firebase';
import { SecurityGate } from './components/SecurityGate';
import { UclHeader } from './components/UclHeader';
import { MatchesSection } from './components/MatchesSection';
import { SquadsSection } from './components/SquadsSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { AdminSection } from './components/AdminSection';
import { AuthModal } from './components/AuthModal';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { ToastContainer, ToastMessage } from './components/ToastContainer';
import { ConfirmDialog } from './components/ConfirmDialog';

const DB_VERSION = "2026.12_TEAMS_CLEARED";

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard' | 'admin'>('matches');

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
    // 1. Check if friend is authenticated
    const authenticated = isFriendAuthenticated();
    setIsUnlocked(authenticated);

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
    const loggedUser = localStorage.getItem('cl_logged_user');
    if (loggedUser) {
      try {
        const parsed = JSON.parse(loggedUser);
        if (parsed.role === 'admin') {
          // Verify that the secret code was entered in this session
          const verified = sessionStorage.getItem('cl_admin_verified') === '05082007';
          if (!verified) {
            // Do not allow automatic admin login without entering admin secret code!
            localStorage.removeItem('cl_logged_user');
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

    return () => {
      unsubTeams();
      unsubMatches();
      unsubPreds();
      unsubUsers();
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
        localStorage.setItem('cl_logged_user', JSON.stringify(updatedCurrent));
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

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('cl_logged_user', JSON.stringify(user));
    if (user.role === 'admin') {
      sessionStorage.setItem('cl_admin_verified', '05082007');
      setActiveTab('admin');
    } else {
      sessionStorage.removeItem('cl_admin_verified');
      setActiveTab('matches');
    }
  };

  const handleRegisterUser = (newUser: AppUser) => {
    const nextUsers = [...users, newUser];
    handleUpdateUsers(nextUsers);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cl_logged_user');
    sessionStorage.removeItem('cl_admin_verified');
    setActiveTab('matches');
  };

  // If friend is not authenticated, display the Security Gate
  if (!isUnlocked) {
    return <SecurityGate onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen ucl-theme-bg starball-bg text-slate-100 flex flex-col justify-between selection:bg-yellow-500/30 selection:text-yellow-200">
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
        <main className="max-w-7xl mx-auto px-3 sm:px-4 mt-3 sm:mt-5 pb-28 md:pb-8">
          
          {/* Grand UEFA Champions League Welcoming Banner: The Stage is Set */}
          <div className="relative mb-6 rounded-3xl overflow-hidden bg-[#10172A] p-5 sm:p-8 border border-slate-800 shadow-2xl">
            {/* Soft cyan & starball ambient glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />
            <div className="absolute -top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/35 text-[#00E5FF] text-[11px] sm:text-xs font-black tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
                  <span>UEFA CHAMPIONS LEAGUE 2026</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase font-sans drop-shadow-sm">
                  THE STAGE IS SET.
                </h1>

                <p className="text-[#E2E8F0] text-xs sm:text-sm md:text-base font-semibold leading-relaxed">
                  المسرح جاهز لليالي الأبطال التاريخية. سجّل توقعاتك الدقيقة لنتائج المواجهات، اختر هدّافي المباريات ورجل اللقاء، واعتلِ صدارة جدول المتوقعين!
                </p>

                {/* Quick Tournament Highlights */}
                <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
                  <span className="bg-[#080C19] text-[#E2E8F0] border border-slate-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    <span>36 نادياً بنظام الدوري الموحد</span>
                  </span>
                  <span className="bg-[#080C19] text-[#E2E8F0] border border-slate-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span>نقاط فورية للهدافين ونجم اللقاء</span>
                  </span>
                  <span className="bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/35 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span>تحديث فوري لجدول المتوقعين</span>
                  </span>
                </div>
              </div>

              {/* Quick Action Navigation */}
              <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2.5">
                <button
                  onClick={() => setActiveTab('matches')}
                  className="ucl-btn-primary px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm text-center cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>ابدأ تسجيل توقعاتك</span>
                </button>

                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className="bg-[#080C19] hover:bg-slate-800 text-[#E2E8F0] border border-slate-800 px-5 py-3 rounded-2xl font-bold text-xs text-center transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>عرض لوحة الشرف والترتيب</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop & Tablet Tabs Navigation (hidden on mobile) */}
          <div className="hidden md:flex border-b border-slate-800/80 mb-6 gap-2 overflow-x-auto pb-1 select-none">
            <button
              onClick={() => setActiveTab('matches')}
              className={`py-3 px-5 font-bold rounded-t-2xl border-b-2 flex items-center gap-2.5 transition shrink-0 text-xs sm:text-sm cursor-pointer ${
                activeTab === 'matches'
                  ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/15 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>المباريات والتوقعات</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`py-3 px-5 font-bold rounded-t-2xl border-b-2 flex items-center gap-2.5 transition shrink-0 text-xs sm:text-sm cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/15 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>جدول الترتيب</span>
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  if (sessionStorage.getItem('cl_admin_verified') === '05082007') {
                    setActiveTab('admin');
                  } else {
                    handleOpenAuth('admin');
                  }
                }}
                className={`py-3 px-5 font-bold rounded-t-2xl border-b-2 flex items-center gap-2.5 transition shrink-0 text-xs sm:text-sm cursor-pointer ${
                  activeTab === 'admin'
                    ? 'border-rose-500 text-rose-400 bg-rose-950/30'
                    : 'border-transparent text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>لوحة التحكم (الآدمن)</span>
              </button>
            )}
          </div>

          {/* Tab Views */}
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

          {activeTab === 'leaderboard' && (
            <LeaderboardSection users={users} />
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
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on phone/mobile screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080C19]/95 border-t border-slate-800/80 backdrop-blur-2xl px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition cursor-pointer min-w-[64px] min-h-[48px] ${
            activeTab === 'matches'
              ? 'text-[#00E5FF] font-black bg-[#00E5FF]/15 border border-[#00E5FF]/30'
              : 'text-[#94A3B8] font-bold hover:text-white'
          }`}
        >
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-[10px]">المباريات</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition cursor-pointer min-w-[64px] min-h-[48px] ${
            activeTab === 'leaderboard'
              ? 'text-[#00E5FF] font-black bg-[#00E5FF]/15 border border-[#00E5FF]/30'
              : 'text-[#94A3B8] font-bold hover:text-white'
          }`}
        >
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-[10px]">الترتيب</span>
        </button>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => {
              if (sessionStorage.getItem('cl_admin_verified') === '05082007') {
                setActiveTab('admin');
              } else {
                handleOpenAuth('admin');
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition cursor-pointer min-w-[64px] min-h-[48px] ${
              activeTab === 'admin'
                ? 'text-rose-400 font-black bg-rose-500/20 border border-rose-500/30'
                : 'text-slate-400 font-bold hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span className="text-[10px]">الآدمن</span>
          </button>
        )}
      </nav>

      {/* Top Banner Toast Notifications (Works seamlessly on Phone & PC) */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Match Delete Custom Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(matchToDelete)}
        title="تأكيد حذف المباراة"
        message={
          matchToDelete
            ? `هل أنت متأكد من حذف مباراة (${matchToDelete.homeTeam} ضد ${matchToDelete.awayTeam}) نهائياً؟ سيتم حذف جميع التوقعات المرتبطة بها.`
            : ''
        }
        confirmText="نعم، احذف المباراة"
        cancelText="إلغاء التراجع"
        isDestructive={true}
        onConfirm={handleConfirmDeleteMatch}
        onCancel={() => setMatchToDelete(null)}
      />

      {/* Reset DB Custom Confirmation Modal */}
      <ConfirmDialog
        isOpen={resetDbConfirmOpen}
        title="إعادة ضبط قاعدة البيانات"
        message="هل أنت متأكد من رغبتك في إعادة ضبط بيانات الفرق الافتراضية والـ 36 فريق والمباريات؟"
        confirmText="نعم، إعادة ضبط"
        cancelText="إلغاء"
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
        <p>1XLMZALIT UCL 2026 Prediction Platform &copy; جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
