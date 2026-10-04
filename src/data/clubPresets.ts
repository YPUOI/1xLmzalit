import { UCL_36_CLUBS_LIST } from './uclTeams36';

export interface ClubPreset {
  name: string;
  enName: string;
  logo: string;
  squad?: string[];
  country?: string;
}

/**
 * All 36 Official Participant Clubs of the UEFA Champions League League Phase
 * Complete with official verified crests, English/Arabic names, countries, and full 2024/25 squads.
 */
export const POPULAR_CLUB_PRESETS: ClubPreset[] = UCL_36_CLUBS_LIST.map((club) => ({
  name: club.name,
  enName: club.enName,
  logo: club.logo,
  squad: club.squad,
  country: club.country
}));

// Comprehensive English Name Mapping Dictionary for all UCL Teams & Arabic variations
export const ARABIC_TO_ENGLISH_TEAMS: Record<string, string> = {
  // Real Madrid
  'ريال مدريد': 'Real Madrid',
  'الريال': 'Real Madrid',
  'نادي ريال مدريد': 'Real Madrid',
  'Real Madrid': 'Real Madrid',

  // Barcelona
  'برشلونة': 'FC Barcelona',
  'البارسا': 'FC Barcelona',
  'نادي برشلونة': 'FC Barcelona',
  'Barcelona': 'FC Barcelona',
  'FC Barcelona': 'FC Barcelona',

  // Manchester City
  'مانشستر سيتي': 'Manchester City',
  'السيتي': 'Manchester City',
  'Manchester City': 'Manchester City',
  'Man City': 'Manchester City',

  // Liverpool
  'ليفربول': 'Liverpool',
  'الريدز': 'Liverpool',
  'Liverpool': 'Liverpool',

  // Arsenal
  'أرسنال': 'Arsenal',
  'ارسنال': 'Arsenal',
  'الغانرز': 'Arsenal',
  'Arsenal': 'Arsenal',

  // Bayern Munich
  'بايرن ميونخ': 'Bayern Munich',
  'البايرن': 'Bayern Munich',
  'Bayern Munich': 'Bayern Munich',
  'FC Bayern': 'Bayern Munich',

  // Paris Saint-Germain
  'باريس سان جيرمان': 'Paris Saint-Germain',
  'باريس': 'Paris Saint-Germain',
  'PSG': 'Paris Saint-Germain',
  'Paris Saint-Germain': 'Paris Saint-Germain',

  // Inter Milan
  'إنتر ميلان': 'Inter Milan',
  'انتر ميلان': 'Inter Milan',
  'الانتر': 'Inter Milan',
  'Inter Milan': 'Inter Milan',
  'Inter': 'Inter Milan',

  // AC Milan
  'ميلان': 'AC Milan',
  'إيه سي ميلان': 'AC Milan',
  'اي سي ميلان': 'AC Milan',
  'AC Milan': 'AC Milan',

  // Atletico Madrid
  'أتلتيكو مدريد': 'Atletico Madrid',
  'اتلتيكو مدريد': 'Atletico Madrid',
  'أتليتكو مدريد': 'Atletico Madrid',
  'Atletico Madrid': 'Atletico Madrid',
  'Atlético Madrid': 'Atletico Madrid',

  // Borussia Dortmund
  'بوروسيا دورتموند': 'Borussia Dortmund',
  'دورتموند': 'Borussia Dortmund',
  'Borussia Dortmund': 'Borussia Dortmund',
  'BVB': 'Borussia Dortmund',

  // Juventus
  'يوفنتوس': 'Juventus',
  'اليوفي': 'Juventus',
  'Juventus': 'Juventus',

  // Bayer Leverkusen
  'باير ليفركوزن': 'Bayer Leverkusen',
  'ليفركوزن': 'Bayer Leverkusen',
  'Bayer Leverkusen': 'Bayer Leverkusen',

  // Aston Villa
  'أستون فيلا': 'Aston Villa',
  'استون فيلا': 'Aston Villa',
  'Aston Villa': 'Aston Villa',

  // Sporting CP
  'سبورتينغ لشبونة': 'Sporting CP',
  'سبورتنج لشبونة': 'Sporting CP',
  'Sporting CP': 'Sporting CP',

  // Benfica
  'بنفيكا': 'Benfica',
  'Benfica': 'Benfica',

  // Atalanta
  'أتالانتا': 'Atalanta',
  'اتالانتا': 'Atalanta',
  'Atalanta': 'Atalanta',

  // Monaco
  'موناكو': 'AS Monaco',
  'Monaco': 'AS Monaco',
  'AS Monaco': 'AS Monaco',

  // Feyenoord
  'فاينورد': 'Feyenoord',
  'Feyenoord': 'Feyenoord',

  // PSV Eindhoven
  'بي إس في آيندهوفن': 'PSV Eindhoven',
  'آيندهوفن': 'PSV Eindhoven',
  'ايندهوفن': 'PSV Eindhoven',
  'PSV Eindhoven': 'PSV Eindhoven',
  'PSV': 'PSV Eindhoven',

  // RB Leipzig
  'لايبزيغ': 'RB Leipzig',
  'لايبتزغ': 'RB Leipzig',
  'ريد بول لايبزيغ': 'RB Leipzig',
  'RB Leipzig': 'RB Leipzig',

  // Girona
  'جيرونا': 'Girona',
  'Girona': 'Girona',

  // VfB Stuttgart
  'شتوتغارت': 'VfB Stuttgart',
  'VfB Stuttgart': 'VfB Stuttgart',
  'Stuttgart': 'VfB Stuttgart',

  // Bologna
  'بولونيا': 'Bologna',
  'Bologna': 'Bologna',

  // Shakhtar Donetsk
  'شاختار دونيتسك': 'Shakhtar Donetsk',
  'شاختار': 'Shakhtar Donetsk',
  'Shakhtar Donetsk': 'Shakhtar Donetsk',

  // Celtic
  'سلتيك': 'Celtic FC',
  'Celtic': 'Celtic FC',
  'Celtic FC': 'Celtic FC',

  // Dinamo Zagreb
  'دينامو زغرب': 'Dinamo Zagreb',
  'Dinamo Zagreb': 'Dinamo Zagreb',

  // Red Star Belgrade
  'النجم الأحمر': 'Red Star Belgrade',
  'Red Star Belgrade': 'Red Star Belgrade',
  'Crvena Zvezda': 'Red Star Belgrade',

  // Club Brugge
  'كلوب بروج': 'Club Brugge',
  'Club Brugge': 'Club Brugge',

  // Red Bull Salzburg
  'سالزبورغ': 'Red Bull Salzburg',
  'Red Bull Salzburg': 'Red Bull Salzburg',
  'Salzburg': 'Red Bull Salzburg',

  // Lille
  'ليل': 'LOSC Lille',
  'Lille': 'LOSC Lille',
  'LOSC Lille': 'LOSC Lille',

  // Young Boys
  'يونغ بويز': 'BSC Young Boys',
  'Young Boys': 'BSC Young Boys',
  'BSC Young Boys': 'BSC Young Boys',

  // Sparta Prague
  'سبارتا براغ': 'Sparta Prague',
  'Sparta Prague': 'Sparta Prague',
  'Sparta Praha': 'Sparta Prague',

  // Sturm Graz
  'ستورم غراتس': 'SK Sturm Graz',
  'Sturm Graz': 'SK Sturm Graz',
  'SK Sturm Graz': 'SK Sturm Graz',

  // Slovan Bratislava
  'سلوفان براتيسلافا': 'Slovan Bratislava',
  'Slovan Bratislava': 'Slovan Bratislava',

  // Stade Brestois 29
  'ستاد بريست': 'Stade Brestois 29',
  'بريست': 'Stade Brestois 29',
  'Stade Brestois 29': 'Stade Brestois 29',
  'Brest': 'Stade Brestois 29',

  // Other European clubs for historical or fallback matches
  'تشيلسي': 'Chelsea',
  'Chelsea': 'Chelsea',
  'مانشستر يونايتد': 'Manchester United',
  'اليونايتد': 'Manchester United',
  'Manchester United': 'Manchester United',
  'توتنهام': 'Tottenham Hotspur',
  'Tottenham Hotspur': 'Tottenham Hotspur',
  'روما': 'AS Roma',
  'AS Roma': 'AS Roma',
  'نابولي': 'Napoli',
  'Napoli': 'Napoli',
  'بورتو': 'FC Porto',
  'FC Porto': 'FC Porto',
  'فياريال': 'Villarreal',
  'Villarreal': 'Villarreal',
  'أتلتيك بيلباو': 'Athletic Club',
  'بيلباو': 'Athletic Club',
  'Athletic Club': 'Athletic Club',
  'ريال بيتيس': 'Real Betis',
  'بيتيس': 'Real Betis',
  'Real Betis': 'Real Betis',
  'مارسيليا': 'Olympique de Marseille',
  'اولمبيك مارسيليا': 'Olympique de Marseille',
  'Olympique de Marseille': 'Olympique de Marseille',
  'Marseille': 'Olympique de Marseille',
  'غلطة سراي': 'Galatasaray',
  'Galatasaray': 'Galatasaray',
  'فنربخشة': 'Fenerbahçe',
  'Fenerbahçe': 'Fenerbahçe',
  'Fenerbahce': 'Fenerbahçe',
  'أياكس': 'Ajax',
  'اياكس': 'Ajax',
  'Ajax': 'Ajax',
  'إشبيلية': 'Sevilla',
  'اشبيلية': 'Sevilla',
  'Sevilla': 'Sevilla'
};

/**
 * Returns the standardized English name for any team,
 * whether it was provided in Arabic, English, or mixed.
 */
export const getTeamEnglishName = (rawName: string | undefined | null): string => {
  if (!rawName) return '';
  const trimmed = rawName.trim();
  if (!trimmed) return '';

  // 1. Direct dictionary match
  if (ARABIC_TO_ENGLISH_TEAMS[trimmed]) {
    return ARABIC_TO_ENGLISH_TEAMS[trimmed];
  }

  // 2. Check in POPULAR_CLUB_PRESETS
  const presetMatch = POPULAR_CLUB_PRESETS.find(
    p => p.name.toLowerCase() === trimmed.toLowerCase() || p.enName.toLowerCase() === trimmed.toLowerCase()
  );
  if (presetMatch) {
    return presetMatch.enName;
  }

  // 3. Fallback: return original name
  return trimmed;
};

/**
 * Returns the team name matching the currently selected app language ('ar' | 'en' | 'fr')
 */
export const getLocalizedTeamName = (
  rawName: string | undefined | null,
  language: 'ar' | 'en' | 'fr' = 'ar'
): string => {
  if (!rawName) return '';
  const trimmed = rawName.trim();
  if (!trimmed) return '';

  if (language === 'ar') {
    // 1. Direct match in POPULAR_CLUB_PRESETS by Arabic or English name
    const presetMatch = POPULAR_CLUB_PRESETS.find(
      p => p.name.toLowerCase() === trimmed.toLowerCase() || p.enName.toLowerCase() === trimmed.toLowerCase()
    );
    if (presetMatch) {
      return presetMatch.name;
    }

    // 2. Check if trimmed maps to an English name that matches a preset
    const enResolved = ARABIC_TO_ENGLISH_TEAMS[trimmed];
    if (enResolved) {
      const presetByEn = POPULAR_CLUB_PRESETS.find(
        p => p.enName.toLowerCase() === enResolved.toLowerCase()
      );
      if (presetByEn) {
        return presetByEn.name;
      }
    }

    return trimmed;
  }

  // For 'en' and 'fr', return the standard international club name
  return getTeamEnglishName(trimmed);
};

/**
 * Parses raw text containing player names into a clean, unique list of player names.
 * Supports separation by newlines, English & Arabic commas (,), semicolons (;)، numbers (1. 2.), bullets, etc.
 */
export const parsePlayersText = (text: string): string[] => {
  if (!text || !text.trim()) return [];

  // Split by newlines, English comma, Arabic comma (،), English semicolon, Arabic semicolon (؛), slashes
  const rawSegments = text.split(/[\r\n,،;؛\/]+/);
  const result: string[] = [];

  for (const seg of rawSegments) {
    // Strip leading numbers (e.g. "1.", "1-", "1)", "1 "), bullets (•, -, *, #, :), etc.
    const cleaned = seg
      .replace(/^[\s\d\.\-\)\(\*•#:]+/, '')
      .replace(/[\.\-\*•:]+$/, '')
      .trim();

    if (cleaned.length >= 2 && !result.includes(cleaned)) {
      result.push(cleaned);
    }
  }

  return result;
};

/**
 * Generates an SVG Data URL with the team's initials in a UEFA Champions League gradient shield
 */
export const generateFallbackLogo = (teamName: string): string => {
  const clean = teamName.trim() || 'UCL';
  const words = clean.split(/\s+/);
  const initials = words.length > 1
    ? (words[0][0] + words[1][0]).toUpperCase()
    : clean.slice(0, 3).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="50%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#fbbf24" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="#0b1120" stroke="url(#g)" stroke-width="4" />
    <path d="M 50 12 L 80 25 L 80 55 C 80 72 50 88 50 88 C 50 88 20 72 20 55 L 20 25 Z" fill="url(#g)" opacity="0.25" />
    <text x="50" y="58" font-family="sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
