import React from 'react';
import { 
  Trophy, 
  Award, 
  Users, 
  Sparkles, 
  Clock, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Match, AppUser, Prediction } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTeamEnglishName } from '../data/clubPresets';

interface HomeSectionProps {
  currentUser: AppUser | null;
  matches: Match[];
  users: AppUser[];
  predictions: Record<string, Prediction>;
  onNavigate: (tab: 'home' | 'matches' | 'members_predictions' | 'leaderboard' | 'rules' | 'admin') => void;
  onOpenAuth: (roleOrTab: 'user' | 'admin' | 'login' | 'signup') => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  currentUser,
  matches,
  users,
  predictions,
  onNavigate,
  onOpenAuth
}) => {
  const { t, isRtl, language } = useLanguage();

  // 1. Available matches to predict (just time left and teams)
  const openMatches = matches
    .filter(m => m.status === 'OPEN' && new Date(m.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // 2. Leaderboard with just standings (rank, member, points - no extra details)
  const approvedUsers = users
    .filter(u => u.status === 'approved' && u.role !== 'admin')
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  // 3. Closed/Settled matches for "latest prediction for each member (after deadline)"
  const closedMatches = matches.filter(m => m.status === 'SETTLED' || new Date(m.deadline) <= new Date());
  const closedMatchIds = new Set(closedMatches.map(m => m.id));

  // Filter predictions belonging to closed matches
  const closedPredictions = Object.values(predictions).filter(p => closedMatchIds.has(p.matchId));

  // Group latest prediction per member
  const memberLatestPredsMap = new Map<string, { pred: Prediction; match: Match }>();
  for (const pred of closedPredictions) {
    const match = closedMatches.find(m => m.id === pred.matchId);
    if (!match) continue;
    const existing = memberLatestPredsMap.get(pred.username);
    if (!existing || (pred.updatedAt || '') > (existing.pred.updatedAt || '')) {
      memberLatestPredsMap.set(pred.username, { pred, match });
    }
  }
  const memberLatestPreds = Array.from(memberLatestPredsMap.values()).slice(0, 4);

  // Helper to format remaining time nicely
  const formatTimeRemaining = (deadlineStr: string) => {
    const diffMs = new Date(deadlineStr).getTime() - Date.now();
    if (diffMs <= 0) return language === 'fr' ? 'Expiré' : language === 'en' ? 'Expired' : 'انتهى';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return language === 'fr' ? `${days}j restants` : language === 'en' ? `${days}d left` : `${days} يوم`;
    }
    if (hours > 0) {
      return language === 'fr' ? `${hours}h ${mins}m` : language === 'en' ? `${hours}h ${mins}m` : `${hours} س ${mins} د`;
    }
    return language === 'fr' ? `${mins} min` : language === 'en' ? `${mins}m left` : `${mins} دقيقة`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 select-none pb-4">
      
      {/* ========================================================================= */}
      {/* 1. TOP CARD: DETAILS (THE STAGE IS SET....)                               */}
      {/* ========================================================================= */}
      <section 
        aria-label="Details - The stage is set"
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#10172A] via-[#0D1527] to-[#070B19] p-5 sm:p-7 border border-slate-800 shadow-2xl"
      >
        {/* Ambient atmosphere glows */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/35 text-[#00E5FF] text-[10px] sm:text-xs font-black tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
              <span>UEFA CHAMPIONS LEAGUE 2026/2027</span>
            </div>

            {/* Headline: The Stage is Set / Le décor est planté / المسرح جاهز */}
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase font-sans drop-shadow-sm leading-snug">
              {t('stageIsSet')}
            </h1>

            {/* Details Description */}
            <p className="text-[#E2E8F0] text-xs sm:text-sm font-semibold leading-relaxed">
              {t('heroDescription')}
            </p>

            {/* Tournament Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="bg-[#080C19]/90 text-slate-200 border border-slate-800 px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span>{t('highlightKnockouts')}</span>
              </span>
              <span className="bg-[#080C19]/90 text-slate-200 border border-slate-800 px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t('highlightAccuracy')}</span>
              </span>
            </div>
          </div>

          {/* Quick CTA */}
          <div className="shrink-0 w-full md:w-auto flex flex-row md:flex-col gap-2">
            <button
              onClick={() => onNavigate('matches')}
              className="ucl-btn-primary flex-1 md:flex-initial px-5 py-3 rounded-2xl font-black text-xs text-center cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,229,255,0.35)] active:scale-95 transition-all"
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>{t('startPredictingBtn')}</span>
            </button>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="bg-[#080C19] hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 py-3 rounded-2xl font-bold text-xs text-center transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 flex-1 md:flex-initial"
            >
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('tabLeaderboardShort')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MIDDLE ROW:                                                            */}
      {/* Left: LEADERBOARD (STANDINGS ONLY)                                       */}
      {/* Right: AVAILABLE MATCHES TO PREDICT (JUST TIME LEFT AND TEAMS)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
        
        {/* CARD 2A: LEADERBOARD WITH JUST STANDINGS NO EXTRA DETAILS */}
        <div 
          onClick={() => onNavigate('leaderboard')}
          className="bg-[#10172A] hover:bg-[#131E35] border border-slate-800 hover:border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                    {t('photoStandingsOnly')}
                  </h2>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {t('noExtraDetailsNotice')}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
            </div>

            {/* Standings List: Just rank, name, points */}
            {approvedUsers.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-bold">
                {language === 'ar' ? 'لا يوجد أعضاء في الترتيب حالياً' : language === 'fr' ? 'Aucun membre classé pour l\'instant' : 'No ranked members yet'}
              </div>
            ) : (
              <div className="space-y-1.5">
                {approvedUsers.slice(0, 5).map((u, idx) => (
                  <div
                    key={u.username}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#080C19] border border-slate-800/80 text-xs font-bold"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        idx === 0 
                          ? 'bg-amber-400 text-slate-950 shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                          : idx === 1 
                          ? 'bg-slate-300 text-slate-950' 
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-white truncate max-w-[130px]">
                        {u.username}
                      </span>
                    </div>
                    <span className="font-mono font-black text-[#00E5FF] shrink-0">
                      {u.points || 0} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-amber-400 group-hover:underline">
            <span>{t('tabLeaderboardShort')}</span>
            <span className="font-mono text-slate-400 text-[10px]">{approvedUsers.length} {language === 'ar' ? 'أعضاء' : language === 'fr' ? 'membres' : 'members'}</span>
          </div>
        </div>

        {/* CARD 2B: AVAILABLE MATCHES TO PREDICT (JUST TIME LEFT AND TEAMS) */}
        <div 
          onClick={() => onNavigate('matches')}
          className="bg-[#10172A] hover:bg-[#131E35] border border-slate-800 hover:border-[#00E5FF]/40 rounded-3xl p-4 sm:p-5 shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white group-hover:text-[#00E5FF] transition-colors">
                    {t('photoMatchesOnly')}
                  </h2>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {t('justTimeLeftNotice')}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-500 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
            </div>

            {/* Matches List: Just teams and time left */}
            {openMatches.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-bold">
                {language === 'ar' ? 'لا توجد مباريات متاحة للتوقع حالياً' : language === 'fr' ? 'Aucun match ouvert actuellement' : 'No available matches currently'}
              </div>
            ) : (
              <div className="space-y-1.5">
                {openMatches.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#080C19] border border-slate-800/80 text-xs font-bold gap-2"
                  >
                    <div className="text-white truncate flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{getTeamEnglishName(m.homeTeam)}</span>
                      <span className="text-[#00E5FF] font-black text-[10px] px-1 font-mono">VS</span>
                      <span className="truncate">{getTeamEnglishName(m.awayTeam)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeRemaining(m.deadline)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-[#00E5FF] group-hover:underline">
            <span>{t('tabMatchesShort')}</span>
            <span className="font-mono text-slate-400 text-[10px]">{openMatches.length} {language === 'ar' ? 'مباريات' : language === 'fr' ? 'matchs' : 'matches'}</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. LOWER ROW:                                                             */}
      {/* Left: LATEST PREDICTION FOR EACH MEMBER (AFTER DEADLINE)                  */}
      {/* Right: POINTS CALCULATING RULES IN BRIEF                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
        
        {/* CARD 3A: LATEST PREDICTION FOR EACH MEMBER (AFTER DEADLINE) (Span 2 on md) */}
        <div 
          onClick={() => onNavigate('members_predictions')}
          className="md:col-span-2 bg-[#10172A] hover:bg-[#131E35] border border-slate-800 hover:border-[#00E5FF]/40 rounded-3xl p-4 sm:p-5 shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00E5FF] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white group-hover:text-[#00E5FF] transition-colors">
                    {t('photoLatestPreds')}
                  </h2>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {language === 'ar' ? 'تظهر التوقعات فور إغلاق مهلة كل مباراة' : language === 'fr' ? 'Visibles dès la clôture de chaque match' : 'Unlocked automatically after kickoff deadline'}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-500 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
            </div>

            {memberLatestPreds.length === 0 ? (
              <div className="text-center py-5 text-xs text-slate-400 space-y-1">
                <p className="font-bold">
                  {language === 'ar' ? 'باب التوقعات ما زال مفتوحاً لجميع المباريات' : language === 'fr' ? 'Les votes sont encore ouverts pour tous les matchs' : 'Deadlines have not passed yet'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {language === 'ar' ? 'ستظهر توقعات الأعضاء هنا تلقائياً بعد صافرة البداية' : language === 'fr' ? 'Les pronostics apparaîtront ici après le coup d\'envoi' : 'Members\' predictions will appear here immediately after kickoff'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {memberLatestPreds.map(({ pred, match }) => (
                  <div 
                    key={`${pred.username}-${pred.matchId}`}
                    className="p-2.5 rounded-xl bg-[#080C19] border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-black text-white block truncate">{pred.username}</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {getTeamEnglishName(match.homeTeam)} × {getTeamEnglishName(match.awayTeam)}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-[#00E5FF] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                        {pred.homeScore} - {pred.awayScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-[#00E5FF] group-hover:underline">
            <span>{t('tabMembersPredictionsShort')}</span>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* CARD 3B: POINTS CALCULATING RULES IN BRIEF (Span 1 on md) */}
        <div 
          onClick={() => onNavigate('rules')}
          className="bg-[#10172A] hover:bg-[#131E35] border border-slate-800 hover:border-[#00E5FF]/40 rounded-3xl p-4 sm:p-5 shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white group-hover:text-[#00E5FF] transition-colors">
                    {t('photoRulesBrief')}
                  </h2>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                    5 + 3 + 1
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-500 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
            </div>

            {/* Brief Rules */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#080C19] border border-slate-800/80">
                <span className="font-bold text-slate-200">
                  {language === 'ar' ? 'النتيجة الدقيقة' : language === 'fr' ? 'Score Exact' : 'Exact Score'}
                </span>
                <span className="font-mono font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                  +5 pts
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#080C19] border border-slate-800/80">
                <span className="font-bold text-slate-200">
                  {language === 'ar' ? 'رجل المباراة (MVP)' : language === 'fr' ? 'Homme du Match (MVP)' : 'Man of the Match'}
                </span>
                <span className="font-mono font-black text-[#00E5FF] bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/60">
                  +3 pts
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#080C19] border border-slate-800/80">
                <span className="font-bold text-slate-200">
                  {language === 'ar' ? 'مسجل الهدف' : language === 'fr' ? 'Buteur' : 'Goalscorer'}
                </span>
                <span className="font-mono font-black text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                  +1 pt
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-[#00E5FF] group-hover:underline">
            <span>{t('tabRulesShort')}</span>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. UEFA AND FIFA OFFICIAL LOGOS (LEADS TO THEIR OFFICIAL SITES)           */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#0A1122]/90 border border-slate-800 p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
            <span className="text-xs font-black text-white block">
              {t('photoOfficialLogos')}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block">
              {language === 'ar' ? 'روابط مباشرة إلى المواقع الرسمية للاتحادات الكروية' : language === 'fr' ? 'Liens officiels vers les fédérations de football' : 'Direct official links to UEFA & FIFA'}
            </span>
          </div>
        </div>

        {/* Action badges for UEFA and FIFA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://www.uefa.com/uefachampionsleague/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#041E34] hover:bg-[#062846] border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-black tracking-wider transition active:scale-95 shadow-sm"
            title={t('visitUefa')}
          >
            <span>UEFA.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <a
            href="https://www.fifa.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06152B] hover:bg-[#0B1E3B] border border-blue-500/40 text-blue-300 text-xs font-black tracking-wider transition active:scale-95 shadow-sm"
            title={t('visitFifa')}
          >
            <span>FIFA.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

    </div>
  );
};
