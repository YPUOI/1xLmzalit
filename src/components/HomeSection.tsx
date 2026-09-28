import React from 'react';
import { 
  Trophy, 
  Award, 
  Users, 
  Sparkles, 
  FileText,
  Clock, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
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

  // 2. Leaderboard with just standings (rank, member, points)
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

  // Helper to format remaining time
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
      {/* 1. TOP HERO CARD: THE STAGE IS SET                                        */}
      {/* ========================================================================= */}
      <section 
        aria-label="Details - The stage is set"
        className="relative rounded-2xl overflow-hidden bg-[#11212D] p-5 sm:p-7 border border-[#253745] shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Clean editorial kicker (zero-pill discipline) */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9BA8AB] tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A5C6A]" />
              <span>UEFA Champions League 2026/2027</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#CCD0CF] leading-tight">
              {t('stageIsSet')}
            </h1>

            {/* Details Description */}
            <p className="text-[#9BA8AB] text-xs sm:text-sm font-normal leading-relaxed">
              {t('heroDescription')}
            </p>

            {/* Tournament Features */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#9BA8AB]">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#CCD0CF] shrink-0" />
                <span className="text-[#CCD0CF] font-medium">{t('highlightKnockouts')}</span>
              </div>
              <span aria-hidden="true" className="text-[#4A5C6A]">·</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#CCD0CF] shrink-0" />
                <span className="text-[#CCD0CF] font-medium">{t('highlightAccuracy')}</span>
              </div>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="shrink-0 w-full md:w-auto flex flex-row md:flex-col gap-2.5">
            <button
              onClick={() => onNavigate('matches')}
              className="bg-[#CCD0CF] hover:bg-white text-[#06141B] flex-1 md:flex-initial px-5 py-3 rounded-xl font-bold text-xs text-center cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200"
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>{t('startPredictingBtn')}</span>
            </button>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] border border-[#253745] px-4 py-3 rounded-xl font-semibold text-xs text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] flex-1 md:flex-initial"
            >
              <Award className="w-4 h-4 text-[#CCD0CF] shrink-0" />
              <span>{t('tabLeaderboardShort')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MIDDLE ROW: STANDINGS & AVAILABLE MATCHES                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 2A: LEADERBOARD STANDINGS */}
        <div 
          onClick={() => onNavigate('leaderboard')}
          className="bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] rounded-2xl p-4 sm:p-5 cursor-pointer flex flex-col justify-between group transition-all duration-200"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#253745] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#CCD0CF] group-hover:text-white transition-colors">
                    {t('photoStandingsOnly')}
                  </h2>
                  <span className="text-[11px] text-[#9BA8AB] block font-normal">
                    {t('noExtraDetailsNotice')}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#9BA8AB] group-hover:text-[#CCD0CF] transition-transform ${isRtl ? 'rotate-180' : ''}`} />
            </div>

            {/* Standings List */}
            {approvedUsers.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#9BA8AB]">
                {language === 'ar' ? 'لا يوجد أعضاء في الترتيب حالياً' : language === 'fr' ? 'Aucun membre classé pour l\'instant' : 'No ranked members yet'}
              </div>
            ) : (
              <div className="space-y-1.5">
                {approvedUsers.slice(0, 5).map((u, idx) => (
                  <div
                    key={u.username}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-all ${
                      idx === 0 
                        ? 'bg-amber-500/10 border-amber-400/50 text-[#CCD0CF]' 
                        : idx === 1 
                        ? 'bg-slate-400/10 border-slate-300/40 text-[#CCD0CF]' 
                        : idx === 2
                        ? 'bg-amber-800/15 border-amber-700/40 text-[#CCD0CF]'
                        : 'bg-cyan-950/20 border-cyan-500/30 text-[#CCD0CF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-black shrink-0 shadow-sm ${
                        idx === 0 
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-[#06141B] ring-1 ring-amber-300' 
                          : idx === 1 
                          ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-[#06141B] ring-1 ring-slate-200' 
                          : idx === 2
                          ? 'bg-gradient-to-br from-amber-600 to-orange-500 text-white ring-1 ring-amber-500'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`font-semibold truncate max-w-[140px] ${
                        idx === 0 ? 'text-amber-200 font-bold' : idx === 1 ? 'text-slate-100' : idx === 2 ? 'text-amber-300' : 'text-[#CCD0CF]'
                      }`}>
                        {u.username}
                      </span>
                    </div>
                    <span className={`font-mono font-bold shrink-0 ${
                      idx === 0 ? 'text-amber-300' : idx === 1 ? 'text-slate-200' : idx === 2 ? 'text-amber-400' : 'text-[#CCD0CF]'
                    }`}>
                      {u.points || 0} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-[#253745] flex items-center justify-between text-xs font-semibold text-[#CCD0CF] group-hover:text-white transition-colors">
            <span>{t('tabLeaderboardShort')}</span>
            <span className="font-mono text-[#9BA8AB] text-[11px]">{approvedUsers.length} {language === 'ar' ? 'أعضاء' : language === 'fr' ? 'membres' : 'members'}</span>
          </div>
        </div>

        {/* CARD 2B: AVAILABLE MATCHES TO PREDICT */}
        <div 
          onClick={() => onNavigate('matches')}
          className="bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] rounded-2xl p-4 sm:p-5 cursor-pointer flex flex-col justify-between group transition-all duration-200"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#253745] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#CCD0CF] group-hover:text-white transition-colors">
                    {t('photoMatchesOnly')}
                  </h2>
                  <span className="text-[11px] text-[#9BA8AB] block font-normal">
                    {t('justTimeLeftNotice')}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#9BA8AB] group-hover:text-[#CCD0CF] transition-transform ${isRtl ? 'rotate-180' : ''}`} />
            </div>

            {/* Matches List */}
            {openMatches.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#9BA8AB]">
                {language === 'ar' ? 'لا توجد مباريات متاحة للتوقع حالياً' : language === 'fr' ? 'Aucun match ouvert actuellement' : 'No available matches currently'}
              </div>
            ) : (
              <div className="space-y-1.5">
                {openMatches.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-xs gap-2"
                  >
                    <div className="text-[#CCD0CF] font-semibold truncate flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{getTeamEnglishName(m.homeTeam)}</span>
                      <span className="text-[#9BA8AB] font-normal text-[10px] px-0.5">vs</span>
                      <span className="truncate">{getTeamEnglishName(m.awayTeam)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-[#CCD0CF] shrink-0 bg-[#253745] px-2 py-0.5 rounded border border-[#4A5C6A]">
                      <Clock className="w-3 h-3 text-[#CCD0CF]" />
                      <span>{formatTimeRemaining(m.deadline)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-[#253745] flex items-center justify-between text-xs font-semibold text-[#CCD0CF] group-hover:text-white transition-colors">
            <span>{t('tabMatchesShort')}</span>
            <span className="font-mono text-[#9BA8AB] text-[11px]">{openMatches.length} {language === 'ar' ? 'مباريات' : language === 'fr' ? 'matchs' : 'matches'}</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. LOWER ROW: LATEST PREDICTIONS & RULES IN BRIEF                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD 3A: LATEST PREDICTIONS FOR EACH MEMBER (Span 2 on md) */}
        <div 
          onClick={() => onNavigate('members_predictions')}
          className="md:col-span-2 bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] rounded-2xl p-4 sm:p-5 cursor-pointer flex flex-col justify-between group transition-all duration-200"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#253745] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#CCD0CF] group-hover:text-white transition-colors">
                    {t('photoLatestPreds')}
                  </h2>
                  <span className="text-[11px] text-[#9BA8AB] block font-normal">
                    {language === 'ar' ? 'تظهر التوقعات فور إغلاق مهلة كل مباراة' : language === 'fr' ? 'Visibles dès la clôture de chaque match' : 'Unlocked automatically after kickoff deadline'}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#9BA8AB] group-hover:text-[#CCD0CF] transition-transform ${isRtl ? 'rotate-180' : ''}`} />
            </div>

            {memberLatestPreds.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#9BA8AB] space-y-1">
                <p className="font-semibold text-[#CCD0CF]">
                  {language === 'ar' ? 'باب التوقعات ما زال مفتوحاً لجميع المباريات' : language === 'fr' ? 'Les votes sont encore ouverts pour tous les matchs' : 'Deadlines have not passed yet'}
                </p>
                <p className="text-[11px] text-[#9BA8AB]">
                  {language === 'ar' ? 'ستظهر توقعات الأعضاء هنا تلقائياً بعد صافرة البداية' : language === 'fr' ? 'Les pronostics apparaîtront ici après le coup d\'envoi' : 'Members\' predictions will appear here immediately after kickoff'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {memberLatestPreds.map(({ pred, match }) => (
                  <div 
                    key={`${pred.username}-${pred.matchId}`}
                    className="p-2.5 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[#CCD0CF] block truncate">{pred.username}</span>
                      <span className="text-[11px] text-[#9BA8AB] block truncate">
                        {getTeamEnglishName(match.homeTeam)} × {getTeamEnglishName(match.awayTeam)}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-[#CCD0CF] bg-[#253745] px-2 py-0.5 rounded border border-[#4A5C6A]">
                        {pred.homeScore} - {pred.awayScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-[#253745] flex items-center justify-between text-xs font-semibold text-[#CCD0CF] group-hover:text-white transition-colors">
            <span>{t('tabMembersPredictionsShort')}</span>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* CARD 3B: POINTS CALCULATING RULES IN BRIEF (Span 1 on md) */}
        <div 
          onClick={() => onNavigate('rules')}
          className="bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] rounded-2xl p-4 sm:p-5 cursor-pointer flex flex-col justify-between group transition-all duration-200"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#253745] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#CCD0CF] group-hover:text-white transition-colors">
                    {t('photoRulesBrief')}
                  </h2>
                  <span className="text-[11px] font-mono text-[#CCD0CF] font-semibold block">
                    5 + 3 + 1 pts
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#9BA8AB] group-hover:text-[#CCD0CF] transition-transform ${isRtl ? 'rotate-180' : ''}`} />
            </div>

            {/* Brief Rules */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#06141B] border border-[#253745]">
                <span className="font-medium text-[#CCD0CF]">
                  {language === 'ar' ? 'النتيجة الدقيقة' : language === 'fr' ? 'Score Exact' : 'Exact Score'}
                </span>
                <span className="font-mono font-bold text-[#CCD0CF] bg-[#253745] px-2 py-0.5 rounded border border-[#4A5C6A]">
                  +5 pts
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#06141B] border border-[#253745]">
                <span className="font-medium text-[#CCD0CF]">
                  {language === 'ar' ? 'رجل المباراة (MVP)' : language === 'fr' ? 'Homme du Match (MVP)' : 'Man of the Match'}
                </span>
                <span className="font-mono font-bold text-[#CCD0CF] bg-[#253745] px-2 py-0.5 rounded border border-[#4A5C6A]">
                  +3 pts
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#06141B] border border-[#253745]">
                <span className="font-medium text-[#CCD0CF]">
                  {language === 'ar' ? 'مسجل الهدف' : language === 'fr' ? 'Buteur' : 'Goalscorer'}
                </span>
                <span className="font-mono font-bold text-[#CCD0CF] bg-[#253745] px-2 py-0.5 rounded border border-[#4A5C6A]">
                  +1 pt
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#253745] flex items-center justify-between text-xs font-semibold text-[#CCD0CF] group-hover:text-white transition-colors">
            <span>{t('tabRulesShort')}</span>
            <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. UEFA AND FIFA OFFICIAL SITES FOOTER BANNER                             */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#11212D] border border-[#253745] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0">
            <Sparkles className="w-4 h-4 text-[#CCD0CF]" />
          </div>
          <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
            <span className="text-xs font-bold text-[#CCD0CF] block">
              {t('photoOfficialLogos')}
            </span>
            <span className="text-[11px] text-[#9BA8AB] font-normal block">
              {language === 'ar' ? 'روابط مباشرة إلى المواقع الرسمية للاتحادات الكروية' : language === 'fr' ? 'Liens officiels vers les fédérations de football' : 'Direct official links to UEFA & FIFA'}
            </span>
          </div>
        </div>

        {/* Action badges for UEFA and FIFA */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://www.uefa.com/uefachampionsleague/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#253745] hover:bg-[#4A5C6A] border border-[#253745] text-[#CCD0CF] hover:text-white text-xs font-semibold transition-all duration-200 active:scale-[0.98]"
            title={t('visitUefa')}
          >
            <span>UEFA.com</span>
            <ExternalLink className="w-3 h-3 text-[#9BA8AB]" />
          </a>

          <a
            href="https://www.fifa.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#253745] hover:bg-[#4A5C6A] border border-[#253745] text-[#CCD0CF] hover:text-white text-xs font-semibold transition-all duration-200 active:scale-[0.98]"
            title={t('visitFifa')}
          >
            <span>FIFA.com</span>
            <ExternalLink className="w-3 h-3 text-[#9BA8AB]" />
          </a>
        </div>
      </div>

    </div>
  );
};
