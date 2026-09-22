import React from 'react';
import { 
  Trophy, 
  Award, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  Clock, 
  ChevronRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Medal
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

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  // Filter pending vs settled matches
  const upcomingMatches = matches
    .filter(m => m.status === 'OPEN' && new Date(m.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const approvedUsers = users.filter(u => u.status === 'approved' && u.role !== 'admin');
  
  // Sorted leaderboard top 3 preview
  const topUsers = [...approvedUsers].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 3);

  // Total predictions submitted
  const totalPredictionsCount = Object.keys(predictions).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* GRAND UEFA CHAMPIONS LEAGUE WELCOMING HERO BANNER (The Second Photo Element) */}
      {/* ========================================================================= */}
      <section 
        aria-label="UEFA Champions League Hero Banner"
        className="relative rounded-3xl overflow-hidden bg-[#10172A] p-5 sm:p-8 md:p-10 border border-slate-800 shadow-2xl"
      >
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />
        <div className="absolute -top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Tournament Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/35 text-[#00E5FF] text-[11px] sm:text-xs font-black tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
              <span>UEFA CHAMPIONS LEAGUE 2026/2027</span>
            </div>

            {/* Translated Hero Headline: "المسرح جاهز" in Arabic, "LE DÉCOR EST PLANTÉ." in French, "THE STAGE IS SET." in English */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase font-sans drop-shadow-sm leading-tight">
              {t('stageIsSet')}
            </h1>

            <p className="text-[#E2E8F0] text-xs sm:text-sm md:text-base font-semibold leading-relaxed">
              {t('heroDescription')}
            </p>

            {/* Quick Tournament Highlights */}
            <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
              <span className="bg-[#080C19] text-[#E2E8F0] border border-slate-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span>{t('highlightKnockouts')}</span>
              </span>
              <span className="bg-[#080C19] text-[#E2E8F0] border border-slate-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                <span>{t('highlightInstantPoints')}</span>
              </span>
              <span className="bg-[#080C19] text-[#E2E8F0] border border-slate-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t('highlightAccuracy')}</span>
              </span>
              <span className="bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/35 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                <span>{t('highlightStages')}</span>
              </span>
            </div>
          </div>

          {/* Direct CTA Action Buttons */}
          <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2.5">
            <button
              onClick={() => onNavigate('matches')}
              className="ucl-btn-primary px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm text-center cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] active:scale-95 transition-all"
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>{t('startPredictingBtn')}</span>
              <ArrowIcon className="w-4 h-4 shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('leaderboard')}
              className="bg-[#080C19] hover:bg-slate-800 text-[#E2E8F0] border border-slate-800 px-5 py-3 rounded-2xl font-bold text-xs text-center transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('viewHonorBoardBtn')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* QUICK SECTION PORTALS (Separate Page Gateways) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Matches & Predictions */}
        <div 
          onClick={() => onNavigate('matches')}
          className="group cursor-pointer bg-[#0A1324]/90 hover:bg-[#0E1C36] border border-slate-800/90 hover:border-[#00E5FF]/50 rounded-2xl p-5 transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                {matches.length} {language === 'ar' ? 'مباراة' : language === 'fr' ? 'matchs' : 'matches'}
              </span>
            </div>

            <div>
              <h2 className="text-base font-black text-white group-hover:text-[#00E5FF] transition-colors flex items-center gap-1.5">
                <span>{t('quickMatchesTitle')}</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-1 line-clamp-2">
                {t('quickMatchesDesc')}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/70 flex items-center justify-between text-xs font-bold text-[#00E5FF] group-hover:underline">
            <span>{t('enterMatchesBtn')}</span>
            <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Members Predictions */}
        <div 
          onClick={() => onNavigate('members_predictions')}
          className="group cursor-pointer bg-[#0A1324]/90 hover:bg-[#0E1C36] border border-slate-800/90 hover:border-[#00E5FF]/50 rounded-2xl p-5 transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                {totalPredictionsCount} {language === 'ar' ? 'توقع' : language === 'fr' ? 'pronostics' : 'preds'}
              </span>
            </div>

            <div>
              <h2 className="text-base font-black text-white group-hover:text-[#00E5FF] transition-colors flex items-center gap-1.5">
                <span>{t('quickMembersTitle')}</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-1 line-clamp-2">
                {t('quickMembersDesc')}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/70 flex items-center justify-between text-xs font-bold text-[#00E5FF] group-hover:underline">
            <span>{t('enterMembersBtn')}</span>
            <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Leaderboard */}
        <div 
          onClick={() => onNavigate('leaderboard')}
          className="group cursor-pointer bg-[#0A1324]/90 hover:bg-[#0E1C36] border border-slate-800/90 hover:border-[#00E5FF]/50 rounded-2xl p-5 transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                {approvedUsers.length} {language === 'ar' ? 'عضو' : language === 'fr' ? 'membres' : 'members'}
              </span>
            </div>

            <div>
              <h2 className="text-base font-black text-white group-hover:text-[#00E5FF] transition-colors flex items-center gap-1.5">
                <span>{t('quickLeaderboardTitle')}</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-1 line-clamp-2">
                {t('quickLeaderboardDesc')}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/70 flex items-center justify-between text-xs font-bold text-[#00E5FF] group-hover:underline">
            <span>{t('enterLeaderboardBtn')}</span>
            <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Rules & Point System */}
        <div 
          onClick={() => onNavigate('rules')}
          className="group cursor-pointer bg-[#0A1324]/90 hover:bg-[#0E1C36] border border-slate-800/90 hover:border-[#00E5FF]/50 rounded-2xl p-5 transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                5 + 3 + 1
              </span>
            </div>

            <div>
              <h2 className="text-base font-black text-white group-hover:text-[#00E5FF] transition-colors flex items-center gap-1.5">
                <span>{t('quickRulesTitle')}</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-1 line-clamp-2">
                {t('quickRulesDesc')}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/70 flex items-center justify-between text-xs font-bold text-[#00E5FF] group-hover:underline">
            <span>{t('enterRulesBtn')}</span>
            <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* UPCOMING MATCHES & TOP LEADERBOARD PREVIEWS ON HOME */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Next Matches Preview (2 Cols on lg) */}
        <div className="lg:col-span-2 bg-[#091120]/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {language === 'ar' ? 'المواجهات القادمة ذات الأولوية' : language === 'fr' ? 'Prochains Chocs Européens' : 'Upcoming European Fixtures'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'ar' ? 'سارع بوضع توقعاتك قبل انتهاء المهل الرسمية' : language === 'fr' ? 'Pronostiquez avant la clôture officielle' : 'Submit your picks before match deadlines'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('matches')}
              className="text-xs font-bold text-[#00E5FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'ar' ? 'عرض الكل' : language === 'fr' ? 'Voir tout' : 'View all'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400/80" />
              <p className="text-xs font-bold">
                {language === 'ar' ? 'لا توجد مواجهات مفتوحة حالياً، انتظر إضافة مباريات جديدة!' : language === 'fr' ? 'Aucun match ouvert actuellement.' : 'No open matches currently scheduled.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingMatches.slice(0, 3).map((match) => (
                <div 
                  key={match.id}
                  onClick={() => onNavigate('matches')}
                  className="bg-[#060D1A] hover:bg-[#0B172E] border border-slate-800/90 hover:border-[#00E5FF]/40 rounded-2xl p-3.5 flex items-center justify-between transition cursor-pointer gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-black text-[#00E5FF] font-mono px-2 py-1 rounded-md bg-[#00E5FF]/10 border border-[#00E5FF]/20 shrink-0">
                      UCL
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      <span>{getTeamEnglishName(match.homeTeam)}</span>
                      <span className="text-[#00E5FF] mx-2 font-mono">VS</span>
                      <span>{getTeamEnglishName(match.awayTeam)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <span className="text-[11px] text-amber-400 font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(match.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button className="bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 text-[#00E5FF] p-1.5 rounded-xl transition">
                      <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Podium Preview (1 Col on lg) */}
        <div className="bg-[#091120]/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Medal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {language === 'ar' ? 'صدارة الترتيب' : language === 'fr' ? 'Top 3 Podium' : 'Top 3 Leaders'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'أفضل المتوقعين حالياً' : language === 'fr' ? 'Les meilleurs pronostiqueurs' : 'Top ranked members'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('leaderboard')}
                className="text-xs font-bold text-[#00E5FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'ar' ? 'الترتيب' : language === 'fr' ? 'Tableau' : 'Full'}</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {topUsers.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-bold">
                {language === 'ar' ? 'بانتظار تسجيل أولى النقاط' : language === 'fr' ? 'En attente des premiers points' : 'Waiting for first scored points'}
              </div>
            ) : (
              <div className="space-y-2">
                {topUsers.map((u, idx) => (
                  <div 
                    key={u.username}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#060D1A] border border-slate-800/80"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0 
                          ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                          : idx === 1 
                          ? 'bg-slate-300 text-slate-950' 
                          : 'bg-amber-700 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">
                        {u.username}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-black text-[#00E5FF]">
                      {u.points || 0} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('leaderboard')}
            className="w-full mt-4 py-2.5 bg-[#061122] hover:bg-[#0c1f3a] text-slate-300 hover:text-white border border-slate-800 hover:border-[#00E5FF]/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('viewHonorBoardBtn')}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
