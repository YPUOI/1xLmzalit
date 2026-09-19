export interface ClubPreset {
  name: string;
  enName: string;
  logo: string;
}

export const POPULAR_CLUB_PRESETS: ClubPreset[] = [
  {
    name: 'ريال مدريد',
    enName: 'Real Madrid',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg'
  },
  {
    name: 'برشلونة',
    enName: 'FC Barcelona',
    logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg'
  },
  {
    name: 'مانشستر سيتي',
    enName: 'Manchester City',
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'
  },
  {
    name: 'ليفربول',
    enName: 'Liverpool',
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg'
  },
  {
    name: 'أرسنال',
    enName: 'Arsenal',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'
  },
  {
    name: 'بايرن ميونخ',
    enName: 'Bayern Munich',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg'
  },
  {
    name: 'باريس سان جيرمان',
    enName: 'PSG',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg'
  },
  {
    name: 'إنتر ميلان',
    enName: 'Inter Milan',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg'
  },
  {
    name: 'ميلان',
    enName: 'AC Milan',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg'
  },
  {
    name: 'أتلتيكو مدريد',
    enName: 'Atletico Madrid',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg'
  },
  {
    name: 'بوروسيا دورتموند',
    enName: 'Borussia Dortmund',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg'
  },
  {
    name: 'يوفنتوس',
    enName: 'Juventus',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg'
  },
  {
    name: 'باير ليفركوزن',
    enName: 'Bayer Leverkusen',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg'
  },
  {
    name: 'تشيلسي',
    enName: 'Chelsea',
    logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg'
  },
  {
    name: 'أستون فيلا',
    enName: 'Aston Villa',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg'
  },
  {
    name: 'سبورتينغ لشبونة',
    enName: 'Sporting CP',
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/e1/Sporting_Clube_de_Portugal_%28Logo%29.svg'
  },
  {
    name: 'بنفيكا',
    enName: 'Benfica',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg'
  },
  {
    name: 'أتالانتا',
    enName: 'Atalanta',
    logo: 'https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg'
  },
  {
    name: 'موناكو',
    enName: 'Monaco',
    logo: 'https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC.svg'
  },
  {
    name: 'نابولي',
    enName: 'Napoli',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/SSC_Napoli_2024_%28deep_blue_navy%29.svg'
  }
];

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
