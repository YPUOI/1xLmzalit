import { AppUser, Match, Prediction } from '../types';

export interface UserCalculatedStats {
  exactScoreCount: number;
  correctMvpCount: number;
  correctScorersCount: number;
  totalPointsCalculated?: number;
}

/**
 * Normalizes username for robust matching (removes '@', trims, lowercases)
 */
export function normalizeUsername(u?: string | null): string {
  if (!u) return '';
  return String(u).trim().toLowerCase().replace(/^@+/, '');
}

/**
 * Exact baseline goal scorers guessed:
 * M.yassaine: 5
 * Youssef: 4
 * ilyass: 4
 * Yassine: 3
 */
export function getInitialMemberScorers(username?: string | null, originalUsername?: string | null): number {
  const normU = normalizeUsername(username);
  const normOrig = normalizeUsername(originalUsername);

  const check = (name: string): number => {
    if (!name) return 0;
    // 1. M.yassaine (or M.Yassine / m.yassaine / myassaine) -> 5
    if ((name.includes('m.') || name.includes('m_')) && (name.includes('yass') || name.includes('yassine') || name.includes('yassaine'))) return 5;
    if (name.startsWith('myass')) return 5;

    // 2. Youssef -> 4
    if (name.startsWith('youssef') || name.startsWith('yousef')) return 4;

    // 3. ilyass / ilyasse -> 4
    if (name.startsWith('ilyas')) return 4;

    // 4. Yassine (plain without M.) -> 3
    if (name.startsWith('yassine') || name.startsWith('yassaine')) return 3;

    return 0;
  };

  const fromU = check(normU);
  if (fromU > 0) return fromU;
  return check(normOrig);
}

/**
 * Known UCL player bilingual alias dictionary (Arabic to English transliterations)
 * Matches Arabic spellings directly to English names used in rosters and vice versa
 */
const UCL_PLAYER_ALIASES: Record<string, string[]> = {
  mbappe: ['مبابي', 'كيليان مبابي', 'كليان مبابي', 'mbappe', 'kylian mbappe'],
  vinicius: ['فينيسيوس', 'فينيسيوس جونيور', 'فيني', 'vinicius', 'vinicius junior', 'vinicius jr'],
  bellingham: ['بيلينغهام', 'بيلينجهام', 'جود بيلينجهام', 'جود بيلينغهام', 'bellingham', 'jude bellingham'],
  rodrygo: ['رودريغو', 'رودريجو', 'رودريغو غوس', 'rodrygo'],
  haaland: ['هالاند', 'إيرلينج هالاند', 'ايرلينغ هالاند', 'haaland', 'erling haaland'],
  yamal: ['يامال', 'لامين يامال', 'لمين يامال', 'yamal', 'lamine yamal'],
  lewandowski: ['ليفاندوفسكي', 'روبرت ليفاندوفسكي', 'lewandowski', 'robert lewandowski'],
  foden: ['فودين', 'فيل فودين', 'foden', 'phil foden'],
  debruyne: ['دي بروين', 'كيفين دي بروين', 'ديبروين', 'de bruyne', 'kevin de bruyne'],
  kane: ['كين', 'هاري كين', 'kane', 'harry kane'],
  salah: ['صلاح', 'محمد صلاح', 'salah', 'mohamed salah'],
  saka: ['ساكا', 'بوكايو ساكا', 'saka', 'bukayo saka'],
  griezmann: ['غريزمان', 'جريزمان', 'أنطوان غريزمان', 'griezmann', 'antoine griezmann'],
  valverde: ['فالفيردي', 'فيديريكو فالفيردي', 'valverde', 'federico valverde'],
  modric: ['مودريتش', 'لوكا مودريتش', 'modric', 'luka modric'],
  diaz: ['دياز', 'براهيم دياز', 'ابراهيم دياز', 'diaz', 'brahim diaz'],
  courtois: ['كورتوا', 'تيبو كورتوا', 'courtois', 'thibaut courtois'],
  raphinha: ['رافينيا', 'رافينها', 'raphinha'],
  pedri: ['بيدري', 'pedri'],
  gavi: ['غافي', 'جافي', 'gavi'],
  olmo: ['أولمو', 'داني أولمو', 'اولمو', 'olmo', 'dani olmo'],
  musiala: ['موسيالا', 'جمال موسيالا', 'musiala', 'jamal musiala'],
  wirtz: ['فيرتز', 'فلوريان فيرتز', 'wirtz', 'florian wirtz'],
  palmer: ['بالمر', 'كول بالمر', 'palmer', 'cole palmer'],
  dembele: ['ديمبيلي', 'عثمان ديمبيلي', 'dembele', 'ousmane dembele'],
  barcola: ['باركولا', 'برادلي باركولا', 'barcola', 'bradley barcola'],
  hakimi: ['حكيمي', 'أشرف حكيمي', 'اشرف حكيمي', 'hakimi', 'achraf hakimi'],
  isak: ['إيزاك', 'ايزاك', 'ألكسندر إيزاك', 'isak', 'alexander isak'],
  odegaard: ['أوديغارد', 'اوديغارد', 'مارتن أوديغارد', 'odegaard', 'martin odegaard'],
  martinelli: ['مارتينيلي', 'غابرييل مارتينيلي', 'martinelli', 'gabriel martinelli'],
  rice: ['رايس', 'ديكلان رايس', 'rice', 'declan rice'],
  alvarez: ['ألفاريز', 'الفاريز', 'جوليان ألفاريز', 'alvarez', 'julian alvarez'],
  lookman: ['لوكمان', 'أديمولا لوكمان', 'lookman', 'ademola lookman'],
  vlahovic: ['فلاهوفيتش', 'دوشان فلاهوفيتش', 'vlahovic', 'dusan vlahovic'],
  leao: ['لياو', 'رافاييل لياو', 'leao', 'rafael leao'],
  gyokeres: ['جيوكيريس', 'فيكتور جيوكيريس', 'gyokeres', 'viktor gyokeres'],
  endrick: ['إندريك', 'اندريك', 'endrick'],
  guler: ['غولر', 'جولر', 'أردا غولر', 'اردا جولر', 'guler', 'arda guler'],
  martinez: ['مارتينيز', 'لاوتارو مارتينيز', 'إيميليانو مارتينيز', 'martinez', 'lautaro martinez'],
  rudiger: ['روديغر', 'روديجر', 'أنطونيو روديغر', 'rudiger', 'antonio rudiger'],
  carvajal: ['كارفاخال', 'داني كارفاخال', 'carvajal', 'dani carvajal'],
  camavinga: ['كامافينغا', 'كامافينجا', 'إدواردو كامافينغا', 'camavinga', 'eduardo camavinga'],
  tchouameni: ['تشواميني', 'أوريليان تشواميني', 'tchouameni', 'aurelien tchouameni'],
  militon: ['ميليتاو', 'إيدير ميليتاو', 'militao', 'eder militao'],
  alaba: ['ألابا', 'الابا', 'دافيد ألابا', 'alaba', 'david alaba'],
  boniface: ['بونيفاس', 'فيكتور بونيفاس', 'boniface', 'victor boniface']
};

/**
 * Normalizes player names preserving Arabic (\u0600-\u06FF) and Latin characters,
 * stripping accents, punctuation, jersey numbers, and extra whitespace.
 */
export function cleanPlayerName(name?: string | null): string {
  if (!name) return '';
  let str = String(name).trim();

  // Strip leading jersey numbers like "7. ", "(9) ", "#10 ", "10 - "
  str = str.replace(/^[#\d\s\(\)\-\.]+/g, '');
  // Strip trailing notes like "(C)", "(P)", "(injured)"
  str = str.replace(/[\(\[\{].*?[\)\]\}]/g, '');

  // Normalize Arabic letters and remove tashkeel
  str = str
    .replace(/[\u064B-\u065F\u0670]/g, '') // strip Arabic diacritics / harakat
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[يىئ]/g, 'ي')
    .replace(/ؤ/g, 'و');

  // Strip Latin accents / diacritics
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Lowercase and remove any remaining punctuation except Arabic & Latin letters and digits
  str = str
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return str;
}

/**
 * Checks if two player names match (exact, accent-insensitive, cross-language, or substring/surname match)
 * e.g. "Mbappé" matches "Kylian Mbappé", "مبابي" matches "Kylian Mbappé", "Vinicius Jr" matches "Vinícius Júnior"
 */
export function isPlayerMatch(name1?: string | null, name2?: string | null): boolean {
  if (!name1 || !name2) return false;

  const raw1 = String(name1).trim().toLowerCase();
  const raw2 = String(name2).trim().toLowerCase();
  if (raw1 === raw2) return true;

  const p1 = cleanPlayerName(name1);
  const p2 = cleanPlayerName(name2);
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;

  // Handle nickname abbreviations (e.g. "jr" vs "junior")
  const exp1 = p1.replace(/\bjr\b/g, 'junior');
  const exp2 = p2.replace(/\bjr\b/g, 'junior');
  if (exp1 === exp2) return true;

  // Check alias dictionary for cross-language Arabic/English matches
  for (const aliases of Object.values(UCL_PLAYER_ALIASES)) {
    const has1 = aliases.some(a => {
      const cleanA = cleanPlayerName(a);
      return p1 === cleanA || (p1.length >= 3 && cleanA.includes(p1)) || (cleanA.length >= 3 && p1.includes(cleanA));
    });
    const has2 = aliases.some(a => {
      const cleanA = cleanPlayerName(a);
      return p2 === cleanA || (p2.length >= 3 && cleanA.includes(p2)) || (cleanA.length >= 3 && p2.includes(cleanA));
    });
    if (has1 && has2) return true;
  }

  // Check if one contains the other if length is significant (at least 3 characters)
  if (p1.length >= 3 && p2.length >= 3) {
    if (p1.includes(p2) || p2.includes(p1)) return true;
  }

  // Check last names (e.g. "Bellingham" vs "Jude Bellingham", "مبابي" vs "كيليان مبابي")
  const parts1 = p1.split(' ').filter(w => w.length >= 3);
  const parts2 = p2.split(' ').filter(w => w.length >= 3);
  if (parts1.length > 0 && parts2.length > 0) {
    const last1 = parts1[parts1.length - 1];
    const last2 = parts2[parts2.length - 1];
    if (last1 === last2) return true;

    // Check first names
    const first1 = parts1[0];
    const first2 = parts2[0];
    if (first1 === first2 && parts1.length === parts2.length && parts1.length === 1) return true;
  }

  return false;
}

/**
 * Normalizes goal scorers input from various data shapes (Array, Record/Map from Firestore, or delimited string)
 */
export function extractScorers(scorers: any): string[] {
  if (!scorers) return [];
  if (Array.isArray(scorers)) {
    return scorers
      .map(s => (typeof s === 'string' ? s : (s as any)?.name || String(s || '')))
      .map(s => s.trim())
      .filter(Boolean);
  }
  if (typeof scorers === 'object') {
    return Object.values(scorers)
      .map(s => (typeof s === 'string' ? s : (s as any)?.name || String(s || '')))
      .map(s => s.trim())
      .filter(Boolean);
  }
  if (typeof scorers === 'string') {
    return scorers.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Determines whether a match has been settled or has official final results entered
 */
export function isMatchSettled(match: Match): boolean {
  if (!match) return false;
  if (match.status === 'SETTLED' || (match.status as string)?.toUpperCase() === 'SETTLED') {
    return true;
  }
  if (match.result) {
    const h = Number(match.result.homeScore);
    const a = Number(match.result.awayScore);
    if (!isNaN(h) && !isNaN(a) && h >= 0 && a >= 0) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates comprehensive stats (Exact Scores, MVPs, Scorers Guessed) for all users
 */
export function calculateAllUserStats(
  users: AppUser[],
  matches: Match[] = [],
  predictions: Record<string, Prediction> | Prediction[] = {}
): Record<string, UserCalculatedStats> {
  const statsMap: Record<string, UserCalculatedStats> = {};

  // Initialize calculated stats for each registered user (derived from settled matches)
  users.forEach((u) => {
    const initScorers = getInitialMemberScorers(u.username, u.originalUsername);
    const initStat: UserCalculatedStats = {
      exactScoreCount: 0,
      correctMvpCount: 0,
      correctScorersCount: initScorers,
      totalPointsCalculated: 0
    };
    statsMap[u.username] = { ...initStat };
    const norm = normalizeUsername(u.username);
    if (norm) {
      statsMap[norm] = statsMap[u.username];
    }
    if (u.originalUsername) {
      const normOrig = normalizeUsername(u.originalUsername);
      if (normOrig) {
        statsMap[normOrig] = statsMap[u.username];
      }
    }
  });

  // Extract robust prediction list, recovering matchId or username from docId keys if needed
  const predList: Prediction[] = Array.isArray(predictions)
    ? predictions
    : Object.entries(predictions || {}).map(([key, val]) => {
        if (!val || typeof val !== 'object') return null as any;
        const copy = { ...val };
        if (!copy.matchId && key.includes('_')) {
          copy.matchId = key.split('_').slice(1).join('_');
        }
        if (!copy.username && key.includes('_')) {
          copy.username = key.split('_')[0];
        }
        return copy;
      }).filter(Boolean);

  // Find all settled matches
  const settledMatches = matches.filter(isMatchSettled);

  settledMatches.forEach((match) => {
    const res = match.result;
    if (!res) return;

    const resHome = Number(res.homeScore);
    const resAway = Number(res.awayScore);
    const isScoreValid = !isNaN(resHome) && !isNaN(resAway);

    const matchIdStr = String(match.id).trim().toLowerCase();

    // Actual scorers for home, away, and whole match
    const actualHomeScorers = extractScorers(res.homeScorers);
    const actualAwayScorers = extractScorers(res.awayScorers);
    const allActualScorers = [...actualHomeScorers, ...actualAwayScorers];

    // Find all predictions for this match (by ID, or fallback by match teams if ID differed)
    const matchPreds = predList.filter((p) => {
      if (!p) return false;
      const pId = String(p.matchId || '').trim().toLowerCase();
      if (pId === matchIdStr) return true;
      // Fallback: match by matchId containing raw match id
      if (matchIdStr && (pId.endsWith(matchIdStr) || matchIdStr.endsWith(pId))) return true;
      return false;
    });

    matchPreds.forEach((pred) => {
      if (!pred || !pred.username) return;

      const normPredUser = normalizeUsername(pred.username);

      // Match with known AppUser
      const targetUser = users.find((u) => {
        const uNorm = normalizeUsername(u.username);
        const uOrig = normalizeUsername(u.originalUsername);
        return (
          (uNorm && normPredUser === uNorm) ||
          (uOrig && normPredUser === uOrig) ||
          (u.email && pred.username && u.email.toLowerCase() === pred.username.toLowerCase()) ||
          u.username === pred.username
        );
      });

      const userKey = targetUser ? targetUser.username : pred.username;
      if (!statsMap[userKey]) {
        const initScorers = getInitialMemberScorers(userKey, targetUser?.originalUsername);
        statsMap[userKey] = {
          exactScoreCount: 0,
          correctMvpCount: 0,
          correctScorersCount: initScorers,
          totalPointsCalculated: 0
        };
      }

      const stat = statsMap[userKey];

      // 1. Exact Score Check (+5 pts)
      if (isScoreValid) {
        const predHome = Number(pred.homeScore);
        const predAway = Number(pred.awayScore);
        if (!isNaN(predHome) && !isNaN(predAway) && predHome === resHome && predAway === resAway) {
          stat.exactScoreCount += 1;
          stat.totalPointsCalculated = (stat.totalPointsCalculated || 0) + 5;
        }
      }

      // 2. MVP Check (+3 pts)
      if (pred.mvp && res.mvp && isPlayerMatch(pred.mvp, res.mvp)) {
        stat.correctMvpCount += 1;
        stat.totalPointsCalculated = (stat.totalPointsCalculated || 0) + 3;
      }

      // 3. Scorers Check (+1 pt per scorer)
      const predScorers = [
        ...extractScorers(pred.homeScorers),
        ...extractScorers(pred.awayScorers)
      ];

      // Avoid double-crediting if user listed same player multiple times for 1 goal
      const matchedActualScorersIndices = new Set<number>();

      predScorers.forEach((predictedPlayer) => {
        for (let i = 0; i < allActualScorers.length; i++) {
          if (!matchedActualScorersIndices.has(i) && isPlayerMatch(predictedPlayer, allActualScorers[i])) {
            matchedActualScorersIndices.add(i);
            stat.correctScorersCount += 1;
            stat.totalPointsCalculated = (stat.totalPointsCalculated || 0) + 1;
            break;
          }
        }
      });

      // Mirror updated stats to user normalized key and original name aliases
      if (targetUser) {
        const norm = normalizeUsername(targetUser.username);
        if (norm) statsMap[norm] = stat;
        if (targetUser.originalUsername) {
          const normOrig = normalizeUsername(targetUser.originalUsername);
          if (normOrig) statsMap[normOrig] = stat;
        }
      }
      if (normPredUser) {
        statsMap[normPredUser] = stat;
      }
    });
  });

  return statsMap;
}

/**
 * Retrieves stats for a specific user, combining calculated match stats with any manual adjustments
 */
export function getUserStats(
  user: AppUser | { username: string; originalUsername?: string; exactScoreCount?: number; correctMvpCount?: number; correctScorersCount?: number },
  statsMap: Record<string, UserCalculatedStats>
): UserCalculatedStats {
  if (!user) {
    return { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };
  }

  const uName = user.username || '';
  const normU = normalizeUsername(uName);
  const normOrig = normalizeUsername(user.originalUsername);

  const found =
    statsMap[uName] ||
    (normU ? statsMap[normU] : null) ||
    (normOrig ? statsMap[normOrig] : null);

  const calculatedExact = found?.exactScoreCount || 0;
  const calculatedMvp = found?.correctMvpCount || 0;
  const calculatedScorers = found?.correctScorersCount || 0;

  const manualExact = Number(user.exactScoreCount) || 0;
  const manualMvp = Number(user.correctMvpCount) || 0;
  const userPoints = Number((user as any).points) || 0;
  const initialScorers = getInitialMemberScorers(user.username, user.originalUsername);

  const userScorers = (user.correctScorersCount !== undefined && user.correctScorersCount !== null)
    ? Number(user.correctScorersCount) || 0
    : initialScorers;
  const effectiveScorers = Math.max(userScorers, calculatedScorers, initialScorers);

  const calculatedPts = found?.totalPointsCalculated || 0;

  return {
    exactScoreCount: Math.max(calculatedExact, manualExact),
    correctMvpCount: Math.max(calculatedMvp, manualMvp),
    correctScorersCount: effectiveScorers,
    totalPointsCalculated: Math.max(calculatedPts, userPoints)
  };
}

/**
 * Returns the highest verified points for a user, reconciling stored user points
 * with real-time calculated points from settled matches.
 */
export function getUserEffectivePoints(
  user: AppUser | { username: string; points?: number; originalUsername?: string },
  statsMap?: Record<string, UserCalculatedStats>
): number {
  if (!user) return 0;
  const directPts = Number(user.points) || 0;
  if (!statsMap) return directPts;
  const stats = getUserStats(user as any, statsMap);
  return Math.max(directPts, stats.totalPointsCalculated || 0);
}
