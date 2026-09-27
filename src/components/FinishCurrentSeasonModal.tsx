import React, { useState } from 'react';
import { 
  X, 
  Trophy, 
  Crown, 
  Medal, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Save, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { AppUser, ArchivedSeason, ArchivedSeasonEntry } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getAutoBadgeForRank } from './AddPastSeasonModal';

interface FinishCurrentSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvedUsers: AppUser[];
  onConfirmFinish: (season: ArchivedSeason, shouldResetPoints: boolean) => Promise<void>;
}

export const FinishCurrentSeasonModal: React.FC<FinishCurrentSeasonModalProps> = ({
  isOpen,
  onClose,
  approvedUsers,
  onConfirmFinish,
}) => {
  const { t, isRtl } = useLanguage();

  const [seasonDate, setSeasonDate] = useState<string>('2026/2027');
  const [seasonTitle, setSeasonTitle] = useState<string>('UEFA Champions League 2026/2027');
  const [resetPoints, setResetPoints] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanSeasonDate = seasonDate.trim();
    if (!cleanSeasonDate) {
      setErrorMsg(t('fillRequiredSeasonFields'));
      return;
    }

    if (approvedUsers.length === 0) {
      setErrorMsg(t('noApprovedUsers'));
      return;
    }

    setIsSubmitting(true);
    try {
      const seasonId = `season_${cleanSeasonDate.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      
      const entries: ArchivedSeasonEntry[] = approvedUsers.map((user, idx) => ({
        rank: idx + 1,
        playerName: user.username,
        points: user.points || 0,
        badge: getAutoBadgeForRank(idx + 1, isRtl),
      }));

      // Title and Notes are completely optional; never pass undefined to Firestore!
      const payload: ArchivedSeason = {
        id: seasonId,
        seasonDate: cleanSeasonDate,
        archivedAt: new Date().toISOString(),
        totalParticipants: entries.length,
        entries,
        ...(seasonTitle.trim() ? { title: seasonTitle.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };

      await onConfirmFinish(payload, resetPoints);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error finalizing season');
    } finally {
      setIsSubmitting(false);
    }
  };

  const top3 = approvedUsers.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-2xl my-6 bg-[#11212D] border border-[#253745] rounded-2xl shadow-2xl p-5 sm:p-7 overflow-hidden text-[#CCD0CF]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#253745]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <Crown className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                {t('finishSeasonModalTitle')}
              </h3>
              <p className="text-xs text-[#9BA8AB] mt-0.5">
                {t('finishSeasonModalDesc')}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Season Date Input */}
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
                placeholder="2026/2027"
                className="w-full bg-[#06141B] border border-[#253745] focus:border-[#4A5C6A] text-[#CCD0CF] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none font-mono transition-colors"
                required
              />
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
                placeholder="UEFA Champions League 2026/2027"
                className="w-full bg-[#06141B] border border-[#253745] focus:border-[#4A5C6A] text-[#CCD0CF] text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Notes field */}
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

          {/* Current Standings Preview */}
          <div className="bg-[#06141B] p-4 rounded-xl border border-[#253745]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#CCD0CF]" />
                <span>{t('currentSeasonLeaderboard')} ({approvedUsers.length} {t('seasonParticipants')})</span>
              </span>
              <span className="text-[11px] font-mono text-[#9BA8AB]">
                {t('finalStandingsCount')}: {approvedUsers.length}
              </span>
            </div>

            {/* Top 3 Snapshot */}
            {top3.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                {top3.map((u, i) => (
                  <div
                    key={u.username}
                    className="bg-[#11212D] border border-[#253745] p-2.5 rounded-lg flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] flex items-center justify-center font-bold text-xs shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-[#CCD0CF] truncate block">
                        {u.username}
                      </span>
                      <span className="text-[10px] text-[#9BA8AB] font-mono">
                        {u.points || 0} pts • {getAutoBadgeForRank(i + 1, isRtl)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#9BA8AB] text-center py-2">
                {t('noApprovedUsers')}
              </div>
            )}

            <p className="text-[11px] text-[#9BA8AB] leading-relaxed">
              {isRtl
                ? 'سيتم توثيق وترتيب جميع المشاركين بدقة وحفظهم كمرجع تاريخي دائم في قائمة الأرشيف.'
                : 'All ranked members will be permanently catalogued as an immutable record in the historical archive.'}
            </p>
          </div>

          {/* Optional Points Reset Checkbox */}
          <div className="p-3.5 rounded-xl bg-[#253745]/30 border border-[#253745] flex items-start gap-3">
            <input
              type="checkbox"
              id="resetPointsCheck"
              checked={resetPoints}
              onChange={e => setResetPoints(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-[#4A5C6A] bg-[#06141B] text-[#CCD0CF] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="resetPointsCheck" className="text-xs text-[#CCD0CF] cursor-pointer select-none">
              <span className="font-semibold block flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#CCD0CF]" />
                <span>{t('resetPointsCheckbox')}</span>
              </span>
              <span className="text-[10px] text-[#9BA8AB] block mt-0.5">
                {isRtl
                  ? 'إذا تركت هذا الخيار غير محدد، ستبقى نقاط الأعضاء كما هي دون تغيير.'
                  : 'If left unchecked, member current points will remain untouched.'}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#253745]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#9BA8AB] hover:text-white bg-[#253745] hover:bg-[#4A5C6A] rounded-xl transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || approvedUsers.length === 0}
              className="px-5 py-2 text-xs font-bold text-[#06141B] bg-[#CCD0CF] hover:bg-white rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? t('loading') : t('confirmFinishAndArchive')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
