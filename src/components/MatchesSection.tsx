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

// Live countdown timer showing remaining time in minutes and seconds
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
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#06141B] border border-[#253745] text-[#9BA8AB] text-[11px] font-medium shrink-0">
        <Clock className="w-3 h-3 text-[#9BA8AB]" />
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
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#253745] border border-rose-500/40 text-rose-300 text-xs font-semibold shrink-0"
        title="< 1h!"
      >
        <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span className="text-[11px] text-rose-200/90 hidden xs:inline">{t('timeLeft')}:</span>
        <span className="font-mono text-[#CCD0CF] text-xs font-bold tracking-wider bg-[#06141B] px-1.5 py-0.5 rounded border border-rose-500/40" dir="ltr">
          {pad(minutes)}:{pad(seconds)}
        </span>
        <span className="text-[10px] text-rose-300/80 font-medium hidden sm:inline">(&lt; 1h)</span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#06141B] border border-[#253745] text-[#CCD0CF] text-xs font-medium shrink-0"
      title={t('timeLeft')}
    >
      <Timer className="w-3.5 h-3.5 text-[#9BA8AB] shrink-0" />
      <span className="text-[11px] text-[#9BA8AB] hidden xs:inline">{t('timeLeft')}:</span>
      <span className="font-mono text-[#CCD0CF] text-xs font-bold tracking-wider bg-[#11212D] px-1.5 py-0.5 rounded border border-[#253745]" dir="ltr">
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
    const userPredKey = currentUser ? `${currentUser.username}_${match.id}` : null;
    const existing = userPredKey ? predictions[userPredKey] : null;

    if (draftPreds[match.id]) {
      return draftPreds[match.id];
    }

    if (existing) {
      return {
        homeScore: existing.homeScore,
        awayScore: existing.awayScore,
        homeScorers: [...(existing.homeScorers || [])],
        awayScorers: [...(existing.awayScorers || [])],
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

      const next = { ...current, ...updates };

      if (typeof updates.homeScore === 'number') {
        const diff = updates.homeScore - (next.homeScorers?.length || 0);
        if (diff > 0) {
          next.homeScorers = [...(next.homeScorers || []), ...Array(diff).fill('')];
        } else if (diff < 0) {
          next.homeScorers = (next.homeScorers || []).slice(0, updates.homeScore);
        }
      }

      if (typeof updates.awayScore === 'number') {
        const diff = updates.awayScore - (next.awayScorers?.length || 0);
        if (diff > 0) {
          next.awayScorers = [...(next.awayScorers || []), ...Array(diff).fill('')];
        } else if (diff < 0) {
          next.awayScorers = (next.awayScorers || []).slice(0, updates.awayScore);
        }
      }

      return { ...prev, [matchId]: next };
    });

    if (validationErrors[matchId]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[matchId];
        return copy;
      });
    }
  };

  const handleSave = (match: Match) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const draft = getDraft(match);

    // Strict validation: every goal must have a scorer assigned
    const missingHome: number[] = [];
    const missingAway: number[] = [];

    for (let i = 0; i < draft.homeScore; i++) {
      if (!draft.homeScorers[i] || !draft.homeScorers[i].trim()) {
        missingHome.push(i);
      }
    }

    for (let i = 0; i < draft.awayScore; i++) {
      if (!draft.awayScorers[i] || !draft.awayScorers[i].trim()) {
        missingAway.push(i);
      }
    }

    if (missingHome.length > 0 || missingAway.length > 0) {
      setMissingScorers(prev => ({
        ...prev,
        [match.id]: { home: missingHome, away: missingAway }
      }));

      const homeName = getTeamEnglishName(match.homeTeam);
      const awayName = getTeamEnglishName(match.awayTeam);

      let fullMessage = '';
      if (language === 'fr') {
        const parts: string[] = [];
        if (missingHome.length > 0) {
          parts.push(`Veuillez sélectionner le nom du buteur pour les buts manquants de ${homeName} (${missingHome.map(idx => `But ${idx + 1}`).join(', ')}).`);
        }
        if (missingAway.length > 0) {
          parts.push(`Veuillez sélectionner le nom du buteur pour les buts manquants de ${awayName} (${missingAway.map(idx => `But ${idx + 1}`).join(', ')}).`);
        }
        fullMessage = parts.join('\n');
      } else if (language === 'en') {
        const parts: string[] = [];
        if (missingHome.length > 0) {
          parts.push(`Please designate a scorer for each goal of ${homeName} (${missingHome.map(idx => `Goal ${idx + 1}`).join(', ')}).`);
        }
        if (missingAway.length > 0) {
          parts.push(`Please designate a scorer for each goal of ${awayName} (${missingAway.map(idx => `Goal ${idx + 1}`).join(', ')}).`);
        }
        fullMessage = parts.join('\n');
      } else {
        const parts: string[] = [];
        if (missingHome.length > 0) {
          parts.push(`يرجى تحديد اسم مسجل الهدف للأهداف المتبقية لفريق ${homeName} (${missingHome.map(idx => `الهدف ${idx + 1}`).join('، ')}).`);
        }
        if (missingAway.length > 0) {
          parts.push(`يرجى تحديد اسم مسجل الهدف للأهداف المتبقية لفريق ${awayName} (${missingAway.map(idx => `الهدف ${idx + 1}`).join('، ')}).`);
        }
        fullMessage = parts.join('\n');
      }

      setValidationErrors(prev => ({ ...prev, [match.id]: fullMessage }));
      return;
    }

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
    openPredictionCard(match, newPred);
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap justify-between items-center bg-[#11212D] p-4 rounded-2xl border border-[#253745] gap-4 shadow-xl" dir={isRtl ? 'rtl' : 'ltr'}>
        <h2 className="text-lg sm:text-xl font-bold text-[#CCD0CF] flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#CCD0CF]" />
          <span>{t('tabMatches')}</span>
        </h2>

        {currentUser && (
          <div className="bg-[#253745] border border-[#4A5C6A] px-3.5 py-1 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs text-[#CCD0CF]">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span><strong className="text-[#CCD0CF] text-sm sm:text-base font-mono">{currentUser.points || 0}</strong> {t('pointsCount')}</span>
          </div>
        )}
      </div>

      {/* Matches Grid */}
      {matches.length === 0 ? (
        <div className="bg-[#11212D] p-10 text-center rounded-2xl text-[#9BA8AB] border border-[#253745] shadow-xl">
          <CalendarX className="w-10 h-10 mx-auto mb-3 text-[#9BA8AB]/40" />
          <p className="font-semibold text-sm">{t('noMatchesFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
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
                className="bg-[#11212D] p-4 sm:p-6 rounded-2xl border border-[#253745] space-y-5 relative overflow-hidden transition-all duration-200 hover:border-[#4A5C6A] shadow-xl"
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {/* Match Status Bar */}
                <div className="flex flex-wrap justify-between items-center border-b border-[#253745] pb-3 gap-2.5">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold text-[#CCD0CF]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#9BA8AB] shrink-0" />
                      <span className="font-mono text-[#CCD0CF] tracking-wide" dir="ltr">{formatEnglishDeadline(match.deadline)}</span>
                    </div>

                    {/* Live Countdown Timer */}
                    <MatchCountdown deadline={match.deadline} status={match.status} />
                  </div>

                  <div className="flex items-center gap-2">
                    {currentUser && currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => onDeleteMatch(match)}
                        className="bg-[#253745] hover:bg-[#4A5C6A] text-rose-300 border border-rose-500/30 text-[11px] px-2.5 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 font-semibold cursor-pointer active:scale-95"
                        title="Delete Match"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}

                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${
                      match.status === 'SETTLED'
                        ? 'bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A]'
                        : isLocked
                        ? 'bg-[#253745] text-rose-300 border border-rose-500/30'
                        : 'bg-[#253745] text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {match.status === 'SETTLED' ? t('settledStatus') : isLocked ? t('predictionLocked') : t('openForPrediction')}
                    </span>
                  </div>
                </div>

                {/* Match Teams Faceoff */}
                <div className="grid grid-cols-3 items-center text-center gap-2 py-1" dir="ltr">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2.5 bg-[#06141B] rounded-2xl border border-[#253745] shrink-0 shadow-inner">
                      <img 
                        src={home.logo} 
                        alt={home.name} 
                        className="w-full h-full object-contain aspect-square" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1e293b/ffffff?text=Logo'; }}
                      />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-[#CCD0CF]">{getTeamEnglishName(home.name)}</span>
                  </div>

                  {/* VS / Score Result */}
                  <div className="flex flex-col items-center">
                    <span className="text-base sm:text-lg font-bold text-[#9BA8AB] font-mono tracking-widest">VS</span>
                    {match.result ? (
                      <div className="mt-2 text-base sm:text-lg font-bold bg-[#06141B] px-3.5 py-1 rounded-xl border border-[#253745] text-[#CCD0CF] shadow font-mono">
                        {match.result.homeScore} - {match.result.awayScore}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#9BA8AB] mt-1 font-mono">UCL 2026/2027</span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2.5 bg-[#06141B] rounded-2xl border border-[#253745] shrink-0 shadow-inner">
                      <img 
                        src={away.logo} 
                        alt={away.name} 
                        className="w-full h-full object-contain aspect-square"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1e293b/ffffff?text=Logo'; }}
                      />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-[#CCD0CF]">{getTeamEnglishName(away.name)}</span>
                  </div>
                </div>

                {/* Prediction Input & Details Area */}
                <div className="bg-[#06141B] p-4 rounded-xl border border-[#253745]">
                  {!currentUser ? (
                    <div className="text-center py-2">
                      <p className="text-xs text-[#CCD0CF] font-medium mb-2.5">
                        {t('memberLogin')}
                      </p>
                      <button
                        onClick={onOpenAuth}
                        className="bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold text-xs px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow"
                      >
                        {t('memberLogin')}
                      </button>
                    </div>
                  ) : isLocked ? (
                    <div className="text-center text-xs space-y-1 py-1">
                      {userPred ? (
                        <div>
                          <span className="text-[#9BA8AB]">{t('exactScore')}: </span>
                          <span className="text-[#CCD0CF] font-bold font-mono text-sm">{userPred.homeScore} - {userPred.awayScore}</span>
                          {userPred.mvp && (
                            <div className="text-[11px] text-[#9BA8AB] mt-1">
                              {t('manOfTheMatch')}: <strong className="text-[#CCD0CF] font-semibold">{userPred.mvp}</strong>
                            </div>
                          )}
                          {!match.result && match.status !== 'SETTLED' ? (
                            <div className="pt-2 flex justify-center">
                              <button
                                type="button"
                                onClick={() => openPredictionCard(match, userPred)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] border border-[#253745] text-[#CCD0CF] text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow active:scale-[0.98]"
                              >
                                <Download className="w-3.5 h-3.5 text-[#CCD0CF]" />
                                <span>{language === 'fr' ? 'Télécharger la carte de pronostic' : language === 'en' ? 'Download Prediction Card' : 'تحميل بطاقة التوقع (صورة)'}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="pt-1.5 text-[11px] text-[#9BA8AB]">
                              {language === 'fr' ? 'Le résultat officiel est publié, le téléchargement est clos.' : language === 'en' ? 'Official result announced; prediction card download closed.' : 'تم إعلان النتيجة الرسمية للمباراة وانتهت فترة تحميل بطاقة التوقع.'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#9BA8AB]">
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
                        <div className="p-3 rounded-xl bg-[#253745] border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2.5">
                          <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>
                            {language === 'fr' ? 'Alerte urgente : fermeture du match imminente (< 1 heure) ! Confirmez votre pronostic dès maintenant.' : language === 'en' ? 'Urgent notice: match deadline approaching (< 1 hour)! Finalize your prediction now.' : 'تنبيه عاجل: اقترب موعد إغلاق المباراة (أقل من ساعة واحدة)! احرص على إكمال وتثبيت توقعك الآن.'}
                          </span>
                        </div>
                      )}

                      {/* Score Inputs with Precision Steppers */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-[#11212D] p-2.5 sm:p-3 rounded-xl border border-[#253745] text-center">
                          <label className="block text-[11px] sm:text-xs font-semibold text-[#CCD0CF] mb-2 truncate">
                            {language === 'fr' ? `Buts ${getTeamEnglishName(home.name)}` : language === 'en' ? `${getTeamEnglishName(home.name)} Goals` : `أهداف ${getTeamEnglishName(home.name)}`}
                          </label>
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              onClick={() => updateDraft(match.id, { homeScore: Math.max(0, draft.homeScore - 1) })}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] font-bold flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 border border-[#253745] select-none shrink-0"
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
                              className="w-12 sm:w-14 bg-transparent text-center font-bold font-mono text-[#CCD0CF] text-xl sm:text-2xl outline-none force-ltr"
                            />
                            <button
                              type="button"
                              onClick={() => updateDraft(match.id, { homeScore: Math.min(15, draft.homeScore + 1) })}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] font-bold flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 border border-[#253745] select-none shrink-0"
                              title={language === 'fr' ? 'Ajouter but' : language === 'en' ? 'Increase goal' : 'زيادة هدف'}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[#11212D] p-2.5 sm:p-3 rounded-xl border border-[#253745] text-center">
                          <label className="block text-[11px] sm:text-xs font-semibold text-[#CCD0CF] mb-2 truncate">
                            {language === 'fr' ? `Buts ${getTeamEnglishName(away.name)}` : language === 'en' ? `${getTeamEnglishName(away.name)} Goals` : `أهداف ${getTeamEnglishName(away.name)}`}
                          </label>
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              onClick={() => updateDraft(match.id, { awayScore: Math.max(0, draft.awayScore - 1) })}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] font-bold flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 border border-[#253745] select-none shrink-0"
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
                              className="w-12 sm:w-14 bg-transparent text-center font-bold font-mono text-[#CCD0CF] text-xl sm:text-2xl outline-none force-ltr"
                            />
                            <button
                              type="button"
                              onClick={() => updateDraft(match.id, { awayScore: Math.min(15, draft.awayScore + 1) })}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] font-bold flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 border border-[#253745] select-none shrink-0"
                              title={language === 'fr' ? 'Ajouter but' : language === 'en' ? 'Increase goal' : 'زيادة هدف'}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Goal Scorers for Home */}
                      {draft.homeScore > 0 && (
                        <div className="p-3 sm:p-4 bg-[#11212D] rounded-xl border border-[#253745] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-[#CCD0CF]">
                              {language === 'fr' ? `Buteurs ${getTeamEnglishName(home.name)} (${draft.homeScore} ${draft.homeScore === 1 ? 'but' : 'buts'}):` : language === 'en' ? `${getTeamEnglishName(home.name)} Scorers (${draft.homeScore} ${draft.homeScore === 1 ? 'goal' : 'goals'}):` : `مسجلو أهداف ${getTeamEnglishName(home.name)} (${draft.homeScore} ${draft.homeScore === 1 ? 'هدف' : 'أهداف'}):`}
                            </label>
                            <span className="text-[10px] text-[#9BA8AB]">
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
                                      className={`w-full bg-[#06141B] border ${
                                        isMissing 
                                          ? 'border-rose-500 ring-2 ring-rose-500/40 bg-[#06141B] text-[#CCD0CF]' 
                                          : 'border-[#253745] text-[#CCD0CF] focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A]'
                                      } rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm outline-none min-h-[42px] cursor-pointer transition-all duration-200`}
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
                                      className={`w-full bg-[#06141B] border ${
                                        isMissing 
                                          ? 'border-rose-500 ring-2 ring-rose-500/40 bg-[#06141B] text-[#CCD0CF]' 
                                          : 'border-[#253745] text-[#CCD0CF] focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A]'
                                      } rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm outline-none min-h-[42px] transition-all duration-200`}
                                    />
                                  )}
                                  {isMissing && (
                                    <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
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

                      {/* Goal Scorers for Away */}
                      {draft.awayScore > 0 && (
                        <div className="p-3 sm:p-4 bg-[#11212D] rounded-xl border border-[#253745] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-[#CCD0CF]">
                              {language === 'fr' ? `Buteurs ${getTeamEnglishName(away.name)} (${draft.awayScore} ${draft.awayScore === 1 ? 'but' : 'buts'}):` : language === 'en' ? `${getTeamEnglishName(away.name)} Scorers (${draft.awayScore} ${draft.awayScore === 1 ? 'goal' : 'goals'}):` : `مسجلو أهداف ${getTeamEnglishName(away.name)} (${draft.awayScore} ${draft.awayScore === 1 ? 'هدف' : 'أهداف'}):`}
                            </label>
                            <span className="text-[10px] text-[#9BA8AB]">
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
                                      className={`w-full bg-[#06141B] border ${
                                        isMissing 
                                          ? 'border-rose-500 ring-2 ring-rose-500/40 bg-[#06141B] text-[#CCD0CF]' 
                                          : 'border-[#253745] text-[#CCD0CF] focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A]'
                                      } rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm outline-none min-h-[42px] cursor-pointer transition-all duration-200`}
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
                                      className={`w-full bg-[#06141B] border ${
                                        isMissing 
                                          ? 'border-rose-500 ring-2 ring-rose-500/40 bg-[#06141B] text-[#CCD0CF]' 
                                          : 'border-[#253745] text-[#CCD0CF] focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A]'
                                      } rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm outline-none min-h-[42px] transition-all duration-200`}
                                    />
                                  )}
                                  {isMissing && (
                                    <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
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
                        <label className="block text-xs font-semibold text-[#CCD0CF] mb-1.5 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-[#9BA8AB]" />
                          <span>{t('manOfTheMatch')}</span>
                        </label>
                        {[...(home.squad || []), ...(away.squad || [])].length > 0 ? (
                          <select
                            value={draft.mvp}
                            onChange={(e) => updateDraft(match.id, { mvp: e.target.value })}
                            className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 text-xs sm:text-sm text-[#CCD0CF] font-semibold outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] min-h-[42px] cursor-pointer transition-all duration-200"
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
                            className="w-full bg-[#06141B] border border-[#253745] rounded-xl p-3 text-xs sm:text-sm text-[#CCD0CF] font-semibold outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] min-h-[42px] transition-all duration-200"
                          />
                        )}
                      </div>

                      {/* Validation Error Banner */}
                      {validationErrors[match.id] && (
                        <div className={`p-3.5 rounded-xl bg-[#253745] border border-rose-500/40 text-rose-200 shadow space-y-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                          <div className="flex items-center gap-2 font-bold text-xs text-[#CCD0CF]">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>
                              {language === 'fr' ? 'Validation impossible : veuillez désigner tous les buteurs' : language === 'en' ? 'Validation Failed: Please complete all goalscorers' : 'تعذر التحقق من التوقع: يرجى إكمال مسجلي الأهداف'}
                            </span>
                          </div>
                          <div className={`text-xs leading-relaxed text-[#CCD0CF]/90 whitespace-pre-line ${isRtl ? 'pr-6' : 'pl-6'}`}>
                            {validationErrors[match.id]}
                          </div>
                        </div>
                      )}

                      {/* Save Button */}
                      <button
                        type="button"
                        onClick={() => handleSave(match)}
                        className="w-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold py-3 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 min-h-[44px] shadow active:scale-[0.98]"
                      >
                        <Save className="w-4 h-4" />
                        <span>{userPred ? t('editPrediction') : t('savePredictionBtn')}</span>
                      </button>

                      {userPred && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => openPredictionCard(match, userPred)}
                            className="w-full bg-[#253745] hover:bg-[#4A5C6A] border border-[#4A5C6A] text-[#CCD0CF] font-semibold py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 group active:scale-[0.98]"
                          >
                            <Download className="w-4 h-4 text-[#CCD0CF] group-hover:translate-y-0.5 transition-transform" />
                            <span>{t('downloadCard')}</span>
                          </button>

                          <div className="p-2.5 bg-[#11212D] border border-emerald-500/30 rounded-xl text-center">
                            <p className="text-xs text-emerald-300 font-medium flex items-center justify-center gap-1.5">
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
