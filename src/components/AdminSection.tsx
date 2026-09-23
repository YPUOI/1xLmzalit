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
  Loader2
} from 'lucide-react';
import { Match, Team, AppUser, Prediction, SecurityConfig } from '../types';
import { getSecurityConfig, saveSecurityConfig } from '../utils/security';
import { subscribeSecurityConfig, syncSaveSecurityConfig } from '../lib/firebase';
import { ConfirmDialog } from './ConfirmDialog';
import { getTeamEnglishName } from '../data/clubPresets';
import { POPULAR_CLUB_PRESETS, parsePlayersText, generateFallbackLogo, ClubPreset } from '../data/clubPresets';
import { removeImageBackground } from '../utils/removeBackground';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t, isRtl, language } = useLanguage();

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
  const [isProcessingLogo, setIsProcessingLogo] = useState<boolean>(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);

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

  const handleAddNewTeam = () => {
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
      language === 'fr'
        ? (initialSquad.length > 0 ? `Équipe (${name}) enregistrée avec (${initialSquad.length}) joueurs !` : `Équipe (${name}) enregistrée !`)
        : language === 'en'
        ? (initialSquad.length > 0 ? `Team (${name}) registered with (${initialSquad.length}) players added!` : `Team (${name}) registered!`)
        : (initialSquad.length > 0 ? `تم تسجيل فريق (${name}) بنجاح مع إضافة (${initialSquad.length}) لاعباً لتشكيلته تلقائياً!` : `تم تسجيل فريق (${name}) بنجاح!`),
      'success'
    );
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

    if (file.size > 10 * 1024 * 1024) {
      notify(
        language === 'fr' ? 'Fichier trop lourd, maximum 10 Mo' : language === 'en' ? 'File too large, maximum 10 MB' : 'حجم الصورة كبير، يرجى اختيار صورة أقل من 10 ميغابايت',
        'error'
      );
      return;
    }

    try {
      setIsProcessingLogo(true);
      if (autoRemoveBg) {
        notify(
          language === 'fr' ? 'Traitement du logo et suppression de l\'arrière-plan...' : language === 'en' ? 'Processing logo and removing background...' : 'جارٍ معالجة الشعار وإزالة الخلفية تلقائياً...',
          'info'
        );
        const transparentLogo = await removeImageBackground(file);
        setNewTeamLogo(transparentLogo);
        notify(
          language === 'fr' ? 'Logo importé et arrière-plan retiré ! ✨' : language === 'en' ? 'Logo uploaded with background removed! ✨' : 'تم رفع الشعار وإزالة الخلفية تلقائياً بنجاح! ✨',
          'success'
        );
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setNewTeamLogo(reader.result);
            notify(
              language === 'fr' ? 'Logo importé avec succès !' : language === 'en' ? 'Logo uploaded successfully!' : 'تم رفع الشعار بنجاح!',
              'success'
            );
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      // Fallback in case of canvas processing failure
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewTeamLogo(reader.result);
          notify(
            language === 'fr' ? 'Logo importé dans son format original' : language === 'en' ? 'Logo uploaded in original format' : 'تم رفع الشعار بالصيغة الأصلية',
            'info'
          );
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingLogo(false);
      e.target.value = '';
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
        language === 'fr' ? `Traitement du logo ${selectedManageTeam}...` : language === 'en' ? `Processing logo for ${selectedManageTeam}...` : `جارٍ معالجة شعار ${selectedManageTeam} وإزالة الخلفية تلقائياً...`,
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
      onUpdateTeams(nextTeams);
      notify(
        language === 'fr' ? `Logo de ${selectedManageTeam} mis à jour sans fond ! ✨` : language === 'en' ? `Logo of ${selectedManageTeam} updated with background removed! ✨` : `تم تحديث شعار فريق ${selectedManageTeam} وإزالة الخلفية بنجاح! ✨`,
        'success'
      );
    } catch (err) {
      console.error(err);
      notify(
        language === 'fr' ? 'Échec du traitement du logo' : language === 'en' ? 'Logo processing failed' : 'فشل معالجة الشعار، يرجى المحاولة مرة أخرى',
        'error'
      );
    } finally {
      setIsProcessingLogo(false);
      e.target.value = '';
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
      onUpdateTeams(nextTeams);
      notify(
        language === 'fr' ? `Arrière-plan du logo de ${selectedManageTeam} retiré ! ✨` : language === 'en' ? `Logo background of ${selectedManageTeam} removed! ✨` : `تمت إزالة خلفية شعار ${selectedManageTeam} بنجاح! ✨`,
        'success'
      );
    } catch (err) {
      console.error(err);
      notify(
        language === 'fr' ? 'Impossible de supprimer le fond automatiquement' : language === 'en' ? 'Could not remove background automatically' : 'تعذر إزالة خلفية هذا الشعار تلقائياً، يمكنك رفع صورة الشعار مباشرة من جهازك',
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
        className="max-w-md mx-auto my-6 sm:my-10 ucl-card p-6 sm:p-8 rounded-3xl border border-rose-500/40 ucl-gold-glow text-center shadow-2xl"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-950/50">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
          {language === 'fr' ? 'Accès Administrateur Sécurisé' : language === 'en' ? 'Protected Admin Portal' : 'لوحة الإدارة محمية'}
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {language === 'fr'
            ? 'L\'accès aux paramètres et à la gestion du système requiert la saisie du code secret administrateur.'
            : language === 'en'
            ? 'Access to system controls requires entering the verified master administrator secret code.'
            : 'لا يمكن الدخول أو استعراض لوحة تحكم الآدمن بدون إدخال الرمز السري للإدارة المعتمد.'}
        </p>

        {adminGateError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-bold leading-relaxed">
            {adminGateError}
          </div>
        )}

        <form onSubmit={handleAdminGateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
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
                className="w-full bg-slate-900 border border-rose-500/60 rounded-2xl p-3.5 text-center text-white text-base tracking-widest outline-none focus:border-rose-400 min-h-[48px] placeholder:text-slate-600 placeholder:tracking-normal force-ltr font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black py-3.5 rounded-2xl transition shadow-lg text-sm cursor-pointer min-h-[48px] flex items-center justify-center gap-2 active:scale-[0.99]"
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900/70 rounded-2xl border border-slate-800">
        <div className="text-xs text-slate-300">
          <span className="font-black text-white ml-1.5 mr-1.5">
            {language === 'fr' ? 'Panneau de Contrôle :' : language === 'en' ? 'Admin Control Center:' : 'لوحة تحكم الإدارة:'}
          </span>
          <span className="text-slate-400">
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
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-700 hover:border-slate-600 flex items-center gap-1.5 active:scale-95"
          >
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('expandAll')}</span>
          </button>
          <button
            type="button"
            onClick={collapseAllSections}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-700 hover:border-slate-600 flex items-center gap-1.5 active:scale-95"
          >
            <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('collapseAll')}</span>
          </button>
        </div>
      </div>

      {/* 1. Friends Access Password & Biometric Settings Card */}
      <div className="ucl-card rounded-3xl border border-yellow-500/30 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('security')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-yellow-400">
                  {language === 'fr' 
                    ? 'Paramètres du mot de passe amis et sécurité' 
                    : language === 'en' 
                    ? 'Friends Access Password & Security Settings' 
                    : 'إعدادات كلمة مرور الأصدقاء والحماية'}
                </h3>
                <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 font-mono" dir="ltr">
                  {language === 'fr' ? 'Actuel : ' : language === 'en' ? 'Current: ' : 'الحالية: '}{securityConfig.friendPassword}
                </span>
                {securityConfig.biometricEnrolled && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 hidden sm:inline">
                    {language === 'fr' ? 'Biométrie active' : language === 'en' ? 'Biometric active' : 'بصمة نشطة'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Modifiez ou consultez le mot de passe requis pour que vos amis accèdent à la plateforme.'
                  : language === 'en'
                  ? 'Change or view the passcode required for friends to access the platform.'
                  : 'يمكنك تغيير كلمة المرور التي يطلبها النظام من أصدقائك للوصول إلى المنصة أو الاطلاع عليها.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-bold hidden md:inline">
              {expandedSections.security 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-transform duration-200 ${expandedSections.security ? 'rotate-180 bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : 'hover:border-yellow-400/50'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.security && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 mt-1">
            <p className="text-xs text-slate-400 my-4 pb-3 border-b border-slate-800 sm:hidden">
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
                  <label className="block text-xs font-bold text-slate-300">
                    {language === 'fr' ? 'Modifier le mot de passe amis' : language === 'en' ? 'Edit Friends Passcode' : 'تعديل كلمة مرور الأصدقاء'}
                  </label>
                  <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800 font-mono" dir="ltr">
                    {securityConfig.friendPassword}
                  </span>
                </div>
                <div dir="ltr">
                  <input
                    type="text"
                    dir="ltr"
                    value={newFriendPassword}
                    onChange={(e) => setNewFriendPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-yellow-300 font-mono font-black outline-none focus:border-yellow-400 force-ltr text-left"
                    placeholder={language === 'fr' ? 'Nouveau mot de passe...' : language === 'en' ? 'New passcode...' : 'أدخل كلمة المرور الجديدة...'}
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSavingSecurity}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
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

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">
                    {language === 'fr' ? 'Empreinte biométrique :' : language === 'en' ? 'Biometrics Status:' : 'حالة البصمة البيومترية:'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {securityConfig.biometricEnrolled 
                      ? (language === 'fr' ? 'Active sur cet appareil' : language === 'en' ? 'Active on this device' : 'مفعلة على هذا الجهاز') 
                      : (language === 'fr' ? 'Non configurée' : language === 'en' ? 'Not configured yet' : 'غير مفعلة بعد')}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  securityConfig.biometricEnrolled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
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
      <div className="ucl-card rounded-3xl border border-yellow-500/20 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('users')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-yellow-400">
                  {language === 'fr' 
                    ? 'Gestion des demandes d\'adhésion et membres' 
                    : language === 'en' 
                    ? 'Membership & User Management' 
                    : 'إدارة طلبات الانضمام والمستخدمين'}
                </h3>
                {pendingUsers.length > 0 ? (
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 animate-pulse">
                    {language === 'fr' ? `En attente (${pendingUsers.length})` : language === 'en' ? `Pending (${pendingUsers.length})` : `طلبات معلقة (${pendingUsers.length})`}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {language === 'fr' ? 'Aucune demande' : language === 'en' ? 'No pending' : 'لا طلبات معلقة'}
                  </span>
                )}
                <span className="text-[10px] text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                  {language === 'fr' ? `Approuvés (${approvedUsers.length})` : language === 'en' ? `Approved (${approvedUsers.length})` : `المقبولون (${approvedUsers.length})`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Approuvez ou rejetez les nouveaux membres avant qu\'ils puissent participer.'
                  : language === 'en'
                  ? 'Approve or reject new members before they can participate and rank.'
                  : 'موافقة أو رفض الأعضاء الجدد قبل السماح لهم بالتوقع والظهور في جدول الترتيب.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-bold hidden md:inline">
              {expandedSections.users 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-transform duration-200 ${expandedSections.users ? 'rotate-180 bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : 'hover:border-yellow-400/50'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.users && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 mt-1">
            <p className="text-xs text-slate-400 my-4 pb-3 border-b border-slate-800 sm:hidden">
              {language === 'fr'
                ? 'Approuvez ou rejetez les nouveaux membres avant qu\'ils puissent participer.'
                : language === 'en'
                ? 'Approve or reject new members before they can participate and rank.'
                : 'موافقة أو رفض الأعضاء الجدد قبل السماح لهم بالتوقع والظهور في جدول الترتيب.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Pending Users */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? `En attente (${pendingUsers.length})` : language === 'en' ? `Pending Requests (${pendingUsers.length})` : `طلبات معلقة (${pendingUsers.length})`}
                  </span>
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {pendingUsers.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">
                      {language === 'fr' ? 'Aucune demande en attente.' : language === 'en' ? 'No pending requests.' : 'لا توجد طلبات معلقة.'}
                    </p>
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
                          <span className="text-[10px] text-amber-400 font-semibold">
                            {language === 'fr' ? 'En attente' : language === 'en' ? 'Awaiting approval' : 'بانتظار الموافقة'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleApproveUser(u.username)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            title={language === 'fr' ? 'Approuver' : language === 'en' ? 'Approve' : 'قبول'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRejectUser(u.username)}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
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
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? `Membres approuvés (${approvedUsers.length})` : language === 'en' ? `Approved Members (${approvedUsers.length})` : `الأعضاء المقبولون (${approvedUsers.length})`}
                  </span>
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {approvedUsers.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">
                      {language === 'fr' ? 'Aucun membre approuvé pour le moment.' : language === 'en' ? 'No approved members yet.' : 'لا يوجد أعضاء مقبولون حالياً.'}
                    </p>
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
                          <span className="text-[10px] text-slate-400 font-semibold">{u.points || 0} {language === 'ar' ? 'نقطة' : 'pts'}</span>
                        </div>
                        <button
                          onClick={() => handleRevokeUser(u.username)}
                          className="bg-slate-800 hover:bg-rose-900 text-rose-400 border border-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0"
                        >
                          {language === 'fr' ? 'Suspendre' : language === 'en' ? 'Suspend' : 'تعليق'}
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
                  <span>
                    {language === 'fr' ? `Administrateurs (${adminUsers.length})` : language === 'en' ? `Active Admins (${adminUsers.length})` : `الآدمنز المتواجدون (${adminUsers.length})`}
                  </span>
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {adminUsers.map(u => (
                    <div key={u.username} className="p-3 bg-slate-950 rounded-xl border border-rose-500/30 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <div>
                          <span className="font-bold text-xs text-white block">{u.username}</span>
                          <span className="text-[10px] text-rose-400 font-semibold">
                            {language === 'fr' ? 'Admin Système' : language === 'en' ? 'Master Admin' : 'مدير نظام أساسي'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
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
      <div className="ucl-card rounded-3xl border border-amber-500/30 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('points')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-base sm:text-lg font-black text-amber-400">
                {language === 'fr' 
                  ? 'Ajustement manuel des points des membres' 
                  : language === 'en' 
                  ? 'Member Points Adjustment' 
                  : 'تعديل نقاط المتوقعين (تصحيح أخطاء)'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Ajoutez, déduisez ou définissez directement les points d\'un membre.'
                  : language === 'en'
                  ? 'Add, deduct, or set points directly for any participating member.'
                  : 'يمكنك إضافة أو خصم أو تعيين نقاط لأي عضو في حال وجود خطأ في الاحتساب.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-bold hidden md:inline">
              {expandedSections.points 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-transform duration-200 ${expandedSections.points ? 'rotate-180 bg-amber-500/20 text-amber-300 border-amber-500/40' : 'hover:border-amber-400/50'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.points && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 mt-1">
            <p className="text-xs text-slate-400 my-4 pb-3 border-b border-slate-800 sm:hidden">
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
                className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-amber-400"
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
                className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-amber-400"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400 force-ltr text-center font-mono"
                />
              </div>

              <button
                onClick={handleApplyPointsModification}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Appliquer' : language === 'en' ? 'Apply Adjustment' : 'تنفيذ التعديل'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Activity Log (سجل النشاطات) Card */}
      <div className="ucl-card rounded-3xl border border-cyan-500/30 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('activityLog')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#00E5FF] shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {language === 'fr' 
                    ? 'Journal d\'activités (Activity Log)' 
                    : language === 'en' 
                    ? 'Activity Log & Live Monitoring' 
                    : 'سجل النشاطات (Activity Log)'}
                </h3>
                <span className="text-[10px] bg-cyan-950/80 text-[#00E5FF] border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                  {language === 'fr' ? 'Surveillance en direct' : language === 'en' ? 'Live monitoring' : 'مراقبة حية'}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {language === 'fr' 
                    ? `Total pronostics : ${Object.keys(predictions).length}` 
                    : language === 'en' 
                    ? `Total predictions: ${Object.keys(predictions).length}` 
                    : `إجمالي التوقعات: ${Object.keys(predictions).length}`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Consultez les derniers pronostics soumis par les membres pour vérifier les délais.'
                  : language === 'en'
                  ? 'Monitor recent member predictions and check submission deadlines.'
                  : 'يوضح آخر التوقعات التي تم إدخالها من قبل الأعضاء لتسهيل مراقبة سير العمل والتحقق من التوقيتات.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-bold hidden md:inline">
              {expandedSections.activityLog 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-transform duration-200 ${expandedSections.activityLog ? 'rotate-180 bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'hover:border-cyan-400/50'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.activityLog && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 mt-1 space-y-4">
            <p className="text-xs text-slate-400 my-4 pb-3 border-b border-slate-800 sm:hidden">
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
                <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${isRtl ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder={language === 'fr' ? 'Rechercher par membre ou club...' : language === 'en' ? 'Search by member or club...' : 'ابحث باسم العضو أو الفريق...'}
                  className={`w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 ${
                    isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                  }`}
                />
              </div>

              {/* Match filter */}
              <select
                value={activityMatchFilter}
                onChange={(e) => setActivityMatchFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
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
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Réinitialiser' : language === 'en' ? 'Reset Filters' : 'إعادة ضبط التصفية'}</span>
                </button>
              )}
            </div>

            {/* Logs Table / List */}
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-500">
                {language === 'fr' 
                  ? 'Aucun pronostic ou activité ne correspond aux filtres actuels.' 
                  : language === 'en' 
                  ? 'No prediction activity matches current filter.' 
                  : 'لا توجد نشاطات أو توقعات مسجلة تطابق التصفية الحالية.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className={`w-full border-collapse text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="p-3">{language === 'fr' ? 'Date & Heure' : language === 'en' ? 'Timestamp' : 'وقت الإدخال'}</th>
                      <th className="p-3">{language === 'fr' ? 'Membre' : language === 'en' ? 'Member' : 'المتسابق'}</th>
                      <th className="p-3">{language === 'fr' ? 'Match' : language === 'en' ? 'Match' : 'المباراة'}</th>
                      <th className="p-3 text-center">{language === 'fr' ? 'Score' : language === 'en' ? 'Score' : 'النتيجة المتوقعة'}</th>
                      <th className="p-3">{language === 'fr' ? 'Buteurs' : language === 'en' ? 'Scorers' : 'الهدافون المتوقعون'}</th>
                      <th className="p-3">{language === 'fr' ? 'MVP' : language === 'en' ? 'MVP' : 'رجل المباراة (MVP)'}</th>
                      <th className="p-3 text-center">{language === 'fr' ? 'Délai' : language === 'en' ? 'Deadline' : 'حالة المهلة'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activityLogs.slice(0, 50).map(({ pred, match, isPastDeadline }) => (
                      <tr key={`${pred.matchId}_${pred.username}`} className="hover:bg-slate-900/50 transition">
                        {/* Timestamp */}
                        <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                          {pred.updatedAt ? (
                            <div>
                              <span className="block text-white font-bold" dir="ltr">
                                {new Date(pred.updatedAt).toLocaleTimeString(language === 'ar' ? 'ar-EG' : language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[10px] text-slate-500" dir="ltr">
                                {new Date(pred.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'numeric', day: 'numeric' })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">
                              {language === 'fr' ? 'Enregistré' : language === 'en' ? 'Saved' : 'مسجل'}
                            </span>
                          )}
                        </td>

                        {/* User */}
                        <td className="p-3 font-bold text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black text-[10px]">
                              {pred.username.charAt(0).toUpperCase()}
                            </div>
                            <span>{pred.username}</span>
                          </div>
                        </td>

                        {/* Match */}
                        <td className="p-3 text-slate-300 whitespace-nowrap">
                          {match ? (
                            <div>
                              <span className="font-bold text-white">{getTeamEnglishName(match.homeTeam)} × {getTeamEnglishName(match.awayTeam)}</span>
                              <span className="block text-[10px] text-slate-500">
                                {match.status === 'SETTLED' 
                                  ? (language === 'fr' ? 'Terminé et validé' : language === 'en' ? 'Settled' : 'منتهية ومعتمدة') 
                                  : (language === 'fr' ? 'Ouvert' : language === 'en' ? 'Open' : 'مفتوحة')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">
                              {language === 'fr' ? 'Match #' : language === 'en' ? 'Match #' : 'مباراة #'}{pred.matchId}
                            </span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="inline-block bg-[#080C19] border border-cyan-500/40 px-2.5 py-1 rounded-lg font-mono font-black text-cyan-300 text-sm" dir="ltr">
                            {pred.homeScore} - {pred.awayScore}
                          </span>
                        </td>

                        {/* Scorers */}
                        <td className="p-3 text-slate-300 max-w-xs truncate">
                          {[...(pred.homeScorers || []), ...(pred.awayScorers || [])].filter(Boolean).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {[...(pred.homeScorers || []), ...(pred.awayScorers || [])].filter(Boolean).map((sc, i) => (
                                <span key={i} className="text-[10px] bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">
                                  {sc}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[10px]">
                              {language === 'fr' ? 'Aucun' : language === 'en' ? 'None' : 'لا يوجد'}
                            </span>
                          )}
                        </td>

                        {/* MVP */}
                        <td className="p-3 whitespace-nowrap">
                          {pred.mvp ? (
                            <span className="text-[11px] font-bold text-purple-300 bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded">
                              {pred.mvp}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">
                              {language === 'fr' ? 'Non spécifié' : language === 'en' ? 'Not specified' : 'لم يُحدد'}
                            </span>
                          )}
                        </td>

                        {/* Deadline Status */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {isPastDeadline ? (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-semibold border border-slate-700">
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
      <div className="ucl-card rounded-3xl border border-amber-500/20 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('addMatch')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-base sm:text-lg font-black text-amber-400">
                {language === 'fr' 
                  ? 'Ajouter un nouveau match' 
                  : language === 'en' 
                  ? 'Add New Match for Predictions' 
                  : 'إضافة مباراة جديدة للتوقع'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Définir l\'équipe à domicile, à l\'extérieur et la date limite de pronostic.'
                  : language === 'en'
                  ? 'Set home team, away team, and prediction deadline.'
                  : 'تحديد الفريق المستضيف والضيف وموعد إغلاق التوقع (Deadline)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-bold hidden md:inline">
              {expandedSections.addMatch 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-transform duration-200 ${expandedSections.addMatch ? 'rotate-180 bg-amber-500/20 text-amber-300 border-amber-500/40' : 'hover:border-amber-400/50'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.addMatch && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 mt-1">
            <p className="text-xs text-slate-400 my-4 pb-3 border-b border-slate-800 sm:hidden">
              {language === 'fr'
                ? 'Définir l\'équipe à domicile, à l\'extérieur et la date limite de pronostic.'
                : language === 'en'
                ? 'Set home team, away team, and prediction deadline.'
                : 'تحديد الفريق المستضيف والضيف وموعد إغلاق التوقع (Deadline)'}
            </p>

            {teamKeys.length < 2 ? (
              <div className="p-4 my-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-xs text-amber-300 leading-relaxed">
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
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {language === 'fr' ? 'Équipe à domicile (Home)' : language === 'en' ? 'Home Team' : 'الفريق المستضيف (Home)'}
                    </label>
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
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {language === 'fr' ? 'Équipe à l\'extérieur (Away)' : language === 'en' ? 'Away Team' : 'الفريق الضيف (Away)'}
                    </label>
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
                    {language === 'fr' ? 'Date & heure du match / Clôture des pronostics' : language === 'en' ? 'Kickoff date/time & deadline' : 'موعد المباراة ووقت إغلاق التوقع (Deadline)'}
                  </label>
                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:border-amber-400 outline-none text-xs font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3.5 rounded-xl transition shadow-lg text-xs cursor-pointer active:scale-95"
                >
                  {language === 'fr' ? 'Publier le match et ouvrir les pronostics' : language === 'en' ? 'Publish Match & Open Predictions' : 'نشر المباراة وإتاحة التوقع للمستخدمين'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 6. Match Score Settlement & Management */}
      <div className="ucl-card rounded-3xl border border-blue-500/20 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('settleMatches')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
              <ListCheck className="w-5 h-5" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-blue-400">
                  {language === 'fr' 
                    ? 'Gestion des matchs & validation des scores' 
                    : language === 'en' 
                    ? 'Match Management & Settlement' 
                    : 'إدارة المباريات واعتماد النتائج'}
                </h3>
                <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                  {language === 'fr' ? `Matchs (${matches.length})` : language === 'en' ? `Matches (${matches.length})` : `المباريات (${matches.length})`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Modifier l\'heure, les scores et supprimer des matchs.'
                  : language === 'en'
                  ? 'Edit schedule, settle final scores, and delete matches.'
                  : 'تعديل التوقيت، النتيجة، وحذف المباريات'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-bold hidden md:inline">
              {expandedSections.settleMatches 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-transform duration-200 ${expandedSections.settleMatches ? 'rotate-180 bg-blue-500/20 text-blue-300 border-blue-500/40' : 'hover:border-blue-400/50'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.settleMatches && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 mt-1 space-y-4">
            <p className="text-xs text-slate-400 my-4 pb-3 border-b border-slate-800 sm:hidden">
              {language === 'fr'
                ? 'Modifier l\'heure, les scores et supprimer des matchs.'
                : language === 'en'
                ? 'Edit schedule, settle final scores, and delete matches.'
                : 'تعديل التوقيت، النتيجة، وحذف المباريات'}
            </p>

            {matches.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                {language === 'fr' ? 'Aucun match enregistré.' : language === 'en' ? 'No matches recorded yet.' : 'لا توجد مباريات مسجلة بعد.'}
              </p>
            ) : (
              <div className="space-y-4 pt-2">
            {matches.map(match => {
              const home = teams[match.homeTeam] || { squad: [] };
              const away = teams[match.awayTeam] || { squad: [] };
              const draft = getSettleDraft(match.id);

              return (
                <div key={match.id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
                  {/* Title & Delete */}
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span className="text-sm text-white font-black">{getTeamEnglishName(match.homeTeam)} VS {getTeamEnglishName(match.awayTeam)}</span>
                    <div className="flex items-center gap-3">
                      <span className={match.status === 'SETTLED' ? 'text-emerald-400' : 'text-amber-400'}>
                        {match.status === 'SETTLED' 
                          ? (language === 'fr' ? 'Résultat validé' : language === 'en' ? 'Settled' : 'تم تنزيل النتيجة') 
                          : (language === 'fr' ? 'Ouvert' : language === 'en' ? 'Open' : 'مفتوحة')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMatchClick(match)}
                        className="bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-500/40 text-[11px] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 font-black cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Supprimer' : language === 'en' ? 'Delete' : 'حذف المباراة'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Edit Deadline */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full">
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {language === 'fr' ? 'Modifier la clôture :' : language === 'en' ? 'Edit deadline:' : 'تعديل موعد ووقت إغلاق التوقع:'}
                      </label>
                      <input
                        type="datetime-local"
                        value={editDeadlines[match.id] || (match.deadline ? match.deadline.slice(0, 16) : '')}
                        onChange={(e) => setEditDeadlines({ ...editDeadlines, [match.id]: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateDeadline(match.id)}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition shrink-0 cursor-pointer"
                    >
                      {language === 'fr' ? 'Enregistrer' : language === 'en' ? 'Save Time' : 'حفظ الوقت الجديد'}
                    </button>
                  </div>

                  {/* Settlement Inputs (If not settled) */}
                  {match.status !== 'SETTLED' && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-400">
                            {language === 'fr' ? `Buts ${getTeamEnglishName(match.homeTeam)}` : language === 'en' ? `${getTeamEnglishName(match.homeTeam)} Goals` : `أهداف ${getTeamEnglishName(match.homeTeam)}`}
                          </label>
                          <div dir="ltr">
                            <input
                              type="number"
                              min="0"
                              dir="ltr"
                              value={draft.homeScore}
                              onChange={(e) => updateSettleDraft(match.id, { homeScore: parseInt(e.target.value) || 0 })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-center text-white font-bold font-mono force-ltr"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400">
                            {language === 'fr' ? `Buts ${getTeamEnglishName(match.awayTeam)}` : language === 'en' ? `${getTeamEnglishName(match.awayTeam)} Goals` : `أهداف ${getTeamEnglishName(match.awayTeam)}`}
                          </label>
                          <div dir="ltr">
                            <input
                              type="number"
                              min="0"
                              dir="ltr"
                              value={draft.awayScore}
                              onChange={(e) => updateSettleDraft(match.id, { awayScore: parseInt(e.target.value) || 0 })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-center text-white font-bold font-mono force-ltr"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Scorer picks for home */}
                      {draft.homeScore > 0 && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-400">
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
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
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
                          <label className="block text-[10px] font-bold text-rose-400">
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
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
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
                        <label className="block text-[10px] text-slate-400 mb-1">
                          {language === 'fr' ? 'Homme du match officiel (MVP)' : language === 'en' ? 'Official Match MVP' : 'رجل المباراة الفعلي (MVP)'}
                        </label>
                        <select
                          value={draft.mvp}
                          onChange={(e) => updateSettleDraft(match.id, { mvp: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold outline-none"
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
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl transition cursor-pointer"
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
      <div className="ucl-card rounded-3xl border border-purple-500/20 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('teams')}
          className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition cursor-pointer select-none ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-purple-400">
                  {language === 'fr' 
                    ? 'Gestion des équipes & effectifs' 
                    : language === 'en' 
                    ? 'Teams & Squads Management' 
                    : 'التحكم في الفرق واللاعبين'}
                </h3>
                <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                  {language === 'fr' 
                    ? `${teamKeys.length} équipes` 
                    : language === 'en' 
                    ? `${teamKeys.length} teams registered` 
                    : `${teamKeys.length} فرق مسجلة`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                {language === 'fr'
                  ? 'Ajouter/modifier des équipes, logos et listes des joueurs.'
                  : language === 'en'
                  ? 'Add & edit teams, logos, and bulk squad entry.'
                  : 'إضافة وتعديل الفرق، رفع وقص الشعارات، إدخال قوائم اللاعبين دفعة واحدة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-bold hidden md:inline">
              {expandedSections.teams 
                ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-transform duration-200 ${expandedSections.teams ? 'rotate-180 bg-purple-500/20 text-purple-300 border-purple-500/40' : 'hover:border-purple-400/50'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {expandedSections.teams && (
          <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 mt-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3">
              <p className="text-xs text-slate-400">
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
                  className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 font-bold cursor-pointer active:scale-95 shrink-0"
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
        <div className="p-5 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>
                {language === 'fr' ? 'Ajouter une nouvelle équipe :' : language === 'en' ? 'Add New Team:' : 'إضافة فريق جديد للبطولة:'}
              </span>
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPresetPicker(!showPresetPicker)}
                className="bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {language === 'fr' 
                    ? `Clubs prédéfinis (${POPULAR_CLUB_PRESETS.length})` 
                    : language === 'en' 
                    ? `Preset Clubs (${POPULAR_CLUB_PRESETS.length})` 
                    : `أندية مقترحة جاهزة بشعاراتها (${POPULAR_CLUB_PRESETS.length})`}
                </span>
                {showPresetPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <label className={`border text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer select-none ${
                isProcessingLogo 
                  ? 'bg-blue-950/80 border-blue-500/50 text-blue-300 animate-pulse' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}>
                {isProcessingLogo ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
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
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title={language === 'fr' ? 'Générer un écusson et logo automatique' : language === 'en' ? 'Generate shield crest based on team name' : 'توليد درع وشعار تلقائي حسب اسم الفريق'}
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'fr' ? 'Générer logo' : language === 'en' ? 'Auto-Generate' : 'توليد شعار تلقائي'}</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Selector Grid */}
          {showPresetPicker && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-purple-500/30 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">
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
                    className={`flex items-center gap-2 p-2 bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/50 rounded-xl transition cursor-pointer group ${
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
                      <div className="text-xs font-bold text-slate-200 truncate group-hover:text-white">
                        {language === 'en' ? preset.enName : preset.name}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate font-mono">
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
              <label className="text-[11px] text-slate-400 font-bold block mb-1">
                {language === 'fr' ? 'Nom de l\'équipe :' : language === 'en' ? 'Team Name:' : 'اسم الفريق:'}
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder={language === 'fr' ? 'Ex: Real Madrid, Manchester City...' : language === 'en' ? 'E.g., Real Madrid, Manchester City...' : 'مثال: ريال مدريد، مانشستر سيتي...'}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400"
              />
            </div>

            <div className="md:col-span-5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400 font-bold">
                  {language === 'fr' ? 'Lien de l\'image / Logo :' : language === 'en' ? 'Logo or Image URL:' : 'رابط الشعار أو الصورة:'}
                </label>
                <label className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoRemoveBg}
                    onChange={(e) => setAutoRemoveBg(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-cyan-500 cursor-pointer"
                  />
                  <span>{language === 'fr' ? 'Détourer auto' : language === 'en' ? 'Auto remove bg' : 'تفريغ الخلفية تلقائياً'}</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  dir="ltr"
                  value={newTeamLogo}
                  onChange={(e) => setNewTeamLogo(e.target.value)}
                  placeholder={language === 'fr' ? 'https://... ou importer ci-dessus' : language === 'en' ? 'https://... or upload above' : 'https://... أو استخدم زر الرفع أعلاه'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400 font-mono text-[11px] force-ltr"
                />
                {newTeamLogo && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div 
                      className="w-9 h-9 bg-slate-950 border border-slate-700 rounded-xl p-1 flex items-center justify-center overflow-hidden relative"
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
                      className="px-2 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl transition cursor-pointer text-[11px] flex items-center gap-1 font-bold"
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
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs py-2.5 px-3 rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/20 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'fr' ? 'Enregistrer' : language === 'en' ? 'Register Team' : 'تسجيل الفريق'}</span>
              </button>
            </div>
          </div>

          {/* Optional Initial Squad Input */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {language === 'fr' 
                    ? 'Effectif initial de l\'équipe (optionnel - détection automatique) :' 
                    : language === 'en' 
                    ? 'Initial Squad for this Team (optional - auto-separated):' 
                    : 'إدخال لاعبي هذا الفريق دفعة واحدة (اختياري - يفصلهم التطبيق تلقائياً):'}
                </span>
              </label>
              {detectedInitialSquad.length > 0 && (
                <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
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
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Manage Squad */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                {language === 'fr' ? 'Gestion des joueurs :' : language === 'en' ? 'Manage Squad Players:' : 'إدارة لاعبي التشكيلة:'}
              </span>
            </h4>
          </div>

          {teamKeys.length === 0 ? (
            <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
              {language === 'fr' 
                ? 'Aucune équipe enregistrée pour le moment. Utilisez le formulaire ci-dessus pour ajouter une équipe.' 
                : language === 'en' 
                ? 'No teams registered yet. Use the Add Team form above to register teams first.' 
                : 'لا توجد أي فرق مسجلة حالياً. استخدم نموذج "إضافة فريق جديد للبطولة" أعلاه لإضافة فريق ثم إضافة لاعبيه.'}
            </div>
          ) : (
            <>
              {/* Registered Teams Visual Bar */}
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-yellow-400" />
                    <span>
                      {language === 'fr' ? `Équipes enregistrées (${teamKeys.length}) :` : language === 'en' ? `Registered Teams (${teamKeys.length}):` : `الفرق المسجلة في البطولة (${teamKeys.length} فرق):`}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500">
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
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/30 border-blue-400 text-white shadow-md shadow-blue-500/20'
                            : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                        }`}
                      >
                        {tObj?.logo ? (
                          <img src={tObj.logo} alt="" className="w-5 h-5 object-contain rounded shrink-0 bg-slate-950 p-0.5" />
                        ) : (
                          <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                        <span>{tKey}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          isSelected ? 'bg-blue-500/40 text-blue-200' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {tObj?.squad?.length || 0} {language === 'fr' ? 'joueurs' : language === 'en' ? 'players' : 'لاعب'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Team Header Bar */}
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {teams[selectedManageTeam]?.logo && (
                    <div 
                      className="w-9 h-9 shrink-0 rounded-xl p-1 bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden"
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
                    <span className="text-xs text-slate-400 font-bold">
                      {language === 'fr' ? 'Équipe sélectionnée :' : language === 'en' ? 'Selected Team:' : 'الفريق الحالي:'}
                    </span>
                    <select
                      value={selectedManageTeam}
                      onChange={(e) => setSelectedManageTeam(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold outline-none focus:border-blue-400"
                    >
                      {teamKeys.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Change Logo / Remove Bg for selected team */}
                  <label 
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 select-none"
                    title={language === 'fr' ? 'Changer le logo et détourer auto' : language === 'en' ? 'Upload new logo with auto-cutout' : 'رفع شعار جديد لهذا الفريق من الجهاز وتفريغ خلفيته تلقائياً'}
                  >
                    {isProcessingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-cyan-400" />}
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
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      title={language === 'fr' ? 'Détourer le logo actuel' : language === 'en' ? 'Remove current logo background' : 'إزالة خلفية الشعار الحالي لهذا الفريق وجعله شفافاً'}
                    >
                      <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>{language === 'fr' ? 'Détourer le logo' : language === 'en' ? 'Cutout Logo' : 'إزالة خلفية الشعار'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setClearSquadConfirm(selectedManageTeam)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    title={language === 'fr' ? 'Vider la liste des joueurs' : language === 'en' ? 'Clear squad player list' : 'مسح قائمة لاعبي هذا الفريق فقط'}
                  >
                    <span>{language === 'fr' ? 'Vider l\'effectif' : language === 'en' ? 'Clear Squad' : 'مسح تشكيلة الفريق'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTeamConfirm(selectedManageTeam)}
                    className="p-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    title={language === 'fr' ? 'Supprimer l\'équipe' : language === 'en' ? 'Delete this team' : 'حذف هذا الفريق بالكامل'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'fr' ? 'Supprimer' : language === 'en' ? 'Delete Team' : 'حذف الفريق'}</span>
                  </button>
                </div>
              </div>

              {/* Automatic Bulk Players Entry (User's primary request) */}
              <div className="p-4 bg-gradient-to-r from-blue-950/40 to-slate-900/60 rounded-2xl border border-blue-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black text-blue-300">
                      {language === 'fr' 
                        ? `Ajout groupé de joueurs pour (${selectedManageTeam}) :` 
                        : language === 'en' 
                        ? `Bulk Players Entry (auto-separated) for (${selectedManageTeam}):` 
                        : `إدخال جميع اللاعبين دفعة واحدة (فصل تلقائي) لـ (${selectedManageTeam}):`}
                    </span>
                  </div>
                  {detectedBulkPlayers.length > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
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

                <p className="text-[11px] text-slate-400">
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-400 placeholder:text-slate-600 leading-relaxed font-sans"
                />

                {/* Live Preview Chips if players are detected */}
                {detectedBulkPlayers.length > 0 && (
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      {language === 'fr' ? 'Aperçu avant ajout :' : language === 'en' ? 'Preview before adding:' : 'معاينة اللاعبين المكتشفين قبل الإضافة:'}
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
                    className={`font-black text-xs py-2.5 px-5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                      detectedBulkPlayers.length > 0
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
                      className="text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer font-bold px-2 py-1"
                    >
                      {language === 'fr' ? 'Effacer le texte' : language === 'en' ? 'Clear text' : 'مسح النص'}
                    </button>
                  )}
                </div>
              </div>

              {/* Single Player Quick Add */}
              <div className="p-3 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-bold shrink-0">
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
                  className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none focus:border-emerald-400 flex-1 min-w-[160px]"
                />
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Ajouter' : language === 'en' ? 'Add' : 'إضافة'}</span>
                </button>
              </div>

              {/* Current Squad Display */}
              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-300">
                    {language === 'fr' 
                      ? `Effectif de (${selectedManageTeam}) :` 
                      : language === 'en' 
                      ? `Squad list of (${selectedManageTeam}):` 
                      : `قائمة لاعبي فريق (${selectedManageTeam}) حالياً:`}
                  </span>
                  <span className="text-xs text-yellow-400 font-bold bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 rounded-full">
                    {teams[selectedManageTeam]?.squad?.length || 0} {language === 'fr' ? 'joueurs enregistrés' : language === 'en' ? 'players registered' : 'لاعبين مسجلين'}
                  </span>
                </div>
                {(!teams[selectedManageTeam]?.squad || teams[selectedManageTeam]?.squad.length === 0) ? (
                  <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
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
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-200 transition"
                      >
                        <span className="text-[10px] text-slate-500 font-mono" dir="ltr">{idx + 1}.</span>
                        <span>{player}</span>
                        <button
                          type="button"
                          onClick={() => handleDeletePlayer(selectedManageTeam, idx)}
                          className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer transition p-0.5 hover:bg-rose-950/50 rounded"
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
        <div className="ucl-card rounded-3xl border border-rose-500/40 shadow-xl overflow-hidden transition-all duration-200">
          <button
            type="button"
            onClick={() => toggleSection('resetDb')}
            className={`w-full p-5 sm:p-6 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition cursor-pointer select-none ${
              isRtl ? 'text-right' : 'text-left'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-rose-400">
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
                <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                  {language === 'fr'
                    ? 'Réinitialiser la base de données et démarrer une nouvelle saison.'
                    : language === 'en'
                    ? 'Reset database, clear teams and matches to start a new season.'
                    : 'إعادة ضبط وتصفير قاعدة البيانات وحذف الفرق والمباريات لبدء موسم جديد'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-bold hidden md:inline">
                {expandedSections.resetDb 
                  ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'إخفاء') 
                  : (language === 'fr' ? 'Voir détails' : language === 'en' ? 'Show details' : 'عرض التفاصيل')}
              </span>
              <div className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-transform duration-200 ${expandedSections.resetDb ? 'rotate-180 bg-rose-500/20 text-rose-300 border-rose-500/40' : 'hover:border-rose-400/50'}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {expandedSections.resetDb && (
            <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 mt-1">
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                <div>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
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
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black px-5 py-3 rounded-2xl transition shadow-lg text-xs sm:text-sm cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
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
    </div>
  );
};
