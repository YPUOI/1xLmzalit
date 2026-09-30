import React, { useMemo, useState } from 'react';
import { 
  Crown, 
  Medal, 
  UserCheck, 
  Star, 
  Trophy, 
  Award, 
  Flame, 
  Target, 
  Sparkles,
  Archive,
  Save,
  Plus,
  Edit3,
  Download
} from 'lucide-react';
import { AppUser, Match, Prediction, ArchivedSeason } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { LeaderboardArchiveModal } from './LeaderboardArchiveModal';
import { FinishCurrentSeasonModal } from './FinishCurrentSeasonModal';
import { AddPastSeasonModal } from './AddPastSeasonModal';
import { EditMemberNameModal } from './EditMemberNameModal';
import { StandingsCardModal } from './StandingsCardModal';

interface LeaderboardSectionProps {
  users: AppUser[];
  matches?: Match[];
  predictions?: Record<string, Prediction>;
  currentUser?: AppUser | null;
  archivedSeasons?: ArchivedSeason[];
  onSaveArchivedSeason?: (season: ArchivedSeason) => Promise<void>;
  onDeleteArchivedSeason?: (seasonId: string) => Promise<void>;
  onFinishCurrentSeason?: (season: ArchivedSeason, shouldResetPoints: boolean) => Promise<void>;
  onRenameUser?: (oldUsername: string, newUsername: string) => Promise<void>;
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ 
  users, 
  matches = [], 
  predictions = {},
  currentUser,
  archivedSeasons = [],
  onSaveArchivedSeason,
  onDeleteArchivedSeason,
  onFinishCurrentSeason,
  onRenameUser,
}) => {
  const { t, isRtl, language } = useLanguage();
  const isAdmin = currentUser?.role === 'admin';

  // Modals state
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isFinishSeasonOpen, setIsFinishSeasonOpen] = useState(false);
  const [isAddPastSeasonOpen, setIsAddPastSeasonOpen] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);
  const [standingsModalAction, setStandingsModalAction] = useState<'share' | 'download' | null>(null);
  const [editingSeason, setEditingSeason] = useState<ArchivedSeason | null>(null);
  const [editingMember, setEditingMember] = useState<AppUser | null>(null);

  // Calculate statistics per user (exact score count, correct MVP count, and correct Scorers count)
  const userStats = useMemo(() => {
    const stats: Record<string, { exactScoreCount: number; correctMvpCount: number; correctScorersCount: number }> = {};

    matches.forEach(match => {
      if (match.status === 'SETTLED' && match.result) {
        const res = match.result;
        Object.values(predictions).forEach(pred => {
          if (pred.matchId === match.id) {
            if (!stats[pred.username]) {
              stats[pred.username] = { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };
            }
            // Check Exact Score
            if (pred.homeScore === res.homeScore && pred.awayScore === res.awayScore) {
              stats[pred.username].exactScoreCount += 1;
            }
            // Check MVP
            if (pred.mvp && res.mvp && pred.mvp.trim().toLowerCase() === res.mvp.trim().toLowerCase()) {
              stats[pred.username].correctMvpCount += 1;
            }
            // Check Scorers
            (pred.homeScorers || []).forEach(sc => {
              if (sc && res.homeScorers.includes(sc)) {
                stats[pred.username].correctScorersCount += 1;
              }
            });
            (pred.awayScorers || []).forEach(sc => {
              if (sc && res.awayScorers.includes(sc)) {
                stats[pred.username].correctScorersCount += 1;
              }
            });
          }
        });
      }
    });

    return stats;
  }, [matches, predictions]);

  // Sort approved users according to strict 4-tier ranking rules:
  // 1. Total Points
  // 2. Most MVP predicted
  // 3. Most scorers predicted
  // 4. Account creation date (earliest wins)
  const approvedUsers = useMemo(() => {
    return users
      .filter(u => (u.status === 'approved' || !u.status) && u.role !== 'admin')
      .sort((a, b) => {
        // 1. Total Points (descending)
        const ptsDiff = (b.points || 0) - (a.points || 0);
        if (ptsDiff !== 0) return ptsDiff;

        // 2. Most MVP predicted (descending)
        const aMvp = userStats[a.username]?.correctMvpCount || 0;
        const bMvp = userStats[b.username]?.correctMvpCount || 0;
        if (bMvp !== aMvp) return bMvp - aMvp;

        // 3. Most scorers predicted (descending)
        const aScorers = userStats[a.username]?.correctScorersCount || 0;
        const bScorers = userStats[b.username]?.correctScorersCount || 0;
        if (bScorers !== aScorers) return bScorers - aScorers;

        // 4. Account creation date (ascending: earlier date wins)
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 9999999999999;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 9999999999999;
        if (aTime !== bTime) return aTime - bTime;

        return a.username.localeCompare(b.username);
      });
  }, [users, userStats]);

  const top3 = useMemo(() => approvedUsers.slice(0, 3), [approvedUsers]);

  // Helper for place-significant styling and numbers
  const getPlaceConfig = (rank: number) => {
    if (rank === 1) {
      return {
        tier: 'gold',
        title: t('seasonChampionBadge'),
        numberBadge: 'bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-[#06141B] ring-2 ring-amber-300 shadow-md shadow-amber-500/25',
        cardBg: 'bg-gradient-to-r from-amber-500/15 via-[#11212D] to-amber-500/5 border-2 border-amber-400/80 shadow-lg shadow-amber-500/10',
        tableRowBg: 'bg-amber-500/[0.05] hover:bg-amber-500/[0.10] border-l-4 border-l-amber-400',
        avatarBg: 'bg-gradient-to-br from-amber-400 to-yellow-600 text-[#06141B] ring-2 ring-amber-400 font-black',
        pointsBadge: 'bg-amber-400/20 border border-amber-400/60 text-amber-300 shadow-sm font-black',
        textAccent: 'text-amber-300 font-bold',
        tagPill: 'bg-amber-400/20 border border-amber-400/50 text-amber-300 font-bold',
        icon: <Crown className="w-4 h-4 text-amber-400 shrink-0" />
      };
    }
    if (rank === 2) {
      return {
        tier: 'silver',
        title: t('runnerUpBadge'),
        numberBadge: 'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 text-[#06141B] ring-2 ring-slate-200 shadow-md shadow-slate-400/20',
        cardBg: 'bg-gradient-to-r from-slate-400/15 via-[#11212D] to-slate-400/5 border-2 border-slate-300/70 shadow-md shadow-slate-400/5',
        tableRowBg: 'bg-slate-400/[0.04] hover:bg-slate-400/[0.09] border-l-4 border-l-slate-300',
        avatarBg: 'bg-gradient-to-br from-slate-200 to-slate-400 text-[#06141B] ring-2 ring-slate-300 font-black',
        pointsBadge: 'bg-slate-300/20 border border-slate-300/50 text-slate-200 shadow-sm font-black',
        textAccent: 'text-slate-200 font-bold',
        tagPill: 'bg-slate-300/20 border border-slate-300/40 text-slate-200 font-bold',
        icon: <Medal className="w-4 h-4 text-slate-200 shrink-0" />
      };
    }
    if (rank === 3) {
      return {
        tier: 'bronze',
        title: t('thirdPlaceBadge'),
        numberBadge: 'bg-gradient-to-br from-amber-600 via-orange-400 to-amber-700 text-white ring-2 ring-amber-500 shadow-md shadow-orange-700/20',
        cardBg: 'bg-gradient-to-r from-amber-800/20 via-[#11212D] to-amber-900/10 border-2 border-amber-700/70 shadow-md shadow-amber-900/5',
        tableRowBg: 'bg-amber-700/[0.04] hover:bg-amber-700/[0.09] border-l-4 border-l-amber-600',
        avatarBg: 'bg-gradient-to-br from-amber-600 to-amber-800 text-white ring-2 ring-amber-600 font-black',
        pointsBadge: 'bg-amber-700/20 border border-amber-600/50 text-amber-300 shadow-sm font-black',
        textAccent: 'text-amber-400 font-bold',
        tagPill: 'bg-amber-700/20 border border-amber-600/40 text-amber-400 font-bold',
        icon: <Medal className="w-4 h-4 text-amber-500 shrink-0" />
      };
    }
    if (rank <= 5) {
      return {
        tier: 'top5',
        title: 'Top 5 UCL Elite',
        numberBadge: 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 ring-1 ring-cyan-400/40 font-black',
        cardBg: 'bg-gradient-to-r from-cyan-950/30 via-[#11212D] to-transparent border border-cyan-500/40 shadow-sm',
        tableRowBg: 'bg-cyan-950/[0.04] hover:bg-cyan-950/[0.09] border-l-4 border-l-cyan-400',
        avatarBg: 'bg-[#253745] text-cyan-300 border border-cyan-500/50 font-bold',
        pointsBadge: 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-bold',
        textAccent: 'text-cyan-300 font-semibold',
        tagPill: 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold',
        icon: <Star className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      };
    }
    if (rank <= 10) {
      return {
        tier: 'top10',
        title: '',
        numberBadge: 'bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] font-bold',
        cardBg: 'bg-[#11212D] border border-[#253745]',
        tableRowBg: 'hover:bg-[#253745]/30 border-l-4 border-l-[#4A5C6A]',
        avatarBg: 'bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] font-bold',
        pointsBadge: 'bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF]',
        textAccent: 'text-[#CCD0CF]',
        tagPill: '',
        icon: null
      };
    }
    return {
      tier: 'standard',
      title: '',
      numberBadge: 'bg-[#06141B] border border-[#253745] text-[#9BA8AB] font-semibold',
      cardBg: 'bg-[#06141B] border border-[#253745]',
      tableRowBg: 'hover:bg-[#253745]/20 border-l-4 border-l-transparent',
      avatarBg: 'bg-[#06141B] text-[#9BA8AB] border border-[#253745] font-semibold',
      pointsBadge: 'bg-[#06141B] border border-[#253745] text-[#CCD0CF]',
      textAccent: 'text-[#CCD0CF]',
      tagPill: '',
      icon: null
    };
  };

  return (
    <div className="bg-[#11212D] p-4 sm:p-6 rounded-2xl border border-[#253745] space-y-5 shadow-xl" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center pb-4 border-b border-[#253745] gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#CCD0CF] flex items-center gap-2.5">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#CCD0CF] shrink-0" />
            <span>{t('leaderboardTitle')}</span>
          </h2>
          <p className="text-xs text-[#9BA8AB] mt-1">
            {t('leaderboardDesc')}
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {/* Archive Button */}
          <button
            onClick={() => setIsArchiveOpen(true)}
            className="text-xs bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] border border-[#4A5C6A] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            title={t('archiveBtn')}
          >
            <Archive className="w-3.5 h-3.5 text-[#CCD0CF]" />
            <span>{t('archiveBtn')}</span>
            {archivedSeasons.length > 0 && (
              <span className="bg-[#11212D] text-[10px] px-1.5 py-0.2 rounded-full border border-[#4A5C6A] font-mono">
                {archivedSeasons.length}
              </span>
            )}
          </button>

          {/* Admin Standings Share & Download Buttons (just for admin) */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 bg-[#06141B] p-1 rounded-xl border border-[#253745]">
              {/* Simple Share Button (matching the user's photo) */}
              <button
                type="button"
                onClick={() => {
                  setStandingsModalAction('share');
                  setIsStandingsModalOpen(true);
                }}
                disabled={approvedUsers.length === 0}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#253745] hover:bg-[#4A5C6A] border border-[#4A5C6A] text-[#CCD0CF] hover:text-white transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
                title={language === 'fr' ? 'Partager le classement' : language === 'en' ? 'Share Standings' : 'مشاركة صورة الترتيب'}
                aria-label="Share Standings"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/>
                </svg>
              </button>

              {/* Download Standings Button */}
              <button
                type="button"
                onClick={() => {
                  setStandingsModalAction('download');
                  setIsStandingsModalOpen(true);
                }}
                disabled={approvedUsers.length === 0}
                className="text-xs bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white border border-[#4A5C6A] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                title={language === 'fr' ? 'Télécharger la photo du classement' : language === 'en' ? 'Download Standings Card' : 'تحميل صورة الترتيب'}
              >
                <Download className="w-3.5 h-3.5 text-[#CCD0CF]" />
                <span className="hidden sm:inline">{language === 'fr' ? 'Télécharger le classement' : language === 'en' ? 'Download Standings' : 'تحميل الترتيب'}</span>
              </button>
            </div>
          )}

          {/* Admin Finish and Save Season Button */}
          {isAdmin && onFinishCurrentSeason && (
            <button
              onClick={() => setIsFinishSeasonOpen(true)}
              disabled={approvedUsers.length === 0}
              className="text-xs bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              title={t('finishCurrentSeasonBtn')}
            >
              <Save className="w-3.5 h-3.5 text-[#06141B]" />
              <span className="hidden sm:inline">{t('finishCurrentSeasonBtn')}</span>
              <span className="sm:hidden">{t('finishCurrentSeasonBtn')}</span>
            </button>
          )}

          <span className="hidden md:flex text-xs bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] px-2.5 py-1.5 rounded-lg font-medium items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#CCD0CF]" />
            <span>{t('tabLeaderboardShort')}</span>
          </span>
        </div>
      </div>

      {approvedUsers.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#9BA8AB] bg-[#06141B] rounded-xl border border-[#253745]">
          {t('noApprovedUsers')}
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TOP 3 PODIUM: Visible when at least 3 members are ranked                  */}
          {/* ========================================================================= */}
          {top3.length >= 3 && (
            <div className="space-y-2.5 pb-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#CCD0CF] px-1">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>{isRtl ? 'منصة التتويج والمراكز الثلاثة الأولى' : 'Top 3 Podium Standings'}</span>
                </span>
                <span className="text-[11px] text-[#9BA8AB] font-mono">
                  {isRtl ? '#1 > #2 > #3 بالترتيب' : 'Rank #1 > Rank #2 > Rank #3'}
                </span>
              </div>

              {/* DESKTOP PODIUM (sm:flex): Tiered Height (1st Tallest/Biggest in Center) */}
              <div className="hidden sm:flex items-end justify-center gap-4 pt-4 pb-2" dir="ltr">
                {/* 2nd Place: SILVER (MEDIUM) */}
                {top3[1] && (
                  <div className="w-1/3 min-h-[195px] bg-[#11212D] border-2 border-slate-300/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-200 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400" />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-400 text-[#06141B] border border-slate-300 font-mono font-black text-lg flex items-center justify-center shadow-md">
                          2
                        </div>
                        <span className="text-[10.5px] uppercase font-extrabold text-slate-200 bg-slate-300/15 border border-slate-300/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Medal className="w-3 h-3 text-slate-200" />
                          <span>{t('runnerUpBadge')}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9BA8AB] uppercase tracking-wider block font-semibold">
                        {isRtl ? 'المركز الثاني' : '2nd Place'}
                      </span>
                      <h4 className="text-base font-bold text-slate-100 truncate mt-0.5" title={top3[1].username}>
                        {top3[1].username}
                      </h4>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#253745] flex items-center justify-between">
                      <span className="text-[10px] text-[#9BA8AB]">{t('totalPoints')}</span>
                      <span className="font-mono font-black text-base text-slate-200 bg-slate-300/15 px-2.5 py-0.5 rounded-lg border border-slate-300/30">
                        {top3[1].points || 0} pts
                      </span>
                    </div>
                  </div>
                )}

                {/* 1st Place: GOLD (BIGGEST & TALLEST, SCALE 105) */}
                {top3[0] && (
                  <div className="w-5/12 min-h-[255px] bg-gradient-to-b from-[#24394c] via-[#162737] to-[#11212D] border-2 border-amber-400 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl shadow-amber-500/15 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 scale-105 z-10">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500" />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-[#06141B] ring-2 ring-amber-300 font-mono font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                          1
                        </div>
                        <span className="text-xs uppercase font-black text-amber-300 bg-amber-400/20 border border-amber-400/50 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Crown className="w-3.5 h-3.5 text-amber-300" />
                          <span>{t('seasonChampionBadge')}</span>
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-300/80 uppercase tracking-wider block font-bold">
                        {isRtl ? 'المتصدر والبطل الحالي' : 'Current Leader & Champion'}
                      </span>
                      <h4 className="text-lg font-black text-white truncate mt-0.5" title={top3[0].username}>
                        {top3[0].username}
                      </h4>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#253745] flex items-center justify-between">
                      <span className="text-xs text-[#9BA8AB]">{t('totalPoints')}</span>
                      <span className="font-mono font-black text-lg text-amber-300 bg-amber-400/20 px-3 py-1 rounded-lg border border-amber-400/50 shadow-sm">
                        {top3[0].points || 0} pts
                      </span>
                    </div>
                  </div>
                )}

                {/* 3rd Place: BRONZE (SMALLEST) */}
                {top3[2] && (
                  <div className="w-1/3 min-h-[175px] bg-[#11212D] border-2 border-amber-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-200 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-700 via-orange-400 to-amber-800" />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 via-orange-400 to-amber-700 text-white border border-amber-600 font-mono font-black text-base flex items-center justify-center shadow-md">
                          3
                        </div>
                        <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-700/20 border border-amber-600/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Medal className="w-3 h-3 text-amber-500" />
                          <span>{t('thirdPlaceBadge')}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9BA8AB] uppercase tracking-wider block font-semibold">
                        {isRtl ? 'المركز الثالث' : '3rd Place'}
                      </span>
                      <h4 className="text-sm font-bold text-amber-100 truncate mt-0.5" title={top3[2].username}>
                        {top3[2].username}
                      </h4>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#253745] flex items-center justify-between">
                      <span className="text-[10px] text-[#9BA8AB]">{t('totalPoints')}</span>
                      <span className="font-mono font-black text-sm text-amber-400 bg-amber-700/20 px-2 py-0.5 rounded-lg border border-amber-600/40">
                        {top3[2].points || 0} pts
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* MOBILE PODIUM SHOWCASE (sm:hidden): 3 Ranked Podium Cards */}
              <div className="sm:hidden space-y-2">
                {/* 1st Place Mobile */}
                {top3[0] && (
                  <div className="bg-gradient-to-r from-amber-500/20 via-[#11212D] to-amber-500/10 border-2 border-amber-400/90 rounded-xl p-3.5 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-[#06141B] ring-2 ring-amber-300 font-mono font-black text-base flex items-center justify-center shrink-0 shadow-md">
                          1
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9.5px] uppercase font-black text-amber-300 bg-amber-400/20 border border-amber-400/50 px-2 py-0.2 rounded-full inline-flex items-center gap-1 mb-0.5">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>{t('seasonChampionBadge')}</span>
                          </span>
                          <h4 className="text-sm font-black text-white truncate">
                            {top3[0].username}
                          </h4>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-base text-amber-300 block">
                          {top3[0].points || 0} pts
                        </span>
                        <span className="text-[9px] text-amber-300/80 font-bold uppercase">#{1} {t('rank')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2nd & 3rd Place Mobile Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {top3[1] && (
                    <div className="bg-[#11212D] border border-slate-300/60 rounded-xl p-2.5 shadow-md">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-200 to-slate-400 text-[#06141B] font-mono font-black text-xs flex items-center justify-center shrink-0 shadow">
                          2
                        </div>
                        <span className="text-[9px] font-bold text-slate-200 bg-slate-300/15 border border-slate-300/30 px-1.5 py-0.2 rounded-full truncate">
                          {t('runnerUpBadge')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 truncate">
                        {top3[1].username}
                      </h4>
                      <span className="font-mono font-bold text-xs text-slate-200 block mt-1">
                        {top3[1].points || 0} pts
                      </span>
                    </div>
                  )}

                  {top3[2] && (
                    <div className="bg-[#11212D] border border-amber-700/60 rounded-xl p-2.5 shadow-md">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 via-orange-400 to-amber-700 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow">
                          3
                        </div>
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-700/20 border border-amber-600/40 px-1.5 py-0.2 rounded-full truncate">
                          {t('thirdPlaceBadge')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-amber-200 truncate">
                        {top3[2].username}
                      </h4>
                      <span className="font-mono font-bold text-xs text-amber-400 block mt-1">
                        {top3[2].points || 0} pts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MOBILE VIEW: Full List Cards (sm:hidden)                                  */}
          {/* ========================================================================= */}
          <div className="space-y-2.5 sm:hidden">
            {approvedUsers.map((user, index) => {
              const rank = index + 1;
              const place = getPlaceConfig(rank);
              const stats = userStats[user.username] || { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };

              return (
                <div 
                  key={user.username}
                  className={`p-3.5 rounded-xl transition-all duration-200 flex flex-col gap-2.5 ${place.cardBg}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Place-Significant Number Badge */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-sm ${place.numberBadge}`}>
                        {rank}
                      </div>

                      {/* User Avatar & Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${place.avatarBg}`}>
                          {user.username.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs sm:text-sm truncate block ${place.textAccent}`}>
                              {user.username}
                            </span>
                            {place.icon}
                            {place.tagPill && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full inline-block ${place.tagPill}`}>
                                {place.title}
                              </span>
                            )}
                            {isAdmin && onRenameUser && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMember(user);
                                }}
                                className="text-[#9BA8AB] hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                                title={t('changeMemberName')}
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-[#9BA8AB] flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-[#9BA8AB]" />
                            {t('memberBadge')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Points Badge */}
                    <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs sm:text-sm ${place.pointsBadge}`}>
                      <Star className="w-3.5 h-3.5 shrink-0" />
                      <span>{user.points || 0} pts</span>
                    </div>
                  </div>

                  {/* Tie-Breaker Sub-Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#253745] text-[10px] text-[#9BA8AB]">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-[#9BA8AB]" />
                      <span>{t('exactScoresCount')}: <strong className="text-[#CCD0CF] font-mono font-medium">{stats.exactScoreCount}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#9BA8AB]" />
                      <span>MVP: <strong className="text-[#CCD0CF] font-mono font-medium">{stats.correctMvpCount}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#9BA8AB]" />
                      <span>{t('scorersCount')}: <strong className="text-[#CCD0CF] font-mono font-medium">{stats.correctScorersCount}</strong></span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* TABLET & DESKTOP VIEW: Clean Table with Significant Place Colors & Numbers */}
          {/* ========================================================================= */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-[#253745]">
            <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} border-collapse`}>
              <thead>
                <tr className="bg-[#06141B] border-b border-[#253745] text-[#9BA8AB] text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{t('rank')}</th>
                  <th className="py-3 px-4">{t('member')}</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">{t('exactScoresCount')}</th>
                  <th className="py-3 px-4 text-center">{t('mvpCount')}</th>
                  <th className="py-3 px-4 text-center">{t('scorersCount')}</th>
                  <th className="py-3 px-4 text-center">{t('totalPoints')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#253745]">
                {approvedUsers.map((user, index) => {
                  const rank = index + 1;
                  const place = getPlaceConfig(rank);
                  const stats = userStats[user.username] || { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };

                  return (
                    <tr 
                      key={user.username} 
                      className={`transition-colors group text-xs sm:text-sm ${place.tableRowBg}`}
                    >
                      {/* Place-Significant Number Badge & Icon */}
                      <td className="py-3.5 px-4 font-bold font-mono">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs sm:text-sm shrink-0 shadow-sm ${place.numberBadge}`}>
                            {rank}
                          </div>
                          {place.icon}
                          {place.tagPill && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block shrink-0 ${place.tagPill}`}>
                              {place.title}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#CCD0CF]">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${place.avatarBg}`}>
                            {user.username.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`transition-colors truncate ${place.textAccent}`}>{user.username}</span>
                            {isAdmin && onRenameUser && (
                              <button
                                type="button"
                                onClick={() => setEditingMember(user)}
                                className="text-[#9BA8AB] hover:text-white p-1 rounded-md hover:bg-[#253745] transition-colors cursor-pointer"
                                title={t('changeMemberName')}
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-normal text-[#9BA8AB]">
                        <span className="inline-flex items-center gap-1 bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] px-2 py-0.5 rounded">
                          <UserCheck className="w-3 h-3 text-[#9BA8AB]" />
                          <span>{t('memberBadge')}</span>
                        </span>
                      </td>

                      {/* Exact Scores column */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-[#CCD0CF]">
                          {stats.exactScoreCount}
                        </span>
                      </td>

                      {/* MVP Tie-breaker column */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-[#CCD0CF]">
                          {stats.correctMvpCount}
                        </span>
                      </td>

                      {/* Scorers Tie-breaker column */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-[#CCD0CF]">
                          {stats.correctScorersCount}
                        </span>
                      </td>

                      {/* Total Points with place color */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        <div className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded-lg mx-auto w-fit font-mono ${place.pointsBadge}`}>
                          <Star className="w-3.5 h-3.5 shrink-0" />
                          <span>{user.points || 0}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* STANDINGS TIER LEGEND: Explaining the Place Colors & Qualification Spots    */}
          {/* ========================================================================= */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 pt-3 border-t border-[#253745] text-[11px] text-[#9BA8AB]">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-[9px] font-black text-[#06141B]">1</span>
              <span className="text-amber-300 font-semibold">{t('seasonChampionBadge')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center text-[9px] font-black text-[#06141B]">2</span>
              <span className="text-slate-200 font-semibold">{t('runnerUpBadge')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-[9px] font-black text-white">3</span>
              <span className="text-amber-400 font-semibold">{t('thirdPlaceBadge')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-[9px] font-bold text-cyan-300 font-mono">4-5</span>
              <span className="text-cyan-300 font-medium">UCL Elite</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[9px] font-bold text-[#CCD0CF] font-mono">6+</span>
              <span className="text-[#9BA8AB]">{t('member')}</span>
            </div>
          </div>
        </>
      )}

      {/* 1. Main Past Seasons Archive Modal */}
      <LeaderboardArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        seasons={archivedSeasons}
        currentUser={currentUser || null}
        onOpenAddPastSeason={() => {
          setEditingSeason(null);
          setIsAddPastSeasonOpen(true);
        }}
        onEditSeason={(season) => {
          setEditingSeason(season);
          setIsAddPastSeasonOpen(true);
        }}
        onDeleteSeason={async (seasonId) => {
          if (onDeleteArchivedSeason) {
            await onDeleteArchivedSeason(seasonId);
          }
        }}
      />

      {/* 2. Admin Finish & Archive Current Season Modal */}
      {isAdmin && onFinishCurrentSeason && (
        <FinishCurrentSeasonModal
          isOpen={isFinishSeasonOpen}
          onClose={() => setIsFinishSeasonOpen(false)}
          approvedUsers={approvedUsers}
          onConfirmFinish={async (season, shouldResetPoints) => {
            await onFinishCurrentSeason(season, shouldResetPoints);
            setIsFinishSeasonOpen(false);
            setIsArchiveOpen(true);
          }}
        />
      )}

      {/* 3. Admin Add / Edit Past Season Modal */}
      {isAdmin && onSaveArchivedSeason && (
        <AddPastSeasonModal
          isOpen={isAddPastSeasonOpen}
          onClose={() => {
            setIsAddPastSeasonOpen(false);
            setEditingSeason(null);
          }}
          initialSeason={editingSeason}
          onSave={async (season) => {
            await onSaveArchivedSeason(season);
            setIsAddPastSeasonOpen(false);
            setEditingSeason(null);
            setIsArchiveOpen(true);
          }}
        />
      )}

      {/* 4. Admin Edit Member Name Modal */}
      {isAdmin && editingMember && onRenameUser && (
        <EditMemberNameModal
          isOpen={Boolean(editingMember)}
          onClose={() => setEditingMember(null)}
          targetUser={editingMember}
          existingUsers={users}
          onRenameUser={async (oldName, newName) => {
            await onRenameUser(oldName, newName);
          }}
        />
      )}

      {/* 5. Admin Standings Card & Download Modal */}
      {isAdmin && isStandingsModalOpen && (
        <StandingsCardModal
          isOpen={isStandingsModalOpen}
          onClose={() => {
            setIsStandingsModalOpen(false);
            setStandingsModalAction(null);
          }}
          users={approvedUsers}
          userStats={userStats}
          initialAction={standingsModalAction}
        />
      )}
    </div>
  );
};
