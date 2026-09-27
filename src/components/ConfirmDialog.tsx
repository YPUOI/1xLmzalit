import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  const { t, isRtl } = useLanguage();

  if (!isOpen) return null;

  const resolvedConfirmText = confirmText || t('confirm');
  const resolvedCancelText = cancelText || t('cancel');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150" dir={isRtl ? 'rtl' : 'ltr'}>
      <div 
        className="ucl-card p-5 sm:p-6 rounded-2xl max-w-sm w-full border border-[#253745] bg-[#11212D] text-center space-y-4 my-auto relative shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onCancel}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-[#9BA8AB] hover:text-[#CCD0CF] p-1 rounded-lg hover:bg-[#253745] transition-colors duration-200 cursor-pointer`}
          aria-label={t('close')}
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center border ${
          isDestructive 
            ? 'bg-rose-950/60 border-rose-500/30 text-rose-400' 
            : 'bg-[#253745] border-[#4A5C6A] text-[#CCD0CF]'
        }`}>
          {isDestructive ? (
            <Trash2 className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-[#CCD0CF] mb-1">{title}</h3>
          <p className="text-xs text-[#9BA8AB] leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] font-semibold text-xs transition-all duration-200 cursor-pointer active:scale-[0.98] border border-[#253745]"
          >
            {resolvedCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-[#CCD0CF] hover:bg-white text-[#06141B]'
            }`}
          >
            {isDestructive && <Trash2 className="w-3.5 h-3.5 shrink-0" />}
            <span>{resolvedConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
