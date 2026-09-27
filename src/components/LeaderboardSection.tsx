import React, { useMemo } from 'react';
import { Crown, Medal, UserCheck, Star, Trophy, Award, Flame, Target, Sparkles } from 'lucide-react';
import { AppUser, Match, Prediction } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t, isRtl } = useLanguage();

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
    <div className="bg-[#11212D] p-4 sm:p-6 rounded-2xl border border-[#253745] space-y-5 shadow-xl" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center pb-4 border-b border-[#253745] gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#CCD0CF] flex items-center gap-2.5">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#CCD0CF] shrink-0" />
            <span>{t('leaderboardTitle')}</span>
          </h2>
          <p className="text-xs text-[#9BA8AB] mt-1">
            {t('leaderboardDesc')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#CCD0CF]" />
            <span>{t('tabLeaderboardShort')}</span>
          </span>
        </div>
      </div>

      {approvedUsers.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#9BA8AB] bg-[#06141B] rounded-xl border border-[#253745]">
          {t('noApprovedUsers')}
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Cards (sm:hidden) */}
          <div className="space-y-2.5 sm:hidden">
            {approvedUsers.map((user, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const stats = userStats[user.username] || { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };

              return (
                <div 
                  key={user.username}
                  className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-2.5 ${
                    isFirst 
                      ? 'bg-[#11212D] border-[#4A5C6A]'
                      : isSecond
                      ? 'bg-[#11212D] border-[#253745]'
                      : isThird
                      ? 'bg-[#11212D] border-[#253745]'
                      : 'bg-[#06141B] border-[#253745]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Badge */}
                      <div className="shrink-0 flex items-center justify-center w-7">
                        {isFirst ? (
                          <div className="w-7 h-7 rounded-lg bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] flex items-center justify-center">
                            <Crown className="w-3.5 h-3.5 text-[#CCD0CF]" />
                          </div>
                        ) : isSecond ? (
                          <div className="w-7 h-7 rounded-lg bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] flex items-center justify-center">
                            <Medal className="w-3.5 h-3.5 text-[#CCD0CF]" />
                          </div>
                        ) : isThird ? (
                          <div className="w-7 h-7 rounded-lg bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] flex items-center justify-center">
                            <Medal className="w-3.5 h-3.5 text-[#CCD0CF]" />
                          </div>
                        ) : (
                          <span className="text-[#9BA8AB] font-mono text-xs font-semibold">#{index + 1}</span>
                        )}
                      </div>

                      {/* User Avatar & Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A]">
                          {user.username.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-[#CCD0CF] truncate block">
                            {user.username}
                          </span>
                          <span className="text-[10px] text-[#9BA8AB] flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-[#9BA8AB]" />
                            {t('memberBadge')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Points Badge */}
                    <div className="shrink-0 flex items-center gap-1.5 bg-[#253745] border border-[#4A5C6A] px-2.5 py-1 rounded-lg font-mono font-bold text-[#CCD0CF] text-xs sm:text-sm">
                      <Star className="w-3.5 h-3.5 text-[#CCD0CF]" />
                      <span>{user.points || 0} pts</span>
                    </div>
                  </div>

                  {/* Tie-Breaker Sub-Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#253745] text-[10px] text-[#9BA8AB]">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-[#9BA8AB]" />
                      <span>{t('exactScoresCount')}: <strong className="text-[#CCD0CF] font-mono font-medium">{stats.exactScoreCount}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#9BA8AB]" />
                      <span>MVP: <strong className="text-[#CCD0CF] font-mono font-medium">{stats.correctMvpCount}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#9BA8AB]" />
                      <span>{t('scorersCount')}: <strong className="text-[#CCD0CF] font-mono font-medium">{stats.correctScorersCount}</strong></span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABLET & DESKTOP VIEW: Clean Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} border-collapse`}>
              <thead>
                <tr className="border-b border-[#253745] text-[#9BA8AB] text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{t('rank')}</th>
                  <th className="py-3 px-4">{t('member')}</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">{t('exactScoresCount')}</th>
                  <th className="py-3 px-4 text-center">{t('mvpCount')}</th>
                  <th className="py-3 px-4 text-center">{t('scorersCount')}</th>
                  <th className="py-3 px-4 text-center">{t('totalPoints')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#253745]">
                {approvedUsers.map((user, index) => {
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isThird = index === 2;
                  const stats = userStats[user.username] || { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };

                  return (
                    <tr 
                      key={user.username} 
                      className="hover:bg-[#253745]/40 transition-colors group text-xs sm:text-sm"
                    >
                      <td className="py-3 px-4 font-bold font-mono">
                        {isFirst ? (
                          <span className="inline-flex items-center gap-1.5 text-[#CCD0CF]">
                            <Crown className="w-4 h-4 text-[#CCD0CF]" />
                            <span>#1</span>
                          </span>
                        ) : isSecond ? (
                          <span className="inline-flex items-center gap-1.5 text-[#CCD0CF]">
                            <Medal className="w-4 h-4 text-[#CCD0CF]" />
                            <span>#2</span>
                          </span>
                        ) : isThird ? (
                          <span className="inline-flex items-center gap-1.5 text-[#CCD0CF]">
                            <Medal className="w-4 h-4 text-[#CCD0CF]" />
                            <span>#3</span>
                          </span>
                        ) : (
                          <span className="text-[#9BA8AB]">#{index + 1}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-semibold text-[#CCD0CF] flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A]">
                          {user.username.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="group-hover:text-white transition-colors">{user.username}</span>
                      </td>

                      <td className="py-3 px-4 text-xs font-normal text-[#9BA8AB]">
                        <span className="inline-flex items-center gap-1 bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] px-2 py-0.5 rounded">
                          <UserCheck className="w-3 h-3 text-[#9BA8AB]" />
                          <span>{t('memberBadge')}</span>
                        </span>
                      </td>

                      {/* Exact Scores column */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-[#CCD0CF]">
                          {stats.exactScoreCount}
                        </span>
                      </td>

                      {/* MVP Tie-breaker column */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-[#CCD0CF]">
                          {stats.correctMvpCount}
                        </span>
                      </td>

                      {/* Scorers Tie-breaker column */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-[#CCD0CF]">
                          {stats.correctScorersCount}
                        </span>
                      </td>

                      {/* Total Points */}
                      <td className="py-3 px-4 text-center font-bold text-[#CCD0CF]">
                        <div className="flex items-center justify-center gap-1.5 bg-[#253745] border border-[#4A5C6A] py-1 px-3 rounded-lg mx-auto w-fit font-mono">
                          <Star className="w-3.5 h-3.5 text-[#CCD0CF]" />
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
