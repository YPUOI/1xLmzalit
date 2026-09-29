import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  Share2, 
  X, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Copy,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { Match, Team, Prediction, AppUser } from '../types';
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
  users?: AppUser[];
}

export const PredictionCardModal: React.FC<PredictionCardModalProps> = ({
  isOpen,
  onClose,
  match,
  homeTeam,
  awayTeam,
  prediction,
  memberName,
  users = []
}) => {
  const { t, isRtl, language } = useLanguage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Compute the official member name as it appears in standings
  // (Priority: 1. Admin-changed username in standings, 2. original username, 3. memberName/prediction username)
  const standingsMemberName = useMemo(() => {
    const raw = (memberName || prediction.username || '').replace(/^@+/, '').trim();
    if (users && users.length > 0 && raw) {
      const matchInUsers = users.find(u => 
        u.username.toLowerCase() === raw.toLowerCase() ||
        (u.originalUsername && u.originalUsername.toLowerCase() === raw.toLowerCase())
      );
      if (matchInUsers) {
        return matchInUsers.username;
      }
    }
    return raw || 'Member';
  }, [memberName, prediction.username, users]);

  useEffect(() => {
    if (!isOpen) {
      setImageUrl(null);
      setError(null);
      setFeedbackMsg(null);
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
      memberName: standingsMemberName,
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
          setError(
            language === 'fr' 
              ? 'Erreur lors de la génération de la carte.' 
              : language === 'en' 
              ? 'Error generating prediction card image.' 
              : 'حدث خطأ أثناء معالجة وتوليد صورة التوقع.'
          );
          setIsGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, match, homeTeam, awayTeam, prediction, standingsMemberName, language]);

  if (!isOpen) return null;

  const filename = `1xlmzalit_Prediction_${homeTeam.name}_vs_${awayTeam.name}_${standingsMemberName}.png`.replace(/\s+/g, '_');

  // Formatted share text for WhatsApp, Discord, Telegram, and Socials
  const scorersHomeText = prediction.homeScorers && prediction.homeScorers.length > 0
    ? `\n⚽ *${homeTeam.name} Scorers:* ${prediction.homeScorers.join(', ')}`
    : '';
  const scorersAwayText = prediction.awayScorers && prediction.awayScorers.length > 0
    ? `\n⚽ *${awayTeam.name} Scorers:* ${prediction.awayScorers.join(', ')}`
    : '';

  const shareText = `🏆 *1xlmzalit UCL Prediction Ticket*
👤 *Member:* @${standingsMemberName}
⚽ *Match:* ${homeTeam.name} vs ${awayTeam.name}
🎯 *Prediction:* ${homeTeam.name} (${prediction.homeScore}) - (${prediction.awayScore}) ${awayTeam.name}
⭐ *MVP:* ${prediction.mvp ? prediction.mvp.trim() : 'Unspecified'}${scorersHomeText}${scorersAwayText}
🇲🇦 *Morocco GMT Standard* • 1xlmzalit.ai`;

  const handleDownload = () => {
    if (!imageUrl) return;
    downloadDataUrlAsPng(imageUrl, filename);
  };

  /**
   * Native Share API (opens native phone share drawer: WhatsApp, Discord, Telegram, Messages, etc.)
   */
  const handleNativeShare = async () => {
    if (!imageUrl) return;
    setIsSharing(true);

    try {
      // 1. Convert data URL to Blob & File
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      // 2. Try native mobile share with the photo file attached
      if (typeof navigator !== 'undefined' && navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `1xlmzalit UCL - ${homeTeam.name} vs ${awayTeam.name}`,
            text: shareText,
            files: [file]
          });
          setFeedbackMsg(language === 'fr' ? 'Partagé avec succès !' : language === 'en' ? 'Shared successfully!' : 'تمت المشاركة بنجاح!');
          setTimeout(() => setFeedbackMsg(null), 3000);
          setIsSharing(false);
          return;
        } else {
          // Native share with text & URL
          await navigator.share({
            title: `1xlmzalit UCL - ${homeTeam.name} vs ${awayTeam.name}`,
            text: shareText,
            url: window.location.href
          });
          setFeedbackMsg(language === 'fr' ? 'Partagé avec succès !' : language === 'en' ? 'Shared successfully!' : 'تمت المشاركة بنجاح!');
          setTimeout(() => setFeedbackMsg(null), 3000);
          setIsSharing(false);
          return;
        }
      }

      // 3. Fallback to copy image to clipboard
      await handleCopyImageOrText(blob);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share warning:', err);
        // Fallback to text copy
        try {
          await navigator.clipboard.writeText(shareText);
          setFeedbackMsg(language === 'fr' ? 'Texte copié !' : language === 'en' ? 'Text copied!' : 'تم نسخ نص التوقع!');
          setTimeout(() => setFeedbackMsg(null), 3000);
        } catch {
          // Silent fallback
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Direct WhatsApp Share (one-click on phone & desktop)
   */
  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
    setFeedbackMsg(language === 'fr' ? 'Ouverture de WhatsApp...' : language === 'en' ? 'Opening WhatsApp...' : 'جارٍ فتح واتساب...');
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  /**
   * Direct Discord / Universal Clipboard copy
   */
  const handleDiscordOrCopy = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      await handleCopyImageOrText(blob);
    } catch {
      await navigator.clipboard.writeText(shareText);
      setFeedbackMsg(language === 'fr' ? 'Copié pour Discord !' : language === 'en' ? 'Copied for Discord!' : 'تم النسخ لـ Discord!');
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const handleCopyImageOrText = async (blob: Blob) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setFeedbackMsg(
          language === 'fr' 
            ? 'Image HD copiée dans le presse-papiers !' 
            : language === 'en' 
            ? 'HD Photo copied to clipboard!' 
            : 'تم نسخ الصورة إلى الحافظة (جاهزة للصق في ديسكورد / واتساب)!'
        );
        setTimeout(() => setFeedbackMsg(null), 3000);
        return;
      } catch {
        // Fallback to text
      }
    }

    await navigator.clipboard.writeText(shareText);
    setFeedbackMsg(
      language === 'fr' 
        ? 'Détails du pronostic copiés !' 
        : language === 'en' 
        ? 'Prediction text copied!' 
        : 'تم نسخ نص التوقع بنجاح!'
    );
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
      <div 
        className="w-full max-w-2xl max-h-[94vh] flex flex-col rounded-2xl border border-[#253745] bg-[#11212D] shadow-2xl overflow-hidden relative"
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
                {language === 'fr' ? 'Prêt à être téléchargé et partagé (WhatsApp, Discord, etc.)' : language === 'en' ? 'Ready to share to WhatsApp, Discord, etc.' : 'جاهزة للمشاركة والتحميل (واتساب، ديسكورد، وغيرها)'}
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
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-[#06141B]">
          {isGenerating ? (
            <div className="py-16 sm:py-24 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-[#CCD0CF] animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-[#CCD0CF] text-sm sm:text-base">{t('loading')}</p>
                <p className="text-xs text-[#9BA8AB]">
                  {language === 'fr' ? 'Génération de la carte HD avec 1xlmzalit...' : language === 'en' ? 'Generating HD ticket with 1xlmzalit...' : 'تضمين التوقيت، الهدافين، رجل المباراة، وشعار 1xlmzalit الرسمي'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-center text-rose-200 text-xs">
              {error}
            </div>
          ) : imageUrl ? (
            <div className="w-full flex flex-col items-center space-y-3 sm:space-y-4">
              {/* Image Preview Box */}
              <div className="relative group rounded-xl overflow-hidden border border-[#253745] shadow-2xl max-w-sm sm:max-w-md w-full bg-[#11212D]">
                <img
                  src={imageUrl}
                  alt={`Prediction Ticket for @${standingsMemberName}`}
                  className="w-full h-auto object-contain select-none"
                />
              </div>

              {/* Feedback Toast if any */}
              {feedbackMsg && (
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{feedbackMsg}</span>
                </div>
              )}

              {/* Quick Share Buttons Bar on Mobile & Desktop */}
              <div className="w-full max-w-sm sm:max-w-md p-2.5 rounded-xl bg-[#11212D] border border-[#253745] flex items-center justify-around gap-2">
                {/* 1. WhatsApp Button */}
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Share to WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* 2. Discord / Chat Copy Button */}
                <button
                  type="button"
                  onClick={handleDiscordOrCopy}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#7289da] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Copy for Discord"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Discord</span>
                </button>

                {/* 3. Native Share (Phone drawer for all apps) */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  disabled={isSharing}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-[#4A5C6A]/30 hover:bg-[#4A5C6A]/50 border border-[#4A5C6A] text-[#CCD0CF] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="More Apps (Share drawer)"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Plus...' : language === 'en' ? 'More...' : 'المزيد...'}</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-[#253745] bg-[#11212D] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#9BA8AB]">
            <span>{t('member')}: <strong className="text-[#CCD0CF] font-semibold">@{standingsMemberName}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Primary Native Share Button */}
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={!imageUrl || isGenerating || isSharing}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] border border-[#253745] text-[#CCD0CF] font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'fr' ? 'Partage...' : language === 'en' ? 'Sharing...' : 'جارٍ المشاركة...'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#CCD0CF]" />
                  <span>{language === 'fr' ? 'Partager (WhatsApp / Discord)' : language === 'en' ? 'Share (WhatsApp / Discord)' : 'مشاركة (WhatsApp / Discord)'}</span>
                </>
              )}
            </button>

            {/* Download PNG Button */}
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
