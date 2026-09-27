import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Trophy, 
  Save, 
  Calendar, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Award
} from 'lucide-react';
import { ArchivedSeason, ArchivedSeasonEntry } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const getAutoBadgeForRank = (rank: number, isRtl: boolean = false): string => {
  if (isRtl) {
    switch (rank) {
      case 1: return 'بطل الموسم 🏆';
      case 2: return 'الوصيف 🥈';
      case 3: return 'المركز الثالث 🥉';
      case 4: return 'المربع الذهبي ⭐';
      case 5: return 'المركز الخامس 🌟';
      case 6: return 'المركز السادس 🎯';
      case 7: return 'المركز السابع 🎖️';
      case 8: return 'المركز الثامن 🏅';
      case 9: return 'المركز التاسع ✨';
      case 10: return 'المركز العاشر 🔥';
      default: return '';
    }
  } else {
    switch (rank) {
      case 1: return 'Champion 🏆';
      case 2: return 'Runner-up 🥈';
      case 3: return '3rd Place 🥉';
      case 4: return 'Top 4 ⭐';
      case 5: return 'Top 5 🌟';
      case 6: return 'Top 6 🎯';
      case 7: return 'Top 7 🎖️';
      case 8: return 'Top 8 🏅';
      case 9: return 'Top 9 ✨';
      case 10: return 'Top 10 🔥';
      default: return '';
    }
  }
};

interface AddPastSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (season: ArchivedSeason) => Promise<void>;
  initialSeason?: ArchivedSeason | null;
}

export const AddPastSeasonModal: React.FC<AddPastSeasonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSeason,
}) => {
  const { t, isRtl } = useLanguage();

  const [seasonDate, setSeasonDate] = useState<string>('');
  const [seasonTitle, setSeasonTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [entries, setEntries] = useState<ArchivedSeasonEntry[]>([
    { rank: 1, playerName: '', points: 0, badge: getAutoBadgeForRank(1, isRtl) },
    { rank: 2, playerName: '', points: 0, badge: getAutoBadgeForRank(2, isRtl) },
    { rank: 3, playerName: '', points: 0, badge: getAutoBadgeForRank(3, isRtl) },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialSeason) {
      setSeasonDate(initialSeason.seasonDate || '');
      setSeasonTitle(initialSeason.title || '');
      setNotes(initialSeason.notes || '');
      if (initialSeason.entries && initialSeason.entries.length > 0) {
        setEntries(initialSeason.entries.map((e, idx) => ({
          rank: e.rank || idx + 1,
          playerName: e.playerName || '',
          points: e.points ?? 0,
          badge: e.badge || (idx < 10 ? getAutoBadgeForRank(idx + 1, isRtl) : ''),
        })));
      } else {
        setEntries([
          { rank: 1, playerName: '', points: 0, badge: getAutoBadgeForRank(1, isRtl) },
          { rank: 2, playerName: '', points: 0, badge: getAutoBadgeForRank(2, isRtl) },
          { rank: 3, playerName: '', points: 0, badge: getAutoBadgeForRank(3, isRtl) },
        ]);
      }
    } else {
      setSeasonDate('2025/2026');
      setSeasonTitle('');
      setNotes('');
      setEntries([
        { rank: 1, playerName: '', points: 0, badge: getAutoBadgeForRank(1, isRtl) },
        { rank: 2, playerName: '', points: 0, badge: getAutoBadgeForRank(2, isRtl) },
        { rank: 3, playerName: '', points: 0, badge: getAutoBadgeForRank(3, isRtl) },
      ]);
    }
    setErrorMsg(null);
  }, [initialSeason, isOpen, isRtl]);

  if (!isOpen) return null;

  // Add new player row with auto rank and badge up to 10
  const handleAddRow = () => {
    setEntries(prev => {
      const nextRank = prev.length + 1;
      return [
        ...prev,
        {
          rank: nextRank,
          playerName: '',
          points: 0,
          badge: nextRank <= 10 ? getAutoBadgeForRank(nextRank, isRtl) : '',
        },
      ];
    });
  };

  // Remove player row and resequence all positions 1..N so standings are always right
  const handleRemoveRow = (index: number) => {
    setEntries(prev => {
      const remaining = prev.filter((_, i) => i !== index);
      return remaining.map((entry, idx) => {
        const newRank = idx + 1;
        // Keep custom badge if typed, or update to corresponding auto badge for 1..10
        const prevAuto = getAutoBadgeForRank(entry.rank, isRtl);
        const hadAutoBadge = !entry.badge || entry.badge === prevAuto;
        return {
          ...entry,
          rank: newRank,
          badge: hadAutoBadge && newRank <= 10 ? getAutoBadgeForRank(newRank, isRtl) : (hadAutoBadge ? '' : entry.badge),
        };
      });
    });
  };

  // Move player up (swapping with player above, matching new positions)
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setEntries(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      // Re-align all ranks and update badges to match their new positions
      return copy.map((entry, idx) => {
        const newRank = idx + 1;
        const prevAuto = getAutoBadgeForRank(entry.rank, isRtl);
        const hadAuto = !entry.badge || entry.badge === prevAuto;
        return {
          ...entry,
          rank: newRank,
          badge: hadAuto && newRank <= 10 ? getAutoBadgeForRank(newRank, isRtl) : (hadAuto ? '' : entry.badge),
        };
      });
    });
  };

  // Move player down (swapping with player below, matching new positions)
  const handleMoveDown = (index: number) => {
    if (index >= entries.length - 1) return;
    setEntries(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      // Re-align all ranks and update badges to match their new positions
      return copy.map((entry, idx) => {
        const newRank = idx + 1;
        const prevAuto = getAutoBadgeForRank(entry.rank, isRtl);
        const hadAuto = !entry.badge || entry.badge === prevAuto;
        return {
          ...entry,
          rank: newRank,
          badge: hadAuto && newRank <= 10 ? getAutoBadgeForRank(newRank, isRtl) : (hadAuto ? '' : entry.badge),
        };
      });
    });
  };

  const handleEntryChange = (index: number, field: keyof ArchivedSeasonEntry, value: any) => {
    setEntries(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  // Sort by entered rank numbers and re-sequence sequentially
  const handleAutoSort = () => {
    setEntries(prev => {
      const sorted = [...prev].sort((a, b) => (Number(a.rank) || 0) - (Number(b.rank) || 0));
      return sorted.map((entry, idx) => {
        const newRank = idx + 1;
        const prevAuto = getAutoBadgeForRank(entry.rank, isRtl);
        const hadAuto = !entry.badge || entry.badge === prevAuto;
        return {
          ...entry,
          rank: newRank,
          badge: hadAuto && newRank <= 10 ? getAutoBadgeForRank(newRank, isRtl) : (hadAuto ? '' : entry.badge),
        };
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanSeasonDate = seasonDate.trim();
    if (!cleanSeasonDate) {
      setErrorMsg(t('fillRequiredSeasonFields'));
      return;
    }

    const validEntries = entries
      .filter(item => item.playerName.trim().length > 0)
      .map((item, idx) => {
        const rankNum = idx + 1;
        return {
          rank: rankNum,
          playerName: item.playerName.trim(),
          points: Number(item.points) || 0,
          badge: item.badge ? item.badge.trim() : (rankNum <= 10 ? getAutoBadgeForRank(rankNum, isRtl) : ''),
        };
      });

    if (validEntries.length === 0) {
      setErrorMsg(t('fillRequiredSeasonFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      const seasonId = initialSeason?.id || `season_${cleanSeasonDate.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      
      // Title and Notes are completely optional; never pass undefined to Firestore!
      const payload: ArchivedSeason = {
        id: seasonId,
        seasonDate: cleanSeasonDate,
        archivedAt: initialSeason?.archivedAt || new Date().toISOString(),
        totalParticipants: validEntries.length,
        entries: validEntries,
        ...(seasonTitle.trim() ? { title: seasonTitle.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving season');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-3xl my-6 bg-[#11212D] border border-[#253745] rounded-2xl shadow-2xl p-5 sm:p-7 overflow-hidden text-[#CCD0CF]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#253745]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <Trophy className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                {initialSeason ? t('editPastSeasonBtn') : t('addPastSeasonModalTitle')}
              </h3>
              <p className="text-xs text-[#9BA8AB] mt-0.5">
                {t('addPastSeasonModalDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9BA8AB] hover:text-white hover:bg-[#253745] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Season Date and Title Row (Title is optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#CCD0CF]" />
                <span>{t('seasonDateLabel')} *</span>
              </label>
              <input
                type="text"
                value={seasonDate}
                onChange={e => setSeasonDate(e.target.value)}
                placeholder={t('seasonDatePlaceholder')}
                className="w-full bg-[#06141B] border border-[#253745] focus:border-[#4A5C6A] text-[#CCD0CF] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none transition-colors font-mono"
                required
              />
              <span className="text-[10px] text-[#9BA8AB] mt-1 block">
                {isRtl ? 'مثال: 2026/2027 أو 2025/2026' : 'e.g. 2026/2027 or 2025/2026'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#CCD0CF]" />
                <span>{t('seasonTitleLabel')} ({isRtl ? 'اختياري' : 'Optional'})</span>
              </label>
              <input
                type="text"
                value={seasonTitle}
                onChange={e => setSeasonTitle(e.target.value)}
                placeholder={t('seasonTitlePlaceholder')}
                className="w-full bg-[#06141B] border border-[#253745] focus:border-[#4A5C6A] text-[#CCD0CF] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Notes field (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5">
              {t('notesLabel')} ({isRtl ? 'اختياري' : 'Optional'})
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full bg-[#06141B] border border-[#253745] focus:border-[#4A5C6A] text-[#CCD0CF] text-xs sm:text-sm rounded-xl px-3.5 py-2 outline-none transition-colors"
            />
          </div>

          {/* Player Standings Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#CCD0CF]" />
                <span>{t('tabLeaderboard')} ({entries.filter(e => e.playerName.trim()).length} {t('seasonParticipants')})</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoSort}
                  className="text-[11px] bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] px-2.5 py-1 rounded-lg border border-[#4A5C6A] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Sort by Rank"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>{isRtl ? 'إعادة الترتيب التلقائي' : 'Auto Sequence'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-[11px] bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] px-3 py-1 rounded-lg border border-[#4A5C6A] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('addPlayerRowBtn')}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {entries.map((entry, index) => {
                const isChampion = entry.rank === 1;
                const isRunnerUp = entry.rank === 2;
                const isThird = entry.rank === 3;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all ${
                      isChampion
                        ? 'bg-[#11212D] border-amber-400/60 shadow-md'
                        : isRunnerUp
                        ? 'bg-[#11212D] border-slate-300/50'
                        : isThird
                        ? 'bg-[#11212D] border-amber-700/50'
                        : 'bg-[#06141B] border-[#253745]'
                    }`}
                  >
                    {/* Position Re-order Controls (Up / Down) */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 hover:bg-[#253745] text-[#9BA8AB] hover:text-white rounded disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === entries.length - 1}
                        className="p-1 hover:bg-[#253745] text-[#9BA8AB] hover:text-white rounded disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Position / Rank Indicator */}
                    <div className="w-12 sm:w-14 shrink-0 text-center">
                      <span className={`inline-block font-mono font-bold text-xs sm:text-sm px-2 py-1 rounded-lg ${
                        isChampion 
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                          : isRunnerUp
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                          : isThird
                          ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40'
                          : 'bg-[#11212D] text-[#CCD0CF] border border-[#253745]'
                      }`}>
                        #{entry.rank}
                      </span>
                    </div>

                    {/* Player Name */}
                    <div className="flex-1 min-w-[110px]">
                      <input
                        type="text"
                        value={entry.playerName}
                        onChange={e => handleEntryChange(index, 'playerName', e.target.value)}
                        placeholder={t('playerNameHeader')}
                        className="w-full bg-[#11212D] border border-[#253745] focus:border-[#4A5C6A] text-xs sm:text-sm text-[#CCD0CF] rounded-lg py-1.5 px-3 outline-none"
                        required
                      />
                    </div>

                    {/* Points */}
                    <div className="w-18 sm:w-22 shrink-0">
                      <input
                        type="number"
                        value={entry.points ?? 0}
                        onChange={e => handleEntryChange(index, 'points', parseInt(e.target.value) || 0)}
                        placeholder={t('playerPointsHeader')}
                        className="w-full bg-[#11212D] border border-[#253745] focus:border-[#4A5C6A] text-center font-mono text-xs sm:text-sm text-[#CCD0CF] rounded-lg py-1.5 px-1 outline-none"
                        title={t('playerPointsHeader')}
                      />
                    </div>

                    {/* Badge (Auto assigned until 10, or custom) */}
                    <div className="w-28 sm:w-36 shrink-0">
                      <input
                        type="text"
                        value={entry.badge || ''}
                        onChange={e => handleEntryChange(index, 'badge', e.target.value)}
                        placeholder={entry.rank <= 10 ? getAutoBadgeForRank(entry.rank, isRtl) : t('playerBadgeHeader')}
                        className="w-full bg-[#11212D] border border-[#253745] focus:border-[#4A5C6A] text-[11px] sm:text-xs text-[#CCD0CF] rounded-lg py-1.5 px-2 outline-none font-medium"
                      />
                    </div>

                    {/* Delete row */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="p-1.5 text-rose-400/70 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                      title={t('removePlayerRow')}
                      disabled={entries.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[#9BA8AB] mt-2">
              {isRtl 
                ? 'يتم تعيين الأوسمة تلقائياً للمراكز من 1 إلى 10، وتحديث الترتيب فورياً عند حذف أو نقل أي لاعب.'
                : 'Badges are automatically assigned up to Rank 10, and standings instantly re-sequence when players are deleted or moved.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#253745]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#9BA8AB] hover:text-white bg-[#253745] hover:bg-[#4A5C6A] rounded-xl transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-[#06141B] bg-[#CCD0CF] hover:bg-white rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? t('loading') : t('saveSeasonBtn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
