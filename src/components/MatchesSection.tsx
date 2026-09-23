import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Trash2, 
  Save, 
  Star, 
  CheckCircle2, 
  CalendarX, 
  Award,
  Users,
  Plus,
  Minus,
  AlertCircle,
  Timer,
  Flame,
  Download,
  Sparkles
} from 'lucide-react';
import { Match, Team, Prediction, AppUser } from '../types';
import { PredictionCardModal } from './PredictionCardModal';
import { useLanguage } from '../i18n/LanguageContext';
import { getTeamEnglishName } from '../data/clubPresets';

interface MatchesSectionProps {
  matches: Match[];
  teams: Record<string, Team>;
  predictions: Record<string, Prediction>;
  currentUser: AppUser | null;
  onSavePrediction: (prediction: Prediction) => void;
  onDeleteMatch: (match: Match) => void;
  onOpenAuth: () => void;
}

// Format date in English (e.g. Nov 11, 2027, 10:10 AM)
const formatEnglishDeadline = (deadlineStr: string): string => {
  const d = new Date(deadlineStr);
  if (isNaN(d.getTime())) return deadlineStr;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Live countdown timer showing remaining time in minutes and seconds, turning red under 1 hour
export const MatchCountdown: React.FC<{
  deadline: string;
  status: 'OPEN' | 'SETTLED';
}> = ({ deadline, status }) => {
  const { t } = useLanguage();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const deadlineTime = new Date(deadline).getTime();
  if (isNaN(deadlineTime)) return null;

  const diffMs = deadlineTime - now;

  if (status === 'SETTLED' || diffMs <= 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-400 text-[11px] font-bold shrink-0">
        <Clock className="w-3 h-3 text-slate-500" />
        <span>{t('timeExpired')}</span>
      </div>
    );
  }

  const isUnderOneHour = diffMs < 60 * 60 * 1000;
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (isUnderOneHour) {
    return (
      <div 
        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-950/90 to-red-950/90 border border-rose-500 text-rose-300 text-xs font-black shadow-[0_0_16px_rgba(244,63,94,0.45)] animate-pulse shrink-0"
        title="< 1h!"
      >
        <Flame className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="text-[11px] text-rose-200 hidden xs:inline">{t('timeLeft')}:</span>
        <span className="font-mono text-white text-xs font-black tracking-wider bg-rose-900/80 px-2 py-0.5 rounded-md border border-rose-500/60" dir="ltr">
          {pad(minutes)}:{pad(seconds)}
        </span>
        <span className="text-[10px] text-rose-300 font-bold hidden sm:inline">(&lt; 1h)</span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-blue-500/40 text-blue-300 text-xs font-bold shadow-sm shrink-0"
      title={t('timeLeft')}
    >
      <Timer className="w-3.5 h-3.5 text-blue-400 shrink-0" />
      <span className="text-[11px] text-slate-400 hidden xs:inline">{t('timeLeft')}:</span>
      <span className="font-mono text-white text-xs font-black tracking-wider bg-slate-950 px-2 py-0.5 rounded-md border border-slate-700/60" dir="ltr">
        {days > 0 ? `${days}d ` : ''}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
};

export const MatchesSection: React.FC<MatchesSectionProps> = ({
  matches,
  teams,
  predictions,
  currentUser,
  onSavePrediction,
  onDeleteMatch,
  onOpenAuth
}) => {
  const { t, isRtl, language } = useLanguage();
  // Local state for predictions being edited per match
  const [draftPreds, setDraftPreds] = useState<Record<string, {
    homeScore: number;
    awayScore: number;
    homeScorers: string[];
    awayScorers: string[];
    mvp: string;
  }>>({});

  // Error messages per match explaining why validation failed
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Specific missing scorer indices per match to visually highlight unchosen fields
  const [missingScorers, setMissingScorers] = useState<Record<string, { home: number[]; away: number[] }>>({});

  // Active prediction card modal for downloading photo
  const [activeCardModal, setActiveCardModal] = useState<{
    match: Match;
    homeTeam: Team;
    awayTeam: Team;
    prediction: Prediction;
    memberName: string;
  } | null>(null);

  const openPredictionCard = (match: Match, pred: Prediction) => {
    const home = teams[match.homeTeam] || { name: match.homeTeam, logo: '', squad: [] };
    const away = teams[match.awayTeam] || { name: match.awayTeam, logo: '', squad: [] };
    setActiveCardModal({
      match,
      homeTeam: home,
      awayTeam: away,
      prediction: pred,
      memberName: currentUser?.username || pred.username
    });
  };

  const getDraft = (match: Match) => {
    if (draftPreds[match.id]) {
      return draftPreds[match.id];
    }

    const userPredKey = currentUser ? `${currentUser.username}_${match.id}` : null;
    const existing = userPredKey ? predictions[userPredKey] : null;

    if (existing) {
      return {
        homeScore: existing.homeScore,
        awayScore: existing.awayScore,
        homeScorers: existing.homeScorers || [],
        awayScorers: existing.awayScorers || [],
        mvp: existing.mvp || ''
      };
    }

    return {
      homeScore: 0,
      awayScore: 0,
      homeScorers: [],
      awayScorers: [],
      mvp: ''
    };
  };

  const updateDraft = (matchId: string, updates: Partial<{
    homeScore: number;
    awayScore: number;
    homeScorers: string[];
    awayScorers: string[];
    mvp: string;
  }>) => {
    setDraftPreds(prev => {
      const match = matches.find(m => m.id === matchId);
      const current = prev[matchId] || (match ? getDraft(match) : {
        homeScore: 0,
        awayScore: 0,
        homeScorers: [],
        awayScorers: [],
        mvp: ''
      });
      return {
        ...prev,
        [matchId]: { ...current, ...updates }
      };
    });

    // Clear or update missing scorer highlights dynamically as user edits
    setMissingScorers(prev => {
      if (!prev[matchId]) return prev;
      return {
        ...prev,
        [matchId]: {
          home: updates.homeScorers ? [] : prev[matchId].home,
          away: updates.awayScorers ? [] : prev[matchId].away
        }
      };
    });

    // Clear error message when user starts updating
    if (validationErrors[matchId]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[matchId];
        return copy;
      });
    }
  };

  const handleSave = (match: Match) => {
    if (!currentUser) return;
    const draft = getDraft(match);

    // 1. Check deadline: do not validate or save if deadline passed or match is settled
    const now = new Date();
    const isLocked = now > new Date(match.deadline) || match.status === 'SETTLED';
    if (isLocked) {
      setValidationErrors(prev => ({
        ...prev,
        [match.id]: 'عذراً، لقد انتهى موعد إرسال التوقعات لهذه المباراة (أغلقت المباراة) ولا يمكن تسجيل أي توقع جديد!'
      }));
      return;
    }

    // 2. Validate all Home Goal Scorers
    const missingHomeIndices: number[] = [];
    for (let i = 0; i < draft.homeScore; i++) {
      const scorer = draft.homeScorers[i];
      if (!scorer || scorer.trim() === '') {
        missingHomeIndices.push(i);
      }
    }

    // 3. Validate all Away Goal Scorers
    const missingAwayIndices: number[] = [];
    for (let i = 0; i < draft.awayScore; i++) {
      const scorer = draft.awayScorers[i];
      if (!scorer || scorer.trim() === '') {
        missingAwayIndices.push(i);
      }
    }

    // 4. If any scorers are missing: DO NOT VALIDATE OR SAVE, show clear explanatory error
    if (missingHomeIndices.length > 0 || missingAwayIndices.length > 0) {
      setMissingScorers(prev => ({
        ...prev,
        [match.id]: { home: missingHomeIndices, away: missingAwayIndices }
      }));

      const explanations: string[] = [];
      if (missingHomeIndices.length > 0) {
        const filled = draft.homeScore - missingHomeIndices.length;
        explanations.push(
          language === 'fr'
            ? `• Équipe ${getTeamEnglishName(match.homeTeam)} : vous avez pronostiqué ${draft.homeScore} buts mais vous n'avez sélectionné que (${filled} sur ${draft.homeScore}) buteurs. Veuillez désigner le buteur pour le but n° (${missingHomeIndices.map(idx => idx + 1).join(', ')}).`
            : language === 'en'
            ? `• Team ${getTeamEnglishName(match.homeTeam)}: you predicted ${draft.homeScore} goals but only chose (${filled} of ${draft.homeScore}) scorers. Please pick a scorer for goal # (${missingHomeIndices.map(idx => idx + 1).join(', ')}).`
            : `• فريق ${match.homeTeam}: توقعت تسجيل ${draft.homeScore} ${draft.homeScore === 1 ? 'هدف' : 'أهداف'} ولكنك حددت فقط (${filled} من ${draft.homeScore}) مسجلين. يرجى اختيار مسجل للهدف رقم (${missingHomeIndices.map(idx => idx + 1).join(' و ')}).`
        );
      }
      if (missingAwayIndices.length > 0) {
        const filled = draft.awayScore - missingAwayIndices.length;
        explanations.push(
          language === 'fr'
            ? `• Équipe ${getTeamEnglishName(match.awayTeam)} : vous avez pronostiqué ${draft.awayScore} buts mais vous n'avez sélectionné que (${filled} sur ${draft.awayScore}) buteurs. Veuillez désigner le buteur pour le but n° (${missingAwayIndices.map(idx => idx + 1).join(', ')}).`
            : language === 'en'
            ? `• Team ${getTeamEnglishName(match.awayTeam)}: you predicted ${draft.awayScore} goals but only chose (${filled} of ${draft.awayScore}) scorers. Please pick a scorer for goal # (${missingAwayIndices.map(idx => idx + 1).join(', ')}).`
            : `• فريق ${match.awayTeam}: توقعت تسجيل ${draft.awayScore} ${draft.awayScore === 1 ? 'هدف' : 'أهداف'} ولكنك حددت فقط (${filled} من ${draft.awayScore}) مسجلين. يرجى اختيار مسجل للهدف رقم (${missingAwayIndices.map(idx => idx + 1).join(' و ')}).`
        );
      }

      const fullMessage = language === 'fr'
        ? `Impossible d'enregistrer le pronostic tant que tous les buteurs ne sont pas désignés !\n\n${explanations.join('\n')}`
        : language === 'en'
        ? `Cannot save prediction until all goalscorers are selected!\n\n${explanations.join('\n')}`
        : `لا يمكن حفظ التوقع حتى يتم إدخال وتحديد جميع مسجلي الأهداف كاملة!\n\n${explanations.join('\n')}`;
      setValidationErrors(prev => ({ ...prev, [match.id]: fullMessage }));
      return; // Stop here!
    }

    // 5. Clean validation: clear errors and save latest prediction
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy[match.id];
      return copy;
    });
    setMissingScorers(prev => {
      const copy = { ...prev };
      delete copy[match.id];
      return copy;
    });

    const newPred: Prediction = {
      matchId: match.id,
      username: currentUser.username,
      homeScore: draft.homeScore,
      awayScore: draft.awayScore,
      homeScorers: draft.homeScorers.slice(0, draft.homeScore).map(s => s.trim()),
      awayScorers: draft.awayScorers.slice(0, draft.awayScore).map(s => s.trim()),
      mvp: draft.mvp?.trim() || '',
      updatedAt: new Date().toISOString()
    };

    onSavePrediction(newPred);

    // Automatically prompt member to download their official prediction card photo
    openPredictionCard(match, newPred);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap justify-between items-center ucl-card p-4 rounded-2xl border border-slate-700/60 gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <h2 className="text-xl font-black text-white flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-blue-400" />
          <span>{t('tabMatches')}</span>
        </h2>

        {currentUser && (
          <div className="ucl-gold-badge px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span><strong className="text-white text-base">{currentUser.points || 0}</strong> {t('pointsCount')}</span>
          </div>
        )}
      </div>

      {/* Matches Grid */}
      {matches.length === 0 ? (
        <div className="ucl-card p-10 text-center rounded-3xl text-slate-400 border border-slate-800">
          <CalendarX className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="font-bold text-sm">{t('noMatchesFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {matches.map(match => {
            const home = teams[match.homeTeam] || { name: match.homeTeam, logo: 'https://placehold.co/100x100?text=Home', squad: [] };
            const away = teams[match.awayTeam] || { name: match.awayTeam, logo: 'https://placehold.co/100x100?text=Away', squad: [] };

            const isLocked = new Date() > new Date(match.deadline) || match.status === 'SETTLED';
            const userPredKey = currentUser ? `${currentUser.username}_${match.id}` : null;
            const userPred = userPredKey ? predictions[userPredKey] : null;
            const draft = getDraft(match);

            return (
              <div 
                key={match.id} 
                className="ucl-card p-5 sm:p-6 rounded-3xl border border-slate-800/90 space-y-6 relative overflow-hidden transition hover:border-blue-500/40"
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {/* Match Status Bar */}
                <div className="flex flex-wrap justify-between items-center border-b border-slate-800/80 pb-3 gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-bold text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-mono text-slate-200 tracking-wide font-semibold" dir="ltr">{formatEnglishDeadline(match.deadline)}</span>
                    </div>

                    {/* Live Countdown Timer */}
                    <MatchCountdown deadline={match.deadline} status={match.status} />
                  </div>

                  <div className="flex items-center gap-2">
                    {currentUser && currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => onDeleteMatch(match)}
                        className="bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-500/40 text-[11px] px-2.5 py-1 rounded-xl transition flex items-center gap-1 font-bold cursor-pointer active:scale-95"
                        title="Delete Match"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}

                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      match.status === 'SETTLED'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : isLocked
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {match.status === 'SETTLED' ? t('settledStatus') : isLocked ? t('predictionLocked') : t('openForPrediction')}
                    </span>
                  </div>
                </div>

                {/* Match Teams Faceoff */}
                <div className="grid grid-cols-3 items-center text-center gap-2 py-2" dir="ltr">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2 bg-slate-900/80 rounded-2xl border border-slate-800 shrink-0">
                      <img 
                        src={home.logo} 
                        alt={home.name} 
                        className="w-full h-full object-contain aspect-square" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1e293b/ffffff?text=Logo'; }}
                      />
                    </div>
                    <span className="font-black text-xs sm:text-sm text-white">{getTeamEnglishName(home.name)}</span>
                  </div>

                  {/* VS / Score Result */}
                  <div className="flex flex-col items-center">
                    <span className="text-xl sm:text-2xl font-black text-yellow-400 tracking-widest">VS</span>
                    {match.result ? (
                      <div className="mt-2 text-base sm:text-lg font-black bg-slate-900 px-4 py-1.5 rounded-xl border border-yellow-500/40 text-yellow-300 shadow-md">
                        {match.result.homeScore} - {match.result.awayScore}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 mt-1 font-mono font-bold">UCL 2026/2027</span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2 bg-slate-900/80 rounded-2xl border border-slate-800 shrink-0">
                      <img 
                        src={away.logo} 
                        alt={away.name} 
                        className="w-full h-full object-contain aspect-square"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1e293b/ffffff?text=Logo'; }}
                      />
                    </div>
                    <span className="font-black text-xs sm:text-sm text-white">{getTeamEnglishName(away.name)}</span>
                  </div>
                </div>

                {/* Prediction Input & Details Area */}
                <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
                  {!currentUser ? (
                    <div className="text-center py-2">
                      <p className="text-xs text-amber-400 font-bold mb-2">
                        {t('memberLogin')}
                      </p>
                      <button
                        onClick={onOpenAuth}
                        className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        {t('memberLogin')}
                      </button>
                    </div>
                  ) : isLocked ? (
                    <div className="text-center text-xs space-y-1 py-1">
                      {userPred ? (
                        <div>
                          <span className="text-slate-400">{t('exactScore')}: </span>
                          <span className="text-yellow-400 font-black text-sm">{userPred.homeScore} - {userPred.awayScore}</span>
                          {userPred.mvp && (
                            <div className="text-[11px] text-slate-400 mt-1">
                              {t('manOfTheMatch')}: <strong className="text-cyan-300">{userPred.mvp}</strong>
                            </div>
                          )}
                          {/* Only allow downloading prediction card BEFORE the real score is launched */}
                          {!match.result && match.status !== 'SETTLED' ? (
                            <div className="pt-2 flex justify-center">
                              <button
                                type="button"
                                onClick={() => openPredictionCard(match, userPred)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-cyan-400"
                              >
                                <Download className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{language === 'fr' ? 'Télécharger la carte de pronostic' : language === 'en' ? 'Download Prediction Card' : 'تحميل بطاقة التوقع (صورة)'}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="pt-1.5 text-[11px] text-slate-500">
                              {language === 'fr' ? 'Le résultat officiel est publié, le téléchargement est clos.' : language === 'en' ? 'Official result announced; prediction card download closed.' : 'تم إعلان النتيجة الرسمية للمباراة وانتهت فترة تحميل بطاقة التوقع.'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">
                          {language === 'fr' ? 'Vous n\'avez pas enregistré de pronostic pour ce match avant la clôture.' : language === 'en' ? 'You did not register a prediction for this match before deadline.' : 'لم تقم بتسجيل توقع لهذه المباراة قبل إغلاقها.'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Urgent Notice if less than 1 hour remaining */}
                      {new Date(match.deadline).getTime() - Date.now() < 3600000 && 
                       new Date(match.deadline).getTime() - Date.now() > 0 && 
                       match.status !== 'SETTLED' && (
                        <div className="p-3 rounded-2xl bg-rose-950/85 border border-rose-500/80 text-rose-200 text-xs font-bold flex items-center gap-2.5 shadow-lg animate-pulse">
                          <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>
                            {language === 'fr' ? 'Alerte urgente : fermeture du match imminente (< 1 heure) ! Confirmez votre pronostic dès maintenant.' : language === 'en' ? 'Urgent notice: match deadline approaching (< 1 hour)! Finalize your prediction now.' : 'تنبيه عاجل: اقترب موعد إغلاق المباراة (أقل من ساعة واحدة)! احرص على إكمال وتثبيت توقعك الآن.'}
                          </span>
                        </div>
                      )}

                      {/* Score Inputs with Mobile-Friendly Steppers */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-slate-950/80 p-2 sm:p-3 rounded-2xl border border-slate-800 text-center">
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-300 mb-2 truncate">
                            {language === 'fr' ? `Buts ${getTeamEnglishName(home.name)}` : language === 'en' ? `${getTeamEnglishName(home.name)} Goals` : `أهداف ${getTeamEnglishName(home.name)}`}
                          </label>
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              onClick={() => updateDraft(match.id, { homeScore: Math.max(0, draft.homeScore - 1) })}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-yellow-400 font-black flex items-center justify-center cursor-pointer transition active:scale-95 border border-slate-700 select-none shrink-0"
                              title={language === 'fr' ? 'Diminuer but' : language === 'en' ? 'Decrease goal' : 'تقليل هدف'}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              max="15"
                              dir="ltr"
                              value={draft.homeScore}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(15, parseInt(e.target.value) || 0));
                                updateDraft(match.id, { homeScore: val });
                              }}
                              className="w-12 sm:w-14 bg-transparent text-center font-black text-white text-xl sm:text-2xl outline-none force-ltr"
                            />
                            <button
                              type="button"
                              onClick={() => updateDraft(match.id, { homeScore: Math.min(15, draft.homeScore + 1) })}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-yellow-400 font-black flex items-center justify-center cursor-pointer transition active:scale-95 border border-slate-700 select-none shrink-0"
                              title={language === 'fr' ? 'Ajouter but' : language === 'en' ? 'Increase goal' : 'زيادة هدف'}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-950/80 p-2 sm:p-3 rounded-2xl border border-slate-800 text-center">
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-300 mb-2 truncate">
                            {language === 'fr' ? `Buts ${getTeamEnglishName(away.name)}` : language === 'en' ? `${getTeamEnglishName(away.name)} Goals` : `أهداف ${getTeamEnglishName(away.name)}`}
                          </label>
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              onClick={() => updateDraft(match.id, { awayScore: Math.max(0, draft.awayScore - 1) })}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-yellow-400 font-black flex items-center justify-center cursor-pointer transition active:scale-95 border border-slate-700 select-none shrink-0"
                              title={language === 'fr' ? 'Diminuer but' : language === 'en' ? 'Decrease goal' : 'تقليل هدف'}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              max="15"
                              dir="ltr"
                              value={draft.awayScore}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(15, parseInt(e.target.value) || 0));
                                updateDraft(match.id, { awayScore: val });
                              }}
                              className="w-12 sm:w-14 bg-transparent text-center font-black text-white text-xl sm:text-2xl outline-none force-ltr"
                            />
                            <button
                              type="button"
                              onClick={() => updateDraft(match.id, { awayScore: Math.min(15, draft.awayScore + 1) })}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-yellow-400 font-black flex items-center justify-center cursor-pointer transition active:scale-95 border border-slate-700 select-none shrink-0"
                              title={language === 'fr' ? 'Ajouter but' : language === 'en' ? 'Increase goal' : 'زيادة هدف'}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Goal Scorers for Home */}
                      {draft.homeScore > 0 && (
                        <div className="p-3 sm:p-4 bg-slate-950/60 rounded-2xl border border-blue-900/40 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-blue-400">
                              {language === 'fr' ? `Buteurs ${getTeamEnglishName(home.name)} (${draft.homeScore} ${draft.homeScore === 1 ? 'but' : 'buts'}):` : language === 'en' ? `${getTeamEnglishName(home.name)} Scorers (${draft.homeScore} ${draft.homeScore === 1 ? 'goal' : 'goals'}):` : `مسجلو أهداف ${getTeamEnglishName(home.name)} (${draft.homeScore} ${draft.homeScore === 1 ? 'هدف' : 'أهداف'}):`}
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {language === 'fr' ? '(Sélection du buteur obligatoire pour chaque but)' : language === 'en' ? '(Scorer required for each goal)' : '(مطلوب تحديد المسجل لكل هدف)'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {Array.from({ length: draft.homeScore }).map((_, idx) => {
                              const isMissing = missingScorers[match.id]?.home.includes(idx);
                              return (
                                <div key={idx} className="space-y-1">
                                  {home.squad && home.squad.length > 0 ? (
                                    <select
                                      value={draft.homeScorers[idx] || ''}
                                      onChange={(e) => {
                                        const nextScorers = [...draft.homeScorers];
                                        nextScorers[idx] = e.target.value;
                                        updateDraft(match.id, { homeScorers: nextScorers });
                                      }}
                                      className={`w-full bg-slate-900 border ${
                                        isMissing 
                                          ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/30 text-rose-100' 
                                          : 'border-slate-700 text-white focus:border-blue-400'
                                      } rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm outline-none min-h-[44px] cursor-pointer transition`}
                                    >
                                      <option value="">{language === 'fr' ? `Choisir le buteur du but (${idx + 1})...` : language === 'en' ? `Select scorer for goal (${idx + 1})...` : `اختر المسجل للهدف (${idx + 1})...`}</option>
                                      {home.squad.map(player => (
                                        <option key={player} value={player}>{player}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={draft.homeScorers[idx] || ''}
                                      onChange={(e) => {
                                        const nextScorers = [...draft.homeScorers];
                                        nextScorers[idx] = e.target.value;
                                        updateDraft(match.id, { homeScorers: nextScorers });
                                      }}
                                      placeholder={language === 'fr' ? `Nom du buteur pour le but (${idx + 1})...` : language === 'en' ? `Scorer name for goal (${idx + 1})...` : `اسم مسجل الهدف (${idx + 1})...`}
                                      className={`w-full bg-slate-900 border ${
                                        isMissing 
                                          ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/30 text-rose-100' 
                                          : 'border-slate-700 text-white focus:border-blue-400'
                                      } rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm outline-none min-h-[44px] transition`}
                                    />
                                  )}
                                  {isMissing && (
                                    <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                      <span>{language === 'fr' ? `Buteur requis pour le but (${idx + 1})` : language === 'en' ? `Scorer required for goal (${idx + 1})` : `مطلوب اختيار اسم مسجل الهدف (${idx + 1})`}</span>
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Dynamic Goal Scorers for Away */}
                      {draft.awayScore > 0 && (
                        <div className="p-3 sm:p-4 bg-slate-950/60 rounded-2xl border border-rose-900/40 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-rose-400">
                              {language === 'fr' ? `Buteurs ${getTeamEnglishName(away.name)} (${draft.awayScore} ${draft.awayScore === 1 ? 'but' : 'buts'}):` : language === 'en' ? `${getTeamEnglishName(away.name)} Scorers (${draft.awayScore} ${draft.awayScore === 1 ? 'goal' : 'goals'}):` : `مسجلو أهداف ${getTeamEnglishName(away.name)} (${draft.awayScore} ${draft.awayScore === 1 ? 'هدف' : 'أهداف'}):`}
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {language === 'fr' ? '(Sélection du buteur obligatoire pour chaque but)' : language === 'en' ? '(Scorer required for each goal)' : '(مطلوب تحديد المسجل لكل هدف)'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {Array.from({ length: draft.awayScore }).map((_, idx) => {
                              const isMissing = missingScorers[match.id]?.away.includes(idx);
                              return (
                                <div key={idx} className="space-y-1">
                                  {away.squad && away.squad.length > 0 ? (
                                    <select
                                      value={draft.awayScorers[idx] || ''}
                                      onChange={(e) => {
                                        const nextScorers = [...draft.awayScorers];
                                        nextScorers[idx] = e.target.value;
                                        updateDraft(match.id, { awayScorers: nextScorers });
                                      }}
                                      className={`w-full bg-slate-900 border ${
                                        isMissing 
                                          ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/30 text-rose-100' 
                                          : 'border-slate-700 text-white focus:border-rose-400'
                                      } rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm outline-none min-h-[44px] cursor-pointer transition`}
                                    >
                                      <option value="">{language === 'fr' ? `Choisir le buteur du but (${idx + 1})...` : language === 'en' ? `Select scorer for goal (${idx + 1})...` : `اختر المسجل للهدف (${idx + 1})...`}</option>
                                      {away.squad.map(player => (
                                        <option key={player} value={player}>{player}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={draft.awayScorers[idx] || ''}
                                      onChange={(e) => {
                                        const nextScorers = [...draft.awayScorers];
                                        nextScorers[idx] = e.target.value;
                                        updateDraft(match.id, { awayScorers: nextScorers });
                                      }}
                                      placeholder={language === 'fr' ? `Nom du buteur pour le but (${idx + 1})...` : language === 'en' ? `Scorer name for goal (${idx + 1})...` : `اسم مسجل الهدف (${idx + 1})...`}
                                      className={`w-full bg-slate-900 border ${
                                        isMissing 
                                          ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/30 text-rose-100' 
                                          : 'border-slate-700 text-white focus:border-rose-400'
                                      } rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm outline-none min-h-[44px] transition`}
                                    />
                                  )}
                                  {isMissing && (
                                    <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                      <span>{language === 'fr' ? `Buteur requis pour le but (${idx + 1})` : language === 'en' ? `Scorer required for goal (${idx + 1})` : `مطلوب اختيار اسم مسجل الهدف (${idx + 1})`}</span>
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* MVP Select */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{t('manOfTheMatch')}</span>
                        </label>
                        {[...(home.squad || []), ...(away.squad || [])].length > 0 ? (
                          <select
                            value={draft.mvp}
                            onChange={(e) => updateDraft(match.id, { mvp: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white font-bold outline-none focus:border-yellow-400 min-h-[44px] cursor-pointer"
                          >
                            <option value="">{t('chooseMvp')}</option>
                            {[...(home.squad || []), ...(away.squad || [])].map((player, idx) => (
                              <option key={`${player}_${idx}`} value={player}>{player}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={draft.mvp}
                            onChange={(e) => updateDraft(match.id, { mvp: e.target.value })}
                            placeholder={t('chooseMvp')}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white font-bold outline-none focus:border-yellow-400 min-h-[44px]"
                          />
                        )}
                      </div>

                      {/* Validation Error Banner with Clear Explication */}
                      {validationErrors[match.id] && (
                        <div className={`p-4 rounded-2xl bg-rose-950/90 border border-rose-500/80 text-rose-200 shadow-xl space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                          <div className="flex items-center gap-2 font-black text-sm text-white">
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            <span>
                              {language === 'fr' ? 'Validation impossible : veuillez désigner tous les buteurs' : language === 'en' ? 'Validation Failed: Please complete all goalscorers' : 'تعذر التحقق من التوقع: يرجى إكمال مسجلي الأهداف'}
                            </span>
                          </div>
                          <div className={`text-xs leading-relaxed text-rose-200 whitespace-pre-line ${isRtl ? 'pr-7' : 'pl-7'}`}>
                            {validationErrors[match.id]}
                          </div>
                        </div>
                      )}

                      {/* Save Button */}
                      <button
                        type="button"
                        onClick={() => handleSave(match)}
                        className="w-full ucl-btn-primary font-black py-3.5 rounded-2xl transition text-sm cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
                      >
                        <Save className="w-4 h-4" />
                        <span>{userPred ? t('editPrediction') : t('savePredictionBtn')}</span>
                      </button>

                      {userPred && (
                        <div className="space-y-2.5">
                          <button
                            type="button"
                            onClick={() => openPredictionCard(match, userPred)}
                            className="w-full bg-gradient-to-r from-cyan-950/80 via-blue-950/95 to-cyan-950/80 hover:from-cyan-900/90 hover:to-blue-900/90 border border-cyan-400/50 text-cyan-300 font-black py-3 rounded-2xl transition text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 group select-none"
                          >
                            <Download className="w-4 h-4 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
                            <span>{t('downloadCard')}</span>
                          </button>

                          <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                            <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{t('predictionSaved')}: ({userPred.homeScore} - {userPred.awayScore})</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prediction Card Download Modal */}
      {activeCardModal && (
        <PredictionCardModal
          isOpen={Boolean(activeCardModal)}
          onClose={() => setActiveCardModal(null)}
          match={activeCardModal.match}
          homeTeam={activeCardModal.homeTeam}
          awayTeam={activeCardModal.awayTeam}
          prediction={activeCardModal.prediction}
          memberName={activeCardModal.memberName}
        />
      )}
    </div>
  );
};
