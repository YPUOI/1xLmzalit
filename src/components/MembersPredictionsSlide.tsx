import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Lock, 
  Clock, 
  Search, 
  ChevronDown,
  Flame,
  Award,
  Download,
  ShieldCheck
} from 'lucide-react';
import { Match, Team, Prediction, AppUser } from '../types';
import { PredictionCardModal } from './PredictionCardModal';
import { useLanguage } from '../i18n/LanguageContext';
import { getTeamEnglishName } from '../data/clubPresets';
import { formatEnglishDeadlineMorocco } from '../utils/moroccoTime';

interface MembersPredictionsSlideProps {
  matches: Match[];
  teams: Record<string, Team>;
  predictions: Record<string, Prediction>;
  users: AppUser[];
}

export const MembersPredictionsSlide: React.FC<MembersPredictionsSlideProps> = ({
  matches,
  teams,
  predictions,
  users
}) => {
  const { t, isRtl, language } = useLanguage();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('ALL');
  const [searchMember, setSearchMember] = useState<string>('');
  const [activeCardModal, setActiveCardModal] = useState<{
    match: Match;
    homeTeam: Team;
    awayTeam: Team;
    prediction: Prediction;
    memberName: string;
  } | null>(null);

  const dateLocale = language === 'ar' ? 'ar-EG' : language === 'fr' ? 'fr-FR' : 'en-US';

  const openPredictionCard = (match: Match, pred: Prediction) => {
    const home = teams[match.homeTeam] || { name: match.homeTeam, logo: '', squad: [] };
    const away = teams[match.awayTeam] || { name: match.awayTeam, logo: '', squad: [] };
    setActiveCardModal({
      match,
      homeTeam: home,
      awayTeam: away,
      prediction: pred,
      memberName: pred.username
    });
  };

  const now = new Date();

  // Determine matches that have passed their deadline
  const lockedMatches = useMemo(() => {
    return matches.filter(m => {
      const isPastDeadline = new Date(m.deadline) <= now;
      return isPastDeadline || m.status === 'SETTLED';
    }).sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  }, [matches, now]);

  // Upcoming matches that are still waiting for deadline
  const upcomingMatches = useMemo(() => {
    return matches.filter(m => {
      const isPastDeadline = new Date(m.deadline) <= now;
      return !isPastDeadline && m.status === 'OPEN';
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [matches, now]);

  // Filtered locked matches based on user tab selection
  const displayedMatches = useMemo(() => {
    if (selectedMatchId === 'ALL') {
      return lockedMatches;
    }
    return lockedMatches.filter(m => m.id === selectedMatchId);
  }, [lockedMatches, selectedMatchId]);

  // Helper to calculate points for a settled prediction (5 pts exact, 3 pts MVP, 1 pt per goalscorer)
  const getPredictionPoints = (pred: Prediction, match: Match) => {
    if (match.status !== 'SETTLED' || !match.result) return null;
    const res = match.result;
    let total = 0;
    let exactScore = false;
    let scorersCount = 0;
    let correctMvp = false;

    // Rule 1: Exact Score (+5)
    if (pred.homeScore === res.homeScore && pred.awayScore === res.awayScore) {
      total += 5;
      exactScore = true;
    }

    // Rule 2: Goal Scorers (+1 per scorer)
    (pred.homeScorers || []).forEach(sc => {
      if (sc && res.homeScorers.includes(sc)) {
        total += 1;
        scorersCount++;
      }
    });
    (pred.awayScorers || []).forEach(sc => {
      if (sc && res.awayScorers.includes(sc)) {
        total += 1;
        scorersCount++;
      }
    });

    // Rule 3: Man of the Match MVP (+3)
    if (pred.mvp && res.mvp && pred.mvp.trim().toLowerCase() === res.mvp.trim().toLowerCase()) {
      total += 3;
      correctMvp = true;
    }

    return { total, exactScore, scorersCount, correctMvp };
  };

  return (
    <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Slide Header */}
      <div className="bg-[#11212D] p-4 sm:p-6 rounded-2xl border border-[#253745] relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9BA8AB] mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#CCD0CF]" />
              <span>{t('brandName')}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#CCD0CF] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#CCD0CF]" />
              <span>{t('membersPredTitle')}</span>
            </h2>
            <p className="text-xs text-[#9BA8AB] mt-1 max-w-2xl leading-relaxed">
              {t('membersPredDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#06141B] p-2 rounded-xl border border-[#253745] self-start md:self-auto">
            <div className={`text-center px-3 ${isRtl ? 'border-l' : 'border-r'} border-[#253745]`}>
              <span className="block text-[10px] text-[#9BA8AB] font-medium">{t('settledMatches')}</span>
              <span className="text-sm font-bold text-[#CCD0CF] font-mono">{lockedMatches.length}</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-[10px] text-[#9BA8AB] font-medium">{t('upcomingMatches')}</span>
              <span className="text-sm font-bold text-[#CCD0CF] font-mono">{upcomingMatches.length}</span>
            </div>
          </div>
        </div>

        {/* Search and Match Filter Bar */}
        <div className="mt-4 pt-3.5 border-t border-[#253745] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-10">
          {/* Search by member name */}
          <div className="relative flex-1">
            <Search className={`w-3.5 h-3.5 text-[#9BA8AB] absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 pointer-events-none`} />
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder={t('filterByUser')}
              className={`w-full bg-[#06141B] border border-[#253745] rounded-xl ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs text-[#CCD0CF] placeholder-[#9BA8AB] outline-none focus:border-[#4A5C6A] transition-all duration-200`}
            />
          </div>

          {/* Filter by Match Dropdown */}
          {lockedMatches.length > 0 && (
            <div className="sm:w-80 relative">
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full bg-[#06141B] border border-[#253745] rounded-xl px-3 py-2 text-xs text-[#CCD0CF] outline-none focus:border-[#4A5C6A] appearance-none cursor-pointer transition-all duration-200"
              >
                <option value="ALL">{t('allMatches')} ({lockedMatches.length})</option>
                {lockedMatches.map(m => (
                  <option key={m.id} value={m.id}>
                    {getTeamEnglishName(m.homeTeam)} × {getTeamEnglishName(m.awayTeam)} {m.status === 'SETTLED' ? `(${t('settledStatus')})` : `(${t('predictionLocked')})`}
                  </option>
                ))}
              </select>
              <ChevronDown className={`w-3.5 h-3.5 text-[#9BA8AB] absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 pointer-events-none`} />
            </div>
          )}
        </div>
      </div>

      {/* When NO matches have reached their deadline yet */}
      {lockedMatches.length === 0 && (
        <div className="bg-[#11212D] p-8 rounded-2xl border border-[#253745] text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-bold text-[#CCD0CF]">{t('predictionsStillOpenTitle')}</h3>
            <p className="text-xs text-[#9BA8AB] mt-1 leading-relaxed">
              {t('predictionsStillOpenDesc')}
            </p>
          </div>

          {upcomingMatches.length > 0 && (
            <div className="pt-3 border-t border-[#253745] max-w-lg mx-auto text-left">
              <h4 className="text-xs font-semibold text-[#CCD0CF] mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#CCD0CF]" />
                <span>{t('upcomingDeadlinesTitle')}</span>
              </h4>
              <div className="space-y-1.5">
                {upcomingMatches.map(m => (
                  <div key={m.id} className="p-2.5 bg-[#06141B] border border-[#253745] rounded-xl flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#CCD0CF]">{getTeamEnglishName(m.homeTeam)} × {getTeamEnglishName(m.awayTeam)}</span>
                    <span className="text-[#9BA8AB] font-mono text-[11px]">
                      {t('deadlinePrefix')} {formatEnglishDeadlineMorocco(m.deadline)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Display Locked Matches and Their Predictions */}
      {displayedMatches.map(match => {
        const homeEnglishName = getTeamEnglishName(match.homeTeam);
        const awayEnglishName = getTeamEnglishName(match.awayTeam);

        // Collect all predictions for this match
        const matchPreds = Object.values(predictions)
          .filter(p => p.matchId === match.id)
          .filter(p => !searchMember.trim() || p.username.toLowerCase().includes(searchMember.trim().toLowerCase()));

        return (
          <div key={match.id} className="bg-[#11212D] p-4 sm:p-5 rounded-2xl border border-[#253745] space-y-4 shadow-xl">
            {/* Match Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#253745]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#CCD0CF]">
                  <Lock className="w-3.5 h-3.5 text-[#CCD0CF]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#CCD0CF]">
                      {homeEnglishName} × {awayEnglishName}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A]">
                      {match.status === 'SETTLED' ? t('matchStatusSettled') : t('matchStatusClosed')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9BA8AB] mt-0.5">
                    {t('deadlineTimeLabel')} {formatEnglishDeadlineMorocco(match.deadline)}
                  </p>
                </div>
              </div>

              {/* Match Result if settled */}
              {match.status === 'SETTLED' && match.result && (
                <div className="bg-[#06141B] border border-[#253745] px-3 py-1.5 rounded-xl flex items-center gap-2.5">
                  <span className="text-xs text-[#9BA8AB]">{t('finalResultLabel')}</span>
                  <span className="text-base font-bold text-[#CCD0CF] font-mono">
                    {match.result.homeScore} - {match.result.awayScore}
                  </span>
                  {match.result.mvp && (
                    <span className="text-[10px] text-[#CCD0CF] bg-[#253745] border border-[#4A5C6A] px-1.5 py-0.5 rounded font-medium">
                      MVP: {match.result.mvp}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* List of Predictions for this match */}
            {matchPreds.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#9BA8AB] bg-[#06141B] rounded-xl border border-[#253745]">
                {searchMember.trim() 
                  ? `${t('noPredsFoundSearch')} "${searchMember}".` 
                  : t('noPredsSubmitted')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {matchPreds.map(pred => {
                  const ptsInfo = getPredictionPoints(pred, match);
                  return (
                    <div 
                      key={pred.username}
                      className="bg-[#06141B] border border-[#253745] hover:border-[#4A5C6A] rounded-xl p-3.5 transition-all duration-200 space-y-2.5"
                    >
                      {/* Member Info & Score Banner */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] flex items-center justify-center font-bold text-xs shrink-0">
                            {pred.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-[#CCD0CF] block truncate">
                              {pred.username}
                            </span>
                            {pred.updatedAt && (
                              <span className="text-[10px] text-[#9BA8AB] block font-mono">
                                {new Date(pred.updatedAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Predicted Score Badge */}
                        <div className="bg-[#11212D] border border-[#253745] px-2.5 py-1 rounded-lg text-center shrink-0">
                          <span className="text-[9px] text-[#9BA8AB] block font-medium leading-none mb-0.5">{t('predictedScoreLabel')}</span>
                          <span className="text-xs sm:text-sm font-bold text-[#CCD0CF] font-mono leading-none">
                            {pred.homeScore} - {pred.awayScore}
                          </span>
                        </div>
                      </div>

                      {/* Scorers & MVP Details */}
                      <div className="space-y-1 pt-2 border-t border-[#253745] text-[11px]">
                        {/* Home Scorers */}
                        {pred.homeScore > 0 && (
                          <div className="flex items-start gap-1.5 text-[#CCD0CF]">
                            <Flame className="w-3 h-3 text-[#CCD0CF] shrink-0 mt-0.5" />
                            <span className="text-[#9BA8AB] text-[10px] shrink-0">{t('goalsOf')} {homeEnglishName}:</span>
                            <span className="font-medium text-[#CCD0CF] truncate">
                              {(pred.homeScorers || []).join(', ') || t('notSpecified')}
                            </span>
                          </div>
                        )}

                        {/* Away Scorers */}
                        {pred.awayScore > 0 && (
                          <div className="flex items-start gap-1.5 text-[#CCD0CF]">
                            <Flame className="w-3 h-3 text-[#CCD0CF] shrink-0 mt-0.5" />
                            <span className="text-[#9BA8AB] text-[10px] shrink-0">{t('goalsOf')} {awayEnglishName}:</span>
                            <span className="font-medium text-[#CCD0CF] truncate">
                              {(pred.awayScorers || []).join(', ') || t('notSpecified')}
                            </span>
                          </div>
                        )}

                        {/* MVP */}
                        {pred.mvp && (
                          <div className="flex items-center gap-1.5 text-[#CCD0CF]">
                            <Award className="w-3 h-3 text-[#CCD0CF] shrink-0" />
                            <span className="text-[#9BA8AB] text-[10px] shrink-0">{t('motmShort')}</span>
                            <span className="font-semibold text-[#CCD0CF] truncate">{pred.mvp}</span>
                          </div>
                        )}
                      </div>

                      {/* Settled Points Breakdown if Match is Settled */}
                      {ptsInfo && (
                        <div className="pt-2 border-t border-[#253745] flex items-center justify-between">
                          <span className="text-[10px] text-[#9BA8AB] font-medium">{t('pointsEarnedColon')}</span>
                          <div className="flex items-center gap-1">
                            {ptsInfo.exactScore && (
                              <span className="text-[9px] bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] px-1.5 py-0.5 rounded font-medium">
                                {t('exactScoreBadge')}
                              </span>
                            )}
                            {ptsInfo.correctMvp && (
                              <span className="text-[9px] bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] px-1.5 py-0.5 rounded font-medium">
                                {t('mvpBadge')}
                              </span>
                            )}
                            {ptsInfo.scorersCount > 0 && (
                              <span className="text-[9px] bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] px-1.5 py-0.5 rounded font-medium">
                                +{ptsInfo.scorersCount}
                              </span>
                            )}
                            <span className="text-xs font-bold font-mono text-[#CCD0CF] bg-[#253745] border border-[#4A5C6A] px-1.5 py-0.5 rounded">
                              +{ptsInfo.total} pts
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Download Prediction Card Button */}
                      {!match.result && match.status !== 'SETTLED' ? (
                        <button
                          type="button"
                          onClick={() => openPredictionCard(match, pred)}
                          className="mt-2 w-full py-1.5 px-2 bg-[#253745] hover:bg-[#4A5C6A] border border-[#253745] text-[#CCD0CF] rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none active:scale-[0.98]"
                          title={t('downloadPredCard')}
                        >
                          <Download className="w-3 h-3 text-[#CCD0CF]" />
                          <span>{t('downloadPredCard')}</span>
                        </button>
                      ) : (
                        <div className="mt-1.5 text-center text-[10px] text-[#9BA8AB]">
                          {t('cardDownloadExpired')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

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
