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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
      <div 
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-[#253745] bg-[#11212D] shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#253745] flex items-center justify-between bg-[#11212D] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF]">
              <Sparkles className="w-4 h-4 text-[#CCD0CF]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#CCD0CF] flex items-center gap-2">
                <span>{language === 'fr' ? 'Carte Officielle de Pronostic' : language === 'en' ? 'Official Prediction Ticket' : 'بطاقة التوقع الرسمية'}</span>
                <span className="text-[10px] font-mono font-bold text-[#CCD0CF] bg-[#253745] border border-[#4A5C6A] px-2 py-0.5 rounded">
                  HD PHOTO
                </span>
              </h3>
              <p className="text-xs text-[#9BA8AB]">
                {language === 'fr' ? 'Prêt à être téléchargé et partagé au design officiel UEFA Champions League' : language === 'en' ? 'Ready to share and download in official UEFA Champions League design' : 'جاهزة للمشاركة والتحميل بجودة وتصميم دوري أبطال أوروبا الرسمي'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#253745] transition-all duration-200 cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable Image Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-[#06141B]">
          {isGenerating ? (
            <div className="py-16 sm:py-24 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-[#CCD0CF] animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-[#CCD0CF] text-sm sm:text-base">{t('loading')}</p>
                <p className="text-xs text-[#9BA8AB]">
                  {language === 'fr' ? 'Génération de la carte HD avec 1xlmzalit et UEFA Champions League...' : language === 'en' ? 'Generating HD ticket with 1xlmzalit and UEFA Champions League...' : 'تضمين التوقيت، الهدافين، رجل المباراة، وشعار 1xlmzalit الرسمي'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-center text-rose-200 text-xs">
              {error}
            </div>
          ) : imageUrl ? (
            <div className="w-full flex flex-col items-center space-y-4">
              {/* Image Preview Box */}
              <div className="relative group rounded-xl overflow-hidden border border-[#253745] shadow-2xl max-w-sm sm:max-w-md w-full bg-[#11212D]">
                <img
                  src={imageUrl}
                  alt="Prediction Ticket"
                  className="w-full h-auto object-contain select-none"
                />
              </div>

              {/* Specs Summary Pill */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#9BA8AB]">
                <span className="px-2.5 py-0.5 rounded bg-[#11212D] border border-[#253745] text-[#CCD0CF] font-mono text-[10px]">
                  1080 × 1350 px
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#11212D] border border-[#253745] text-[#CCD0CF] text-[10px]">
                  1xlmzalit Verified
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#11212D] border border-[#253745] text-[#CCD0CF] flex items-center gap-1 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-[#CCD0CF]" />
                  <span>{t('brandName')}</span>
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-[#253745] bg-[#11212D] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#9BA8AB]">
            {memberName && (
              <span>{t('member')}: <strong className="text-[#CCD0CF] font-semibold">@{memberName}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyLinkOrShare}
              disabled={!imageUrl || isGenerating}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] border border-[#253745] text-[#CCD0CF] font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {hasCopied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{language === 'fr' ? 'Copié !' : language === 'en' ? 'Copied!' : 'تم النسخ!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#CCD0CF]" />
                  <span>{language === 'fr' ? 'Partager' : language === 'en' ? 'Share' : 'نسخ / مشاركة'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!imageUrl || isGenerating}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Télécharger PNG' : language === 'en' ? 'Download PNG' : 'تحميل الصورة (Download PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
