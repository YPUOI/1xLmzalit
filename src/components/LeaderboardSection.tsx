import React, { useMemo } from 'react';
import { Crown, Medal, UserCheck, Star, Trophy, Award, Flame, Target, Sparkles } from 'lucide-react';
import { AppUser, Match, Prediction } from '../types';

interface LeaderboardSectionProps {
  users: AppUser[];
  matches?: Match[];
  predictions?: Record<string, Prediction>;
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ 
  users, 
  matches = [], 
  predictions = {} 
}) => {
  // Calculate statistics per user (exact score count, correct MVP count, and correct Scorers count)
  const userStats = useMemo(() => {
    const stats: Record<string, { exactScoreCount: number; correctMvpCount: number; correctScorersCount: number }> = {};

    matches.forEach(match => {
      if (match.status === 'SETTLED' && match.result) {
        const res = match.result;
        Object.values(predictions).forEach(pred => {
          if (pred.matchId === match.id) {
            if (!stats[pred.username]) {
              stats[pred.username] = { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };
            }
            // Check Exact Score
            if (pred.homeScore === res.homeScore && pred.awayScore === res.awayScore) {
              stats[pred.username].exactScoreCount += 1;
            }
            // Check MVP
            if (pred.mvp && res.mvp && pred.mvp.trim().toLowerCase() === res.mvp.trim().toLowerCase()) {
              stats[pred.username].correctMvpCount += 1;
            }
            // Check Scorers
            (pred.homeScorers || []).forEach(sc => {
              if (sc && res.homeScorers.includes(sc)) {
                stats[pred.username].correctScorersCount += 1;
              }
            });
            (pred.awayScorers || []).forEach(sc => {
              if (sc && res.awayScorers.includes(sc)) {
                stats[pred.username].correctScorersCount += 1;
              }
            });
          }
        });
      }
    });

    return stats;
  }, [matches, predictions]);

  // Sort approved users according to strict 4-tier ranking rules:
  // 1. Total Points
  // 2. Most MVP predicted
  // 3. Most scorers predicted
  // 4. Account creation date (earliest wins)
  const approvedUsers = useMemo(() => {
    return users
      .filter(u => (u.status === 'approved' || !u.status) && u.role !== 'admin')
      .sort((a, b) => {
        // 1. Total Points (descending)
        const ptsDiff = (b.points || 0) - (a.points || 0);
        if (ptsDiff !== 0) return ptsDiff;

        // 2. Most MVP predicted (descending)
        const aMvp = userStats[a.username]?.correctMvpCount || 0;
        const bMvp = userStats[b.username]?.correctMvpCount || 0;
        if (bMvp !== aMvp) return bMvp - aMvp;

        // 3. Most scorers predicted (descending)
        const aScorers = userStats[a.username]?.correctScorersCount || 0;
        const bScorers = userStats[b.username]?.correctScorersCount || 0;
        if (bScorers !== aScorers) return bScorers - aScorers;

        // 4. Account creation date (ascending: earlier date wins)
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 9999999999999;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 9999999999999;
        if (aTime !== bTime) return aTime - bTime;

        return a.username.localeCompare(b.username);
      });
  }, [users, userStats]);

  return (
    <div className="ucl-card p-4 sm:p-6 rounded-3xl ucl-gold-glow border border-yellow-500/20 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-yellow-400 flex items-center gap-2.5">
            <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 fill-amber-400 shrink-0" />
            <span>جدول ترتيب المتوقعين</span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            يُعتمد نظام كسر التعادل الرسمي: النقاط &larr; الأكثر توقعاً لرجل المباراة (MVP) &larr; الأكثر توقعاً للهدافين &larr; أسبقية التسجيل.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>تحديث فوري للنقاط</span>
          </span>
        </div>
      </div>

      {approvedUsers.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800">
          لا يوجد متوقعون مقبولون حالياً. بمجرد موافقة الآدمن على طلبات الأعضاء وتسجيل النقاط ستظهر النتائج هنا.
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Touch-optimized Cards (sm:hidden) */}
          <div className="space-y-3 sm:hidden">
            {approvedUsers.map((user, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const stats = userStats[user.username] || { correctMvpCount: 0, correctScorersCount: 0 };

              return (
                <div 
                  key={user.username}
                  className={`p-3.5 rounded-2xl border transition flex flex-col gap-2.5 ${
                    isFirst 
                      ? 'bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-slate-900 border-yellow-500/40 shadow-lg shadow-yellow-500/10'
                      : isSecond
                      ? 'bg-slate-900/80 border-slate-600/50'
                      : isThird
                      ? 'bg-slate-900/80 border-amber-700/50'
                      : 'bg-slate-900/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Badge */}
                      <div className="shrink-0 flex items-center justify-center w-8">
                        {isFirst ? (
                          <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 flex items-center justify-center font-black text-sm">
                            <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                          </div>
                        ) : isSecond ? (
                          <div className="w-8 h-8 rounded-xl bg-slate-700/30 text-slate-200 border border-slate-500/30 flex items-center justify-center font-black text-xs">
                            <Medal className="w-4 h-4 text-slate-300" />
                          </div>
                        ) : isThird ? (
                          <div className="w-8 h-8 rounded-xl bg-amber-900/30 text-amber-500 border border-amber-600/30 flex items-center justify-center font-black text-xs">
                            <Medal className="w-4 h-4 text-amber-600" />
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">#{index + 1}</span>
                        )}
                      </div>

                      {/* User Avatar & Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isFirst 
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {user.username.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-sm text-white truncate block">
                            {user.username}
                          </span>
                          <span className="text-[10px] text-blue-300 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-blue-400" />
                            عضو معتمد
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Points Badge */}
                    <div className="shrink-0 flex items-center gap-1 bg-slate-950/80 border border-yellow-500/30 px-3 py-1.5 rounded-xl font-black text-amber-300 text-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{user.points || 0}</span>
                    </div>
                  </div>

                  {/* Tie-Breaker Sub-Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-yellow-400" />
                      <span>دقيقة: <strong className="text-yellow-300 font-bold">{stats.exactScoreCount}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-purple-400" />
                      <span>MVP: <strong className="text-purple-300 font-bold">{stats.correctMvpCount}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-emerald-400" />
                      <span>هدافين: <strong className="text-emerald-300 font-bold">{stats.correctScorersCount}</strong></span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABLET & DESKTOP VIEW: Full Data Table (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <th className="p-4">المركز</th>
                  <th className="p-4">اسم المتوقع</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">النتائج الدقيقة</th>
                  <th className="p-4 text-center">نجوم اللقاء (MVP)</th>
                  <th className="p-4 text-center">الهدافون المصابون</th>
                  <th className="p-4 text-center">إجمالي النقاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {approvedUsers.map((user, index) => {
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isThird = index === 2;
                  const stats = userStats[user.username] || { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };

                  return (
                    <tr 
                      key={user.username} 
                      className="hover:bg-slate-900/50 transition group"
                    >
                      <td className="p-4 font-black">
                        {isFirst ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-300 text-base">
                            <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span>#1</span>
                          </span>
                        ) : isSecond ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-200">
                            <Medal className="w-4 h-4 text-slate-300" />
                            <span>#2</span>
                          </span>
                        ) : isThird ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-600">
                            <Medal className="w-4 h-4 text-amber-600" />
                            <span>#3</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">#{index + 1}</span>
                        )}
                      </td>

                      <td className="p-4 font-bold text-white flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          isFirst ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
                          {user.username.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="group-hover:text-yellow-300 transition">{user.username}</span>
                      </td>

                      <td className="p-4 text-xs font-semibold text-slate-400">
                        <span className="inline-flex items-center gap-1 bg-blue-950/60 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                          <UserCheck className="w-3 h-3 text-blue-400" />
                          <span>عضو معتمد</span>
                        </span>
                      </td>

                      {/* Exact Scores column */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-yellow-950/40 text-yellow-300 border border-yellow-800/40 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                          <Target className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{stats.exactScoreCount}</span>
                        </span>
                      </td>

                      {/* MVP Tie-breaker column */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-purple-950/40 text-purple-300 border border-purple-800/40 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                          <Award className="w-3.5 h-3.5 text-purple-400" />
                          <span>{stats.correctMvpCount}</span>
                        </span>
                      </td>

                      {/* Scorers Tie-breaker column */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                          <Flame className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{stats.correctScorersCount}</span>
                        </span>
                      </td>

                      {/* Total Points */}
                      <td className="p-4 text-center font-black text-amber-400 text-lg">
                        <div className="flex items-center justify-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 py-1 px-3 rounded-xl mx-auto w-fit">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span>{user.points || 0}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
