import React from 'react';
import { 
  X, 
  AlertCircle, 
  Wrench,
  Clock
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, isRtl, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#080C19]/85 backdrop-blur-md z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`bg-[#10172A] p-6 sm:p-8 rounded-3xl max-w-md w-full border border-slate-800 relative ${isRtl ? 'text-right' : 'text-left'} shadow-2xl`}>
        
        <button 
          onClick={onClose} 
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-[#94A3B8] hover:text-white p-1 transition cursor-pointer`}
          aria-label={t('close')}
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
            <span>{language === 'fr' ? 'En maintenance' : language === 'en' ? 'Under Maintenance' : 'تحت الصيانة'}</span>
          </div>
          <h3 className="text-xl font-black text-white">{t('securitySettingsTitle')}</h3>
          <p className="text-xs text-[#94A3B8] mt-1">{language === 'fr' ? 'Sécurité et authentification biométrique' : language === 'en' ? 'Security & Biometrics settings' : 'إعدادات الأمان والمصادقة الحيوية'}</p>
        </div>

        {/* Under Maintenance Notice Box */}
        <div className={`bg-[#080C19] border border-amber-500/30 rounded-2xl p-4 sm:p-5 ${isRtl ? 'text-right' : 'text-left'} space-y-3 mb-6`}>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{language === 'fr' ? 'Maintenance planifiée' : language === 'en' ? 'Scheduled Maintenance' : 'تحديثات وصيانة مجدولة'}</span>
          </div>
          <p className="text-xs text-[#E2E8F0] leading-relaxed">
            {language === 'fr'
              ? 'Cette section est temporairement en maintenance pour intégrer les normes de chiffrement biométrique les plus récentes pour UCL 2026/2027.'
              : language === 'en'
              ? 'This section is temporarily under maintenance for upgrades to integrate the latest biometric encryption standards for UCL 2026/2027.'
              : 'تم إيقاف هذا القسم مؤقتاً لأعمال الصيانة والترقية الجارية من قبل إدارة المنصة، لدمج أحدث معايير الأمان وتشفير البيانات البيومترية لبطولة دوري أبطال أوروبا.'}
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>{language === 'fr' ? 'Statut:' : language === 'en' ? 'Status:' : 'الحالة:'} <strong className="text-amber-400">{language === 'fr' ? 'Maintenance' : language === 'en' ? 'Maintenance' : 'تحت الصيانة'}</strong></span>
            <span>UCL Security v2.6</span>
          </div>
        </div>

        {/* Close / Understood Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};
