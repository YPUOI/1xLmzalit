import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

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
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء',
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="ucl-card p-5 sm:p-6 rounded-3xl max-w-sm w-full border border-rose-500/40 shadow-2xl text-center space-y-4 my-auto relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${
          isDestructive 
            ? 'bg-rose-950/80 border-rose-500/40 text-rose-400 shadow-lg shadow-rose-950/50' 
            : 'bg-amber-950/80 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-950/50'
        }`}>
          {isDestructive ? (
            <Trash2 className="w-7 h-7 animate-bounce" />
          ) : (
            <AlertTriangle className="w-7 h-7" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-black text-white mb-1.5">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer min-h-[44px] active:scale-95 border border-slate-700"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition cursor-pointer min-h-[44px] active:scale-95 shadow-lg flex items-center justify-center gap-1.5 ${
              isDestructive
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-yellow-500/30'
            }`}
          >
            {isDestructive && <Trash2 className="w-4 h-4 shrink-0" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
