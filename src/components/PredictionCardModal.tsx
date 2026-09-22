import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Share2, 
  X, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  ExternalLink,
  Copy
} from 'lucide-react';
import { Match, Team, Prediction } from '../types';
import { generatePredictionCardImage, downloadDataUrlAsPng, formatDateTimeEn } from '../utils/generatePredictionCard';
import { useLanguage } from '../i18n/LanguageContext';

interface PredictionCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  prediction: Prediction;
  memberName: string;
}

export const PredictionCardModal: React.FC<PredictionCardModalProps> = ({
  isOpen,
  onClose,
  match,
  homeTeam,
  awayTeam,
  prediction,
  memberName,
}) => {
  const { t, isRtl, language } = useLanguage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setImageUrl(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);
    setError(null);

    const now = new Date();

    generatePredictionCardImage({
      match,
      homeTeam,
      awayTeam,
      prediction,
      memberName,
      downloadDate: now
    })
      .then((url) => {
        if (isMounted) {
          setImageUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate prediction card image:', err);
        if (isMounted) {
          setError('حدث خطأ أثناء معالجة وتوليد صورة التوقع.');
          setIsGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, match, homeTeam, awayTeam, prediction, memberName]);

  if (!isOpen) return null;

  const filename = `1xlmzalit_Prediction_${homeTeam.name}_vs_${awayTeam.name}_${memberName}.png`.replace(/\s+/g, '_');

  const handleDownload = () => {
    if (!imageUrl) return;
    downloadDataUrlAsPng(imageUrl, filename);
  };

  const handleCopyLinkOrShare = async () => {
    if (!imageUrl) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Fetch blob from dataURL and copy image to clipboard if supported
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setHasCopied(true);
          setTimeout(() => setHasCopied(false), 2500);
          return;
        } catch {
          // Fallback to copying summary text
        }
      }

      // Fallback share text
      const shareText = `🏆 توقعي لمباراة ${homeTeam.name} vs ${awayTeam.name} في بطولة دوري أبطال أوروبا 1xlmzalit:\nالنتيجة المتوقعة: ${homeTeam.name} (${prediction.homeScore}) - (${prediction.awayScore}) ${awayTeam.name}\nرجل المباراة (MVP): ${prediction.mvp || 'غير محدد'}\nوقت الإرسال (EN): ${formatDateTimeEn(prediction.updatedAt)}`;
      await navigator.clipboard.writeText(shareText);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
      <div 
        className="ucl-card w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-blue-500/40 shadow-2xl shadow-blue-950/60 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{language === 'fr' ? 'Carte Officielle de Pronostic' : language === 'en' ? 'Official Prediction Ticket' : 'بطاقة التوقع الرسمية'}</span>
                <span className="text-[10px] font-mono font-black text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  HD PHOTO
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'fr' ? 'Prêt à être téléchargé et partagé au design officiel UEFA Champions League' : language === 'en' ? 'Ready to share and download in official UEFA Champions League design' : 'جاهزة للمشاركة والتحميل بجودة وتصميم دوري أبطال أوروبا الرسمي'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Image Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-950/60">
          {isGenerating ? (
            <div className="py-16 sm:py-24 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-white text-base">{t('loading')}</p>
                <p className="text-xs text-slate-400">
                  {language === 'fr' ? 'Génération de la carte HD avec 1xlmzalit et UEFA Champions League...' : language === 'en' ? 'Generating HD ticket with 1xlmzalit and UEFA Champions League...' : 'تضمين التوقيت، الهدافين، رجل المباراة، وشعار 1xlmzalit الرسمي'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-center text-rose-200 text-sm">
              {error}
            </div>
          ) : imageUrl ? (
            <div className="w-full flex flex-col items-center space-y-4">
              {/* Image Preview Box */}
              <div className="relative group rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl max-w-sm sm:max-w-md w-full bg-slate-900/60">
                <img
                  src={imageUrl}
                  alt="Prediction Ticket"
                  className="w-full h-auto object-contain select-none"
                />
              </div>

              {/* Specs Summary Pill */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                  1080 × 1350 px
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  1xlmzalit Verified
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t('brandName')}</span>
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {memberName && (
              <span>{t('member')}: <strong className="text-white">@{memberName}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyLinkOrShare}
              disabled={!imageUrl || isGenerating}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {hasCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{language === 'fr' ? 'Copié !' : language === 'en' ? 'Copied!' : 'تم النسخ!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>{language === 'fr' ? 'Partager' : language === 'en' ? 'Share' : 'نسخ / مشاركة'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!imageUrl || isGenerating}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:opacity-95 text-white font-black text-xs sm:text-sm transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'fr' ? 'Télécharger PNG' : language === 'en' ? 'Download PNG' : 'تحميل الصورة (Download PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
