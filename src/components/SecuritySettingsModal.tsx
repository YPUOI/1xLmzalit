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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`ucl-card p-5 sm:p-6 rounded-2xl max-w-md w-full border border-[#253745] bg-[#11212D] relative ${isRtl ? 'text-right' : 'text-left'} shadow-2xl`}>
        
        <button 
          onClick={onClose} 
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-[#9BA8AB] hover:text-[#CCD0CF] p-1 rounded-lg hover:bg-[#253745] transition-colors duration-200 cursor-pointer`}
          aria-label={t('close')}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Maintenance Badge & Icon */}
        <div className="flex flex-col items-center text-center justify-center pt-2 pb-3">
          <div className="w-12 h-12 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] mb-2.5">
            <Wrench className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] text-[11px] font-medium mb-1.5">
            <Clock className="w-3 h-3 text-[#CCD0CF]" />
            <span>{language === 'fr' ? 'En maintenance' : language === 'en' ? 'Under Maintenance' : 'تحت الصيانة'}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">{t('securitySettingsTitle')}</h3>
          <p className="text-xs text-[#9BA8AB] mt-0.5">{language === 'fr' ? 'Sécurité et authentification biométrique' : language === 'en' ? 'Security & Biometrics settings' : 'إعدادات الأمان والمصادقة الحيوية'}</p>
        </div>

        {/* Under Maintenance Notice Box */}
        <div className={`bg-[#06141B] border border-[#253745] rounded-xl p-4 ${isRtl ? 'text-right' : 'text-left'} space-y-2 mb-4`}>
          <div className="flex items-center gap-2 text-[#CCD0CF] font-semibold text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#CCD0CF]" />
            <span>{language === 'fr' ? 'Maintenance planifiée' : language === 'en' ? 'Scheduled Maintenance' : 'تحديثات وصيانة مجدولة'}</span>
          </div>
          <p className="text-xs text-[#9BA8AB] leading-relaxed">
            {language === 'fr'
              ? 'Cette section est temporairement en maintenance pour intégrer les normes de chiffrement biométrique les plus récentes pour UCL 2026/2027.'
              : language === 'en'
              ? 'This section is temporarily under maintenance for upgrades to integrate the latest biometric encryption standards for UCL 2026/2027.'
              : 'تم إيقاف هذا القسم مؤقتاً لأعمال الصيانة والترقية الجارية من قبل إدارة المنصة، لدمج أحدث معايير الأمان وتشفير البيانات البيومترية لبطولة دوري أبطال أوروبا.'}
          </p>
          <div className="pt-2 border-t border-[#253745] flex items-center justify-between text-[11px] text-[#9BA8AB]">
            <span>{language === 'fr' ? 'Statut:' : language === 'en' ? 'Status:' : 'الحالة:'} <strong className="text-[#CCD0CF] font-medium">{language === 'fr' ? 'Maintenance' : language === 'en' ? 'Maintenance' : 'تحت الصيانة'}</strong></span>
            <span className="font-mono text-[10px]">UCL Security v2.6</span>
          </div>
        </div>

        {/* Close / Understood Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white font-semibold text-xs border border-[#253745] transition-all duration-200 cursor-pointer active:scale-[0.98]"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};
