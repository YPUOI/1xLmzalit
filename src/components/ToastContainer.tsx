import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl shadow-2xl border backdrop-blur-lg animate-in slide-in-from-top-3 duration-200 text-right ${
              isSuccess
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
                : isError
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
                : 'bg-slate-900/95 border-blue-500/50 text-blue-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : isError ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-black leading-snug">{toast.message}</span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0 cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
