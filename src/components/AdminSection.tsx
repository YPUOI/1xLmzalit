import React, { useState, useEffect, useMemo } from 'react';
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
  Shield,
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
  RotateCw,
  Search,
  Activity,
  Flame,
  Award,
  Filter,
  Loader2,
  Edit3
} from 'lucide-react';
import { Match, Team, AppUser, Prediction, SecurityConfig } from '../types';
import { getSecurityConfig, saveSecurityConfig } from '../utils/security';
import { subscribeSecurityConfig, syncSaveSecurityConfig } from '../lib/firebase';
import { ConfirmDialog } from './ConfirmDialog';
import { EditMemberNameModal } from './EditMemberNameModal';
import { getTeamEnglishName } from '../data/clubPresets';
import { POPULAR_CLUB_PRESETS, parsePlayersText, generateFallbackLogo, ClubPreset } from '../data/clubPresets';
import { removeImageBackground } from '../utils/removeBackground';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  parseMoroccoDateTime, 
  formatMoroccoInput, 
  getMoroccoCurrentTimeFormatted,
  formatEnglishDeadlineMorocco,
  getStoredMoroccoOffset,
  setStoredMoroccoOffset 
} from '../utils/moroccoTime';

interface AdminSectionProps {
  matches: Match[];
  teams: Record<string, Team>;
  users: AppUser[];
  predictions: Record<string, Prediction>;
  currentUser: AppUser | null;
  onUpdateUsers: (users: AppUser[]) => void;
  onUpdateMatches: (matches: Match[]) => void;
  onUpdateTeams: (teams: Record<string, Team>) => void | Promise<void>;
  onResetDeviceLock: () => void;
  onResetDatabase?: () => void;
  onAdminAuthenticated?: (adminUser: AppUser) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onRequestDeleteMatch?: (match: Match) => void;
  onRenameUser?: (oldUsername: string, newUsername: string) => Promise<void>;
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
  onRequestDeleteMatch,
  onRenameUser
}) => {
  const { t, isRtl, language } = useLanguage();

  // Admin passcode challenge state if accessed directly
  const [adminGatePasscode, setAdminGatePasscode] = useState('');
  const [adminGateError, setAdminGateError] = useState<string | null>(null);

  // Edit member name modal state
  const [editingMember, setEditingMember] = useState<AppUser | null>(null);

  // Point correction state
  const [selectedUserForPoints, setSelectedUserForPoints] = useState<string>('');
  const [pointsAction, setPointsAction] = useState<'add' | 'sub' | 'set'>('add');
  const [pointsValue, setPointsValue] = useState<number>(0);

  // Match creation state
  const teamKeys = Object.keys(teams).sort();
  const [newHomeTeam, setNewHomeTeam] = useState<string>(teamKeys[0] || '');
  const [newAwayTeam, setNewAwayTeam] = useState<string>(teamKeys[1] || teamKeys[0] || '');
  const [newDeadline, setNewDeadline] = useState<string>('');

  // Morocco Time settings (Default: GMT / UTC+0 officially matching Morocco phone time)
  const [moroccoOffset, setMoroccoOffset] = useState<number>(() => getStoredMoroccoOffset());
  const handleOffsetChange = (offset: number) => {
    setMoroccoOffset(offset);
    setStoredMoroccoOffset(offset);
    notify(language === 'fr' ? `Fuseau horaire configuré : GMT${offset === 0 ? '' : '+' + offset}` : language === 'en' ? `Timezone configured: GMT${offset === 0 ? '' : '+' + offset}` : `تم ضبط التوقيت: GMT${offset === 0 ? '' : '+' + offset}`, 'info');
  };

  // Live Morocco Time for fixture scheduling
  const [moroccoNowTime, setMoroccoNowTime] = useState<string>(() => getMoroccoCurrentTimeFormatted(true, moroccoOffset));
  useEffect(() => {
    const timer = setInterval(() => {
      setMoroccoNowTime(getMoroccoCurrentTimeFormatted(true, moroccoOffset));
    }, 1000);
    return () => clearInterval(timer);
  }, [moroccoOffset]);

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
  const [isProcessingLogo, setIsProcessingLogo] = useState<boolean>(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [editSelectedTeamLogoUrl, setEditSelectedTeamLogoUrl] = useState<string>('');

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

  // Activity Log State & Processing
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [activityMatchFilter, setActivityMatchFilter] = useState<string>('ALL');

  // Collapsible Accordion Sections for Admin Portal (show titles only with arrow to expand)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    security: false,
    users: false,
    points: false,
    activityLog: false,
    addMatch: false,
    manageMatches: false,
    teams: false,
    resetDb: false
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAllSections = () => {
    setExpandedSections({
      security: true,
      users: true,
      points: true,
      activityLog: true,
      addMatch: true,
      manageMatches: true,
      teams: true,
      resetDb: true
    });
  };

  const collapseAllSections = () => {
    setExpandedSections({
      security: false,
      users: false,
      points: false,
      activityLog: false,
      addMatch: false,
      manageMatches: false,
      teams: false,
      resetDb: false
    });
  };

  const activityLogs = useMemo(() => {
    const list = Object.values(predictions).map(pred => {
      const match = matches.find(m => m.id === pred.matchId);
      const isPastDeadline = match ? new Date(match.deadline).getTime() <= Date.now() : false;
      return {
        pred,
        match,
        isPastDeadline,
        timestamp: pred.updatedAt ? new Date(pred.updatedAt).getTime() : 0
      };
    });

    return list
      .filter(item => {
        if (activityMatchFilter !== 'ALL' && item.pred.matchId !== activityMatchFilter) return false;
        if (activitySearch.trim()) {
          const q = activitySearch.trim().toLowerCase();
          const matchesUsername = item.pred.username.toLowerCase().includes(q);
          const matchesHome = item.match?.homeTeam.toLowerCase().includes(q);
          const matchesAway = item.match?.awayTeam.toLowerCase().includes(q);
          return matchesUsername || matchesHome || matchesAway;
        }
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [predictions, matches, activitySearch, activityMatchFilter]);

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
      notify(language === 'fr' ? 'Impossible de choisir la même équipe !' : language === 'en' ? 'Cannot choose the same team!' : 'لا يمكن اختيار نفس الفريق للمواجهة!', 'error');
      return;
    }
    if (!newDeadline) {
      notify(language === 'fr' ? 'Veuillez définir la date et l\'heure (Heure du Maroc) !' : language === 'en' ? 'Please specify date and time (Morocco Time)!' : 'الرجاء تحديد موعد المباراة ووقت إغلاق التوقع (بتوقيت المغرب)!', 'error');
      return;
    }

    // Convert admin's input to ISO string strictly in Morocco's timezone
    const isoDeadline = parseMoroccoDateTime(newDeadline, moroccoOffset);

    const newMatch: Match = {
      id: `m_${Date.now()}`,
      homeTeam: newHomeTeam,
      awayTeam: newAwayTeam,
      deadline: isoDeadline,
      status: 'OPEN',
      result: null
    };

    onUpdateMatches([...matches, newMatch]);
    notify(language === 'fr' ? `Match ajouté et programmé à l'heure du Maroc (GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset}) !` : language === 'en' ? `Match scheduled successfully according to Morocco Time (GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset})!` : `تمت إضافة المباراة وبرمجتها وفق توقيت المغرب (GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset}) بنجاح!`, 'success');
    setNewDeadline('');
  };

  const handleUpdateDeadline = (matchId: string) => {
    const dl = editDeadlines[matchId];
    if (!dl) {
      notify(language === 'fr' ? 'Veuillez entrer une date/heure valide !' : language === 'en' ? 'Please enter a valid date/time!' : 'الرجاء اختيار وقت صحيح!', 'error');
      return;
    }
    // Convert admin's edited time in Morocco timezone to ISO string
    const isoDeadline = parseMoroccoDateTime(dl, moroccoOffset);
    const next = matches.map(m => m.id === matchId ? { ...m, deadline: isoDeadline } : m);
    onUpdateMatches(next);
    notify(language === 'fr' ? `Horaire mis à jour selon l'heure du Maroc (GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset}) !` : language === 'en' ? `Deadline updated according to Morocco Time (GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset})!` : `تم تحديث موعد المباراة بنجاح بتوقيت المغرب (GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset})!`, 'success');
  };

  const handleQuickExtendDeadline = (matchId: string, addMinutes: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    const currentMs = new Date(match.deadline).getTime();
    const baseMs = Math.max(Date.now(), isNaN(currentMs) ? Date.now() : currentMs);
    const newIso = new Date(baseMs + addMinutes * 60000).toISOString();
    const next = matches.map(m => m.id === matchId ? { ...m, deadline: newIso } : m);
    onUpdateMatches(next);
    setEditDeadlines(prev => ({ ...prev, [matchId]: formatMoroccoInput(newIso, moroccoOffset) }));
    notify(language === 'fr' ? `Délai prolongé de +${addMinutes} min (Heure du Maroc) !` : language === 'en' ? `Deadline extended by +${addMinutes} min (Morocco Time)!` : `تم تمديد موعد المباراة بـ +${addMinutes} دقيقة!`, 'success');
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
        // Exact Score (5 points)
        if (pred.homeScore === result.homeScore && pred.awayScore === result.awayScore) {
          pts += 5;
        }

        // Scorers points (1 point for each correct goal scorer)
        (pred.homeScorers || []).forEach(sc => {
          if (sc && result.homeScorers.includes(sc)) pts += 1;
        });
        (pred.awayScorers || []).forEach(sc => {
          if (sc && result.awayScorers.includes(sc)) pts += 1;
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
    notify(
      language === 'fr' 
        ? 'Résultat validé et points calculés avec succès !' 
        : language === 'en' 
        ? 'Match result settled and points calculated successfully!' 
        : 'تم اعتماد النتيجة واحتساب النقاط للمتوقعين بنجاح!', 
      'success'
    );
  };

  const handleAddNewTeam = async () => {
    const name = newTeamName.trim();
    if (!name) {
      notify(
        language === 'fr' ? 'Veuillez saisir le nom de l\'équipe !' : language === 'en' ? 'Please enter team name!' : 'الرجاء إدخال اسم الفريق!',
        'error'
      );
      return;
    }
    if (teams[name]) {
      notify(
        language === 'fr' ? 'Cette équipe existe déjà !' : language === 'en' ? 'This team already exists!' : 'هذا الفريق موجود بالفعل!',
        'error'
      );
      return;
    }

    const initialSquad = parsePlayersText(newTeamInitialSquad);
    let finalLogo = newTeamLogo.trim();

    if (!finalLogo) {
      finalLogo = generateFallbackLogo(name);
    } else {
      // Automatically ensure any uploaded or pasted logo has its background stripped and is compressed
      try {
        setIsProcessingLogo(true);
        finalLogo = await removeImageBackground(finalLogo);
      } catch (e) {
        console.warn('Auto background cutout notice:', e);
      } finally {
        setIsProcessingLogo(false);
      }
    }

    const nextTeams = {
      ...teams,
      [name]: {
        name,
        logo: finalLogo,
        squad: initialSquad
      }
    };
    try {
      await onUpdateTeams(nextTeams);
      setSelectedManageTeam(name);
      setNewTeamName('');
      setNewTeamLogo('');
      setNewTeamInitialSquad('');
      setShowPresetPicker(false);
      notify(
        language === 'fr'
          ? (initialSquad.length > 0 ? `Équipe (${name}) enregistrée dans la base de données avec (${initialSquad.length}) joueurs pour tous !` : `Équipe (${name}) enregistrée pour tous !`)
          : language === 'en'
          ? (initialSquad.length > 0 ? `Team (${name}) registered in database with (${initialSquad.length}) players for everyone!` : `Team (${name}) registered for everyone!`)
          : (initialSquad.length > 0 ? `تم تسجيل فريق (${name}) في قاعدة البيانات لكافة الأعضاء مع (${initialSquad.length}) لاعباً!` : `تم تسجيل فريق (${name}) في قاعدة البيانات لكافة الأعضاء!`),
        'success'
      );
    } catch (err: any) {
      console.error(err);
      notify(
        language === 'fr' ? 'Échec de l\'enregistrement de l\'équipe' : language === 'en' ? 'Failed to save team to database' : 'فشل حفظ الفريق في قاعدة البيانات',
        'error'
      );
    }
  };

  const handleSelectPreset = (preset: ClubPreset) => {
    setNewTeamName(preset.name);
    setNewTeamLogo(preset.logo);
    setShowPresetPicker(false);
    notify(
      language === 'fr' ? `Club ${preset.name} et logo sélectionnés !` : language === 'en' ? `Club ${preset.name} and logo selected!` : `تم اختيار نادي ${preset.name} وشعاره!`,
      'info'
    );
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      notify(
        language === 'fr' ? 'Fichier trop lourd, maximum 15 Mo' : language === 'en' ? 'File too large, maximum 15 MB' : 'حجم الصورة كبير، يرجى اختيار صورة أقل من 15 ميغابايت',
        'error'
      );
      return;
    }

    try {
      setIsProcessingLogo(true);
      notify(
        language === 'fr' ? 'Traitement du logo et suppression automatique de l\'arrière-plan...' : language === 'en' ? 'Processing logo and automatically removing background...' : 'جارٍ معالجة الشعار وإزالة الخلفية تلقائياً...',
        'info'
      );
      const transparentLogo = await removeImageBackground(file);
      setNewTeamLogo(transparentLogo);
      notify(
        language === 'fr' ? 'Logo importé et arrière-plan retiré automatiquement ! ✨' : language === 'en' ? 'Logo uploaded with background removed automatically! ✨' : 'تم رفع الشعار وإزالة الخلفية تلقائياً وجعله شفافاً بنجاح! ✨',
        'success'
      );
    } catch (err: any) {
      console.error('Logo upload error:', err);
      notify(
        language === 'fr' ? `Erreur de traitement du logo (${err?.message || ''})` : language === 'en' ? `Error processing logo (${err?.message || ''})` : 'تعذر إزالة خلفية الشعار، يرجى تجربة صورة أخرى',
        'error'
      );
    } finally {
      setIsProcessingLogo(false);
      e.target.value = '';
    }
  };

  const handleLogoUrlBlur = async () => {
    if (!newTeamLogo.trim() || newTeamLogo.startsWith('data:image/png;base64,')) return;
    try {
      setIsProcessingLogo(true);
      const transparent = await removeImageBackground(newTeamLogo.trim());
      setNewTeamLogo(transparent);
      notify(
        language === 'fr' ? 'Arrière-plan supprimé automatiquement ! ✨' : language === 'en' ? 'Background removed automatically! ✨' : 'تم تفريغ خلفية الشعار تلقائياً بنجاح! ✨',
        'success'
      );
    } catch (err) {
      console.warn('URL auto cutout notice:', err);
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleManualRemoveBackground = async () => {
    if (!newTeamLogo.trim()) {
      notify(
        language === 'fr' ? 'Veuillez choisir un logo d\'abord' : language === 'en' ? 'Please choose or upload a logo first' : 'يرجى اختيار أو رفع شعار أولاً لإزالة خلفيته',
        'error'
      );
      return;
    }
    try {
      setIsProcessingLogo(true);
      notify(
        language === 'fr' ? 'Suppression de l\'arrière-plan en cours...' : language === 'en' ? 'Removing logo background...' : 'جارٍ إزالة خلفية الشعار...',
        'info'
      );
      const transparentLogo = await removeImageBackground(newTeamLogo);
      setNewTeamLogo(transparentLogo);
      notify(
        language === 'fr' ? 'Arrière-plan supprimé avec succès ! ✨' : language === 'en' ? 'Background removed successfully! ✨' : 'تمت إزالة خلفية الشعار بنجاح وجعله شفافاً! ✨',
        'success'
      );
    } catch (err) {
      console.error(err);
      notify(
        language === 'fr' ? 'Impossible de supprimer le fond automatiquement (CORS)' : language === 'en' ? 'Could not remove background automatically (CORS)' : 'تعذر إزالة خلفية هذا الشعار تلقائياً (قد يكون الرابط محمي CORS)، يُفضل رفع الصورة من جهازك مباشرة',
        'error'
      );
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleUpdateSelectedTeamLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedManageTeam || !teams[selectedManageTeam]) return;

    try {
      setIsProcessingLogo(true);
      notify(
        language === 'fr' ? `Traitement du logo ${selectedManageTeam} et détourage automatique...` : language === 'en' ? `Processing logo for ${selectedManageTeam} and auto-removing background...` : `جارٍ معالجة شعار ${selectedManageTeam} وإزالة الخلفية تلقائياً...`,
        'info'
      );
      const transparentLogo = await removeImageBackground(file);
      const nextTeams = {
        ...teams,
        [selectedManageTeam]: {
          ...teams[selectedManageTeam],
          logo: transparentLogo
        }
      };

      notify(
        language === 'fr' ? `Enregistrement du logo dans la base de données...` : language === 'en' ? `Saving logo to database for everyone...` : `جارٍ حفظ الشعار في قاعدة البيانات لكافة المستخدمين...`,
        'info'
      );
      await onUpdateTeams(nextTeams);

      notify(
        language === 'fr' ? `Logo de ${selectedManageTeam} détouré et enregistré pour tous ! ✨` : language === 'en' ? `Logo of ${selectedManageTeam} cutout and saved for everyone! ✨` : `تم تفريغ شعار فريق ${selectedManageTeam} بدون خلفية وحفظه بنجاح لكافة المستخدمين! ✨`,
        'success'
      );
    } catch (err: any) {
      console.error(err);
      notify(
        err?.message || (language === 'fr' ? 'Échec du traitement du logo' : language === 'en' ? 'Logo processing failed' : 'فشل معالجة الشعار، يرجى المحاولة مرة أخرى'),
        'error'
      );
    } finally {
      setIsProcessingLogo(false);
      e.target.value = '';
    }
  };

  const handleUpdateSelectedTeamLogoFromUrl = async () => {
    if (!editSelectedTeamLogoUrl.trim() || !selectedManageTeam || !teams[selectedManageTeam]) return;
    try {
      setIsProcessingLogo(true);
      notify(
        language === 'fr' ? `Traitement du logo ${selectedManageTeam} et suppression de l'arrière-plan...` : language === 'en' ? `Processing logo for ${selectedManageTeam} and auto-removing background...` : `جارٍ معالجة شعار ${selectedManageTeam} وإزالة الخلفية تلقائياً...`,
        'info'
      );
      const transparentLogo = await removeImageBackground(editSelectedTeamLogoUrl.trim());
      const nextTeams = {
        ...teams,
        [selectedManageTeam]: {
          ...teams[selectedManageTeam],
          logo: transparentLogo
        }
      };

      notify(
        language === 'fr' ? `Enregistrement du logo dans la base de données...` : language === 'en' ? `Saving logo to database for everyone...` : `جارٍ حفظ الشعار في قاعدة البيانات لكافة المستخدمين...`,
        'info'
      );
      await onUpdateTeams(nextTeams);

      notify(
        language === 'fr' ? `Logo de ${selectedManageTeam} détouré et enregistré pour tous ! ✨` : language === 'en' ? `Logo of ${selectedManageTeam} cutout and saved for everyone! ✨` : `تم تفريغ شعار فريق ${selectedManageTeam} وحفظه بنجاح لكافة المستخدمين! ✨`,
        'success'
      );
      setEditSelectedTeamLogoUrl('');
    } catch (err: any) {
      console.error(err);
      notify(
        err?.message || (language === 'fr' ? 'Échec du traitement du logo' : language === 'en' ? 'Logo processing failed' : 'فشل معالجة الشعار، يرجى المحاولة مرة أخرى'),
        'error'
      );
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleRemoveExistingTeamLogoBg = async () => {
    const currentTeam = teams[selectedManageTeam];
    if (!currentTeam || !currentTeam.logo) {
      notify(
        language === 'fr' ? 'Aucun logo spécifié pour cette équipe' : language === 'en' ? 'No logo specified for this team' : 'لا يوجد شعار محدد لهذا الفريق',
        'error'
      );
      return;
    }

    try {
      setIsProcessingLogo(true);
      notify(
        language === 'fr' ? `Suppression de l'arrière-plan de ${selectedManageTeam}...` : language === 'en' ? `Removing background of ${selectedManageTeam}...` : `جارٍ إزالة خلفية شعار ${selectedManageTeam}...`,
        'info'
      );
      const transparentLogo = await removeImageBackground(currentTeam.logo);
      const nextTeams = {
        ...teams,
        [selectedManageTeam]: {
          ...currentTeam,
          logo: transparentLogo
        }
      };

      notify(
        language === 'fr' ? `Enregistrement dans la base de données pour tous...` : language === 'en' ? `Saving to database for everyone...` : `جارٍ حفظ الشعار الشفاف لكافة الأعضاء في قاعدة البيانات...`,
        'info'
      );
      await onUpdateTeams(nextTeams);

      notify(
        language === 'fr' ? `Arrière-plan du logo de ${selectedManageTeam} retiré et enregistré pour tous ! ✨` : language === 'en' ? `Logo background of ${selectedManageTeam} removed and saved for everyone! ✨` : `تمت إزالة خلفية شعار ${selectedManageTeam} وحفظه بنجاح لكافة المستخدمين! ✨`,
        'success'
      );
    } catch (err: any) {
      console.error(err);
      notify(
        err?.message || (language === 'fr' ? 'Impossible de supprimer le fond automatiquement' : language === 'en' ? 'Could not remove background automatically' : 'تعذر إزالة خلفية هذا الشعار تلقائياً، يمكنك رفع صورة الشعار مباشرة من جهازك'),
        'error'
      );
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleGenerateFallbackLogo = () => {
    if (!newTeamName.trim()) {
      notify(
        language === 'fr' ? 'Veuillez saisir le nom de l\'équipe d\'abord' : language === 'en' ? 'Please enter team name first' : 'يرجى كتابة اسم الفريق أولاً لتوليد الشعار',
        'error'
      );
      return;
    }
    const logoUrl = generateFallbackLogo(newTeamName);
    setNewTeamLogo(logoUrl);
    notify(
      language === 'fr' ? 'Logo généré et appliqué avec succès !' : language === 'en' ? 'Logo generated and set successfully!' : 'تم إنشاء وتعيين الشعار بنجاح!',
      'success'
    );
  };

  const handleAddBulkPlayers = () => {
    const team = teams[selectedManageTeam];
    if (!team) {
      notify(
        language === 'fr' ? 'Veuillez choisir une équipe d\'abord !' : language === 'en' ? 'Please select a team first!' : 'الرجاء اختيار فريق أولاً!',
        'error'
      );
      return;
    }

    const parsed = parsePlayersText(bulkSquadInput);
    if (parsed.length === 0) {
      notify(
        language === 'fr' ? 'Veuillez saisir ou coller les noms des joueurs !' : language === 'en' ? 'Please enter or paste player names!' : 'الرجاء إدخال أو لصق أسماء اللاعبين أولاً!',
        'error'
      );
      return;
    }

    const currentSquad = team.squad || [];
    const newUniquePlayers = parsed.filter(p => !currentSquad.includes(p));

    if (newUniquePlayers.length === 0) {
      notify(
        language === 'fr' ? 'Tous ces joueurs figurent déjà dans l\'effectif !' : language === 'en' ? 'All these players are already in this squad!' : 'جميع هؤلاء اللاعبين مسجلون بالفعل في تشكيلة هذا الفريق!',
        'info'
      );
      return;
    }

    const nextSquad = [...currentSquad, ...newUniquePlayers];
    const nextTeams = {
      ...teams,
      [selectedManageTeam]: { ...team, squad: nextSquad }
    };
    onUpdateTeams(nextTeams);
    setBulkSquadInput('');
    notify(
      language === 'fr'
        ? `(${newUniquePlayers.length}) joueurs ajoutés avec succès à (${selectedManageTeam}) !`
        : language === 'en'
        ? `(${newUniquePlayers.length}) players added successfully to (${selectedManageTeam})!`
        : `تمت إضافة (${newUniquePlayers.length}) لاعباً بنجاح إلى تشكيلة (${selectedManageTeam})!`,
      'success'
    );
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
    notify(
      language === 'fr' ? `Effectif de (${clearSquadConfirm}) effacé avec succès !` : language === 'en' ? `Squad of (${clearSquadConfirm}) cleared successfully!` : `تم مسح تشكيلة فريق (${clearSquadConfirm}) بنجاح!`,
      'info'
    );
  };

  const handleAddPlayer = () => {
    const team = teams[selectedManageTeam];
    const name = newPlayerName.trim();
    if (!team || !name) return;

    if (team.squad && team.squad.includes(name)) {
      notify(
        language === 'fr' ? 'Ce joueur existe déjà dans l\'effectif !' : language === 'en' ? 'This player already exists in the squad!' : 'هذا اللاعب موجود بالفعل في التشكيلة!',
        'info'
      );
      return;
    }

    const nextSquad = [...(team.squad || []), name];
    const nextTeams = {
      ...teams,
      [selectedManageTeam]: { ...team, squad: nextSquad }
    };
    onUpdateTeams(nextTeams);
    setNewPlayerName('');
    notify(
      language === 'fr' ? `Joueur (${name}) ajouté !` : language === 'en' ? `Player (${name}) added!` : `تمت إضافة اللاعب (${name})!`,
      'success'
    );
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
    notify(
      language === 'fr' ? `Équipe (${teamName}) et son effectif supprimés !` : language === 'en' ? `Team (${teamName}) and its squad deleted!` : `تم حذف فريق (${teamName}) وقائمته بالكامل!`,
      'info'
    );
  };

  const handleDeleteAllTeamsConfirmed = () => {
    onUpdateTeams({});
    setDeleteAllTeamsConfirm(false);
    notify(
      language === 'fr' ? 'Toutes les équipes et joueurs ont été supprimés !' : language === 'en' ? 'All teams and squad players cleared!' : 'تم حذف وإفراغ كافة الفرق وجميع اللاعبين بنجاح!',
      'info'
    );
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendPassword.trim()) {
      notify(
        language === 'fr' ? 'Veuillez saisir un mot de passe valide !' : language === 'en' ? 'Please enter a valid password!' : 'الرجاء إدخال كلمة مرور صالحة!',
        'error'
      );
      return;
    }
    const cleanPass = newFriendPassword.trim();
    setIsSavingSecurity(true);
    const updated = {
      ...securityConfig,
      friendPassword: cleanPass
    };
    saveSecurityConfig(updated);
    setSecurityConfig(updated);
    try {
      await syncSaveSecurityConfig(cleanPass);
      notify(
        language === 'fr' ? 'Mot de passe des amis mis à jour et synchronisé !' : language === 'en' ? 'Friend password updated and synced via cloud!' : 'تم تحديث وتعميم كلمة مرور الأصدقاء بنجاح عبر السحابة!',
        'success'
      );
      setSecuritySuccess(
        language === 'fr'
          ? `Mot de passe des amis mis à jour : "${cleanPass}" et synchronisé sur tous les appareils`
          : language === 'en'
          ? `Friend password updated to: "${cleanPass}" and broadcast to all devices`
          : `تم تحديث كلمة مرور الأصدقاء بنجاح إلى: "${cleanPass}" وتعميمها على كافة الأجهزة`
      );
    } catch (err) {
      console.error(err);
      notify(
        language === 'fr' ? 'Enregistré localement (erreur de synchronisation cloud)' : language === 'en' ? 'Saved locally (cloud sync temporarily unavailable)' : 'تم الحفظ محلياً مع تعذر المزامنة السحابية المؤقتة',
        'info'
      );
      setSecuritySuccess(
        language === 'fr' ? `Mot de passe mis à jour localement : "${cleanPass}"` : language === 'en' ? `Password updated locally to: "${cleanPass}"` : `تم تحديث كلمة المرور محلياً إلى: "${cleanPass}"`
      );
    } finally {
      setIsSavingSecurity(false);
      setTimeout(() => setSecuritySuccess(null), 4500);
    }
  };

  const isVerifiedAdmin = currentUser?.role === 'admin' && sessionStorage.getItem('cl_admin_verified') === '05082007';

  const handleAdminGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminGatePasscode.trim() !== '05082007') {
      setAdminGateError(
        language === 'fr'
          ? 'Code secret incorrect ! Veuillez saisir le bon code administrateur.'
          : language === 'en'
          ? 'Incorrect passcode! Please enter the valid master admin secret code.'
          : 'الرمز السري غير صحيح! يرجى إدخال الرمز السري الصحيح للإدارة.'
      );
      return;
    }
    sessionStorage.setItem('cl_admin_verified', '05082007');
    setAdminGateError(null);
    let adminUser = users.find(u => u.role === 'admin');
    if (!adminUser) {
      adminUser = {
        username: language === 'fr' ? 'Admin Système' : language === 'en' ? 'Master Admin' : 'الآدمن (Admin)',
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
      <div 
        className="max-w-md mx-auto my-6 sm:my-10 bg-[#11212D] p-6 sm:p-7 rounded-2xl border border-[#253745] text-center shadow-2xl"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="w-12 h-12 rounded-xl bg-[#06141B] border border-[#253745] text-[#CCD0CF] flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6 text-[#CCD0CF]" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-[#CCD0CF] mb-1.5">
          {language === 'fr' ? 'Accès Administrateur Sécurisé' : language === 'en' ? 'Protected Admin Portal' : 'لوحة الإدارة محمية'}
        </h2>
        <p className="text-xs text-[#9BA8AB] mb-5 leading-relaxed">
          {language === 'fr'
            ? 'L\'accès aux paramètres et à la gestion du système requiert la saisie du code secret administrateur.'
            : language === 'en'
            ? 'Access to system controls requires entering the verified master administrator secret code.'
            : 'لا يمكن الدخول أو استعراض لوحة تحكم الآدمن بدون إدخال الرمز السري للإدارة المعتمد.'}
        </p>

        {adminGateError && (
          <div className="mb-4 p-3 rounded-xl bg-[#253745] border border-rose-500/40 text-rose-200 text-xs font-semibold leading-relaxed">
            {adminGateError}
          </div>
        )}

        <form onSubmit={handleAdminGateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#9BA8AB]" />
              <span>
                {language === 'fr' 
                  ? 'Code secret administrateur (Admin Code)' 
                  : language === 'en' 
                  ? 'Admin Secret Passcode' 
                  : 'الرمز السري للآدمن (Admin Secret Code)'}
              </span>
            </label>
            <div className="relative" dir="ltr">
              <input
                type="password"
                dir="ltr"
                value={adminGatePasscode}
                onChange={(e) => setAdminGatePasscode(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 text-center text-[#CCD0CF] text-base tracking-widest outline-none focus:border-[#4A5C6A] min-h-[44px] placeholder:text-[#9BA8AB]/40 placeholder:tracking-normal force-ltr font-mono transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold py-3 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer min-h-[44px] flex items-center justify-center gap-2 active:scale-[0.98] shadow"
          >
            <Lock className="w-4 h-4" />
            <span>
              {language === 'fr' ? 'Vérifier et Accéder' : language === 'en' ? 'Verify & Access Dashboard' : 'التحقق والدخول إلى لوحة التحكم'}
            </span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Organization Bar: Expand / Collapse All */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-[#11212D] rounded-2xl border border-[#253745] shadow-xl">
        <div className="text-xs text-[#CCD0CF]">
          <span className="font-bold text-[#CCD0CF] ml-1 mr-1">
            {language === 'fr' ? 'Panneau de Contrôle :' : language === 'en' ? 'Admin Control Center:' : 'لوحة تحكم الإدارة:'}
          </span>
          <span className="text-[#9BA8AB]">
            {language === 'fr' 
              ? 'Cliquez sur une section pour la déplier et modifier son contenu.' 
              : language === 'en' 
              ? 'Click any section header or chevron to expand or collapse details.' 
              : 'انقر على عنوان أي قسم أو السهم لتوسيعه وعرض كامل تفاصيله، أو طيّه للتبسيط والترتيب.'}
          </span>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={expandAllSections}
            className="px-3 py-1.5 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] text-xs font-semibold transition-all duration-200 cursor-pointer border border-[#253745] flex items-center gap-1.5 active:scale-95"
          >
            <ChevronDown className="w-3.5 h-3.5 text-[#CCD0CF]" />
            <span>{t('expandAll')}</span>
          </button>
          <button
            type="button"
            onClick={collapseAllSections}
            className="px-3 py-1.5 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] text-xs font-semibold transition-all duration-200 cursor-pointer border border-[#253745] flex items-center gap-1.5 active:scale-95"
          >
            <ChevronUp className="w-3.5 h-3.5 text-[#CCD0CF]" />
            <span>{t('collapseAll')}</span>
          </button>
        </div>
      </div>

      {/* 1. Friends Access Password & Biometric Settings Card */}
      <div className="ucl-card rounded-2xl border border-[#253745] bg-[#11212D] overflow-hidden transition-all duration-200 shadow-xl">
        <button
          type="button"
          onClick={() => toggleSection('security')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-[#253745]/40 transition-all duration-200 cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <KeyRound className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                  {language === 'fr' 
                    ? 'Paramètres du mot de passe amis et sécurité' 
                    : language === 'en' 
                    ? 'Friends Access Password & Security Settings' 
                    : 'إعدادات كلمة مرور الأصدقاء والحماية'}
                </h3>
                <span className="text-[10px] text-[#CCD0CF] font-bold bg-[#253745] px-2 py-0.5 rounded border border-[#4A5C6A] font-mono" dir="ltr">
                  {language === 'fr' ? 'Actuel : ' : language === 'en' ? 'Current: ' : 'الحالية: '}{securityConfig.friendPassword}
                </span>
                {securityConfig.biometricEnrolled && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 hidden sm:inline">
                    {language === 'fr' ? 'Biométrie active' : language === 'en' ? 'Biometric active' : 'بصمة نشطة'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9BA8AB] mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Modifiez ou consultez le mot de passe requis pour que vos amis accèdent à la plateforme.'
                  : language === 'en'
                  ? 'Change or view the passcode required for friends to access the platform.'
                  : 'يمكنك تغيير كلمة المرور التي يطلبها النظام من أصدقائك للوصول إلى المنصة أو الاطلاع عليها.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#9BA8AB] font-semibold hidden md:inline">
              {expandedSections.security 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-[#253745] border border-[#253745] flex items-center justify-center text-[#CCD0CF] transition-transform duration-200 ${expandedSections.security ? 'rotate-180 bg-[#4A5C6A] text-[#CCD0CF] border-[#4A5C6A]' : 'hover:border-[#4A5C6A]'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.security && (
          <div className="p-5 sm:p-6 pt-0 border-t border-[#253745] mt-1">
            <p className="text-xs text-[#9BA8AB] my-4 pb-3 border-b border-[#253745] sm:hidden">
              {language === 'fr'
                ? 'Modifiez ou consultez le mot de passe requis pour que vos amis accèdent à la plateforme.'
                : language === 'en'
                ? 'Change or view the passcode required for friends to access the platform.'
                : 'يمكنك تغيير كلمة المرور التي يطلبها النظام من أصدقائك للوصول إلى المنصة أو الاطلاع عليها.'}
            </p>

            {securitySuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold">
                {securitySuccess}
              </div>
            )}

            <form onSubmit={handleSaveSecurity} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#CCD0CF]">
                    {language === 'fr' ? 'Modifier le mot de passe amis' : language === 'en' ? 'Edit Friends Passcode' : 'تعديل كلمة مرور الأصدقاء'}
                  </label>
                  <span className="text-[10px] text-[#CCD0CF] font-bold bg-[#253745] px-2 py-0.5 rounded border border-[#4A5C6A] font-mono" dir="ltr">
                    {securityConfig.friendPassword}
                  </span>
                </div>
                <div dir="ltr">
                  <input
                    type="text"
                    dir="ltr"
                    value={newFriendPassword}
                    onChange={(e) => setNewFriendPassword(e.target.value)}
                    className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 text-xs text-[#CCD0CF] font-mono font-bold outline-none focus:border-[#4A5C6A] force-ltr text-left transition-all duration-200"
                    placeholder={language === 'fr' ? 'Nouveau mot de passe...' : language === 'en' ? 'New passcode...' : 'أدخل كلمة المرور الجديدة...'}
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSavingSecurity}
                  className="w-full bg-[#CCD0CF] hover:bg-white disabled:opacity-50 text-[#06141B] font-bold text-xs py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isSavingSecurity ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'fr' ? 'Synchronisation cloud...' : language === 'en' ? 'Syncing with cloud...' : 'جاري المزامنة مع السحابة...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{language === 'fr' ? 'Enregistrer et synchroniser' : language === 'en' ? 'Save & Sync Passcode' : 'حفظ وتعميم كلمة المرور'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-[#06141B] rounded-xl border border-[#253745] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#CCD0CF] block">
                    {language === 'fr' ? 'Empreinte biométrique :' : language === 'en' ? 'Biometrics Status:' : 'حالة البصمة البيومترية:'}
                  </span>
                  <span className="text-[11px] text-[#9BA8AB]">
                    {securityConfig.biometricEnrolled 
                      ? (language === 'fr' ? 'Active sur cet appareil' : language === 'en' ? 'Active on this device' : 'مفعلة على هذا الجهاز') 
                      : (language === 'fr' ? 'Non configurée' : language === 'en' ? 'Not configured yet' : 'غير مفعلة بعد')}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  securityConfig.biometricEnrolled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#253745] text-[#9BA8AB]'
                }`}>
                  {securityConfig.biometricEnrolled 
                    ? (language === 'fr' ? 'Active' : language === 'en' ? 'Active' : 'نشطة') 
                    : (language === 'fr' ? 'Inactive' : language === 'en' ? 'Not enrolled' : 'غير مسجلة')}
                </span>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 2. User Approval & Membership Control Card */}
      <div className="ucl-card rounded-2xl border border-[#253745] bg-[#11212D] overflow-hidden transition-all duration-200 shadow-xl">
        <button
          type="button"
          onClick={() => toggleSection('users')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-[#253745]/40 transition-all duration-200 cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <UserCheck className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                  {language === 'fr' 
                    ? 'Gestion des demandes d\'adhésion et membres' 
                    : language === 'en' 
                    ? 'Membership & User Management' 
                    : 'إدارة طلبات الانضمام والمستخدمين'}
                </h3>
                {pendingUsers.length > 0 ? (
                  <span className="text-[10px] text-amber-300 font-bold bg-[#253745] px-2 py-0.5 rounded border border-[#4A5C6A] animate-pulse">
                    {language === 'fr' ? `En attente (${pendingUsers.length})` : language === 'en' ? `Pending (${pendingUsers.length})` : `طلبات معلقة (${pendingUsers.length})`}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#9BA8AB] bg-[#253745] px-2 py-0.5 rounded border border-[#253745]">
                    {language === 'fr' ? 'Aucune demande' : language === 'en' ? 'No pending' : 'لا طلبات معلقة'}
                  </span>
                )}
                <span className="text-[10px] text-[#CCD0CF] bg-[#253745] px-2 py-0.5 rounded border border-[#4A5C6A]">
                  {language === 'fr' ? `Approuvés (${approvedUsers.length})` : language === 'en' ? `Approved (${approvedUsers.length})` : `المقبولون (${approvedUsers.length})`}
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB] mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Approuvez ou rejetez les nouveaux membres avant qu\'ils puissent participer.'
                  : language === 'en'
                  ? 'Approve or reject new members before they can participate and rank.'
                  : 'موافقة أو رفض الأعضاء الجدد قبل السماح لهم بالتوقع والظهور في جدول الترتيب.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#9BA8AB] font-semibold hidden md:inline">
              {expandedSections.users 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-[#253745] border border-[#253745] flex items-center justify-center text-[#CCD0CF] transition-transform duration-200 ${expandedSections.users ? 'rotate-180 bg-[#4A5C6A] text-[#CCD0CF] border-[#4A5C6A]' : 'hover:border-[#4A5C6A]'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.users && (
          <div className="p-5 sm:p-6 pt-0 border-t border-[#253745] mt-1">
            <p className="text-xs text-[#9BA8AB] my-4 pb-3 border-b border-[#253745] sm:hidden">
              {language === 'fr'
                ? 'Approuvez ou rejetez les nouveaux membres avant qu\'ils puissent participer.'
                : language === 'en'
                ? 'Approve or reject new members before they can participate and rank.'
                : 'موافقة أو رفض الأعضاء الجدد قبل السماح لهم بالتوقع والظهور في جدول الترتيب.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Pending Users */}
              <div className="bg-[#06141B] p-4 rounded-xl border border-[#253745]">
                <h4 className="text-sm font-bold text-[#CCD0CF] mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#CCD0CF]" />
                  <span>
                    {language === 'fr' ? `En attente (${pendingUsers.length})` : language === 'en' ? `Pending Requests (${pendingUsers.length})` : `طلبات معلقة (${pendingUsers.length})`}
                  </span>
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {pendingUsers.length === 0 ? (
                    <p className="text-xs text-[#9BA8AB] text-center py-4">
                      {language === 'fr' ? 'Aucune demande en attente.' : language === 'en' ? 'No pending requests.' : 'لا توجد طلبات معلقة.'}
                    </p>
                  ) : (
                    pendingUsers.map(u => (
                      <div key={u.username} className="p-3 bg-[#11212D] rounded-xl border border-[#253745] flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs text-[#CCD0CF] block truncate">{u.username}</span>
                          {u.originalUsername && u.originalUsername.toLowerCase() !== u.username.toLowerCase() && (
                            <span className="text-[10px] text-amber-400/90 font-mono block truncate">
                              {language === 'ar' ? 'الاسم الأصلي:' : language === 'fr' ? 'Nom d\'origine :' : 'Original:'} {u.originalUsername}
                            </span>
                          )}
                          {u.email && (
                            <span className="text-[10px] text-[#9BA8AB] font-mono block truncate" dir="ltr">
                              {u.email}
                            </span>
                          )}
                          <span className="text-[10px] text-amber-300 font-semibold">
                            {language === 'fr' ? 'En attente' : language === 'en' ? 'Awaiting approval' : 'بانتظار الموافقة'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {onRenameUser && (
                            <button
                              type="button"
                              onClick={() => setEditingMember(u)}
                              className="bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white p-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 border border-[#4A5C6A]/50"
                              title={t('changeMemberName')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleApproveUser(u.username)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
                            title={language === 'fr' ? 'Approuver' : language === 'en' ? 'Approve' : 'قبول'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRejectUser(u.username)}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
                            title={language === 'fr' ? 'Rejeter' : language === 'en' ? 'Reject' : 'رفض'}
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
              <div className="bg-[#06141B] p-4 rounded-xl border border-[#253745]">
                <h4 className="text-sm font-bold text-[#CCD0CF] mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#CCD0CF]" />
                  <span>
                    {language === 'fr' ? `Membres approuvés (${approvedUsers.length})` : language === 'en' ? `Approved Members (${approvedUsers.length})` : `الأعضاء المقبولون (${approvedUsers.length})`}
                  </span>
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {approvedUsers.length === 0 ? (
                    <p className="text-xs text-[#9BA8AB] text-center py-4">
                      {language === 'fr' ? 'Aucun membre approuvé pour le moment.' : language === 'en' ? 'No approved members yet.' : 'لا يوجد أعضاء مقبولون حالياً.'}
                    </p>
                  ) : (
                    approvedUsers.map(u => (
                      <div key={u.username} className="p-3 bg-[#11212D] rounded-xl border border-[#253745] flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs text-[#CCD0CF] block truncate">{u.username}</span>
                          {u.originalUsername && u.originalUsername.toLowerCase() !== u.username.toLowerCase() && (
                            <span className="text-[10px] text-amber-400/90 font-mono block truncate">
                              {language === 'ar' ? 'الاسم الأصلي:' : language === 'fr' ? 'Nom d\'origine :' : 'Original:'} {u.originalUsername}
                            </span>
                          )}
                          {u.email && (
                            <span className="text-[10px] text-[#9BA8AB] font-mono block truncate" dir="ltr">
                              {u.email}
                            </span>
                          )}
                          <span className="text-[10px] text-[#9BA8AB] font-semibold">{u.points || 0} {language === 'ar' ? 'نقطة' : 'pts'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {onRenameUser && (
                            <button
                              type="button"
                              onClick={() => setEditingMember(u)}
                              className="bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-95 border border-[#4A5C6A]/50"
                              title={t('changeMemberName')}
                            >
                              <Edit3 className="w-3 h-3 text-[#CCD0CF]" />
                              <span>{language === 'fr' ? 'Renommer' : language === 'en' ? 'Rename' : 'تعديل الاسم'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleRevokeUser(u.username)}
                            className="bg-[#253745] hover:bg-rose-900/60 text-rose-300 border border-[#253745] text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
                          >
                            {language === 'fr' ? 'Suspendre' : language === 'en' ? 'Suspend' : 'تعليق'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Admins */}
              <div className="bg-[#06141B] p-4 rounded-xl border border-[#253745]">
                <h4 className="text-sm font-bold text-[#CCD0CF] mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#CCD0CF]" />
                  <span>
                    {language === 'fr' ? `Administrateurs (${adminUsers.length})` : language === 'en' ? `Active Admins (${adminUsers.length})` : `الآدمنز المتواجدون (${adminUsers.length})`}
                  </span>
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {adminUsers.map(u => (
                    <div key={u.username} className="p-3 bg-[#11212D] rounded-xl border border-[#253745] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#4A5C6A] animate-pulse" />
                        <div>
                          <span className="font-bold text-xs text-[#CCD0CF] block">{u.username}</span>
                          <span className="text-[10px] text-[#9BA8AB] font-semibold">
                            {language === 'fr' ? 'Admin Système' : language === 'en' ? 'Master Admin' : 'مدير نظام أساسي'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] px-2 py-0.5 rounded font-bold">
                        {language === 'fr' ? 'Actif' : language === 'en' ? 'Active' : 'نشط'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Points Correction Card */}
      <div className="ucl-card rounded-2xl border border-[#253745] bg-[#11212D] overflow-hidden transition-all duration-200 shadow-xl">
        <button
          type="button"
          onClick={() => toggleSection('points')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-[#253745]/40 transition-all duration-200 cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <Calculator className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                {language === 'fr' 
                  ? 'Ajustement manuel des points des membres' 
                  : language === 'en' 
                  ? 'Member Points Adjustment' 
                  : 'تعديل نقاط المتوقعين (تصحيح أخطاء)'}
              </h3>
              <p className="text-xs text-[#9BA8AB] mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Ajoutez, déduisez ou définissez directement les points d\'un membre.'
                  : language === 'en'
                  ? 'Add, deduct, or set points directly for any participating member.'
                  : 'يمكنك إضافة أو خصم أو تعيين نقاط لأي عضو في حال وجود خطأ في الاحتساب.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#9BA8AB] font-semibold hidden md:inline">
              {expandedSections.points 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-[#253745] border border-[#253745] flex items-center justify-center text-[#CCD0CF] transition-transform duration-200 ${expandedSections.points ? 'rotate-180 bg-[#4A5C6A] text-[#CCD0CF] border-[#4A5C6A]' : 'hover:border-[#4A5C6A]'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.points && (
          <div className="p-5 sm:p-6 pt-0 border-t border-[#253745] mt-1">
            <p className="text-xs text-[#9BA8AB] my-4 pb-3 border-b border-[#253745] sm:hidden">
              {language === 'fr'
                ? 'Ajoutez, déduisez ou définissez directement les points d\'un membre.'
                : language === 'en'
                ? 'Add, deduct, or set points directly for any participating member.'
                : 'يمكنك إضافة أو خصم أو تعيين نقاط لأي عضو في حال وجود خطأ في الاحتساب.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <select
                value={selectedUserForPoints}
                onChange={(e) => setSelectedUserForPoints(e.target.value)}
                className="bg-[#06141B] border border-[#253745] rounded-xl p-2.5 text-xs text-[#CCD0CF] font-semibold outline-none focus:border-[#4A5C6A] transition-all duration-200"
              >
                <option value="">{language === 'fr' ? 'Choisir le membre...' : language === 'en' ? 'Select member...' : 'اختر العضو...'}</option>
                {users.filter(u => u.role !== 'admin').map(u => (
                  <option key={u.username} value={u.username}>
                    {u.username} ({u.points || 0} {language === 'ar' ? 'نقطة' : 'pts'})
                  </option>
                ))}
              </select>

              <select
                value={pointsAction}
                onChange={(e) => setPointsAction(e.target.value as 'add' | 'sub' | 'set')}
                className="bg-[#06141B] border border-[#253745] rounded-xl p-2.5 text-xs text-[#CCD0CF] font-semibold outline-none focus:border-[#4A5C6A] transition-all duration-200"
              >
                <option value="add">{language === 'fr' ? 'Ajouter des points (+)' : language === 'en' ? 'Add points (+)' : 'إضافة نقاط (+)'}</option>
                <option value="sub">{language === 'fr' ? 'Déduire des points (-)' : language === 'en' ? 'Deduct points (-)' : 'خصم نقاط (-)'}</option>
                <option value="set">{language === 'fr' ? 'Définir le total (=)' : language === 'en' ? 'Set total points (=)' : 'تعيين إجمالي النقاط (=)'}</option>
              </select>

              <div dir="ltr">
                <input
                  type="number"
                  min="0"
                  dir="ltr"
                  value={pointsValue}
                  onChange={(e) => setPointsValue(parseInt(e.target.value) || 0)}
                  placeholder={language === 'fr' ? 'Nombre de points...' : language === 'en' ? 'Points amount...' : 'عدد النقاط...'}
                  className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-2.5 text-xs text-[#CCD0CF] outline-none focus:border-[#4A5C6A] force-ltr text-center font-mono transition-all duration-200"
                />
              </div>

              <button
                onClick={handleApplyPointsModification}
                className="bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Appliquer' : language === 'en' ? 'Apply Adjustment' : 'تنفيذ التعديل'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Activity Log (سجل النشاطات) Card */}
      <div className="ucl-card rounded-2xl border border-[#253745] bg-[#11212D] overflow-hidden transition-all duration-200 shadow-xl">
        <button
          type="button"
          onClick={() => toggleSection('activityLog')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-[#253745]/40 transition-all duration-200 cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <Activity className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                  {language === 'fr' 
                    ? 'Journal d\'activités (Activity Log)' 
                    : language === 'en' 
                    ? 'Activity Log & Live Monitoring' 
                    : 'سجل النشاطات (Activity Log)'}
                </h3>
                <span className="text-[10px] bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] px-2 py-0.5 rounded-full font-bold">
                  {language === 'fr' ? 'Surveillance en direct' : language === 'en' ? 'Live monitoring' : 'مراقبة حية'}
                </span>
                <span className="text-[10px] text-[#9BA8AB] bg-[#253745] px-2 py-0.5 rounded border border-[#253745]">
                  {language === 'fr' 
                    ? `Total pronostics : ${Object.keys(predictions).length}` 
                    : language === 'en' 
                    ? `Total predictions: ${Object.keys(predictions).length}` 
                    : `إجمالي التوقعات: ${Object.keys(predictions).length}`}
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB] mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Consultez les derniers pronostics soumis par les membres pour vérifier les délais.'
                  : language === 'en'
                  ? 'Monitor recent member predictions and check submission deadlines.'
                  : 'يوضح آخر التوقعات التي تم إدخالها من قبل الأعضاء لتسهيل مراقبة سير العمل والتحقق من التوقيتات.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#9BA8AB] font-semibold hidden md:inline">
              {expandedSections.activityLog 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-[#253745] border border-[#253745] flex items-center justify-center text-[#CCD0CF] transition-transform duration-200 ${expandedSections.activityLog ? 'rotate-180 bg-[#4A5C6A] text-[#CCD0CF] border-[#4A5C6A]' : 'hover:border-[#4A5C6A]'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.activityLog && (
          <div className="p-5 sm:p-6 pt-0 border-t border-[#253745] mt-1 space-y-4">
            <p className="text-xs text-[#9BA8AB] my-4 pb-3 border-b border-[#253745] sm:hidden">
              {language === 'fr'
                ? 'Consultez les derniers pronostics soumis par les membres pour vérifier les délais.'
                : language === 'en'
                ? 'Monitor recent member predictions and check submission deadlines.'
                : 'يوضح آخر التوقعات التي تم إدخالها من قبل الأعضاء لتسهيل مراقبة سير العمل والتحقق من التوقيتات.'}
            </p>

            {/* Filters bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {/* Search input */}
              <div className="relative">
                <Search className={`w-4 h-4 text-[#9BA8AB] absolute top-1/2 -translate-y-1/2 pointer-events-none ${isRtl ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder={language === 'fr' ? 'Rechercher par membre ou club...' : language === 'en' ? 'Search by member or club...' : 'ابحث باسم العضو أو الفريق...'}
                  className={`w-full bg-[#06141B] border border-[#253745] rounded-xl py-2 text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/50 outline-none focus:border-[#4A5C6A] transition-all duration-200 ${
                    isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                  }`}
                />
              </div>

              {/* Match filter */}
              <select
                value={activityMatchFilter}
                onChange={(e) => setActivityMatchFilter(e.target.value)}
                className="bg-[#06141B] border border-[#253745] rounded-xl px-3 py-2 text-xs text-[#CCD0CF] outline-none focus:border-[#4A5C6A] transition-all duration-200"
              >
                <option value="ALL">
                  {language === 'fr' ? `Tous les matchs (${matches.length})` : language === 'en' ? `All matches (${matches.length})` : `جميع المباريات (${matches.length})`}
                </option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {getTeamEnglishName(m.homeTeam)} × {getTeamEnglishName(m.awayTeam)} {m.status === 'SETTLED' ? (language === 'ar' ? '(معتمدة)' : '(Settled)') : (language === 'ar' ? '(مفتوحة)' : '(Open)')}
                  </option>
                ))}
              </select>

              {/* Clear Filter button if active */}
              {(activitySearch || activityMatchFilter !== 'ALL') && (
                <button
                  onClick={() => { setActivitySearch(''); setActivityMatchFilter('ALL'); }}
                  className="bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] text-xs px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Réinitialiser' : language === 'en' ? 'Reset Filters' : 'إعادة ضبط التصفية'}</span>
                </button>
              )}
            </div>

            {/* Logs Table / List */}
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center bg-[#06141B] rounded-xl border border-[#253745] text-xs text-[#9BA8AB]">
                {language === 'fr' 
                  ? 'Aucun pronostic ou activité ne correspond aux filtres actuels.' 
                  : language === 'en' 
                  ? 'No prediction activity matches current filter.' 
                  : 'لا توجد نشاطات أو توقعات مسجلة تطابق التصفية الحالية.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#253745]">
                <table className={`w-full border-collapse text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
                  <thead>
                    <tr className="bg-[#06141B] border-b border-[#253745] text-[#CCD0CF] font-bold">
                      <th className="p-3">{language === 'fr' ? 'Date & Heure' : language === 'en' ? 'Timestamp' : 'وقت الإدخال'}</th>
                      <th className="p-3">{language === 'fr' ? 'Membre' : language === 'en' ? 'Member' : 'المتسابق'}</th>
                      <th className="p-3">{language === 'fr' ? 'Match' : language === 'en' ? 'Match' : 'المباراة'}</th>
                      <th className="p-3 text-center">{language === 'fr' ? 'Score' : language === 'en' ? 'Score' : 'النتيجة المتوقعة'}</th>
                      <th className="p-3">{language === 'fr' ? 'Buteurs' : language === 'en' ? 'Scorers' : 'الهدافون المتوقعون'}</th>
                      <th className="p-3">{language === 'fr' ? 'MVP' : language === 'en' ? 'MVP' : 'رجل المباراة (MVP)'}</th>
                      <th className="p-3 text-center">{language === 'fr' ? 'Délai' : language === 'en' ? 'Deadline' : 'حالة المهلة'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#253745]">
                    {activityLogs.slice(0, 50).map(({ pred, match, isPastDeadline }) => (
                      <tr key={`${pred.matchId}_${pred.username}`} className="hover:bg-[#253745]/30 transition-all duration-150">
                        {/* Timestamp */}
                        <td className="p-3 font-mono text-[#9BA8AB] whitespace-nowrap">
                          {pred.updatedAt ? (
                            <div>
                              <span className="block text-[#CCD0CF] font-bold" dir="ltr">
                                {new Date(pred.updatedAt).toLocaleTimeString(language === 'ar' ? 'ar-EG' : language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[10px] text-[#9BA8AB]" dir="ltr">
                                {new Date(pred.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'numeric', day: 'numeric' })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#9BA8AB] text-[10px]">
                              {language === 'fr' ? 'Enregistré' : language === 'en' ? 'Saved' : 'مسجل'}
                            </span>
                          )}
                        </td>

                        {/* User */}
                        <td className="p-3 font-bold text-[#CCD0CF] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] flex items-center justify-center font-bold text-[10px]">
                              {pred.username.charAt(0).toUpperCase()}
                            </div>
                            <span>{pred.username}</span>
                          </div>
                        </td>

                        {/* Match */}
                        <td className="p-3 text-[#CCD0CF] whitespace-nowrap">
                          {match ? (
                            <div>
                              <span className="font-bold text-[#CCD0CF]">{getTeamEnglishName(match.homeTeam)} × {getTeamEnglishName(match.awayTeam)}</span>
                              <span className="block text-[10px] text-[#9BA8AB]">
                                {match.status === 'SETTLED' 
                                  ? (language === 'fr' ? 'Terminé et validé' : language === 'en' ? 'Settled' : 'منتهية ومعتمدة') 
                                  : (language === 'fr' ? 'Ouvert' : language === 'en' ? 'Open' : 'مفتوحة')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#9BA8AB]">
                              {language === 'fr' ? 'Match #' : language === 'en' ? 'Match #' : 'مباراة #'}{pred.matchId}
                            </span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="inline-block bg-[#06141B] border border-[#253745] px-2.5 py-1 rounded-lg font-mono font-bold text-[#CCD0CF] text-sm" dir="ltr">
                            {pred.homeScore} - {pred.awayScore}
                          </span>
                        </td>

                        {/* Scorers */}
                        <td className="p-3 text-[#CCD0CF] max-w-xs truncate">
                          {[...(pred.homeScorers || []), ...(pred.awayScorers || [])].filter(Boolean).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {[...(pred.homeScorers || []), ...(pred.awayScorers || [])].filter(Boolean).map((sc, i) => (
                                <span key={i} className="text-[10px] bg-[#253745] text-[#CCD0CF] px-1.5 py-0.5 rounded border border-[#4A5C6A]">
                                  {sc}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#9BA8AB] text-[10px]">
                              {language === 'fr' ? 'Aucun' : language === 'en' ? 'None' : 'لا يوجد'}
                            </span>
                          )}
                        </td>

                        {/* MVP */}
                        <td className="p-3 whitespace-nowrap">
                          {pred.mvp ? (
                            <span className="text-[11px] font-bold text-[#CCD0CF] bg-[#253745] border border-[#4A5C6A] px-2 py-0.5 rounded">
                              {pred.mvp}
                            </span>
                          ) : (
                            <span className="text-[#9BA8AB] text-[10px]">
                              {language === 'fr' ? 'Non spécifié' : language === 'en' ? 'Not specified' : 'لم يُحدد'}
                            </span>
                          )}
                        </td>

                        {/* Deadline Status */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {isPastDeadline ? (
                            <span className="text-[10px] bg-[#253745] text-[#9BA8AB] px-2 py-0.5 rounded font-semibold border border-[#253745]">
                              {language === 'fr' ? 'Expiré' : language === 'en' ? 'Closed' : 'مغلقة'}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-800">
                              {language === 'fr' ? 'À temps' : language === 'en' ? 'On time' : 'في الموعد'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Match Creation Card */}
      <div className="ucl-card rounded-2xl border border-[#253745] bg-[#11212D] overflow-hidden transition-all duration-200 shadow-xl">
        <button
          type="button"
          onClick={() => toggleSection('addMatch')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-[#253745]/40 transition-all duration-200 cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <PlusCircle className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                {language === 'fr' 
                  ? 'Ajouter un nouveau match' 
                  : language === 'en' 
                  ? 'Add New Match for Predictions' 
                  : 'إضافة مباراة جديدة للتوقع'}
              </h3>
              <p className="text-xs text-[#9BA8AB] mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Définir l\'équipe à domicile, à l\'extérieur et la date limite de pronostic.'
                  : language === 'en'
                  ? 'Set home team, away team, and prediction deadline.'
                  : 'تحديد الفريق المستضيف والضيف وموعد إغلاق التوقع (Deadline)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#9BA8AB] font-semibold hidden md:inline">
              {expandedSections.addMatch 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-[#253745] border border-[#253745] flex items-center justify-center text-[#CCD0CF] transition-transform duration-200 ${expandedSections.addMatch ? 'rotate-180 bg-[#4A5C6A] text-[#CCD0CF] border-[#4A5C6A]' : 'hover:border-[#4A5C6A]'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.addMatch && (
          <div className="p-5 sm:p-6 pt-0 border-t border-[#253745] mt-1">
            <p className="text-xs text-[#9BA8AB] my-4 pb-3 border-b border-[#253745] sm:hidden">
              {language === 'fr'
                ? 'Définir l\'équipe à domicile, à l\'extérieur et la date limite de pronostic.'
                : language === 'en'
                ? 'Set home team, away team, and prediction deadline.'
                : 'تحديد الفريق المستضيف والضيف وموعد إغلاق التوقع (Deadline)'}
            </p>

            {teamKeys.length < 2 ? (
              <div className="p-4 my-3 bg-[#06141B] border border-amber-500/30 rounded-xl text-xs text-amber-200 leading-relaxed">
                {language === 'fr'
                  ? 'Attention : Au moins 2 équipes sont requises pour créer un match. Veuillez d\'abord ajouter des équipes dans la section ci-dessous.'
                  : language === 'en'
                  ? 'Notice: At least 2 teams are required to create a match. Please add teams in the Team Management section below first.'
                  : 'تنبيه: يلزم تسجيل فريقين على الأقل لإنشاء مباراة. يرجى إضافة الفرق وتشكيلاتها من قسم "التحكم في الفرق واللاعبين" أدناه أولاً.'}
              </div>
            ) : (
              <form onSubmit={handleCreateMatch} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5">
                      {language === 'fr' ? 'Équipe à domicile (Home)' : language === 'en' ? 'Home Team' : 'الفريق المستضيف (Home)'}
                    </label>
                    <select
                      value={newHomeTeam}
                      onChange={(e) => setNewHomeTeam(e.target.value)}
                      className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 text-[#CCD0CF] font-semibold focus:border-[#4A5C6A] outline-none text-xs transition-all duration-200"
                      required
                    >
                      {teamKeys.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5">
                      {language === 'fr' ? 'Équipe à l\'extérieur (Away)' : language === 'en' ? 'Away Team' : 'الفريق الضيف (Away)'}
                    </label>
                    <select
                      value={newAwayTeam}
                      onChange={(e) => setNewAwayTeam(e.target.value)}
                      className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 text-[#CCD0CF] font-semibold focus:border-[#4A5C6A] outline-none text-xs transition-all duration-200"
                      required
                    >
                      {teamKeys.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#CCD0CF]">
                        {language === 'fr' 
                          ? `Date & heure du match (🇲🇦 Heure du Maroc - GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset})` 
                          : language === 'en' 
                          ? `Kickoff date/time & deadline (🇲🇦 Morocco Time - GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset})` 
                          : `موعد المباراة ووقت إغلاق التوقع (🇲🇦 بتوقيت المغرب - GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset})`}
                      </label>
                      <span className="text-[11px] text-[#9BA8AB]">
                        {language === 'fr' ? 'Conforme à l\'heure de votre téléphone au Maroc' : language === 'en' ? 'Matches your phone\'s time in Morocco' : 'يطابق توقيت هاتفك في المغرب تماماً'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[#06141B] p-0.5 rounded-lg border border-[#253745] text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleOffsetChange(0)}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                            moroccoOffset === 0 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                          }`}
                          title="Morocco Official GMT (UTC+0)"
                        >
                          GMT (Officiel)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOffsetChange(1)}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                            moroccoOffset === 1 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                          }`}
                          title="GMT+1"
                        >
                          GMT+1
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-[#06141B] px-2.5 py-1 rounded-lg border border-[#253745] shadow-inner">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>🇲🇦 {moroccoNowTime}</span>
                      </div>
                    </div>
                  </div>

                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 text-[#CCD0CF] font-semibold focus:border-[#4A5C6A] outline-none text-xs font-mono transition-all duration-200"
                    required
                  />
                  <p className="text-[11px] text-[#9BA8AB] mt-1.5 flex items-center gap-1.5">
                    <span className="text-amber-400">🇲🇦</span>
                    <span>
                      {language === 'fr' 
                        ? `L'heure saisie est enregistrée selon le fuseau sélectionné (GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset}) et reste synchronisée avec l'heure réelle de votre téléphone.` 
                        : language === 'en' 
                        ? `The entered time is saved according to the selected timezone (GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset}) and matches your phone's real-time clock.` 
                        : `يتم تسجيل الوقت وفق التوقيت المختار (GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset}) ليتطابق مع ساعة هاتفك.`}
                    </span>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold py-3.5 rounded-xl transition-all duration-200 shadow text-xs cursor-pointer active:scale-95"
                >
                  {language === 'fr' ? 'Publier le match et ouvrir les pronostics' : language === 'en' ? 'Publish Match & Open Predictions' : 'نشر المباراة وإتاحة التوقع للمستخدمين'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 6. Match Score Settlement & Management */}
      <div className="ucl-card rounded-2xl border border-[#253745] bg-[#11212D] overflow-hidden transition-all duration-200 shadow-xl">
        <button
          type="button"
          onClick={() => toggleSection('settleMatches')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-[#253745]/40 transition-all duration-200 cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <ListCheck className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                  {language === 'fr' 
                    ? 'Gestion des matchs & validation des scores' 
                    : language === 'en' 
                    ? 'Match Management & Settlement' 
                    : 'إدارة المباريات واعتماد النتائج'}
                </h3>
                <span className="text-[10px] bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] px-2 py-0.5 rounded-full font-bold">
                  {language === 'fr' ? `Matchs (${matches.length})` : language === 'en' ? `Matches (${matches.length})` : `المباريات (${matches.length})`}
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB] mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Modifier l\'heure, les scores et supprimer des matchs.'
                  : language === 'en'
                  ? 'Edit schedule, settle final scores, and delete matches.'
                  : 'تعديل التوقيت، النتيجة، وحذف المباريات'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#9BA8AB] font-semibold hidden md:inline">
              {expandedSections.settleMatches 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-[#253745] border border-[#253745] flex items-center justify-center text-[#CCD0CF] transition-transform duration-200 ${expandedSections.settleMatches ? 'rotate-180 bg-[#4A5C6A] text-[#CCD0CF] border-[#4A5C6A]' : 'hover:border-[#4A5C6A]'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.settleMatches && (
          <div className="p-5 sm:p-6 pt-0 border-t border-[#253745] mt-1 space-y-4">
            <p className="text-xs text-[#9BA8AB] my-4 pb-3 border-b border-[#253745] sm:hidden">
              {language === 'fr'
                ? 'Modifier l\'heure, les scores et supprimer des matchs.'
                : language === 'en'
                ? 'Edit schedule, settle final scores, and delete matches.'
                : 'تعديل التوقيت، النتيجة، وحذف المباريات'}
            </p>

            {matches.length === 0 ? (
              <p className="text-xs text-[#9BA8AB] text-center py-4">
                {language === 'fr' ? 'Aucun match enregistré.' : language === 'en' ? 'No matches recorded yet.' : 'لا توجد مباريات مسجلة بعد.'}
              </p>
            ) : (
              <div className="space-y-4 pt-2">
            {matches.map(match => {
              const home = teams[match.homeTeam] || { squad: [] };
              const away = teams[match.awayTeam] || { squad: [] };
              const draft = getSettleDraft(match.id);

              return (
                <div key={match.id} className="p-4 bg-[#06141B] rounded-xl border border-[#253745] space-y-4">
                  {/* Title & Delete */}
                  <div className="flex justify-between items-center text-xs font-bold text-[#CCD0CF]">
                    <span className="text-sm text-[#CCD0CF] font-bold">{getTeamEnglishName(match.homeTeam)} VS {getTeamEnglishName(match.awayTeam)}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                        match.status === 'SETTLED'
                          ? 'text-[#CCD0CF] bg-[#253745] border border-[#4A5C6A]'
                          : 'text-[#9BA8AB] bg-[#253745] border border-[#253745]'
                      }`}>
                        {match.status === 'SETTLED' 
                          ? (language === 'fr' ? 'Résultat validé' : language === 'en' ? 'Settled' : 'تم تنزيل النتيجة') 
                          : (language === 'fr' ? 'Ouvert' : language === 'en' ? 'Open' : 'مفتوحة')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMatchClick(match)}
                        className="bg-[#253745] hover:bg-rose-950/60 text-rose-300 border border-[#253745] text-[11px] px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 font-bold cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Supprimer' : language === 'en' ? 'Delete' : 'حذف المباراة'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Edit Deadline */}
                  <div className="p-3 bg-[#11212D] rounded-xl border border-[#253745] space-y-2.5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="w-full">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <label className="block text-[11px] font-semibold text-[#CCD0CF]">
                            {language === 'fr' 
                              ? `Modifier la clôture (🇲🇦 GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset}) :` 
                              : language === 'en' 
                              ? `Edit deadline (🇲🇦 GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset}):` 
                              : `تعديل موعد ووقت إغلاق التوقع (🇲🇦 GMT${moroccoOffset === 0 ? '' : '+' + moroccoOffset}):`}
                          </label>
                          <span className="text-[10px] text-amber-300 font-mono">
                            {formatEnglishDeadlineMorocco(match.deadline, moroccoOffset)}
                          </span>
                        </div>
                        <input
                          type="datetime-local"
                          value={editDeadlines[match.id] !== undefined ? editDeadlines[match.id] : formatMoroccoInput(match.deadline, moroccoOffset)}
                          onChange={(e) => setEditDeadlines({ ...editDeadlines, [match.id]: e.target.value })}
                          className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-2 text-xs text-[#CCD0CF] font-semibold outline-none focus:border-[#4A5C6A] font-mono transition-all duration-200"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateDeadline(match.id)}
                        className="w-full sm:w-auto bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shrink-0 cursor-pointer border border-[#253745] active:scale-95"
                      >
                        {language === 'fr' ? 'Enregistrer' : language === 'en' ? 'Save Time' : 'حفظ الوقت الجديد'}
                      </button>
                    </div>

                    {/* Quick Reopen / Extend Buttons for Admin convenience */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#253745]/60 text-[10px]">
                      <span className="text-[#9BA8AB] font-semibold">
                        {language === 'fr' ? 'Prolonger / Réouvrir :' : language === 'en' ? 'Quick Extend / Reopen:' : 'تمديد سريع / إعادة فتح:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickExtendDeadline(match.id, 30)}
                        className="px-2 py-0.5 rounded-md bg-[#06141B] hover:bg-[#253745] text-amber-300 border border-[#253745] font-semibold cursor-pointer active:scale-95"
                        title="Add 30 minutes from now or deadline"
                      >
                        +30 min
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickExtendDeadline(match.id, 60)}
                        className="px-2 py-0.5 rounded-md bg-[#06141B] hover:bg-[#253745] text-emerald-300 border border-[#253745] font-semibold cursor-pointer active:scale-95"
                        title="Add 1 hour from now or deadline"
                      >
                        +1 Hour
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickExtendDeadline(match.id, 120)}
                        className="px-2 py-0.5 rounded-md bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 font-bold cursor-pointer active:scale-95"
                        title="Reopen match with deadline 2 hours from now"
                      >
                        ⚡ {language === 'fr' ? 'Réouvrir (+2h)' : language === 'en' ? 'Reopen (+2h)' : 'إعادة فتح (+ساعتين)'}
                      </button>
                    </div>
                  </div>

                  {/* Settlement Inputs (If not settled) */}
                  {match.status !== 'SETTLED' && (
                    <div className="space-y-3 pt-2 border-t border-[#253745]">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-[#9BA8AB] mb-1">
                            {language === 'fr' ? `Buts ${getTeamEnglishName(match.homeTeam)}` : language === 'en' ? `${getTeamEnglishName(match.homeTeam)} Goals` : `أهداف ${getTeamEnglishName(match.homeTeam)}`}
                          </label>
                          <div dir="ltr">
                            <input
                              type="number"
                              min="0"
                              dir="ltr"
                              value={draft.homeScore}
                              onChange={(e) => updateSettleDraft(match.id, { homeScore: parseInt(e.target.value) || 0 })}
                              className="w-full bg-[#11212D] border border-[#253745] rounded-xl p-2 text-xs text-center text-[#CCD0CF] font-bold font-mono force-ltr outline-none focus:border-[#4A5C6A] transition-all duration-200"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#9BA8AB] mb-1">
                            {language === 'fr' ? `Buts ${getTeamEnglishName(match.awayTeam)}` : language === 'en' ? `${getTeamEnglishName(match.awayTeam)} Goals` : `أهداف ${getTeamEnglishName(match.awayTeam)}`}
                          </label>
                          <div dir="ltr">
                            <input
                              type="number"
                              min="0"
                              dir="ltr"
                              value={draft.awayScore}
                              onChange={(e) => updateSettleDraft(match.id, { awayScore: parseInt(e.target.value) || 0 })}
                              className="w-full bg-[#11212D] border border-[#253745] rounded-xl p-2 text-xs text-center text-[#CCD0CF] font-bold font-mono force-ltr outline-none focus:border-[#4A5C6A] transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Scorer picks for home */}
                      {draft.homeScore > 0 && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-[#CCD0CF]">
                            {language === 'fr' ? `Buteurs ${getTeamEnglishName(match.homeTeam)} :` : language === 'en' ? `${getTeamEnglishName(match.homeTeam)} Goal Scorers:` : `مسجلو أهداف ${getTeamEnglishName(match.homeTeam)}:`}
                          </label>
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
                                className="w-full bg-[#11212D] border border-[#253745] rounded-xl p-2 text-xs text-[#CCD0CF] outline-none focus:border-[#4A5C6A] transition-all duration-200"
                              >
                                <option value="">
                                  {language === 'fr' ? `Choisir le buteur (${idx + 1})...` : language === 'en' ? `Select scorer (${idx + 1})...` : `اختر المسجل للهدف (${idx + 1})...`}
                                </option>
                                {(home.squad || []).map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scorer picks for away */}
                      {draft.awayScore > 0 && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-[#CCD0CF]">
                            {language === 'fr' ? `Buteurs ${getTeamEnglishName(match.awayTeam)} :` : language === 'en' ? `${getTeamEnglishName(match.awayTeam)} Goal Scorers:` : `مسجلو أهداف ${getTeamEnglishName(match.awayTeam)}:`}
                          </label>
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
                                className="w-full bg-[#11212D] border border-[#253745] rounded-xl p-2 text-xs text-[#CCD0CF] outline-none focus:border-[#4A5C6A] transition-all duration-200"
                              >
                                <option value="">
                                  {language === 'fr' ? `Choisir le buteur (${idx + 1})...` : language === 'en' ? `Select scorer (${idx + 1})...` : `اختر المسجل للهدف (${idx + 1})...`}
                                </option>
                                {(away.squad || []).map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] text-[#9BA8AB] mb-1">
                          {language === 'fr' ? 'Homme du match officiel (MVP)' : language === 'en' ? 'Official Match MVP' : 'رجل المباراة الفعلي (MVP)'}
                        </label>
                        <select
                          value={draft.mvp}
                          onChange={(e) => updateSettleDraft(match.id, { mvp: e.target.value })}
                          className="w-full bg-[#11212D] border border-[#253745] rounded-xl p-2 text-xs text-[#CCD0CF] font-semibold outline-none focus:border-[#4A5C6A] transition-all duration-200"
                        >
                          <option value="">
                            {language === 'fr' ? 'Choisir l\'homme du match...' : language === 'en' ? 'Select Match MVP...' : 'اختر رجل المباراة...'}
                          </option>
                          {[...(home.squad || []), ...(away.squad || [])].map((p, i) => (
                            <option key={`${p}_${i}`} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSettleConfirmMatch(match)}
                        className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold text-xs py-3 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98] shadow"
                      >
                        {language === 'fr' ? 'Valider le score et calculer les points' : language === 'en' ? 'Confirm Result & Calculate Points' : 'اعتماد النتيجة واحتساب النقاط للمتوقعين'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Teams & Squads Full Control */}
      <div className="ucl-card rounded-2xl border border-[#253745] bg-[#11212D] overflow-hidden transition-all duration-200 shadow-xl">
        <button
          type="button"
          onClick={() => toggleSection('teams')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-[#253745]/40 transition-all duration-200 cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <Users className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                  {language === 'fr' 
                    ? 'Gestion des équipes & effectifs' 
                    : language === 'en' 
                    ? 'Teams & Squads Management' 
                    : 'التحكم في الفرق واللاعبين'}
                </h3>
                <span className="text-[10px] bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] px-2 py-0.5 rounded-full font-bold">
                  {language === 'fr' 
                    ? `${teamKeys.length} équipes` 
                    : language === 'en' 
                    ? `${teamKeys.length} teams registered` 
                    : `${teamKeys.length} فرق مسجلة`}
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB] mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Ajouter/modifier des équipes, logos et listes des joueurs.'
                  : language === 'en'
                  ? 'Add & edit teams, logos, and bulk squad entry.'
                  : 'إضافة وتعديل الفرق، رفع وقص الشعارات، إدخال قوائم اللاعبين دفعة واحدة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#9BA8AB] font-semibold hidden md:inline">
              {expandedSections.teams 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-[#253745] border border-[#253745] flex items-center justify-center text-[#CCD0CF] transition-transform duration-200 ${expandedSections.teams ? 'rotate-180 bg-[#4A5C6A] text-[#CCD0CF] border-[#4A5C6A]' : 'hover:border-[#4A5C6A]'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.teams && (
          <div className="p-5 sm:p-6 pt-0 border-t border-[#253745] mt-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3">
              <p className="text-xs text-[#9BA8AB]">
                {language === 'fr'
                  ? 'Ajout et modification des équipes, joueurs, et suppression.'
                  : language === 'en'
                  ? 'Add and edit teams, squad lists, and team deletion.'
                  : 'إضافة وتعديل الفرق، قوائم اللاعبين، وحذف الفرق كلياً'}
              </p>

              {teamKeys.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDeleteAllTeamsConfirm(true)}
                  className="bg-[#253745] hover:bg-rose-950/60 text-rose-300 border border-[#253745] text-xs px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 font-bold cursor-pointer active:scale-95 shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>
                    {language === 'fr' 
                      ? 'Supprimer toutes les équipes' 
                      : language === 'en' 
                      ? 'Delete All Teams & Squads' 
                      : 'حذف جميع الفرق واللاعبين'}
                  </span>
                </button>
              )}
            </div>

        {/* Add Team */}
        <div className="p-5 bg-[#06141B] rounded-xl border border-[#253745] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[#CCD0CF] flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#CCD0CF]" />
              <span>
                {language === 'fr' ? 'Ajouter une nouvelle équipe :' : language === 'en' ? 'Add New Team:' : 'إضافة فريق جديد للبطولة:'}
              </span>
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPresetPicker(!showPresetPicker)}
                className="bg-[#253745] hover:bg-[#4A5C6A] border border-[#253745] text-[#CCD0CF] text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#CCD0CF]" />
                <span>
                  {language === 'fr' 
                    ? `Clubs prédéfinis (${POPULAR_CLUB_PRESETS.length})` 
                    : language === 'en' 
                    ? `Preset Clubs (${POPULAR_CLUB_PRESETS.length})` 
                    : `أندية مقترحة جاهزة بشعاراتها (${POPULAR_CLUB_PRESETS.length})`}
                </span>
                {showPresetPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <label className={`border text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none ${
                isProcessingLogo 
                  ? 'bg-[#253745] border-[#4A5C6A] text-[#CCD0CF] animate-pulse' 
                  : 'bg-[#253745] hover:bg-[#4A5C6A] border-[#253745] text-[#CCD0CF]'
              }`}>
                {isProcessingLogo ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#CCD0CF] animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-[#CCD0CF]" />
                )}
                <span>
                  {isProcessingLogo 
                    ? (language === 'fr' ? 'Détourage du logo...' : language === 'en' ? 'Processing logo...' : 'جارٍ تفريغ الشعار...') 
                    : (language === 'fr' ? 'Importer logo (auto-détouré)' : language === 'en' ? 'Upload Logo (auto-cutout)' : 'رفع شعار من الجهاز (تفريغ تلقائي)')}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                  disabled={isProcessingLogo}
                />
              </label>

              <button
                type="button"
                onClick={handleGenerateFallbackLogo}
                className="bg-[#253745] hover:bg-[#4A5C6A] border border-[#253745] text-[#CCD0CF] text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                title={language === 'fr' ? 'Générer un écusson et logo automatique' : language === 'en' ? 'Generate shield crest based on team name' : 'توليد درع وشعار تلقائي حسب اسم الفريق'}
              >
                <Wand2 className="w-3.5 h-3.5 text-[#CCD0CF]" />
                <span>{language === 'fr' ? 'Générer logo' : language === 'en' ? 'Auto-Generate' : 'توليد شعار تلقائي'}</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Selector Grid */}
          {showPresetPicker && (
            <div className="p-3 bg-[#11212D] rounded-xl border border-[#253745] space-y-2">
              <span className="text-[11px] font-bold text-[#9BA8AB] block">
                {language === 'fr' 
                  ? 'Cliquez sur un club pour renseigner son nom et logo officiel :' 
                  : language === 'en' 
                  ? 'Click any club to auto-fill its name and official crest:' 
                  : 'اضغط على أي نادٍ لملء اسمه وشعاره الرسمي تلقائياً:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                {POPULAR_CLUB_PRESETS.map((preset) => (
                  <button
                    key={preset.enName}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-2 p-2 bg-[#06141B] hover:bg-[#253745] border border-[#253745] rounded-xl transition-all duration-200 cursor-pointer group ${
                      isRtl ? 'text-right' : 'text-left'
                    }`}
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
                      <div className="text-xs font-bold text-[#CCD0CF] truncate group-hover:text-white">
                        {language === 'en' ? preset.enName : preset.name}
                      </div>
                      <div className="text-[9px] text-[#9BA8AB] truncate font-mono">
                        {language === 'en' ? preset.name : preset.enName}
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
              <label className="text-[11px] text-[#9BA8AB] font-bold block mb-1">
                {language === 'fr' ? 'Nom de l\'équipe :' : language === 'en' ? 'Team Name:' : 'اسم الفريق:'}
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder={language === 'fr' ? 'Ex: Real Madrid, Manchester City...' : language === 'en' ? 'E.g., Real Madrid, Manchester City...' : 'مثال: ريال مدريد، مانشستر سيتي...'}
                className="w-full bg-[#11212D] border border-[#253745] rounded-xl p-2.5 text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/50 outline-none focus:border-[#4A5C6A] transition-all duration-200"
              />
            </div>

            <div className="md:col-span-5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-[#9BA8AB] font-bold">
                  {language === 'fr' ? 'Lien de l\'image / Logo :' : language === 'en' ? 'Logo or Image URL:' : 'رابط الشعار أو الصورة:'}
                </label>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full select-none">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{language === 'fr' ? 'Détourage 100% auto' : language === 'en' ? 'Auto-cutout active' : 'تفريغ تلقائي 100%'}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  dir="ltr"
                  value={newTeamLogo}
                  onChange={(e) => setNewTeamLogo(e.target.value)}
                  onBlur={handleLogoUrlBlur}
                  placeholder={language === 'fr' ? 'https://... ou importer ci-dessus' : language === 'en' ? 'https://... or upload above' : 'https://... أو استخدم زر الرفع أعلاه'}
                  className="w-full bg-[#11212D] border border-[#253745] rounded-xl p-2.5 text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/50 outline-none focus:border-[#4A5C6A] font-mono text-[11px] force-ltr transition-all duration-200"
                />
                {newTeamLogo && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div 
                      className="w-9 h-9 bg-[#06141B] border border-[#253745] rounded-xl p-1 flex items-center justify-center overflow-hidden relative"
                      style={{
                        backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
                        backgroundSize: '6px 6px'
                      }}
                      title={language === 'fr' ? 'Aperçu du logo' : language === 'en' ? 'Logo preview' : 'معاينة الشعار'}
                    >
                      <img src={newTeamLogo} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={handleManualRemoveBackground}
                      disabled={isProcessingLogo}
                      className="px-2 py-1.5 bg-[#253745] hover:bg-[#4A5C6A] border border-[#253745] text-[#CCD0CF] rounded-xl transition cursor-pointer text-[11px] flex items-center gap-1 font-bold"
                      title={language === 'fr' ? 'Supprimer le fond' : language === 'en' ? 'Remove background' : 'إزالة خلفية هذه الصورة وجعلها شفافة'}
                    >
                      {isProcessingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{language === 'fr' ? 'Détourer' : language === 'en' ? 'Cutout' : 'تفريغ'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 md:self-end">
              <button
                type="button"
                onClick={handleAddNewTeam}
                className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold text-xs py-2.5 px-3 rounded-xl transition-all duration-200 cursor-pointer shadow flex items-center justify-center gap-1.5 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'fr' ? 'Enregistrer' : language === 'en' ? 'Register Team' : 'تسجيل الفريق'}</span>
              </button>
            </div>
          </div>

          {/* Optional Initial Squad Input */}
          <div className="pt-2 border-t border-[#253745]">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-[#9BA8AB] font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#CCD0CF]" />
                <span>
                  {language === 'fr' 
                    ? 'Effectif initial de l\'équipe (optionnel - détection automatique) :' 
                    : language === 'en' 
                    ? 'Initial Squad for this Team (optional - auto-separated):' 
                    : 'إدخال لاعبي هذا الفريق دفعة واحدة (اختياري - يفصلهم التطبيق تلقائياً):'}
                </span>
              </label>
              {detectedInitialSquad.length > 0 && (
                <span className="text-[10px] font-bold bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] px-2 py-0.5 rounded-full">
                  {language === 'fr' 
                    ? `(${detectedInitialSquad.length}) joueurs détectés` 
                    : language === 'en' 
                    ? `(${detectedInitialSquad.length}) players detected` 
                    : `سيتم تسجيل (${detectedInitialSquad.length}) لاعباً مع الفريق`}
                </span>
              )}
            </div>
            <textarea
              value={newTeamInitialSquad}
              onChange={(e) => setNewTeamInitialSquad(e.target.value)}
              placeholder={language === 'fr' ? 'Collez la liste des joueurs ici (séparés par retours à la ligne ou virgules)...' : language === 'en' ? 'Paste or type squad players here (separated by newlines or commas)...' : 'الصق أو اكتب جميع اللاعبين دفعة واحدة هنا (يفصل بينهم بسطور، أو فواصل ، أو ترقيم 1. 2.)...'}
              rows={2}
              className="w-full bg-[#11212D] border border-[#253745] rounded-xl p-2 text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/50 outline-none focus:border-[#4A5C6A] transition-all duration-200"
            />
          </div>
        </div>

        {/* Manage Squad */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[#CCD0CF] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#CCD0CF]" />
              <span>
                {language === 'fr' ? 'Gestion des joueurs :' : language === 'en' ? 'Manage Squad Players:' : 'إدارة لاعبي التشكيلة:'}
              </span>
            </h4>
          </div>

          {teamKeys.length === 0 ? (
            <div className="p-6 bg-[#06141B] rounded-xl border border-[#253745] text-center text-xs text-[#9BA8AB]">
              {language === 'fr' 
                ? 'Aucune équipe enregistrée pour le moment. Utilisez le formulaire ci-dessus pour ajouter une équipe.' 
                : language === 'en' 
                ? 'No teams registered yet. Use the Add Team form above to register teams first.' 
                : 'لا توجد أي فرق مسجلة حالياً. استخدم نموذج "إضافة فريق جديد للبطولة" أعلاه لإضافة فريق ثم إضافة لاعبيه.'}
            </div>
          ) : (
            <>
              {/* Registered Teams Visual Bar */}
              <div className="p-3 bg-[#06141B] rounded-xl border border-[#253745] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#CCD0CF] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#CCD0CF]" />
                    <span>
                      {language === 'fr' ? `Équipes enregistrées (${teamKeys.length}) :` : language === 'en' ? `Registered Teams (${teamKeys.length}):` : `الفرق المسجلة في البطولة (${teamKeys.length} فرق):`}
                    </span>
                  </span>
                  <span className="text-[11px] text-[#9BA8AB]">
                    {language === 'fr' ? 'Cliquez sur une équipe pour gérer ses joueurs' : language === 'en' ? 'Click on any team to manage squad' : 'اضغط على أي فريق لعرضه وإدارة لاعبيه'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {teamKeys.map(tKey => {
                    const isSelected = tKey === selectedManageTeam;
                    const tObj = teams[tKey];
                    return (
                      <button
                        key={tKey}
                        type="button"
                        onClick={() => setSelectedManageTeam(tKey)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-[#253745] border-[#4A5C6A] text-[#CCD0CF] shadow'
                            : 'bg-[#11212D] border-[#253745] text-[#9BA8AB] hover:border-[#4A5C6A] hover:bg-[#253745]/50'
                        }`}
                      >
                        {tObj?.logo ? (
                          <img src={tObj.logo} alt="" className="w-5 h-5 object-contain rounded shrink-0 bg-[#06141B] p-0.5" />
                        ) : (
                          <Shield className="w-4 h-4 text-[#CCD0CF] shrink-0" />
                        )}
                        <span>{tKey}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          isSelected ? 'bg-[#4A5C6A] text-[#CCD0CF]' : 'bg-[#253745] text-[#9BA8AB]'
                        }`}>
                          {tObj?.squad?.length || 0} {language === 'fr' ? 'joueurs' : language === 'en' ? 'players' : 'لاعب'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Team Header Bar */}
              <div className="p-3 bg-[#06141B] rounded-xl border border-[#253745] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {teams[selectedManageTeam]?.logo && (
                    <div 
                      className="w-9 h-9 shrink-0 rounded-xl p-1 bg-[#11212D] border border-[#253745] flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
                        backgroundSize: '6px 6px'
                      }}
                      title={language === 'fr' ? 'Logo de l\'équipe' : language === 'en' ? 'Team logo' : 'شعار الفريق المفرغ'}
                    >
                      <img
                        src={teams[selectedManageTeam].logo}
                        alt={selectedManageTeam}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#9BA8AB] font-bold">
                      {language === 'fr' ? 'Équipe sélectionnée :' : language === 'en' ? 'Selected Team:' : 'الفريق الحالي:'}
                    </span>
                    <select
                      value={selectedManageTeam}
                      onChange={(e) => setSelectedManageTeam(e.target.value)}
                      className="bg-[#11212D] border border-[#253745] rounded-xl p-2 text-xs text-[#CCD0CF] font-bold outline-none focus:border-[#4A5C6A] transition-all duration-200"
                    >
                      {teamKeys.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Change Logo / Remove Bg for selected team */}
                  <label 
                    className="p-2 bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745] rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 select-none"
                    title={language === 'fr' ? 'Changer le logo et détourer auto' : language === 'en' ? 'Upload new logo with auto-cutout' : 'رفع شعار جديد لهذا الفريق من الجهاز وتفريغ خلفيته تلقائياً'}
                  >
                    {isProcessingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-[#CCD0CF]" />}
                    <span>{language === 'fr' ? 'Changer le logo' : language === 'en' ? 'Change Logo' : 'تغيير الشعار من الجهاز (تفريغ تلقائي)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpdateSelectedTeamLogoUpload}
                      className="hidden"
                      disabled={isProcessingLogo}
                    />
                  </label>

                  {teams[selectedManageTeam]?.logo && (
                    <button
                      type="button"
                      onClick={handleRemoveExistingTeamLogoBg}
                      disabled={isProcessingLogo}
                      className="p-2 bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745] rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                      title={language === 'fr' ? 'Détourer le logo actuel' : language === 'en' ? 'Remove current logo background' : 'إزالة خلفية الشعار الحالي لهذا الفريق وجعله شفافاً'}
                    >
                      <Wand2 className="w-3.5 h-3.5 text-[#CCD0CF]" />
                      <span>{language === 'fr' ? 'Détourer le logo' : language === 'en' ? 'Cutout Logo' : 'إزالة خلفية الشعار'}</span>
                    </button>
                  )}

                  {/* Optional Quick URL input for selected team */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      dir="ltr"
                      value={editSelectedTeamLogoUrl}
                      onChange={(e) => setEditSelectedTeamLogoUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleUpdateSelectedTeamLogoFromUrl();
                        }
                      }}
                      placeholder={language === 'fr' ? 'URL nouveau logo...' : language === 'en' ? 'New logo URL...' : 'رابط شعار جديد...'}
                      className="bg-[#11212D] border border-[#253745] rounded-xl px-2.5 py-1.5 text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/50 outline-none focus:border-[#4A5C6A] w-32 sm:w-44 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleUpdateSelectedTeamLogoFromUrl}
                      disabled={isProcessingLogo || !editSelectedTeamLogoUrl.trim()}
                      className="p-2 bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745] rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 disabled:opacity-40"
                      title={language === 'fr' ? 'Détourer et enregistrer pour tous' : language === 'en' ? 'Cutout and save for everyone' : 'تفريغ الشعار وحفظه لكافة الأعضاء'}
                    >
                      {isProcessingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                      <span className="hidden sm:inline">{language === 'fr' ? 'Appliquer' : language === 'en' ? 'Apply' : 'تطبيق'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setClearSquadConfirm(selectedManageTeam)}
                    className="p-2 bg-[#253745] hover:bg-amber-950/50 text-amber-300 border border-[#253745] rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                    title={language === 'fr' ? 'Vider la liste des joueurs' : language === 'en' ? 'Clear squad player list' : 'مسح قائمة لاعبي هذا الفريق فقط'}
                  >
                    <span>{language === 'fr' ? 'Vider l\'effectif' : language === 'en' ? 'Clear Squad' : 'مسح تشكيلة الفريق'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTeamConfirm(selectedManageTeam)}
                    className="p-2 bg-[#253745] hover:bg-rose-950/60 border border-[#253745] text-rose-300 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                    title={language === 'fr' ? 'Supprimer l\'équipe' : language === 'en' ? 'Delete this team' : 'حذف هذا الفريق بالكامل'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'fr' ? 'Supprimer' : language === 'en' ? 'Delete Team' : 'حذف الفريق'}</span>
                  </button>
                </div>
              </div>

              {/* Automatic Bulk Players Entry */}
              <div className="p-4 bg-[#06141B] rounded-xl border border-[#253745] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#CCD0CF]" />
                    <span className="text-xs font-bold text-[#CCD0CF]">
                      {language === 'fr' 
                        ? `Ajout groupé de joueurs pour (${selectedManageTeam}) :` 
                        : language === 'en' 
                        ? `Bulk Players Entry (auto-separated) for (${selectedManageTeam}):` 
                        : `إدخال جميع اللاعبين دفعة واحدة (فصل تلقائي) لـ (${selectedManageTeam}):`}
                    </span>
                  </div>
                  {detectedBulkPlayers.length > 0 && (
                    <span className="bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>
                        {language === 'fr' 
                          ? `(${detectedBulkPlayers.length}) joueurs détectés` 
                          : language === 'en' 
                          ? `(${detectedBulkPlayers.length}) players detected` 
                          : `تم التعرف على (${detectedBulkPlayers.length}) لاعباً`}
                      </span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#9BA8AB]">
                  {language === 'fr'
                    ? 'Collez ou tapez tous les noms des joueurs (séparés par des lignes, virgules ou chiffres). L\'application les séparera automatiquement.'
                    : language === 'en'
                    ? 'Paste or type all squad player names together (separated by newlines, commas, or numbering); the app will parse them automatically.'
                    : 'الصق أو اكتب جميع أسماء لاعبي الفريق معاً بأي شكل (أسماء مفصولة بسطور جديدة، أو فواصل ، أو فواصل إنجليزية , أو ترقيم 1. 2.) وسيقوم التطبيق بفرزهم وفصلهم تلقائياً.'}
                </p>

                <textarea
                  value={bulkSquadInput}
                  onChange={(e) => setBulkSquadInput(e.target.value)}
                  placeholder={language === 'fr' 
                    ? `Écrivez ou collez la liste des joueurs ici...\nExemple:\nCourtois\nVinicius Junior\nKylian Mbappe\nJude Bellingham\nValverde\nRodrygo` 
                    : language === 'en' 
                    ? `Type or paste player list here...\nExample:\nCourtois\nVinicius Junior\nKylian Mbappe\nJude Bellingham\nValverde\nRodrygo` 
                    : `اكتب أو الصق قائمة اللاعبين هنا دفعة واحدة...\nمثال:\nكورتوا\nفينيسيوس جونيور\nكيليان مبابي\nجود بيلينجهام\nفالفيردي\nرودريغو\n(أو مفصولين بفواصل: كورتوا، فينيسيوس، مبابي)`}
                  rows={4}
                  className="w-full bg-[#11212D] border border-[#253745] rounded-xl p-3 text-xs text-[#CCD0CF] outline-none focus:border-[#4A5C6A] placeholder-[#9BA8AB]/50 leading-relaxed font-sans transition-all duration-200"
                />

                {/* Live Preview Chips if players are detected */}
                {detectedBulkPlayers.length > 0 && (
                  <div className="p-2.5 bg-[#11212D] rounded-xl border border-[#253745] space-y-1.5">
                    <span className="text-[10px] font-bold text-[#9BA8AB] block">
                      {language === 'fr' ? 'Aperçu avant ajout :' : language === 'en' ? 'Preview before adding:' : 'معاينة اللاعبين المكتشفين قبل الإضافة:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {detectedBulkPlayers.slice(0, 15).map((p, idx) => (
                        <span
                          key={`${p}_${idx}`}
                          className="bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        >
                          {p}
                        </span>
                      ))}
                      {detectedBulkPlayers.length > 15 && (
                        <span className="bg-[#253745] text-[#9BA8AB] text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          +{detectedBulkPlayers.length - 15} {language === 'fr' ? 'autres' : language === 'en' ? 'others' : 'آخرين'}
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
                    className={`font-bold text-xs py-2.5 px-5 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                      detectedBulkPlayers.length > 0
                        ? 'bg-[#CCD0CF] hover:bg-white text-[#06141B] shadow active:scale-95'
                        : 'bg-[#253745] text-[#9BA8AB] cursor-not-allowed'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {detectedBulkPlayers.length > 0
                        ? (language === 'fr' ? `Ajouter tous les joueurs (${detectedBulkPlayers.length})` : language === 'en' ? `Add All Players (${detectedBulkPlayers.length})` : `إضافة جميع اللاعبين (${detectedBulkPlayers.length}) دفعة واحدة`)
                        : (language === 'fr' ? 'Ajouter tous les joueurs' : language === 'en' ? 'Add All Players' : 'إضافة جميع اللاعبين دفعة واحدة')}
                    </span>
                  </button>

                  {bulkSquadInput && (
                    <button
                      type="button"
                      onClick={() => setBulkSquadInput('')}
                      className="text-xs text-[#9BA8AB] hover:text-rose-400 transition-all duration-150 cursor-pointer font-bold px-2 py-1"
                    >
                      {language === 'fr' ? 'Effacer le texte' : language === 'en' ? 'Clear text' : 'مسح النص'}
                    </button>
                  )}
                </div>
              </div>

              {/* Single Player Quick Add */}
              <div className="p-3 bg-[#06141B] rounded-xl border border-[#253745] flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#9BA8AB] font-bold shrink-0">
                  {language === 'fr' ? 'Ou ajouter un joueur individuel :' : language === 'en' ? 'Or add individual player:' : 'أو إضافة لاعب فردي:'}
                </span>
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
                  placeholder={language === 'fr' ? 'Nom du joueur...' : language === 'en' ? 'Player name...' : 'اسم لاعب مفرد...'}
                  className="bg-[#11212D] border border-[#253745] rounded-xl p-2 text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/50 outline-none focus:border-[#4A5C6A] flex-1 min-w-[160px] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white font-bold text-xs py-2 px-3 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1 shrink-0 border border-[#253745]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Ajouter' : language === 'en' ? 'Add' : 'إضافة'}</span>
                </button>
              </div>

              {/* Current Squad Display */}
              <div className="p-4 bg-[#06141B] rounded-xl border border-[#253745]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[#CCD0CF]">
                    {language === 'fr' 
                      ? `Effectif de (${selectedManageTeam}) :` 
                      : language === 'en' 
                      ? `Squad list of (${selectedManageTeam}):` 
                      : `قائمة لاعبي فريق (${selectedManageTeam}) حالياً:`}
                  </span>
                  <span className="text-xs text-[#CCD0CF] font-bold bg-[#253745] border border-[#4A5C6A] px-2.5 py-0.5 rounded-full">
                    {teams[selectedManageTeam]?.squad?.length || 0} {language === 'fr' ? 'joueurs enregistrés' : language === 'en' ? 'players registered' : 'لاعبين مسجلين'}
                  </span>
                </div>
                {(!teams[selectedManageTeam]?.squad || teams[selectedManageTeam]?.squad.length === 0) ? (
                  <p className="text-xs text-[#9BA8AB] text-center py-4 bg-[#11212D] rounded-xl border border-[#253745]">
                    {language === 'fr' 
                      ? 'Aucun joueur enregistré dans cette équipe pour le moment. Utilisez le formulaire d\'ajout groupé ci-dessus !' 
                      : language === 'en' 
                      ? 'No players registered in this squad yet. Use bulk entry above to paste all players at once!' 
                      : 'لا يوجد لاعبون مسجلون في تشكيلة هذا الفريق بعد. استخدم مربع الإدخال الجماعي أعلاه للصق جميع اللاعبين دفعة واحدة!'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto p-1">
                    {teams[selectedManageTeam]?.squad?.map((player, idx) => (
                      <div
                        key={`${player}_${idx}`}
                        className="bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-[#CCD0CF] transition-all duration-150"
                      >
                        <span className="text-[10px] text-[#9BA8AB] font-mono" dir="ltr">{idx + 1}.</span>
                        <span>{player}</span>
                        <button
                          type="button"
                          onClick={() => handleDeletePlayer(selectedManageTeam, idx)}
                          className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer transition p-0.5 hover:bg-rose-950/50 rounded"
                          title={language === 'fr' ? 'Supprimer ce joueur' : language === 'en' ? 'Delete this player' : 'حذف هذا اللاعب'}
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
        )}
      </div>

      {/* 8. Database Maintenance & Complete Reset (Admin Only) */}
      {onResetDatabase && (
        <div className="ucl-card rounded-2xl border border-rose-500/40 bg-[#11212D] shadow-xl overflow-hidden transition-all duration-200">
          <button
            type="button"
            onClick={() => toggleSection('resetDb')}
            className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-[#253745]/40 transition-all duration-200 cursor-pointer select-none ${
              isRtl ? 'text-right' : 'text-left'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#06141B] border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-rose-300">
                    {language === 'fr' 
                      ? 'Réinitialisation & maintenance de la base' 
                      : language === 'en' 
                      ? 'Database Maintenance & Reset' 
                      : 'إعادة ضبط وصيانة قاعدة البيانات'}
                  </h3>
                  <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                    {language === 'fr' 
                      ? 'Action sensible (Admin)' 
                      : language === 'en' 
                      ? 'Sensitive Action (Admin Only)' 
                      : 'إجراء حساس (خاص بالآدمن)'}
                  </span>
                </div>
                <p className="text-xs text-[#9BA8AB] mt-0.5 truncate hidden sm:block">
                  {language === 'fr'
                    ? 'Réinitialiser la base de données et démarrer une nouvelle saison.'
                    : language === 'en'
                    ? 'Reset database, clear teams and matches to start a new season.'
                    : 'إعادة ضبط وتصفير قاعدة البيانات وحذف الفرق والمباريات لبدء موسم جديد'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[#9BA8AB] font-semibold hidden md:inline">
                {expandedSections.resetDb 
                  ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                  : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
              </span>
              <div className={`w-8 h-8 rounded-xl bg-[#253745] border border-[#253745] flex items-center justify-center text-[#CCD0CF] transition-transform duration-200 ${expandedSections.resetDb ? 'rotate-180 bg-rose-950/60 text-rose-300 border-rose-500/40' : 'hover:border-rose-400/50'}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {expandedSections.resetDb && (
            <div className="p-5 sm:p-6 pt-0 border-t border-[#253745] mt-1">
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                <div>
                  <p className="text-xs text-[#9BA8AB] max-w-2xl leading-relaxed">
                    {language === 'fr'
                      ? 'Cette option permet à l\'administrateur de réinitialiser la base de données pour préparer une nouvelle compétition ou saison.'
                      : language === 'en'
                      ? 'This option allows the administrator to reset the database and clear all matches and teams to start fresh.'
                      : 'يتيح هذا الخيار للمدير إعادة ضبط قاعدة البيانات وحذف كافة الفرق الافتراضية والمباريات المسجلة لبدء موسم جديد أو تنظيم جديد للبطولة.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onResetDatabase}
                  className="bg-[#253745] hover:bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold px-5 py-3 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
                  title={language === 'fr' ? 'Réinitialiser la base' : language === 'en' ? 'Reset database' : 'إعادة ضبط قاعدة البيانات'}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Réinitialiser la base' : language === 'en' ? 'Reset Database' : 'إعادة ضبط قاعدة البيانات'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settlement Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(settleConfirmMatch)}
        title={language === 'fr' ? 'Validation du score & attribution des points' : language === 'en' ? 'Confirm Result & Calculate Points' : 'اعتماد النتيجة واحتساب النقاط'}
        message={
          settleConfirmMatch
            ? (language === 'fr'
                ? `Voulez-vous valider le résultat du match (${getTeamEnglishName(settleConfirmMatch.homeTeam)} ${getSettleDraft(settleConfirmMatch.id).homeScore} - ${getSettleDraft(settleConfirmMatch.id).awayScore} ${getTeamEnglishName(settleConfirmMatch.awayTeam)}) et distribuer les points ?`
                : language === 'en'
                ? `Are you sure you want to settle (${getTeamEnglishName(settleConfirmMatch.homeTeam)} ${getSettleDraft(settleConfirmMatch.id).homeScore} - ${getSettleDraft(settleConfirmMatch.id).awayScore} ${getTeamEnglishName(settleConfirmMatch.awayTeam)}) and distribute points?`
                : `هل أنت متأكد من اعتماد نتيجة مباراة (${getTeamEnglishName(settleConfirmMatch.homeTeam)} ${getSettleDraft(settleConfirmMatch.id).homeScore} - ${getSettleDraft(settleConfirmMatch.id).awayScore} ${getTeamEnglishName(settleConfirmMatch.awayTeam)}) وتوزيع النقاط على جميع المتوقعين؟`)
            : ''
        }
        confirmText={language === 'fr' ? 'Oui, valider' : language === 'en' ? 'Yes, Settle Match' : 'نعم، اعتمد واحتسب النقاط'}
        cancelText={language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'تراجع'}
        isDestructive={false}
        onConfirm={handleSettleMatchConfirmed}
        onCancel={() => setSettleConfirmMatch(null)}
      />

      {/* Delete Single Team Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTeamConfirm)}
        title={language === 'fr' ? 'Supprimer l\'équipe' : language === 'en' ? 'Delete Team' : 'تأكيد حذف الفريق'}
        message={
          deleteTeamConfirm
            ? (language === 'fr'
                ? `Voulez-vous vraiment supprimer l'équipe (${deleteTeamConfirm}) et tous ses joueurs de la compétition ?`
                : language === 'en'
                ? `Are you sure you want to delete (${deleteTeamConfirm}) and all its squad players?`
                : `هل أنت متأكد من حذف فريق (${deleteTeamConfirm}) وجميع لاعبيه من البطولة؟`)
            : ''
        }
        confirmText={language === 'fr' ? 'Oui, supprimer' : language === 'en' ? 'Yes, Delete Team' : 'نعم، احذف الفريق'}
        cancelText={language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'إلغاء'}
        isDestructive={true}
        onConfirm={handleDeleteTeamConfirmed}
        onCancel={() => setDeleteTeamConfirm(null)}
      />

      {/* Delete All Teams & Players Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteAllTeamsConfirm}
        title={language === 'fr' ? 'Supprimer toutes les équipes et joueurs' : language === 'en' ? 'Delete All Teams & Players' : 'حذف جميع الفرق واللاعبين'}
        message={
          language === 'fr'
            ? 'Attention : Voulez-vous vraiment supprimer toutes les équipes et tous les joueurs de l\'application ?'
            : language === 'en'
            ? 'Warning: Are you completely sure you want to erase all teams and players from the application?'
            : 'تحذير: هل أنت متأكد تماماً من رغبتك في مسح وإفراغ كافة الفرق وجميع اللاعبين نهائياً من التطبيق؟'
        }
        confirmText={language === 'fr' ? 'Oui, tout supprimer' : language === 'en' ? 'Yes, Delete All' : 'نعم، حذف الكل نهائياً'}
        cancelText={language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'تراجع'}
        isDestructive={true}
        onConfirm={handleDeleteAllTeamsConfirmed}
        onCancel={() => setDeleteAllTeamsConfirm(false)}
      />

      {/* Clear Squad Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(clearSquadConfirm)}
        title={language === 'fr' ? 'Vider l\'effectif' : language === 'en' ? 'Clear Team Squad' : 'مسح تشكيلة الفريق'}
        message={
          clearSquadConfirm
            ? (language === 'fr'
                ? `Voulez-vous supprimer tous les joueurs de l'équipe (${clearSquadConfirm}) ? L'équipe elle-même ne sera pas supprimée.`
                : language === 'en'
                ? `Are you sure you want to clear all players from (${clearSquadConfirm})? The team itself will not be deleted.`
                : `هل أنت متأكد من مسح جميع اللاعبين المسجلين في فريق (${clearSquadConfirm})؟ لن يتم حذف الفريق نفسه.`)
            : ''
        }
        confirmText={language === 'fr' ? 'Oui, vider l\'effectif' : language === 'en' ? 'Yes, Clear Squad' : 'نعم، مسح التشكيلة'}
        cancelText={language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'إلغاء'}
        isDestructive={true}
        onConfirm={handleClearSquadConfirmed}
        onCancel={() => setClearSquadConfirm(null)}
      />

      {/* Edit Member Name Modal */}
      {editingMember && (
        <EditMemberNameModal
          isOpen={Boolean(editingMember)}
          onClose={() => setEditingMember(null)}
          targetUser={editingMember}
          existingUsers={users}
          onRenameUser={async (oldName, newName) => {
            if (onRenameUser) {
              await onRenameUser(oldName, newName);
            }
          }}
        />
      )}
    </div>
  );
};
