import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trophy, 
  Crown, 
  Medal, 
  Archive, 
  Plus, 
  Calendar, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  Star, 
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { ArchivedSeason, AppUser } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface LeaderboardArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  seasons: ArchivedSeason[];
  currentUser: AppUser | null;
  onOpenAddPastSeason: () => void;
  onEditSeason: (season: ArchivedSeason) => void;
  onDeleteSeason: (seasonId: string) => Promise<void>;
}

export const LeaderboardArchiveModal: React.FC<LeaderboardArchiveModalProps> = ({
  isOpen,
  onClose,
  seasons,
  currentUser,
  onOpenAddPastSeason,
  onEditSeason,
  onDeleteSeason,
}) => {
  const { t, isRtl } = useLanguage();
  const isAdmin = currentUser?.role === 'admin';

  // Selected season (defaults to first available or null)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Ordered seasons:
  // Default 'desc' (Newest -> Oldest):
  // - In English & French (LTR):
  //   Left: Newest, Right: Oldest.
  //   Starting from the right: Oldest -> moving left to Newest! (Matches: "start from right from oldest to left to newest")
  // - In Arabic (RTL):
  //   Right: Newest, Left: Oldest.
  //   Starting from the right: Newest -> moving left to Oldest! (Reversed for Arabic)
  const sortedSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => {
      const cmp = (b.seasonDate || '').localeCompare(a.seasonDate || '');
      return sortOrder === 'desc' ? cmp : -cmp;
    });
  }, [seasons, sortOrder]);

  // Default to newest season initially so the user views the latest results
  const newestSeason = useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    return [...seasons].sort((a, b) => (b.seasonDate || '').localeCompare(a.seasonDate || ''))[0];
  }, [seasons]);

  // Active season
  const activeSeason = useMemo(() => {
    if (!sortedSeasons || sortedSeasons.length === 0) return null;
    if (selectedSeasonId) {
      const found = sortedSeasons.find(s => s.id === selectedSeasonId);
      if (found) return found;
    }
    return sortedSeasons[0] || newestSeason;
  }, [sortedSeasons, selectedSeasonId, newestSeason]);

  // Filtered entries for search
  const filteredEntries = useMemo(() => {
    if (!activeSeason || !activeSeason.entries) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return activeSeason.entries;
    return activeSeason.entries.filter(e => 
      e.playerName.toLowerCase().includes(query) ||
      (e.badge && e.badge.toLowerCase().includes(query)) ||
      String(e.rank).includes(query)
    );
  }, [activeSeason, searchQuery]);

  if (!isOpen) return null;

  const handleDelete = async (seasonId: string) => {
    if (!window.confirm(t('deleteSeasonConfirmMsg'))) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDeleteSeason(seasonId);
      if (selectedSeasonId === seasonId) {
        setSelectedSeasonId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const top3 = activeSeason ? activeSeason.entries.slice(0, 3) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-4xl my-4 bg-[#11212D] border border-[#253745] rounded-2xl shadow-2xl overflow-hidden text-[#CCD0CF] flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#253745] bg-[#11212D]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <Archive className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-[#CCD0CF]">
                  {t('archiveTitle')}
                </h2>
                <span className="text-[10px] bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] px-2 py-0.5 rounded-full font-mono">
                  {seasons.length} {t('pastSeasonsCount')}
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB] mt-0.5">
                {t('archiveDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onOpenAddPastSeason}
                className="hidden sm:flex items-center gap-1.5 bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addPastSeasonBtn')}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#9BA8AB] hover:text-white hover:bg-[#253745] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Season Selector Tabs */}
          {sortedSeasons.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#9BA8AB] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t('selectSeason')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="text-[10px] bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] border border-[#4A5C6A] px-2 py-0.5 rounded-lg font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    title={isRtl ? 'تبديل ترتيب عرض المواسم' : 'Toggle seasons display order'}
                  >
                    <span>⇄</span>
                    <span>
                      {sortOrder === 'desc'
                        ? (isRtl ? 'الأحدث ← الأقدم' : 'Newest → Oldest')
                        : (isRtl ? 'الأقدم ← الأحدث' : 'Oldest → Newest')}
                    </span>
                  </button>
                </div>
                {isAdmin && (
                  <button
                    onClick={onOpenAddPastSeason}
                    className="sm:hidden flex items-center gap-1 text-[11px] font-bold text-[#06141B] bg-[#CCD0CF] px-2.5 py-1 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('addPastSeasonBtn')}</span>
                  </button>
                )}
              </div>

              {/* Scrollable Season Buttons - Respects user orientation (Oldest on right in EN/FR, on left in Arabic) */}
              <div 
                className="flex items-center gap-2 overflow-x-auto pb-2" 
                data-no-swipe 
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {sortedSeasons.map(season => {
                  const isSelected = activeSeason?.id === season.id;
                  return (
                    <button
                      key={season.id}
                      onClick={() => {
                        setSelectedSeasonId(season.id);
                        setSearchQuery('');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 border cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-[#CCD0CF] text-[#06141B] border-white shadow-lg font-bold'
                          : 'bg-[#06141B] text-[#9BA8AB] border-[#253745] hover:text-[#CCD0CF] hover:border-[#4A5C6A]'
                      }`}
                    >
                      <Trophy className={`w-3.5 h-3.5 ${isSelected ? 'text-[#06141B]' : 'text-[#CCD0CF]'}`} />
                      <span className="font-mono">{season.seasonDate}</span>
                      {season.entries && season.entries.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-black/20 text-[#06141B]' : 'bg-[#253745] text-[#9BA8AB]'
                        }`}>
                          {season.entries.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#06141B] rounded-2xl border border-[#253745] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] mx-auto">
                <Archive className="w-6 h-6 text-[#CCD0CF]" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-[#CCD0CF]">
                {t('noPastSeasons')}
              </h4>
              {isAdmin && (
                <div className="pt-2">
                  <button
                    onClick={onOpenAddPastSeason}
                    className="inline-flex items-center gap-2 bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('addPastSeasonBtn')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Season Details */}
          {activeSeason && (
            <div className="space-y-6">
              {/* Season Banner Card */}
              <div className="bg-[#06141B] p-4 sm:p-5 rounded-2xl border border-[#253745] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg sm:text-2xl font-black font-mono text-white tracking-wide">
                      {activeSeason.seasonDate}
                    </span>
                    {activeSeason.title && (
                      <span className="text-xs sm:text-sm font-semibold text-[#CCD0CF] bg-[#11212D] border border-[#253745] px-2.5 py-1 rounded-lg">
                        {activeSeason.title}
                      </span>
                    )}
                  </div>
                  {activeSeason.notes && (
                    <p className="text-xs text-[#9BA8AB] mt-1.5 italic">
                      "{activeSeason.notes}"
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[#9BA8AB]">
                    <span className="flex items-center gap-1 font-mono">
                      <Users className="w-3 h-3" />
                      <span>{activeSeason.entries.length} {t('seasonParticipants')}</span>
                    </span>
                    <span>•</span>
                    <span>{new Date(activeSeason.archivedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Admin Management Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditSeason(activeSeason)}
                      className="px-3 py-1.5 bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] rounded-xl text-xs font-semibold border border-[#4A5C6A] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t('editPastSeasonBtn')}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(activeSeason.id)}
                      disabled={isDeleting}
                      className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 rounded-xl text-xs font-semibold border border-rose-500/40 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('deletePastSeasonBtn')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* TOP 3 PODIUM: 1st BIGGER THAN 2nd, AND 2nd BIGGER THAN 3rd               */}
              {/* ========================================================================= */}
              {top3.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#CCD0CF] mb-1">
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>{isRtl ? 'منصة التتويج والمراكز الثلاثة الأولى' : 'Top 3 Podium Standings'}</span>
                    </span>
                    <span className="text-[11px] text-[#9BA8AB]">
                      {isRtl ? '1 > 2 > 3 بالترتيب' : 'Rank 1 > Rank 2 > Rank 3'}
                    </span>
                  </div>

                  {/* DESKTOP PODIUM (sm:flex): Tiered Height (1st Tallest/Biggest, 2nd Medium, 3rd Smallest) */}
                  <div className="hidden sm:flex items-end justify-center gap-4 pt-3 pb-1" dir="ltr">
                    
                    {/* 2nd Place: MEDIUM */}
                    {top3[1] ? (
                      <div className="w-1/3 min-h-[200px] bg-[#11212D] border-2 border-slate-300/50 rounded-2xl p-4.5 flex flex-col justify-between shadow-xl relative overflow-hidden transition-transform hover:-translate-y-1">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400" />
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-bold text-lg shadow-sm">
                              🥈
                            </div>
                            <span className="text-[11px] uppercase font-bold text-slate-200 bg-slate-300/15 border border-slate-300/30 px-2.5 py-0.5 rounded-full">
                              {top3[1].badge || t('runnerUpBadge')}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#9BA8AB] uppercase tracking-wider block font-semibold">
                            {isRtl ? 'المركز الثاني' : '2nd Place'}
                          </span>
                          <h4 className="text-base font-bold text-[#CCD0CF] truncate mt-0.5" title={top3[1].playerName}>
                            {top3[1].playerName}
                          </h4>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-[#253745] flex items-center justify-between">
                          <span className="text-[10px] text-[#9BA8AB]">{t('playerPointsHeader')}</span>
                          <span className="font-mono font-bold text-base text-slate-200">
                            {top3[1].points ?? 0} pts
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-1/3 min-h-[200px]" />
                    )}

                    {/* 1st Place: BIGGEST, TALLEST & MOST PROMINENT */}
                    {top3[0] && (
                      <div className="w-5/12 min-h-[265px] bg-gradient-to-b from-[#24394c] via-[#162737] to-[#11212D] border-2 border-amber-400 rounded-2xl p-6 flex flex-col justify-between shadow-2xl shadow-amber-500/15 relative overflow-hidden transition-transform hover:-translate-y-1 scale-105 z-10">
                        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500" />
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-14 h-14 rounded-2xl bg-amber-400/25 text-amber-300 border-2 border-amber-400/60 flex items-center justify-center font-bold text-2xl shadow-lg">
                              🥇
                            </div>
                            <span className="text-xs uppercase font-extrabold text-amber-300 bg-amber-400/20 border border-amber-400/40 px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5 text-amber-300" />
                              <span>{top3[0].badge || t('seasonChampionBadge')}</span>
                            </span>
                          </div>
                          <span className="text-[11px] text-amber-400/90 uppercase tracking-widest block font-bold">
                            {isRtl ? 'بطل الموسم الأول' : 'Grand Champion #1'}
                          </span>
                          <h4 className="text-xl sm:text-2xl font-black text-white truncate mt-1" title={top3[0].playerName}>
                            {top3[0].playerName}
                          </h4>
                        </div>
                        <div className="mt-4 pt-3 border-t border-amber-400/30 flex items-center justify-between">
                          <span className="text-xs text-amber-200/80 font-medium uppercase">{t('playerPointsHeader')}</span>
                          <span className="font-mono font-black text-xl sm:text-2xl text-amber-300">
                            {top3[0].points ?? 0} pts
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place: SMALLEST */}
                    {top3[2] ? (
                      <div className="w-1/3 min-h-[160px] bg-[#0c1822] border border-amber-700/50 rounded-2xl p-3.5 flex flex-col justify-between shadow-md relative overflow-hidden transition-transform hover:-translate-y-1">
                        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800" />
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-700/20 text-amber-400 border border-amber-700/40 flex items-center justify-center font-bold text-sm">
                              🥉
                            </div>
                            <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-700/15 border border-amber-700/30 px-2 py-0.5 rounded-full">
                              {top3[2].badge || t('thirdPlaceBadge')}
                            </span>
                          </div>
                          <span className="text-[9px] text-[#9BA8AB] uppercase tracking-wider block font-medium">
                            {isRtl ? 'المركز الثالث' : '3rd Place'}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-[#CCD0CF] truncate mt-0.5" title={top3[2].playerName}>
                            {top3[2].playerName}
                          </h4>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#253745] flex items-center justify-between">
                          <span className="text-[9px] text-[#9BA8AB]">{t('playerPointsHeader')}</span>
                          <span className="font-mono font-semibold text-sm text-amber-400">
                            {top3[2].points ?? 0} pts
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-1/3 min-h-[160px]" />
                    )}
                  </div>

                  {/* MOBILE PODIUM (sm:hidden): Stacked Vertically with Clear Scale Hierarchy (1st > 2nd > 3rd) */}
                  <div className="sm:hidden space-y-2.5">
                    {/* 1st Place: LARGEST */}
                    {top3[0] && (
                      <div className="bg-gradient-to-b from-[#1f3242] to-[#11212D] border-2 border-amber-400 rounded-2xl p-4 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-amber-400" />
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-amber-400/25 text-amber-300 border-2 border-amber-400/60 flex items-center justify-center font-bold text-xl shrink-0">
                              🥇
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-400/20 px-2 py-0.2 rounded-full inline-block mb-0.5">
                                {top3[0].badge || t('seasonChampionBadge')}
                              </span>
                              <h4 className="text-base font-black text-white truncate">
                                {top3[0].playerName}
                              </h4>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-lg text-amber-300 block">
                              {top3[0].points ?? 0} pts
                            </span>
                            <span className="text-[9px] text-amber-200/70 font-semibold uppercase">{t('rank')} #1</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2nd Place: MEDIUM */}
                    {top3[1] && (
                      <div className="bg-[#11212D] border border-slate-300/50 rounded-xl p-3 shadow-md relative overflow-hidden">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-bold text-base shrink-0">
                              🥈
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-300 font-semibold block">
                                {top3[1].badge || t('runnerUpBadge')}
                              </span>
                              <h4 className="text-sm font-bold text-[#CCD0CF] truncate">
                                {top3[1].playerName}
                              </h4>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-base text-slate-200 block">
                              {top3[1].points ?? 0} pts
                            </span>
                            <span className="text-[9px] text-[#9BA8AB]">{t('rank')} #2</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place: SMALLEST */}
                    {top3[2] && (
                      <div className="bg-[#0c1822] border border-amber-700/40 rounded-xl p-2.5 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-amber-700/20 text-amber-400 border border-amber-700/40 flex items-center justify-center font-bold text-xs shrink-0">
                              🥉
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] text-amber-400/80 font-medium block">
                                {top3[2].badge || t('thirdPlaceBadge')}
                              </span>
                              <h4 className="text-xs font-semibold text-[#CCD0CF] truncate">
                                {top3[2].playerName}
                              </h4>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-semibold text-xs text-amber-400 block">
                              {top3[2].points ?? 0} pts
                            </span>
                            <span className="text-[9px] text-[#9BA8AB]">{t('rank')} #3</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Standings Table with Search */}
              <div className="bg-[#06141B] rounded-2xl border border-[#253745] overflow-hidden">
                {/* Search Bar */}
                <div className="p-3 border-b border-[#253745] flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#9BA8AB] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlayerInArchive')}
                    className="w-full bg-transparent text-xs sm:text-sm text-[#CCD0CF] placeholder-[#9BA8AB]/60 outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-[#9BA8AB] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Table for Desktop & Tablet */}
                <div className="overflow-x-auto">
                  <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} border-collapse`}>
                    <thead>
                      <tr className="border-b border-[#253745] bg-[#11212D]/60 text-[#9BA8AB] text-[11px] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-4 w-16">{t('rank')}</th>
                        <th className="py-2.5 px-4">{t('member')}</th>
                        <th className="py-2.5 px-4">{t('playerBadgeHeader')}</th>
                        <th className="py-2.5 px-4 text-center">{t('totalPoints')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#253745] text-xs sm:text-sm">
                      {filteredEntries.map((entry, idx) => {
                        const isFirst = entry.rank === 1;
                        const isSecond = entry.rank === 2;
                        const isThird = entry.rank === 3;

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-[#253745]/30 transition-colors"
                          >
                            {/* Rank */}
                            <td className="py-2.5 px-4 font-mono font-bold">
                              {isFirst ? (
                                <span className="inline-flex items-center gap-1 text-amber-300">
                                  <Crown className="w-4 h-4" />
                                  <span>#1</span>
                                </span>
                              ) : isSecond ? (
                                <span className="inline-flex items-center gap-1 text-slate-300">
                                  <Medal className="w-4 h-4" />
                                  <span>#2</span>
                                </span>
                              ) : isThird ? (
                                <span className="inline-flex items-center gap-1 text-amber-500">
                                  <Medal className="w-4 h-4" />
                                  <span>#3</span>
                                </span>
                              ) : (
                                <span className="text-[#9BA8AB]">#{entry.rank}</span>
                              )}
                            </td>

                            {/* Player Name */}
                            <td className="py-2.5 px-4 font-semibold text-[#CCD0CF]">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isFirst 
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                                    : isSecond
                                    ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                                    : isThird
                                    ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40'
                                    : 'bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A]'
                                }`}>
                                  {entry.playerName.slice(0, 1).toUpperCase()}
                                </div>
                                <span>{entry.playerName}</span>
                              </div>
                            </td>

                            {/* Badge */}
                            <td className="py-2.5 px-4 text-xs text-[#9BA8AB]">
                              {entry.badge ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                  isFirst
                                    ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                                    : isSecond
                                    ? 'bg-slate-300/10 text-slate-200 border-slate-300/30'
                                    : isThird
                                    ? 'bg-amber-700/10 text-amber-400 border-amber-700/30'
                                    : 'bg-[#253745] text-[#CCD0CF] border-[#4A5C6A]'
                                }`}>
                                  {entry.badge}
                                </span>
                              ) : (
                                <span className="text-[#9BA8AB]/40">—</span>
                              )}
                            </td>

                            {/* Points */}
                            <td className="py-2.5 px-4 text-center">
                              <span className={`inline-flex items-center justify-center gap-1 font-mono font-bold px-2.5 py-0.5 rounded-lg text-xs border ${
                                isFirst
                                  ? 'bg-amber-400/20 text-amber-200 border-amber-400/40'
                                  : isSecond
                                  ? 'bg-slate-300/20 text-slate-100 border-slate-300/40'
                                  : isThird
                                  ? 'bg-amber-700/20 text-amber-300 border-amber-700/40'
                                  : 'bg-[#253745] text-[#CCD0CF] border-[#4A5C6A]'
                              }`}>
                                <Star className="w-3 h-3" />
                                <span>{entry.points ?? 0}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredEntries.length === 0 && (
                  <div className="p-6 text-center text-xs text-[#9BA8AB]">
                    {searchQuery ? t('noPredsFoundSearch') : t('noApprovedUsers')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#253745] bg-[#11212D] flex items-center justify-between text-xs text-[#9BA8AB] shrink-0">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#CCD0CF]" />
            <span>1xlmzalit Champions League Archive</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] rounded-xl font-semibold transition-colors cursor-pointer"
          >
            {t('closeModal')}
          </button>
        </div>
      </div>
    </div>
  );
};
