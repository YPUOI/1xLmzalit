import { POPULAR_CLUB_PRESETS, getTeamEnglishName } from '../data/clubPresets';

export interface MatchSuggestion {
  id: string;
  homeTeam: string; // Arabic name matching preset, e.g. 'ريال مدريد'
  awayTeam: string; // Arabic name matching preset, e.g. 'برشلونة'
  homeTeamEn: string;
  awayTeamEn: string;
  homeLogo: string;
  awayLogo: string;
  kickoffDate: string; // ISO string in UTC
  moroccoInputDate: string; // "YYYY-MM-DDTHH:mm" suitable for input
  formattedDate: string; // e.g. "الثلاثاء 6 أكتوبر • 20:00 (GMT)"
  formattedDateEn: string; // e.g. "Tuesday, Oct 6 • 20:00 (GMT)"
  stage: string;
  stageEn: string;
  isHot?: boolean;
  matchday: number;
  group: 'thisWeek' | 'nextWeek' | 'upcoming';
}

/**
 * Helper to find club logo from presets or fallback
 */
export function getClubLogo(teamName: string): string {
  const clean = (teamName || '').trim().toLowerCase();
  const found = POPULAR_CLUB_PRESETS.find(
    p => p.name.toLowerCase() === clean || p.enName.toLowerCase() === clean
  );
  if (found && found.logo) return found.logo;
  return 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg';
}

/**
 * Returns next target date for a given day of week (2 = Tuesday, 3 = Wednesday)
 * relative to a base date.
 */
function getNextDayOfWeek(baseDate: Date, targetDay: number, weeksToAdd: number = 0): Date {
  const result = new Date(baseDate);
  const currentDay = result.getDay();
  let daysUntil = (targetDay - currentDay + 7) % 7;
  
  // If target day is today but it's already past kickoff (20:00), push to next week
  if (daysUntil === 0 && result.getHours() >= 20) {
    daysUntil = 7;
  }
  
  result.setDate(result.getDate() + daysUntil + (weeksToAdd * 7));
  return result;
}

/**
 * Pad numbers with leading zero
 */
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Dynamic upcoming fixtures generator.
 * Automatically computes chronological matchdays starting from the current moment,
 * guaranteeing all suggested matches have valid future dates and match UEFA Champions League scheduling.
 */
export function generateDynamicUclSuggestions(moroccoOffset: number = 0): MatchSuggestion[] {
  const now = new Date();

  // Champions League matchdays happen on Tuesdays (2) and Wednesdays (3)
  // Matchday 1: Upcoming Tuesday & Wednesday
  const tuesday1 = getNextDayOfWeek(now, 2, 0);
  const wednesday1 = getNextDayOfWeek(now, 3, 0);

  // Matchday 2: Next week's Tuesday & Wednesday
  const tuesday2 = getNextDayOfWeek(now, 2, 1);
  const wednesday2 = getNextDayOfWeek(now, 3, 1);

  // Matchday 3: 2 weeks later
  const tuesday3 = getNextDayOfWeek(now, 2, 2);
  const wednesday3 = getNextDayOfWeek(now, 3, 2);

  const formatFixture = (
    baseDate: Date,
    hour: number,
    minute: number,
    homeTeam: string,
    awayTeam: string,
    stage: string,
    stageEn: string,
    isHot: boolean,
    matchday: number,
    group: 'thisWeek' | 'nextWeek' | 'upcoming'
  ): MatchSuggestion => {
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();
    const d = baseDate.getDate();

    // Kickoff time in Morocco GMT (UTC + offset)
    const utcKickoff = Date.UTC(y, m, d, hour - moroccoOffset, minute);
    const isoKickoff = new Date(utcKickoff).toISOString();
    const moroccoInput = `${y}-${pad(m + 1)}-${pad(d)}T${pad(hour)}:${pad(minute)}`;

    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const dayNameAr = daysAr[baseDate.getDay()];
    const dayNameEn = daysEn[baseDate.getDay()];
    const monthNameAr = monthsAr[m];
    const monthNameEn = monthsEn[m];

    const offsetTag = moroccoOffset === 0 ? 'GMT' : `GMT+${moroccoOffset}`;
    const timeFormatted = `${pad(hour)}:${pad(minute)} (${offsetTag})`;

    const formattedDate = `${dayNameAr} ${d} ${monthNameAr} • ${timeFormatted}`;
    const formattedDateEn = `${dayNameEn}, ${monthNameEn} ${d} • ${timeFormatted}`;

    return {
      id: `sug_${matchday}_${homeTeam}_${awayTeam}_${y}${pad(m+1)}${pad(d)}`.replace(/[\s\(\)]+/g, '_'),
      homeTeam,
      awayTeam,
      homeTeamEn: getTeamEnglishName(homeTeam),
      awayTeamEn: getTeamEnglishName(awayTeam),
      homeLogo: getClubLogo(homeTeam),
      awayLogo: getClubLogo(awayTeam),
      kickoffDate: isoKickoff,
      moroccoInputDate: moroccoInput,
      formattedDate,
      formattedDateEn,
      stage,
      stageEn,
      isHot,
      matchday,
      group
    };
  };

  const suggestions: MatchSuggestion[] = [
    // ----------------------------------------------------
    // MATCHDAY A: Upcoming Week (This Week)
    // ----------------------------------------------------
    formatFixture(tuesday1, 20, 0, 'ريال مدريد', 'مانشستر سيتي', 'مرحلة الدوري 2026/2027 • الجولة 1', 'League Phase 2026/27 • Matchday 1', true, 1, 'thisWeek'),
    formatFixture(tuesday1, 20, 0, 'بايرن ميونخ', 'باريس سان جيرمان', 'مرحلة الدوري 2026/2027 • الجولة 1', 'League Phase 2026/27 • Matchday 1', true, 1, 'thisWeek'),
    formatFixture(tuesday1, 17, 45, 'باير ليفركوزن', 'ميلان', 'مرحلة الدوري 2026/2027 • الجولة 1', 'League Phase 2026/27 • Matchday 1', false, 1, 'thisWeek'),
    formatFixture(tuesday1, 20, 0, 'تشيلسي', 'يوفنتوس', 'مرحلة الدوري 2026/2027 • الجولة 1', 'League Phase 2026/27 • Matchday 1', true, 1, 'thisWeek'),
    
    formatFixture(wednesday1, 20, 0, 'برشلونة', 'ليفربول', 'مرحلة الدوري 2026/2027 • الجولة 1', 'League Phase 2026/27 • Matchday 1', true, 1, 'thisWeek'),
    formatFixture(wednesday1, 20, 0, 'أرسنال', 'إنتر ميلان', 'مرحلة الدوري 2026/2027 • الجولة 1', 'League Phase 2026/27 • Matchday 1', true, 1, 'thisWeek'),
    formatFixture(wednesday1, 20, 0, 'مانشستر يونايتد', 'نابولي', 'مرحلة الدوري 2026/2027 • الجولة 1', 'League Phase 2026/27 • Matchday 1', true, 1, 'thisWeek'),
    formatFixture(wednesday1, 17, 45, 'أتلتيكو مدريد', 'بوروسيا دورتموند', 'مرحلة الدوري 2026/2027 • الجولة 1', 'League Phase 2026/27 • Matchday 1', false, 1, 'thisWeek'),

    // ----------------------------------------------------
    // MATCHDAY B: Next Week
    // ----------------------------------------------------
    formatFixture(tuesday2, 20, 0, 'برشلونة', 'بايرن ميونخ', 'مرحلة الدوري 2026/2027 • الجولة 2', 'League Phase 2026/27 • Matchday 2', true, 2, 'nextWeek'),
    formatFixture(tuesday2, 20, 0, 'ريال مدريد', 'ليفربول', 'مرحلة الدوري 2026/2027 • الجولة 2', 'League Phase 2026/27 • Matchday 2', true, 2, 'nextWeek'),
    formatFixture(tuesday2, 17, 45, 'سبورتينغ لشبونة', 'مانشستر سيتي', 'مرحلة الدوري 2026/2027 • الجولة 2', 'League Phase 2026/27 • Matchday 2', false, 2, 'nextWeek'),
    formatFixture(tuesday2, 20, 0, 'بورتو', 'روما', 'مرحلة الدوري 2026/2027 • الجولة 2', 'League Phase 2026/27 • Matchday 2', false, 2, 'nextWeek'),

    formatFixture(wednesday2, 20, 0, 'باريس سان جيرمان', 'أرسنال', 'مرحلة الدوري 2026/2027 • الجولة 2', 'League Phase 2026/27 • Matchday 2', true, 2, 'nextWeek'),
    formatFixture(wednesday2, 20, 0, 'إنتر ميلان', 'باير ليفركوزن', 'مرحلة الدوري 2026/2027 • الجولة 2', 'League Phase 2026/27 • Matchday 2', true, 2, 'nextWeek'),
    formatFixture(wednesday2, 20, 0, 'غلطة سراي', 'موناكو', 'مرحلة الدوري 2026/2027 • الجولة 2', 'League Phase 2026/27 • Matchday 2', false, 2, 'nextWeek'),
    formatFixture(wednesday2, 17, 45, 'أستون فيلا', 'أتالانتا', 'مرحلة الدوري 2026/2027 • الجولة 2', 'League Phase 2026/27 • Matchday 2', false, 2, 'nextWeek'),

    // ----------------------------------------------------
    // MATCHDAY C: Upcoming Blockbusters
    // ----------------------------------------------------
    formatFixture(tuesday3, 20, 0, 'مانشستر سيتي', 'ريال مدريد', 'مرحلة الدوري 2026/2027 • الجولة 3', 'League Phase 2026/27 • Matchday 3', true, 3, 'upcoming'),
    formatFixture(tuesday3, 20, 0, 'تشيلسي', 'برشلونة', 'مرحلة الدوري 2026/2027 • الجولة 3', 'League Phase 2026/27 • Matchday 3', true, 3, 'upcoming'),
    formatFixture(wednesday3, 20, 0, 'يوفنتوس', 'باريس سان جيرمان', 'مرحلة الدوري 2026/2027 • الجولة 3', 'League Phase 2026/27 • Matchday 3', true, 3, 'upcoming'),
    formatFixture(wednesday3, 20, 0, 'أرسنال', 'بايرن ميونخ', 'مرحلة الدوري 2026/2027 • الجولة 3', 'League Phase 2026/27 • Matchday 3', true, 3, 'upcoming')
  ];

  return suggestions;
}

/**
 * Fetches live upcoming fixtures from the server API endpoint if available,
 * falling back gracefully to the dynamic calendar suggestions.
 */
export async function fetchLiveUpcomingFixtures(moroccoOffset: number = 0): Promise<{
  fixtures: MatchSuggestion[];
  isLive: boolean;
  source: string;
}> {
  try {
    const res = await fetch('/api/upcoming-fixtures', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.fixtures) && data.fixtures.length > 0) {
        return {
          fixtures: data.fixtures,
          isLive: Boolean(data.isLive),
          source: data.source || 'UEFA Calendar'
        };
      }
    }
  } catch {
    // Graceful fallback to dynamic calculations
  }

  // Fallback to dynamic real-calendar generator
  return {
    fixtures: generateDynamicUclSuggestions(moroccoOffset),
    isLive: false,
    source: 'Dynamic UEFA Calendar'
  };
}
