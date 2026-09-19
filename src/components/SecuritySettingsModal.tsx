import React from 'react';
import { 
  X, 
  AlertCircle, 
  Wrench,
  Clock
} from 'lucide-react';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#080C19]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#10172A] p-6 sm:p-8 rounded-3xl max-w-md w-full border border-slate-800 relative text-right shadow-2xl">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 left-4 text-[#94A3B8] hover:text-white p-1 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Maintenance Badge & Icon */}
        <div className="flex flex-col items-center text-center justify-center pt-2 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            <Wrench className="w-8 h-8 animate-pulse" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>تحت الصيانة</span>
          </div>
          <h3 className="text-xl font-black text-white">قسم الحماية والبصمة</h3>
          <p className="text-xs text-[#94A3B8] mt-1">إعدادات الأمان والمصادقة الحيوية</p>
        </div>

        {/* Under Maintenance Notice Box */}
        <div className="bg-[#080C19] border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-right space-y-3 mb-6">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>تحديثات وصيانة مجدولة</span>
          </div>
          <p className="text-xs text-[#E2E8F0] leading-relaxed">
            تم إيقاف هذا القسم مؤقتاً لأعمال الصيانة والترقية الجارية من قبل إدارة المنصة، لدمج أحدث معايير الأمان وتشفير البيانات البيومترية لبطولة دوري أبطال أوروبا 2026.
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>الحالة: <strong className="text-amber-400">تحت الصيانة</strong></span>
            <span>النسخة القادمة: UCL Security v2.6</span>
          </div>
        </div>

        {/* Close / Understood Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
        >
          حسناً، فهمت
        </button>
      </div>
    </div>
  );
};
