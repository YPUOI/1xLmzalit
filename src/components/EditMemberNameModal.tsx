import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  User, 
  Check, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { AppUser } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface EditMemberNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: AppUser | null;
  existingUsers: AppUser[];
  onRenameUser: (oldUsername: string, newUsername: string) => Promise<void>;
}

export const EditMemberNameModal: React.FC<EditMemberNameModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  existingUsers,
  onRenameUser,
}) => {
  const { t, isRtl } = useLanguage();

  const [newName, setNewName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (targetUser && isOpen) {
      setNewName(targetUser.username);
      setErrorMsg(null);
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = newName.trim();
    if (!trimmed || trimmed.length < 2) {
      setErrorMsg(t('nameInvalidError'));
      return;
    }

    if (trimmed.length > 50) {
      setErrorMsg(isRtl ? 'اسم المستخدم يجب ألا يتجاوز 50 حرفاً!' : 'Username cannot exceed 50 characters!');
      return;
    }

    if (trimmed === targetUser.username) {
      setErrorMsg(t('nameSameError'));
      return;
    }

    // Check if new name is already taken by another user
    const isTaken = existingUsers.some(
      u => u.username.toLowerCase() === trimmed.toLowerCase() && 
           u.username.toLowerCase() !== targetUser.username.toLowerCase()
    );

    if (isTaken) {
      setErrorMsg(t('authUsernameTaken'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onRenameUser(targetUser.username, trimmed);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('nameChangeError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isChanged = newName.trim() !== targetUser.username;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-md my-4 bg-[#11212D] border border-[#253745] rounded-2xl shadow-2xl overflow-hidden text-[#CCD0CF]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#253745] bg-[#06141B]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0">
              <Edit3 className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                {t('changeMemberName')}
              </h3>
              <p className="text-xs text-[#9BA8AB] mt-0.5">
                {t('changeMemberNameDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-[#9BA8AB] hover:text-white hover:bg-[#253745] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Current Member Overview Badge */}
          <div className="bg-[#06141B] p-3.5 rounded-xl border border-[#253745] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#253745] text-[#CCD0CF] font-bold text-sm flex items-center justify-center border border-[#4A5C6A] shrink-0">
                {targetUser.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#9BA8AB] block font-semibold">
                  {t('currentMemberName')}
                </span>
                <span className="font-bold text-sm text-white truncate block">
                  {targetUser.username}
                </span>
                <span className="text-[10.5px] text-[#9BA8AB] block mt-0.5">
                  <span className="text-[#9BA8AB]">{isRtl ? 'الاسم الأصلي الأول للدخول:' : 'Original login name:'} </span>
                  <span className="font-mono font-bold text-[#CCD0CF] bg-[#11212D] px-1.5 py-0.2 rounded border border-[#253745]">
                    {targetUser.originalUsername || targetUser.username}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-mono font-bold bg-[#11212D] text-[#CCD0CF] border border-[#253745] px-2.5 py-1 rounded-lg">
                {targetUser.points || 0} pts
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                targetUser.status === 'approved' 
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              }`}>
                {targetUser.status === 'approved' ? (isRtl ? 'مقبول' : 'Approved') : (isRtl ? 'معلق' : 'Pending')}
              </span>
            </div>
          </div>

          {/* New Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#CCD0CF] block">
              {t('newMemberNameLabel')} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={newName}
                onChange={e => {
                  setNewName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                disabled={isSubmitting}
                placeholder={t('newMemberNamePlaceholder')}
                className="w-full bg-[#06141B] border border-[#253745] focus:border-[#CCD0CF] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#9BA8AB]/50 outline-none transition-all"
                maxLength={50}
                autoFocus
              />
              {newName && (
                <button
                  type="button"
                  onClick={() => setNewName('')}
                  className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex items-center text-[#9BA8AB] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#9BA8AB] pt-1">
              <span>{isRtl ? 'الحد الأقصى: 50 حرفاً' : 'Max 50 characters'}</span>
              <span className="font-mono">{newName.trim().length}/50</span>
            </div>
          </div>

          {/* Seamless Transfer Notice */}
          <div className="bg-[#162737]/80 border border-[#253745] rounded-xl p-3 text-xs text-[#9BA8AB] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isRtl 
                ? `سيتمكن العضو من تسجيل الدخول دائماً باسمه الأصلي القديم (${targetUser.originalUsername || targetUser.username}) أو باسمه الجديد، مع الحفاظ على جميع توقعاته ونقاطه في جدول الترتيب.`
                : `The member will always be able to log in using their original name (${targetUser.originalUsername || targetUser.username}) or their new name, while all points and predictions are preserved.`}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#253745]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isChanged || !newName.trim()}
              className="px-5 py-2 bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('loading')}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{t('saveNewNameBtn')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
