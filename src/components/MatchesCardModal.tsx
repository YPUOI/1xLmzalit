import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  Loader2,
  Clock
} from 'lucide-react';
import { Match, Team } from '../types';
import { generateMatchesCardImage } from '../utils/generateMatchesCard';
import { downloadDataUrlAsPng } from '../utils/generateStandingsCard';
import { useLanguage } from '../i18n/LanguageContext';

interface MatchesCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  teams: Record<string, Team>;
  initialAction?: 'share' | 'download' | null;
}

export const MatchesCardModal: React.FC<MatchesCardModalProps> = ({
  isOpen,
  onClose,
  matches,
  teams,
  initialAction = null
}) => {
  const { t, isRtl, language } = useLanguage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `1xlmzalit_UCL_Matches_${language.toUpperCase()}_${dateStr}.png`;

  useEffect(() => {
    if (!isOpen || matches.length === 0) {
      setImageUrl(null);
      setError(null);
      setFeedbackMsg(null);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);
    setError(null);

    generateMatchesCardImage({
      matches,
      teams,
      language
    })
      .then((url) => {
        if (isMounted) {
          setImageUrl(url);
          setIsGenerating(false);

          if (initialAction === 'download') {
            downloadDataUrlAsPng(url, filename);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to generate matches card image:', err);
        if (isMounted) {
          setError(
            language === 'fr'
              ? 'Erreur lors de la génération de la carte des matchs.'
              : language === 'en'
              ? 'Error generating matches card image.'
              : 'حدث خطأ أثناء معالجة وتوليد صورة المباريات.'
          );
          setIsGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, matches, teams, filename, initialAction, language]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    downloadDataUrlAsPng(imageUrl, filename);
  };

  const handleNativeShare = async () => {
    if (!imageUrl) return;
    setIsSharing(true);

    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file]
          });
          setFeedbackMsg(
            language === 'fr'
              ? 'Photo partagée avec succès !'
              : language === 'en'
              ? 'Photo shared successfully!'
              : 'تمت مشاركة الصورة بنجاح!'
          );
          setTimeout(() => setFeedbackMsg(null), 3000);
          setIsSharing(false);
          return;
        }
      }

      // Fallback: Copy photo to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setFeedbackMsg(
            language === 'fr'
              ? 'Image copiée dans le presse-papiers !'
              : language === 'en'
              ? 'Photo copied to clipboard!'
              : 'تم نسخ الصورة إلى الحافظة!'
          );
          setTimeout(() => setFeedbackMsg(null), 3000);
          return;
        } catch {
          downloadDataUrlAsPng(imageUrl, filename);
        }
      } else {
        downloadDataUrlAsPng(imageUrl, filename);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share warning:', err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[94vh] flex flex-col rounded-2xl border border-[#253745] bg-[#11212D] shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#253745] flex items-center justify-between bg-[#11212D] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF]">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#CCD0CF] flex items-center gap-2">
                <span>
                  {language === 'fr'
                    ? 'Matchs disponibles aux pronostics'
                    : language === 'en'
                    ? 'Matches Available to Predict'
                    : 'بطاقة المباريات المتاحة للتوقع'}
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  HD
                </span>
              </h3>
              <p className="text-xs text-[#9BA8AB]">
                {language === 'fr'
                  ? 'Noms des équipes, logos officiels, date et heure'
                  : language === 'en'
                  ? 'Team names, official logos, date and time'
                  : 'أسماء الفرق، الشعارات الرسمية، والتاريخ والوقت'}
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

        {/* Modal Body: Image Preview */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-[#06141B]">
          {isGenerating ? (
            <div className="py-16 sm:py-24 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-[#CCD0CF] animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-[#CCD0CF] text-sm sm:text-base">{t('loading')}</p>
                <p className="text-xs text-[#9BA8AB]">
                  {language === 'fr'
                    ? 'Génération de la carte des matchs HD...'
                    : language === 'en'
                    ? 'Generating HD matches card...'
                    : 'معالجة وتوليد صورة المباريات المتاحة بجودة عالية...'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-center text-rose-200 text-xs">
              {error}
            </div>
          ) : imageUrl ? (
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="relative group rounded-xl overflow-hidden border border-[#253745] shadow-2xl max-w-md sm:max-w-lg w-full bg-[#11212D]">
                <img
                  src={imageUrl}
                  alt="UCL Matches Available to Predict"
                  className="w-full h-auto object-contain select-none"
                />
              </div>

              {feedbackMsg && (
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{feedbackMsg}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions: Share & Download */}
        <div className="p-3.5 sm:p-4 border-t border-[#253745] bg-[#11212D] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#9BA8AB]">
            <span>
              {t('tabMatches')}:{' '}
              <strong className="text-amber-400 font-semibold">
                {matches.length}{' '}
                {language === 'fr'
                  ? matches.length === 1 ? 'match' : 'matchs'
                  : language === 'en'
                  ? matches.length === 1 ? 'match' : 'matches'
                  : 'مباريات'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Share Button */}
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={!imageUrl || isGenerating || isSharing}
              className="p-2.5 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] border border-[#4A5C6A] text-[#CCD0CF] hover:text-white transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95 shadow-md"
              title={language === 'fr' ? 'Partager les matchs' : language === 'en' ? 'Share Matches' : 'مشاركة المباريات'}
              aria-label="Share Matches"
            >
              {isSharing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
                </svg>
              )}
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={!imageUrl || isGenerating}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md active:scale-95"
            >
              <Download className="w-4 h-4 text-[#06141B]" />
              <span>
                {language === 'fr'
                  ? 'Télécharger l\'image (PNG)'
                  : language === 'en'
                  ? 'Download Image (PNG)'
                  : 'تحميل الصورة (PNG)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
