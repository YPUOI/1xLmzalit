import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Clock, 
  Smartphone, 
  Calculator, 
  PlusCircle, 
  ListCheck, 
  Trash2, 
  PenSquare, 
  History, 
  ShieldAlert, 
  Check, 
  X, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  KeyRound,
  Upload,
  Image as ImageIcon,
  Wand2,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCw
} from 'lucide-react';
import { Match, Team, AppUser, Prediction, SecurityConfig } from '../types';
import { getSecurityConfig, saveSecurityConfig } from '../utils/security';
import { subscribeSecurityConfig, syncSaveSecurityConfig } from '../lib/firebase';
import { ConfirmDialog } from './ConfirmDialog';
import { POPULAR_CLUB_PRESETS, parsePlayersText, generateFallbackLogo, ClubPreset } from '../data/clubPresets';

interface AdminSectionProps {
  matches: Match[];
  teams: Record<string, Team>;
  users: AppUser[];
  predictions: Record<string, Prediction>;
  currentUser: AppUser | null;
  onUpdateUsers: (users: AppUser[]) => void;
  onUpdateMatches: (matches: Match[]) => void;
  onUpdateTeams: (teams: Record<string, Team>) => void;
  onResetDeviceLock: () => void;
  onResetDatabase?: () => void;
  onAdminAuthenticated?: (adminUser: AppUser) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onRequestDeleteMatch?: (match: Match) => void;
}

export const AdminSection: React.FC<AdminSectionProps> = ({
  matches,
  teams,
  users,
  predictions,
  currentUser,
  onUpdateUsers,
  onUpdateMatches,
  onUpdateTeams,
  onResetDeviceLock,
  onResetDatabase,
  onAdminAuthenticated,
  onShowToast,
  onRequestDeleteMatch
}) => {
  // Admin passcode challenge state if accessed directly
  const [adminGatePasscode, setAdminGatePasscode] = useState('');
  const [adminGateError, setAdminGateError] = useState<string | null>(null);

  // Point correction state
  const [selectedUserForPoints, setSelectedUserForPoints] = useState<string>('');
  const [pointsAction, setPointsAction] = useState<'add' | 'sub' | 'set'>('add');
  const [pointsValue, setPointsValue] = useState<number>(0);

  // Match creation state
  const teamKeys = Object.keys(teams).sort();
  const [newHomeTeam, setNewHomeTeam] = useState<string>(teamKeys[0] || '');
  const [newAwayTeam, setNewAwayTeam] = useState<string>(teamKeys[1] || teamKeys[0] || '');
  const [newDeadline, setNewDeadline] = useState<string>('');

  // Match editing & settlement state
  const [editDeadlines, setEditDeadlines] = useState<Record<string, string>>({});
  const [settlementData, setSettlementData] = useState<Record<string, {
    homeScore: number;
    awayScore: number;
    homeScorers: string[];
    awayScorers: string[];
    mvp: string;
  }>>({});

  // Local Confirm Dialog state for match settlement or internal actions
  const [settleConfirmMatch, setSettleConfirmMatch] = useState<Match | null>(null);
  const [deleteTeamConfirm, setDeleteTeamConfirm] = useState<string | null>(null);
  const [deleteAllTeamsConfirm, setDeleteAllTeamsConfirm] = useState<boolean>(false);

  // Squad management & Bulk players
  const [selectedManageTeam, setSelectedManageTeam] = useState<string>(teamKeys[0] || '');
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [bulkSquadInput, setBulkSquadInput] = useState<string>('');
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamLogo, setNewTeamLogo] = useState<string>('');
  const [newTeamInitialSquad, setNewTeamInitialSquad] = useState<string>('');
  const [showPresetPicker, setShowPresetPicker] = useState<boolean>(false);
  const [clearSquadConfirm, setClearSquadConfirm] = useState<string | null>(null);

  const detectedBulkPlayers = parsePlayersText(bulkSquadInput);
  const detectedInitialSquad = parsePlayersText(newTeamInitialSquad);

  // Synchronize team selects when teams change
  useEffect(() => {
    const keys = Object.keys(teams).sort();
    if (!keys.includes(selectedManageTeam)) {
      setSelectedManageTeam(keys[0] || '');
    }
    if (!keys.includes(newHomeTeam)) {
      setNewHomeTeam(keys[0] || '');
    }
    if (!keys.includes(newAwayTeam)) {
      setNewAwayTeam(keys[1] || keys[0] || '');
    }
  }, [teams, selectedManageTeam, newHomeTeam, newAwayTeam]);

  // Friend security settings
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(getSecurityConfig());
  const [newFriendPassword, setNewFriendPassword] = useState<string>(securityConfig.friendPassword);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  useEffect(() => {
    const unsub = subscribeSecurityConfig((data) => {
      if (data.friendPassword) {
        setSecurityConfig(prev => ({ ...prev, friendPassword: data.friendPassword! }));
        setNewFriendPassword(data.friendPassword);
      }
    });
    return () => unsub();
  }, []);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onShowToast) {
      onShowToast(msg, type);
    } else {
      alert(msg);
    }
  };

  // Users Filter
  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => (u.status === 'approved' || !u.status) && u.role !== 'admin');
  const adminUsers = users.filter(u => u.role === 'admin');

  // --- Handlers ---
  const handleApproveUser = (username: string) => {
    const next = users.map(u => u.username === username ? { ...u, status: 'approved' as const } : u);
    onUpdateUsers(next);
    notify(`تمت الموافقة على انضمام العضو (${username}) بنجاح!`, 'success');
  };

  const handleRejectUser = (username: string) => {
    const next = users.filter(u => u.username !== username);
    onUpdateUsers(next);
    notify(`تم رفض واستبعاد العضو (${username})`, 'info');
  };

  const handleRevokeUser = (username: string) => {
    const next = users.map(u => u.username === username ? { ...u, status: 'pending' as const } : u);
    onUpdateUsers(next);
    notify(`تم تعليق حساب العضو (${username}) بنجاح`, 'info');
  };

  const handleApplyPointsModification = () => {
    if (!selectedUserForPoints) {
      notify('الرجاء اختيار العضو المراد تعديل نقاطه!', 'error');
      return;
    }
    const val = Number(pointsValue) || 0;
    const next = users.map(u => {
      if (u.username === selectedUserForPoints) {
        let pts = u.points || 0;
        if (pointsAction === 'add') pts += val;
        else if (pointsAction === 'sub') pts = Math.max(0, pts - val);
        else if (pointsAction === 'set') pts = Math.max(0, val);
        return { ...u, points: pts };
      }
      return u;
    });
    onUpdateUsers(next);
    notify(`تم تعديل نقاط العضو (${selectedUserForPoints}) بنجاح!`, 'success');
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHomeTeam === newAwayTeam) {
      notify('لا يمكن اختيار نفس الفريق للمواجهة!', 'error');
      return;
    }
    if (!newDeadline) {
      notify('الرجاء تحديد موعد المباراة ووقت إغلاق التوقع!', 'error');
      return;
    }

    const newMatch: Match = {
      id: `m_${Date.now()}`,
      homeTeam: newHomeTeam,
      awayTeam: newAwayTeam,
      deadline: newDeadline,
      status: 'OPEN',
      result: null
    };

    onUpdateMatches([...matches, newMatch]);
    notify('تمت إضافة المباراة ونشرها بنجاح!', 'success');
    setNewDeadline('');
  };

  const handleUpdateDeadline = (matchId: string) => {
    const dl = editDeadlines[matchId];
    if (!dl) {
      notify('الرجاء اختيار وقت صحيح!', 'error');
      return;
    }
    const next = matches.map(m => m.id === matchId ? { ...m, deadline: dl } : m);
    onUpdateMatches(next);
    notify('تم تحديث موعد المباراة بنجاح!', 'success');
  };

  const handleDeleteMatchClick = (match: Match) => {
    if (onRequestDeleteMatch) {
      onRequestDeleteMatch(match);
    } else {
      const next = matches.filter(m => m.id !== match.id);
      onUpdateMatches(next);
      notify('تم حذف المباراة بنجاح!', 'success');
    }
  };

  const getSettleDraft = (matchId: string) => {
    return settlementData[matchId] || {
      homeScore: 0,
      awayScore: 0,
      homeScorers: [],
      awayScorers: [],
      mvp: ''
    };
  };

  const updateSettleDraft = (matchId: string, updates: Partial<{
    homeScore: number;
    awayScore: number;
    homeScorers: string[];
    awayScorers: string[];
    mvp: string;
  }>) => {
    setSettlementData(prev => {
      const cur = prev[matchId] || {
        homeScore: 0,
        awayScore: 0,
        homeScorers: [],
        awayScorers: [],
        mvp: ''
      };
      return { ...prev, [matchId]: { ...cur, ...updates } };
    });
  };

  const handleSettleMatchConfirmed = () => {
    if (!settleConfirmMatch) return;
    const match = settleConfirmMatch;
    const draft = getSettleDraft(match.id);

    const result = {
      homeScore: draft.homeScore,
      awayScore: draft.awayScore,
      homeScorers: draft.homeScorers.slice(0, draft.homeScore),
      awayScorers: draft.awayScorers.slice(0, draft.awayScore),
      mvp: draft.mvp
    };

    // Calculate user points
    const userPointsDelta: Record<string, number> = {};

    Object.values(predictions).forEach(pred => {
      if (pred.matchId === match.id) {
        let pts = 0;
        // Exact Score
        if (pred.homeScore === result.homeScore && pred.awayScore === result.awayScore) {
          pts += 5;
        } else {
          // Correct Outcome
          const actualOutcome = Math.sign(result.homeScore - result.awayScore);
          const predOutcome = Math.sign(pred.homeScore - pred.awayScore);
          if (actualOutcome === predOutcome) {
            pts += 3;
          }
        }

        // Scorers points
        (pred.homeScorers || []).forEach(sc => {
          if (sc && result.homeScorers.includes(sc)) pts += 2;
        });
        (pred.awayScorers || []).forEach(sc => {
          if (sc && result.awayScorers.includes(sc)) pts += 2;
        });

        // MVP point
        if (pred.mvp && result.mvp && pred.mvp === result.mvp) {
          pts += 3;
        }

        userPointsDelta[pred.username] = (userPointsDelta[pred.username] || 0) + pts;
      }
    });

    // Update users points
    const updatedUsers = users.map(u => {
      if (userPointsDelta[u.username]) {
        return { ...u, points: (u.points || 0) + userPointsDelta[u.username] };
      }
      return u;
    });

    // Mark match as SETTLED
    const updatedMatches = matches.map(m => m.id === match.id ? { ...m, status: 'SETTLED' as const, result } : m);

    onUpdateUsers(updatedUsers);
    onUpdateMatches(updatedMatches);
    setSettleConfirmMatch(null);
    notify('تم اعتماد النتيجة واحتساب النقاط للمتوقعين بنجاح!', 'success');
  };

  const handleAddNewTeam = () => {
    const name = newTeamName.trim();
    if (!name) {
      notify('الرجاء إدخال اسم الفريق!', 'error');
      return;
    }
    if (teams[name]) {
      notify('هذا الفريق موجود بالفعل!', 'error');
      return;
    }

    const initialSquad = parsePlayersText(newTeamInitialSquad);
    const finalLogo = newTeamLogo.trim() || generateFallbackLogo(name);

    const nextTeams = {
      ...teams,
      [name]: {
        name,
        logo: finalLogo,
        squad: initialSquad
      }
    };
    onUpdateTeams(nextTeams);
    setSelectedManageTeam(name);
    setNewTeamName('');
    setNewTeamLogo('');
    setNewTeamInitialSquad('');
    setShowPresetPicker(false);
    notify(
      initialSquad.length > 0
        ? `تم تسجيل فريق (${name}) بنجاح مع إضافة (${initialSquad.length}) لاعباً لتشكيلته تلقائياً!`
        : `تم تسجيل فريق (${name}) بنجاح!`,
      'success'
    );
  };

  const handleSelectPreset = (preset: ClubPreset) => {
    setNewTeamName(preset.name);
    setNewTeamLogo(preset.logo);
    setShowPresetPicker(false);
    notify(`تم اختيار نادي ${preset.name} وشعاره!`, 'info');
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notify('حجم الصورة كبير، يرجى اختيار صورة أقل من 2 ميغابايت', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewTeamLogo(reader.result);
        notify('تم رفع الشعار بنجاح!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateFallbackLogo = () => {
    if (!newTeamName.trim()) {
      notify('يرجى كتابة اسم الفريق أولاً لتوليد الشعار', 'error');
      return;
    }
    const logoUrl = generateFallbackLogo(newTeamName);
    setNewTeamLogo(logoUrl);
    notify('تم إنشاء وتعيين الشعار بنجاح!', 'success');
  };

  const handleAddBulkPlayers = () => {
    const team = teams[selectedManageTeam];
    if (!team) {
      notify('الرجاء اختيار فريق أولاً!', 'error');
      return;
    }

    const parsed = parsePlayersText(bulkSquadInput);
    if (parsed.length === 0) {
      notify('الرجاء إدخال أو لصق أسماء اللاعبين أولاً!', 'error');
      return;
    }

    const currentSquad = team.squad || [];
    const newUniquePlayers = parsed.filter(p => !currentSquad.includes(p));

    if (newUniquePlayers.length === 0) {
      notify('جميع هؤلاء اللاعبين مسجلون بالفعل في تشكيلة هذا الفريق!', 'info');
      return;
    }

    const nextSquad = [...currentSquad, ...newUniquePlayers];
    const nextTeams = {
      ...teams,
      [selectedManageTeam]: { ...team, squad: nextSquad }
    };
    onUpdateTeams(nextTeams);
    setBulkSquadInput('');
    notify(`تمت إضافة (${newUniquePlayers.length}) لاعباً بنجاح إلى تشكيلة (${selectedManageTeam})!`, 'success');
  };

  const handleClearSquadConfirmed = () => {
    if (!clearSquadConfirm) return;
    const team = teams[clearSquadConfirm];
    if (!team) return;

    const nextTeams = {
      ...teams,
      [clearSquadConfirm]: { ...team, squad: [] }
    };
    onUpdateTeams(nextTeams);
    setClearSquadConfirm(null);
    notify(`تم مسح تشكيلة فريق (${clearSquadConfirm}) بنجاح!`, 'info');
  };

  const handleAddPlayer = () => {
    const team = teams[selectedManageTeam];
    const name = newPlayerName.trim();
    if (!team || !name) return;

    if (team.squad && team.squad.includes(name)) {
      notify('هذا اللاعب موجود بالفعل في التشكيلة!', 'info');
      return;
    }

    const nextSquad = [...(team.squad || []), name];
    const nextTeams = {
      ...teams,
      [selectedManageTeam]: { ...team, squad: nextSquad }
    };
    onUpdateTeams(nextTeams);
    setNewPlayerName('');
    notify(`تمت إضافة اللاعب (${name})!`, 'success');
  };

  const handleDeletePlayer = (teamName: string, index: number) => {
    const team = teams[teamName];
    if (!team) return;
    const nextSquad = [...team.squad];
    nextSquad.splice(index, 1);
    const nextTeams = {
      ...teams,
      [teamName]: { ...team, squad: nextSquad }
    };
    onUpdateTeams(nextTeams);
  };

  const handleDeleteTeamConfirmed = () => {
    if (!deleteTeamConfirm) return;
    const teamName = deleteTeamConfirm;
    const nextTeams = { ...teams };
    delete nextTeams[teamName];
    onUpdateTeams(nextTeams);
    setDeleteTeamConfirm(null);
    notify(`تم حذف فريق (${teamName}) وقائمته بالكامل!`, 'info');
  };

  const handleDeleteAllTeamsConfirmed = () => {
    onUpdateTeams({});
    setDeleteAllTeamsConfirm(false);
    notify('تم حذف وإفراغ كافة الفرق وجميع اللاعبين بنجاح!', 'info');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendPassword.trim()) {
      alert('الرجاء إدخال كلمة مرور صالحة!');
      return;
    }
    const updated = {
      ...securityConfig,
      friendPassword: newFriendPassword.trim()
    };
    saveSecurityConfig(updated);
    setSecurityConfig(updated);
    setSecuritySuccess('تم تحديث كلمة مرور الأصدقاء بنجاح!');
    setTimeout(() => setSecuritySuccess(null), 3500);
  };

  const isVerifiedAdmin = currentUser?.role === 'admin' && sessionStorage.getItem('cl_admin_verified') === '05082007';

  const handleAdminGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminGatePasscode.trim() !== '05082007') {
      setAdminGateError('الرمز السري غير صحيح! يرجى إدخال الرمز السري الصحيح للإدارة.');
      return;
    }
    sessionStorage.setItem('cl_admin_verified', '05082007');
    setAdminGateError(null);
    let adminUser = users.find(u => u.role === 'admin');
    if (!adminUser) {
      adminUser = {
        username: 'الآدمن (Admin)',
        role: 'admin',
        points: 0,
        status: 'approved'
      };
      onUpdateUsers([...users, adminUser]);
    }
    if (onAdminAuthenticated) {
      onAdminAuthenticated(adminUser);
    }
  };

  if (!isVerifiedAdmin) {
    return (
      <div className="max-w-md mx-auto my-6 sm:my-10 ucl-card p-6 sm:p-8 rounded-3xl border border-rose-500/40 ucl-gold-glow text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-950/50">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">لوحة الإدارة محمية</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          لا يمكن الدخول أو استعراض لوحة تحكم الآدمن بدون إدخال الرمز السري للإدارة المعتمد.
        </p>

        {adminGateError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-bold leading-relaxed">
            {adminGateError}
          </div>
        )}

        <form onSubmit={handleAdminGateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-rose-400 mb-2 text-right flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>الرمز السري للآدمن (Admin Secret Code)</span>
            </label>
            <input
              type="password"
              value={adminGatePasscode}
              onChange={(e) => setAdminGatePasscode(e.target.value)}
              placeholder="أدخل الرمز السري للإدارة..."
              autoFocus
              className="w-full bg-slate-900 border border-rose-500/60 rounded-2xl p-3.5 text-center text-white text-base tracking-widest outline-none focus:border-rose-400 min-h-[48px] placeholder:text-slate-600 placeholder:tracking-normal"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black py-3.5 rounded-2xl transition shadow-lg text-sm cursor-pointer min-h-[48px] flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Lock className="w-4 h-4" />
            <span>التحقق والدخول إلى لوحة التحكم</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Friends Access Password & Biometric Settings Card */}
      <div className="ucl-card p-6 rounded-3xl border border-yellow-500/30">
        <h3 className="text-xl font-black text-yellow-400 flex items-center gap-2.5 mb-2">
          <KeyRound className="w-6 h-6 text-yellow-400" />
          <span>إعدادات كلمة مرور الأصدقاء والحماية</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6 pb-3 border-b border-slate-800">
          يمكنك تغيير كلمة المرور التي يطلبها النظام من أصدقائك للوصول إلى المنصة أو الاطلاع عليها.
        </p>

        {securitySuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold">
            {securitySuccess}
          </div>
        )}

        <form onSubmit={handleSaveSecurity} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">كلمة مرور الأصدقاء الحالية</label>
            <input
              type="text"
              value={newFriendPassword}
              onChange={(e) => setNewFriendPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-yellow-300 font-black outline-none focus:border-yellow-400"
              placeholder="أدخل كلمة المرور الجديدة..."
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs py-3 px-4 rounded-xl transition cursor-pointer"
            >
              حفظ وتحديث كلمة المرور
            </button>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white block">حالة البصمة البيومترية:</span>
              <span className="text-[11px] text-slate-400">
                {securityConfig.biometricEnrolled ? 'مفعلة على هذا الجهاز' : 'غير مفعلة بعد'}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
              securityConfig.biometricEnrolled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {securityConfig.biometricEnrolled ? 'نشطة' : 'غير مسجلة'}
            </span>
          </div>
        </form>
      </div>

      {/* 2. User Approval & Membership Control Card */}
      <div className="ucl-card p-6 rounded-3xl border border-yellow-500/20">
        <div className="mb-2">
          <h3 className="text-xl font-black text-yellow-400 flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-yellow-400" />
            <span>إدارة طلبات الانضمام والمستخدمين</span>
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-6 pb-3 border-b border-slate-800">
          موافقة أو رفض الأعضاء الجدد قبل السماح لهم بالتوقع والظهور في جدول الترتيب.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Users */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>طلبات معلقة ({pendingUsers.length})</span>
            </h4>
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {pendingUsers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">لا توجد طلبات معلقة.</p>
              ) : (
                pendingUsers.map(u => (
                  <div key={u.username} className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-white block truncate">{u.username}</span>
                      {u.email && (
                        <span className="text-[10px] text-cyan-400 font-mono block truncate" dir="ltr">
                          {u.email}
                        </span>
                      )}
                      <span className="text-[10px] text-amber-400 font-semibold">بانتظار الموافقة</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApproveUser(u.username)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        title="قبول"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRejectUser(u.username)}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        title="رفض"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Approved Users */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>الأعضاء المقبولون ({approvedUsers.length})</span>
            </h4>
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {approvedUsers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">لا يوجد أعضاء مقبولون حالياً.</p>
              ) : (
                approvedUsers.map(u => (
                  <div key={u.username} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-white block truncate">{u.username}</span>
                      {u.email && (
                        <span className="text-[10px] text-cyan-400 font-mono block truncate" dir="ltr">
                          {u.email}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold">{u.points || 0} نقطة</span>
                    </div>
                    <button
                      onClick={() => handleRevokeUser(u.username)}
                      className="bg-slate-800 hover:bg-rose-900 text-rose-400 border border-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0"
                    >
                      تعليق
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Admins */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-rose-500/30">
            <h4 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>الآدمنز المتواجدون ({adminUsers.length})</span>
            </h4>
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {adminUsers.map(u => (
                <div key={u.username} className="p-3 bg-slate-950 rounded-xl border border-rose-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <div>
                      <span className="font-bold text-xs text-white block">{u.username}</span>
                      <span className="text-[10px] text-rose-400 font-semibold">مدير نظام أساسي</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                    نشط
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Points Correction Card */}
      <div className="ucl-card p-6 rounded-3xl border border-amber-500/30">
        <h3 className="text-xl font-black text-amber-400 mb-2 flex items-center gap-2.5">
          <Calculator className="w-6 h-6 text-amber-400" />
          <span>تعديل نقاط المتوقعين (تصحيح أخطاء)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
          يمكنك إضافة أو خصم أو تعيين نقاط لأي عضو في حال وجود خطأ في الاحتساب.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={selectedUserForPoints}
            onChange={(e) => setSelectedUserForPoints(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-amber-400"
          >
            <option value="">اختر العضو...</option>
            {users.filter(u => u.role !== 'admin').map(u => (
              <option key={u.username} value={u.username}>
                {u.username} ({u.points || 0} نقطة)
              </option>
            ))}
          </select>

          <select
            value={pointsAction}
            onChange={(e) => setPointsAction(e.target.value as 'add' | 'sub' | 'set')}
            className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-amber-400"
          >
            <option value="add">إضافة نقاط (+)</option>
            <option value="sub">خصم نقاط (-)</option>
            <option value="set">تعيين إجمالي النقاط (=)</option>
          </select>

          <input
            type="number"
            min="0"
            value={pointsValue}
            onChange={(e) => setPointsValue(parseInt(e.target.value) || 0)}
            placeholder="عدد النقاط..."
            className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
          />

          <button
            onClick={handleApplyPointsModification}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span>تنفيذ التعديل</span>
          </button>
        </div>
      </div>

      {/* 4. Match Creation Card */}
      <div className="ucl-card p-6 rounded-3xl border border-amber-500/20">
        <h3 className="text-xl font-black text-amber-400 mb-4 flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <PlusCircle className="w-6 h-6 text-amber-500" />
          <span>إضافة مباراة جديدة للتوقع</span>
        </h3>

        {teamKeys.length < 2 ? (
          <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-xs text-amber-300 leading-relaxed">
            تنبيه: يلزم تسجيل فريقين على الأقل لإنشاء مباراة. يرجى إضافة الفرق وتشكيلاتها من قسم <span className="text-purple-300 font-bold">"التحكم في الفرق واللاعبين"</span> أدناه أولاً.
          </div>
        ) : (
          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">الفريق المستضيف (Home)</label>
                <select
                  value={newHomeTeam}
                  onChange={(e) => setNewHomeTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:border-amber-400 outline-none text-xs"
                  required
                >
                  {teamKeys.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">الفريق الضيف (Away)</label>
                <select
                  value={newAwayTeam}
                  onChange={(e) => setNewAwayTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:border-amber-400 outline-none text-xs"
                  required
                >
                  {teamKeys.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                موعد المباراة ووقت إغلاق التوقع (Deadline)
              </label>
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:border-amber-400 outline-none text-xs"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3.5 rounded-xl transition shadow-lg text-xs cursor-pointer"
            >
              نشر المباراة وإتاحة التوقع للمستخدمين
            </button>
          </form>
        )}
      </div>

      {/* 5. Match Score Settlement & Management */}
      <div className="ucl-card p-6 rounded-3xl border border-blue-500/20 space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <h3 className="text-xl font-black text-blue-400 flex items-center gap-2.5">
            <ListCheck className="w-6 h-6 text-blue-500" />
            <span>إدارة المباريات واعتماد النتائج</span>
          </h3>
          <span className="text-xs text-slate-400">تعديل التوقيت، النتيجة، وحذف المباريات</span>
        </div>

        {matches.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">لا توجد مباريات مسجلة بعد.</p>
        ) : (
          <div className="space-y-4">
            {matches.map(match => {
              const home = teams[match.homeTeam] || { squad: [] };
              const away = teams[match.awayTeam] || { squad: [] };
              const draft = getSettleDraft(match.id);

              return (
                <div key={match.id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
                  {/* Title & Delete */}
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span className="text-sm text-white font-black">{match.homeTeam} VS {match.awayTeam}</span>
                    <div className="flex items-center gap-3">
                      <span className={match.status === 'SETTLED' ? 'text-emerald-400' : 'text-amber-400'}>
                        {match.status === 'SETTLED' ? 'تم تنزيل النتيجة' : 'مفتوحة'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMatchClick(match)}
                        className="bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-500/40 text-[11px] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 font-black cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف المباراة</span>
                      </button>
                    </div>
                  </div>

                  {/* Edit Deadline */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full">
                      <label className="block text-[10px] text-slate-400 mb-1">تعديل موعد ووقت إغلاق التوقع:</label>
                      <input
                        type="datetime-local"
                        value={editDeadlines[match.id] || (match.deadline ? match.deadline.slice(0, 16) : '')}
                        onChange={(e) => setEditDeadlines({ ...editDeadlines, [match.id]: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateDeadline(match.id)}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition shrink-0 cursor-pointer"
                    >
                      حفظ الوقت الجديد
                    </button>
                  </div>

                  {/* Settlement Inputs (If not settled) */}
                  {match.status !== 'SETTLED' && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-400">أهداف {match.homeTeam}</label>
                          <input
                            type="number"
                            min="0"
                            value={draft.homeScore}
                            onChange={(e) => updateSettleDraft(match.id, { homeScore: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-center text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400">أهداف {match.awayTeam}</label>
                          <input
                            type="number"
                            min="0"
                            value={draft.awayScore}
                            onChange={(e) => updateSettleDraft(match.id, { awayScore: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-center text-white font-bold"
                          />
                        </div>
                      </div>

                      {/* Scorer picks for home */}
                      {draft.homeScore > 0 && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-400">مسجلو أهداف {match.homeTeam}:</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Array.from({ length: draft.homeScore }).map((_, idx) => (
                              <select
                                key={idx}
                                value={draft.homeScorers[idx] || ''}
                                onChange={(e) => {
                                  const arr = [...draft.homeScorers];
                                  arr[idx] = e.target.value;
                                  updateSettleDraft(match.id, { homeScorers: arr });
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                              >
                                <option value="">اختر المسجل للهدف ({idx + 1})...</option>
                                {(home.squad || []).map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scorer picks for away */}
                      {draft.awayScore > 0 && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-rose-400">مسجلو أهداف {match.awayTeam}:</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Array.from({ length: draft.awayScore }).map((_, idx) => (
                              <select
                                key={idx}
                                value={draft.awayScorers[idx] || ''}
                                onChange={(e) => {
                                  const arr = [...draft.awayScorers];
                                  arr[idx] = e.target.value;
                                  updateSettleDraft(match.id, { awayScorers: arr });
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                              >
                                <option value="">اختر المسجل للهدف ({idx + 1})...</option>
                                {(away.squad || []).map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">رجل المباراة الفعلي (MVP)</label>
                        <select
                          value={draft.mvp}
                          onChange={(e) => updateSettleDraft(match.id, { mvp: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold outline-none"
                        >
                          <option value="">اختر رجل المباراة...</option>
                          {[...(home.squad || []), ...(away.squad || [])].map((p, i) => (
                            <option key={`${p}_${i}`} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSettleConfirmMatch(match)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl transition cursor-pointer"
                      >
                        اعتماد النتيجة واحتساب النقاط للمتوقعين
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Teams & Squads Full Control */}
      <div className="ucl-card p-6 rounded-3xl border border-purple-500/20 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-black text-purple-400 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-purple-400" />
              <span>التحكم في الفرق واللاعبين ({teamKeys.length} فرق مسجلة)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              إضافة وتعديل الفرق، قوائم اللاعبين، وحذف الفرق كلياً
            </p>
          </div>

          {teamKeys.length > 0 && (
            <button
              type="button"
              onClick={() => setDeleteAllTeamsConfirm(true)}
              className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 font-bold cursor-pointer active:scale-95 shrink-0"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>حذف جميع الفرق واللاعبين</span>
            </button>
          )}
        </div>

        {/* Add Team */}
        <div className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>إضافة فريق جديد للبطولة:</span>
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPresetPicker(!showPresetPicker)}
                className="bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>أندية مقترحة جاهزة بشعاراتها ({POPULAR_CLUB_PRESETS.length})</span>
                {showPresetPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>رفع شعار من الجهاز</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleGenerateFallbackLogo}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="توليد درع وشعار تلقائي حسب اسم الفريق"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>توليد شعار تلقائي</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Selector Grid */}
          {showPresetPicker && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-purple-500/30 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">
                اضغط على أي نادٍ لملء اسمه وشعاره الرسمي تلقائياً:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                {POPULAR_CLUB_PRESETS.map((preset) => (
                  <button
                    key={preset.enName}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="flex items-center gap-2 p-2 bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/50 rounded-xl transition cursor-pointer text-right group"
                  >
                    <img
                      src={preset.logo}
                      alt={preset.name}
                      className="w-6 h-6 object-contain shrink-0 group-hover:scale-110 transition"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200 truncate group-hover:text-white">
                        {preset.name}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">
                        {preset.enName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Team Info Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5">
              <label className="text-[11px] text-slate-400 font-bold block mb-1">اسم الفريق:</label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="مثال: ريال مدريد، مانشستر سيتي..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400"
              />
            </div>

            <div className="md:col-span-5">
              <label className="text-[11px] text-slate-400 font-bold block mb-1">رابط الشعار أو الصورة:</label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={newTeamLogo}
                  onChange={(e) => setNewTeamLogo(e.target.value)}
                  placeholder="https://... أو استخدم زر الرفع/التوليد أعلاه"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400 font-mono text-[11px]"
                />
                {newTeamLogo && (
                  <div className="w-9 h-9 shrink-0 bg-slate-950 border border-slate-700 rounded-xl p-1 flex items-center justify-center overflow-hidden">
                    <img src={newTeamLogo} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 md:self-end">
              <button
                type="button"
                onClick={handleAddNewTeam}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs py-2.5 px-3 rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/20 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>تسجيل الفريق</span>
              </button>
            </div>
          </div>

          {/* Optional Initial Squad Input */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>إدخال لاعبي هذا الفريق دفعة واحدة (اختياري - يفصلهم التطبيق تلقائياً):</span>
              </label>
              {detectedInitialSquad.length > 0 && (
                <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                  سيتم تسجيل ({detectedInitialSquad.length}) لاعباً مع الفريق
                </span>
              )}
            </div>
            <textarea
              value={newTeamInitialSquad}
              onChange={(e) => setNewTeamInitialSquad(e.target.value)}
              placeholder="الصق أو اكتب جميع اللاعبين دفعة واحدة هنا (يفصل بينهم بسطور، أو فواصل ، أو ترقيم 1. 2.)..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Manage Squad */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>إدارة لاعبي التشكيلة:</span>
            </h4>
          </div>

          {teamKeys.length === 0 ? (
            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
              لا توجد أي فرق مسجلة حالياً. استخدم نموذج "إضافة فريق جديد للبطولة" أعلاه لإضافة فريق ثم إضافة لاعبيه.
            </div>
          ) : (
            <>
              {/* Selected Team Header Bar */}
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {teams[selectedManageTeam]?.logo && (
                    <img
                      src={teams[selectedManageTeam].logo}
                      alt={selectedManageTeam}
                      className="w-8 h-8 object-contain shrink-0 rounded-lg p-0.5 bg-slate-950 border border-slate-700"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">الفريق الحالي:</span>
                    <select
                      value={selectedManageTeam}
                      onChange={(e) => setSelectedManageTeam(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold outline-none focus:border-blue-400"
                    >
                      {teamKeys.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setClearSquadConfirm(selectedManageTeam)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    title="مسح قائمة لاعبي هذا الفريق فقط"
                  >
                    <span>مسح تشكيلة الفريق</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTeamConfirm(selectedManageTeam)}
                    className="p-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    title="حذف هذا الفريق بالكامل"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الفريق</span>
                  </button>
                </div>
              </div>

              {/* Automatic Bulk Players Entry (User's primary request) */}
              <div className="p-4 bg-gradient-to-r from-blue-950/40 to-slate-900/60 rounded-2xl border border-blue-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black text-blue-300">
                      إدخال جميع اللاعبين دفعة واحدة (فصل تلقائي) لـ ({selectedManageTeam}):
                    </span>
                  </div>
                  {detectedBulkPlayers.length > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>تم التعرف على ({detectedBulkPlayers.length}) لاعباً</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  الصق أو اكتب جميع أسماء لاعبي الفريق معاً بأي شكل (أسماء مفصولة بسطور جديدة، أو فواصل ، أو فواصل إنجليزية , أو ترقيم 1. 2.) وسيقوم التطبيق بفرزهم وفصلهم تلقائياً.
                </p>

                <textarea
                  value={bulkSquadInput}
                  onChange={(e) => setBulkSquadInput(e.target.value)}
                  placeholder={`اكتب أو الصق قائمة اللاعبين هنا دفعة واحدة...
مثال:
كورتوا
فينيسيوس جونيور
كيليان مبابي
جود بيلينجهام
فالفيردي
رودريغو
(أو مفصولين بفواصل: كورتوا، فينيسيوس، مبابي)`}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-400 placeholder:text-slate-600 leading-relaxed font-sans"
                />

                {/* Live Preview Chips if players are detected */}
                {detectedBulkPlayers.length > 0 && (
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      معاينة اللاعبين المكتشفين قبل الإضافة:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {detectedBulkPlayers.slice(0, 15).map((p, idx) => (
                        <span
                          key={`${p}_${idx}`}
                          className="bg-blue-950/60 border border-blue-500/30 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        >
                          {p}
                        </span>
                      ))}
                      {detectedBulkPlayers.length > 15 && (
                        <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          +{detectedBulkPlayers.length - 15} آخرين
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddBulkPlayers}
                    disabled={detectedBulkPlayers.length === 0}
                    className={`font-black text-xs py-2.5 px-5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                      detectedBulkPlayers.length > 0
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {detectedBulkPlayers.length > 0
                        ? `إضافة جميع اللاعبين (${detectedBulkPlayers.length}) دفعة واحدة`
                        : 'إضافة جميع اللاعبين دفعة واحدة'}
                    </span>
                  </button>

                  {bulkSquadInput && (
                    <button
                      type="button"
                      onClick={() => setBulkSquadInput('')}
                      className="text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer font-bold px-2 py-1"
                    >
                      مسح النص
                    </button>
                  )}
                </div>
              </div>

              {/* Single Player Quick Add */}
              <div className="p-3 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-bold shrink-0">أو إضافة لاعب فردي:</span>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPlayer();
                    }
                  }}
                  placeholder="اسم لاعب مفرد..."
                  className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none focus:border-emerald-400 flex-1 min-w-[160px]"
                />
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>

              {/* Current Squad Display */}
              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-300">
                    قائمة لاعبي فريق ({selectedManageTeam}) حالياً:
                  </span>
                  <span className="text-xs text-yellow-400 font-bold bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 rounded-full">
                    {teams[selectedManageTeam]?.squad?.length || 0} لاعبين مسجلين
                  </span>
                </div>
                {(!teams[selectedManageTeam]?.squad || teams[selectedManageTeam]?.squad.length === 0) ? (
                  <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
                    لا يوجد لاعبون مسجلون في تشكيلة هذا الفريق بعد. استخدم مربع الإدخال الجماعي أعلاه للصق جميع اللاعبين دفعة واحدة!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto p-1">
                    {teams[selectedManageTeam]?.squad?.map((player, idx) => (
                      <div
                        key={`${player}_${idx}`}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-200 transition"
                      >
                        <span className="text-[10px] text-slate-500 font-mono">{idx + 1}.</span>
                        <span>{player}</span>
                        <button
                          type="button"
                          onClick={() => handleDeletePlayer(selectedManageTeam, idx)}
                          className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer transition p-0.5 hover:bg-rose-950/50 rounded"
                          title="حذف هذا اللاعب"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Database Maintenance & Complete Reset (Admin Only) */}
      {onResetDatabase && (
        <div className="ucl-card p-6 rounded-3xl border border-rose-500/40 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-rose-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <span>إعادة ضبط وصيانة قاعدة البيانات (خاص بالآدمن فقط)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                يتيح هذا الخيار للمدير إعادة ضبط قاعدة البيانات وحذف كافة الفرق الافتراضية والمباريات المسجلة لبدء موسم جديد أو تنظيم جديد للبطولة.
              </p>
            </div>

            <button
              type="button"
              onClick={onResetDatabase}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black px-5 py-3 rounded-2xl transition shadow-lg text-xs sm:text-sm cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
              title="إعادة ضبط قاعدة البيانات"
            >
              <Trash2 className="w-4 h-4" />
              <span>إعادة ضبط قاعدة البيانات</span>
            </button>
          </div>
        </div>
      )}

      {/* Settlement Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(settleConfirmMatch)}
        title="اعتماد النتيجة واحتساب النقاط"
        message={
          settleConfirmMatch
            ? `هل أنت متأكد من اعتماد نتيجة مباراة (${settleConfirmMatch.homeTeam} ${getSettleDraft(settleConfirmMatch.id).homeScore} - ${getSettleDraft(settleConfirmMatch.id).awayScore} ${settleConfirmMatch.awayTeam}) وتوزيع النقاط على جميع المتوقعين؟`
            : ''
        }
        confirmText="نعم، اعتمد واحتسب النقاط"
        cancelText="تراجع"
        isDestructive={false}
        onConfirm={handleSettleMatchConfirmed}
        onCancel={() => setSettleConfirmMatch(null)}
      />

      {/* Delete Single Team Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTeamConfirm)}
        title="تأكيد حذف الفريق"
        message={
          deleteTeamConfirm
            ? `هل أنت متأكد من حذف فريق (${deleteTeamConfirm}) وجميع لاعبيه من البطولة؟`
            : ''
        }
        confirmText="نعم، احذف الفريق"
        cancelText="إلغاء"
        isDestructive={true}
        onConfirm={handleDeleteTeamConfirmed}
        onCancel={() => setDeleteTeamConfirm(null)}
      />

      {/* Delete All Teams & Players Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteAllTeamsConfirm}
        title="حذف جميع الفرق واللاعبين"
        message="تحذير: هل أنت متأكد تماماً من رغبتك في مسح وإفراغ كافة الفرق وجميع اللاعبين نهائياً من التطبيق؟"
        confirmText="نعم، حذف الكل نهائياً"
        cancelText="تراجع"
        isDestructive={true}
        onConfirm={handleDeleteAllTeamsConfirmed}
        onCancel={() => setDeleteAllTeamsConfirm(false)}
      />

      {/* Clear Squad Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(clearSquadConfirm)}
        title="مسح تشكيلة الفريق"
        message={
          clearSquadConfirm
            ? `هل أنت متأكد من مسح جميع اللاعبين المسجلين في فريق (${clearSquadConfirm})؟ لن يتم حذف الفريق نفسه.`
            : ''
        }
        confirmText="نعم، مسح التشكيلة"
        cancelText="إلغاء"
        isDestructive={true}
        onConfirm={handleClearSquadConfirmed}
        onCancel={() => setClearSquadConfirm(null)}
      />
    </div>
  );
};
