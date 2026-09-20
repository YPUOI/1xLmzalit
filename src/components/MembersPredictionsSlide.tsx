import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Lock, 
  Clock, 
  CheckCircle2, 
  Award, 
  Flame, 
  ShieldCheck, 
  Search, 
  Trophy, 
  ChevronDown,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Match, Team, Prediction, AppUser } from '../types';

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
  const [selectedMatchId, setSelectedMatchId] = useState<string>('ALL');
  const [searchMember, setSearchMember] = useState<string>('');

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

  // Helper to calculate points for a settled prediction
  const getPredictionPoints = (pred: Prediction, match: Match) => {
    if (match.status !== 'SETTLED' || !match.result) return null;
    const res = match.result;
    let total = 0;
    let exactScore = false;
    let scorersCount = 0;
    let correctMvp = false;

    if (pred.homeScore === res.homeScore && pred.awayScore === res.awayScore) {
      total += 5;
      exactScore = true;
    }

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

    if (pred.mvp && res.mvp && pred.mvp.trim().toLowerCase() === res.mvp.trim().toLowerCase()) {
      total += 3;
      correctMvp = true;
    }

    return { total, exactScore, scorersCount, correctMvp };
  };

  return (
    <div className="space-y-6">
      {/* Slide Header */}
      <div className="ucl-card p-5 sm:p-6 rounded-3xl border border-cyan-500/30 ucl-card-glow relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#080C19] border border-[#00E5FF]/40 text-xs font-black text-[#00E5FF] mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>الشفافية الرسمية لمجتمع الأصدقاء</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#00E5FF]" />
              <span>توقعات الأعضاء المعتمدة</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1.5 max-w-2xl leading-relaxed">
              تُعرض هنا كافة التوقعات الأخيرة المعتمدة للأعضاء التي تم تسجيلها قبل انتهاء المهلة (Deadline). تظهر التوقعات فور إغلاق باب التوقع للمباراة لضمان العدالة والنزاهة الكاملة.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#080C19] p-2.5 rounded-2xl border border-slate-800 self-start md:self-auto">
            <div className="text-center px-3 border-l border-slate-800">
              <span className="block text-[10px] text-slate-400 font-bold">مباريات مغلقة</span>
              <span className="text-base font-black text-[#00E5FF]">{lockedMatches.length}</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-[10px] text-slate-400 font-bold">مباريات جارية</span>
              <span className="text-base font-black text-yellow-400">{upcomingMatches.length}</span>
            </div>
          </div>
        </div>

        {/* Search and Match Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
          {/* Search by member name */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="ابحث باسم المتسابق أو الصديق..."
              className="w-full bg-[#080C19] border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#00E5FF] transition"
            />
          </div>

          {/* Filter by Match Dropdown */}
          {lockedMatches.length > 0 && (
            <div className="sm:w-72 relative">
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full bg-[#080C19] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF] appearance-none cursor-pointer"
              >
                <option value="ALL">جميع المباريات المغلقة ({lockedMatches.length})</option>
                {lockedMatches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.homeTeam} ضد {m.awayTeam} {m.status === 'SETTLED' ? '(منتهية)' : '(مغلقة)'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* When NO matches have reached their deadline yet */}
      {lockedMatches.length === 0 && (
        <div className="ucl-card p-8 rounded-3xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#00E5FF] mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-black text-white">باب التوقعات ما زال مفتوحاً</h3>
            <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
              لم تنتهِ مهلة التوقع (Deadline) لأي مباراة بعد. ستظهر توقعات جميع الأصدقاء هنا تلقائياً في هذه الصفحة فور إغلاق باب التوقع وبدء المباريات.
            </p>
          </div>

          {upcomingMatches.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 max-w-xl mx-auto text-right">
              <h4 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>المباريات القادمة ومواعيد الإغلاق (Deadlines):</span>
              </h4>
              <div className="space-y-2">
                {upcomingMatches.map(m => (
                  <div key={m.id} className="p-3 bg-[#080C19] border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-black text-white">{m.homeTeam} × {m.awayTeam}</span>
                    <span className="text-cyan-400 font-mono text-[11px]">
                      إغلاق: {new Date(m.deadline).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
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
        const home = teams[match.homeTeam] || { name: match.homeTeam, logo: '', squad: [] };
        const away = teams[match.awayTeam] || { name: match.awayTeam, logo: '', squad: [] };

        // Collect all predictions for this match
        const matchPreds = Object.values(predictions)
          .filter(p => p.matchId === match.id)
          .filter(p => !searchMember.trim() || p.username.toLowerCase().includes(searchMember.trim().toLowerCase()));

        return (
          <div key={match.id} className="ucl-card p-5 sm:p-6 rounded-3xl border border-slate-800/80 space-y-5">
            {/* Match Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {match.homeTeam} × {match.awayTeam}
                    </h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      match.status === 'SETTLED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {match.status === 'SETTLED' ? 'تم اعتماد النتيجة' : 'انتهت المهلة ومغلقة'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    موعد الإغلاق: {new Date(match.deadline).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {/* Match Result if settled */}
              {match.status === 'SETTLED' && match.result && (
                <div className="bg-[#080C19] border border-yellow-500/30 px-4 py-2 rounded-2xl flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">النتيجة النهائية:</span>
                  <span className="text-lg font-black text-yellow-400 font-mono">
                    {match.result.homeScore} - {match.result.awayScore}
                  </span>
                  {match.result.mvp && (
                    <span className="text-[10px] text-purple-300 bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded-md font-bold">
                      MVP: {match.result.mvp}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* List of Predictions for this match */}
            {matchPreds.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-[#080C19]/50 rounded-2xl border border-slate-800/60">
                {searchMember.trim() 
                  ? `لا توجد توقعات مسجلة تطابق البحث "${searchMember}".` 
                  : 'لم يقم أي عضو بتسجيل توقع لهذه المباراة قبل انتهاء المهلة.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {matchPreds.map(pred => {
                  const ptsInfo = getPredictionPoints(pred, match);
                  return (
                    <div 
                      key={pred.username}
                      className="bg-[#080C19]/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition space-y-3 relative overflow-hidden"
                    >
                      {/* Member Info & Score Banner */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-black text-xs text-slate-950 shrink-0">
                            {pred.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {pred.username}
                            </span>
                            {pred.updatedAt && (
                              <span className="text-[9px] text-slate-500 block">
                                {new Date(pred.updatedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Predicted Score Badge */}
                        <div className="bg-[#10172A] border border-[#00E5FF]/40 px-3 py-1.5 rounded-xl text-center shrink-0">
                          <span className="text-[10px] text-slate-400 block font-bold leading-none mb-0.5">توقعه</span>
                          <span className="text-sm font-black text-[#00E5FF] font-mono leading-none">
                            {pred.homeScore} - {pred.awayScore}
                          </span>
                        </div>
                      </div>

                      {/* Scorers & MVP Details */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                        {/* Home Scorers */}
                        {pred.homeScore > 0 && (
                          <div className="flex items-start gap-1.5 text-slate-300">
                            <Flame className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-slate-400 text-[10px] shrink-0">أهداف {home.name}:</span>
                            <span className="font-semibold text-white truncate">
                              {(pred.homeScorers || []).join('، ') || 'لم يُحدد'}
                            </span>
                          </div>
                        )}

                        {/* Away Scorers */}
                        {pred.awayScore > 0 && (
                          <div className="flex items-start gap-1.5 text-slate-300">
                            <Flame className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-slate-400 text-[10px] shrink-0">أهداف {away.name}:</span>
                            <span className="font-semibold text-white truncate">
                              {(pred.awayScorers || []).join('، ') || 'لم يُحدد'}
                            </span>
                          </div>
                        )}

                        {/* MVP */}
                        {pred.mvp && (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Award className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="text-slate-400 text-[10px] shrink-0">رجل اللقاء:</span>
                            <span className="font-bold text-purple-300 truncate">{pred.mvp}</span>
                          </div>
                        )}
                      </div>

                      {/* Settled Points Breakdown if Match is Settled */}
                      {ptsInfo && (
                        <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold">النقاط المحصودة:</span>
                          <div className="flex items-center gap-1.5">
                            {ptsInfo.exactScore && (
                              <span className="text-[9px] bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-1.5 py-0.5 rounded font-bold">
                                دقيقة (+5)
                              </span>
                            )}
                            {ptsInfo.correctMvp && (
                              <span className="text-[9px] bg-purple-500/20 border border-purple-500/40 text-purple-200 px-1.5 py-0.5 rounded font-bold">
                                MVP (+3)
                              </span>
                            )}
                            {ptsInfo.scorersCount > 0 && (
                              <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                هدافين (+{ptsInfo.scorersCount})
                              </span>
                            )}
                            <span className="text-xs font-black text-yellow-400 bg-yellow-950/60 border border-yellow-800/80 px-2 py-0.5 rounded-lg">
                              +{ptsInfo.total} نقطة
                            </span>
                          </div>
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
    </div>
  );
};
