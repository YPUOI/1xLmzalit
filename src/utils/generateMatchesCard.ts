/**
 * UEFA Champions League Available Matches Card Generator
 * Generates an official, publication-ready HD image displaying ONLY:
 * - Team Names (in the currently selected app language: 'ar' | 'en' | 'fr')
 * - Official Team Logos (proportionally fitted)
 * - Match Date & Time (in Morocco GMT)
 */

import { Match, Team } from '../types';
import { getLocalizedTeamName, POPULAR_CLUB_PRESETS } from '../data/clubPresets';
import { getStoredMoroccoOffset } from './moroccoTime';
import { Language } from '../i18n/translations';

export interface MatchesCardOptions {
  matches: Match[];
  teams: Record<string, Team>;
  language: Language;
}

/**
 * Draw an image fitted proportionally (aspect ratio preserved) inside a target box
 */
function drawImageFitted(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  maxW: number,
  maxH: number
) {
  const naturalW = img.naturalWidth || img.width || maxW;
  const naturalH = img.naturalHeight || img.height || maxH;

  const ratio = Math.min(maxW / naturalW, maxH / naturalH);
  const targetW = naturalW * ratio;
  const targetH = naturalH * ratio;

  const targetX = x + (maxW - targetW) / 2;
  const targetY = y + (maxH - targetH) / 2;

  ctx.drawImage(img, targetX, targetY, targetW, targetH);
}

/**
 * Loads an image safely with CORS handling; returns null if unavailable
 */
async function loadImgSafe(url?: string): Promise<HTMLImageElement | null> {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  return new Promise((resolve) => {
    const img = new Image();
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (url.startsWith('data:')) {
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => resolve(null);
        fallback.src = url;
      } else {
        resolve(null);
      }
    };
    img.src = url;
  });
}

/**
 * Resolve logo from team object or preset fallback
 */
function resolveTeamLogoUrl(teamName: string, teams: Record<string, Team>): string {
  const teamObj = teams[teamName];
  if (teamObj && teamObj.logo && !teamObj.logo.includes('placehold.co')) {
    return teamObj.logo;
  }
  const clean = (teamName || '').trim().toLowerCase();
  const preset = POPULAR_CLUB_PRESETS.find(
    (p) => p.name.toLowerCase() === clean || p.enName.toLowerCase() === clean
  );
  if (preset && preset.logo) return preset.logo;
  return teamObj?.logo || '';
}

/**
 * Draw a rounded rectangle path with glitch-free geometry
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  const radius = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
  ctx.closePath();
}

/**
 * Format match date and time separately in the selected app language (Morocco GMT)
 */
function formatMatchDateAndTime(deadlineStr: string, language: Language): { dateText: string; timeText: string } {
  const d = new Date(deadlineStr);
  if (isNaN(d.getTime())) {
    return { dateText: deadlineStr, timeText: '' };
  }

  const offsetHours = getStoredMoroccoOffset();
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const moroccoDate = new Date(utcMs + offsetHours * 3600000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(moroccoDate.getDate());
  const monthIdx = moroccoDate.getMonth();
  const year = moroccoDate.getFullYear();

  const hours24 = pad(moroccoDate.getHours());
  const minutes = pad(moroccoDate.getMinutes());
  const offsetTag = offsetHours === 0 ? 'GMT' : `GMT+${offsetHours}`;

  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthsFr = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dayOfWeek = moroccoDate.getDay();

  if (language === 'ar') {
    return {
      dateText: `${daysAr[dayOfWeek]} ${moroccoDate.getDate()} ${monthsAr[monthIdx]} ${year}`,
      timeText: `${hours24}:${minutes} (${offsetTag})`
    };
  }

  if (language === 'fr') {
    return {
      dateText: `${daysFr[dayOfWeek]} ${day} ${monthsFr[monthIdx]} ${year}`,
      timeText: `${hours24}:${minutes} (${offsetTag})`
    };
  }

  return {
    dateText: `${daysEn[dayOfWeek]}, ${monthsEn[monthIdx]} ${day}, ${year}`,
    timeText: `${hours24}:${minutes} (${offsetTag})`
  };
}

/**
 * Generates an HD PNG Data URL containing ONLY:
 * - Team Names (in the selected app language)
 * - Team Logos
 * - Time & Date of each match
 */
export async function generateMatchesCardImage(options: MatchesCardOptions): Promise<string> {
  const { matches, teams, language } = options;

  const width = 1080;
  const margin = 28;
  const cardW = width - margin * 2;

  const rowCount = Math.max(1, matches.length);
  const isSingleMatch = matches.length === 1;

  const headerH = 86;
  const rowH = isSingleMatch ? 240 : 148;
  const rowGap = 16;
  const contentPaddingTop = 20;
  const contentPaddingBottom = 28;

  const listH = rowCount * rowH + Math.max(0, rowCount - 1) * rowGap;
  const cardH = headerH + contentPaddingTop + listH + contentPaddingBottom;
  const height = cardH + margin * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot initialize 2D canvas context');

  // 1. Base Dark Background
  ctx.fillStyle = '#06141B';
  ctx.fillRect(0, 0, width, height);

  const centerGlow = ctx.createRadialGradient(
    width / 2,
    height * 0.4,
    60,
    width / 2,
    height * 0.4,
    width * 0.75
  );
  centerGlow.addColorStop(0, '#0D212D');
  centerGlow.addColorStop(0.65, '#06141B');
  centerGlow.addColorStop(1, '#030B0F');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Card Frame
  const borderGrad = ctx.createLinearGradient(margin, margin, margin + cardW, margin + cardH);
  borderGrad.addColorStop(0, '#4A5C6A');
  borderGrad.addColorStop(0.5, '#253745');
  borderGrad.addColorStop(1, '#EAA81B');

  roundRect(ctx, margin, margin, cardW, cardH, 24);
  ctx.fillStyle = '#0A1922';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = borderGrad;
  ctx.stroke();

  // 3. Minimal Title Bar (in the selected app language)
  const titleText =
    language === 'ar'
      ? 'المباريات المتاحة للتوقع'
      : language === 'fr'
      ? 'MATCHS DISPONIBLES AUX PRONOSTICS'
      : 'MATCHES AVAILABLE TO PREDICT';

  ctx.save();
  ctx.fillStyle = '#CCD0CF';
  ctx.font = 'bold 28px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleText, width / 2, margin + headerH / 2);
  ctx.restore();

  // Divider line under title
  ctx.save();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin + 32, margin + headerH);
  ctx.lineTo(margin + cardW - 32, margin + headerH);
  ctx.stroke();
  ctx.restore();

  // Preload all team logos in parallel
  const logoPromises = matches.map(async (m) => {
    const homeUrl = resolveTeamLogoUrl(m.homeTeam, teams);
    const awayUrl = resolveTeamLogoUrl(m.awayTeam, teams);
    const [homeImg, awayImg] = await Promise.all([
      loadImgSafe(homeUrl),
      loadImgSafe(awayUrl)
    ]);
    return { homeImg, awayImg };
  });

  const loadedLogos = await Promise.all(logoPromises);

  // 4. Draw Each Match Row (ONLY Team Names in selected app language, Team Logos, and Time & Date)
  const listStartX = margin + 28;
  const rowW = cardW - 56;
  let currentY = margin + headerH + contentPaddingTop;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const { homeImg, awayImg } = loadedLogos[i];

    const homeName = getLocalizedTeamName(match.homeTeam, language);
    const awayName = getLocalizedTeamName(match.awayTeam, language);
    const { dateText, timeText } = formatMatchDateAndTime(match.deadline, language);

    // Match Row Container
    roundRect(ctx, listStartX, currentY, rowW, rowH, 18);
    ctx.fillStyle = '#11212D';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#253745';
    ctx.stroke();

    const centerY = currentY + rowH / 2;
    const centerX = width / 2;

    if (isSingleMatch) {
      // Single Match Layout: Large Logos, Team Names, and Prominent Date & Time in Center
      const homeCenterX = listStartX + rowW * 0.23;
      const awayCenterX = listStartX + rowW * 0.77;
      const logoBoxSize = 116;
      const logoY = currentY + 26;

      // Home Logo Box
      roundRect(ctx, homeCenterX - logoBoxSize / 2, logoY, logoBoxSize, logoBoxSize, 22);
      ctx.fillStyle = '#06141B';
      ctx.fill();
      ctx.strokeStyle = '#253745';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (homeImg) {
        drawImageFitted(ctx, homeImg, homeCenterX - logoBoxSize / 2 + 14, logoY + 14, logoBoxSize - 28, logoBoxSize - 28);
      } else {
        ctx.fillStyle = '#CCD0CF';
        ctx.font = 'bold 28px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(homeName.slice(0, 3).toUpperCase(), homeCenterX, logoY + logoBoxSize / 2);
      }

      // Home Team Name
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(homeName, homeCenterX, logoY + logoBoxSize + 38, rowW * 0.36);
      ctx.restore();

      // Away Logo Box
      roundRect(ctx, awayCenterX - logoBoxSize / 2, logoY, logoBoxSize, logoBoxSize, 22);
      ctx.fillStyle = '#06141B';
      ctx.fill();
      ctx.strokeStyle = '#253745';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (awayImg) {
        drawImageFitted(ctx, awayImg, awayCenterX - logoBoxSize / 2 + 14, logoY + 14, logoBoxSize - 28, logoBoxSize - 28);
      } else {
        ctx.fillStyle = '#CCD0CF';
        ctx.font = 'bold 28px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(awayName.slice(0, 3).toUpperCase(), awayCenterX, logoY + logoBoxSize / 2);
      }

      // Away Team Name
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(awayName, awayCenterX, logoY + logoBoxSize + 38, rowW * 0.36);
      ctx.restore();

      // Center VS + Date & Time
      ctx.save();
      ctx.fillStyle = '#EAA81B';
      ctx.font = '900 30px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VS', centerX, centerY - 34);

      // Date Pill
      const dateBoxW = 260;
      const dateBoxH = 74;
      roundRect(ctx, centerX - dateBoxW / 2, centerY - 6, dateBoxW, dateBoxH, 14);
      ctx.fillStyle = '#06141B';
      ctx.fill();
      ctx.strokeStyle = '#253745';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#CCD0CF';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(dateText, centerX, centerY + 16, dateBoxW - 16);

      ctx.fillStyle = '#EAA81B';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(timeText, centerX, centerY + 46, dateBoxW - 16);
      ctx.restore();
    } else {
      // Multi-Match Row Layout:
      // Left: Home Logo + Home Team Name
      // Center: Date & Time + VS
      // Right: Away Team Name + Away Logo
      const logoBoxSize = 86;
      const homeLogoX = listStartX + 24;
      const homeLogoY = centerY - logoBoxSize / 2;

      // Home Logo Box
      roundRect(ctx, homeLogoX, homeLogoY, logoBoxSize, logoBoxSize, 16);
      ctx.fillStyle = '#06141B';
      ctx.fill();
      ctx.strokeStyle = '#253745';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (homeImg) {
        drawImageFitted(ctx, homeImg, homeLogoX + 10, homeLogoY + 10, logoBoxSize - 20, logoBoxSize - 20);
      } else {
        ctx.fillStyle = '#CCD0CF';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(homeName.slice(0, 3).toUpperCase(), homeLogoX + logoBoxSize / 2, centerY);
      }

      // Home Team Name
      const homeTextX = homeLogoX + logoBoxSize + 18;
      const maxTeamNameW = 225;
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 23px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(homeName, homeTextX, centerY, maxTeamNameW);
      ctx.restore();

      // Center Date & Time Box
      const centerBoxW = 240;
      const centerBoxH = 92;
      roundRect(ctx, centerX - centerBoxW / 2, centerY - centerBoxH / 2, centerBoxW, centerBoxH, 14);
      ctx.fillStyle = '#06141B';
      ctx.fill();
      ctx.strokeStyle = '#253745';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#EAA81B';
      ctx.font = '900 16px system-ui, sans-serif';
      ctx.fillText('VS', centerX, centerY - 26);

      ctx.fillStyle = '#CCD0CF';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(dateText, centerX, centerY + 2, centerBoxW - 16);

      ctx.fillStyle = '#9BA8AB';
      ctx.font = 'bold 17px monospace';
      ctx.fillText(timeText, centerX, centerY + 27, centerBoxW - 16);
      ctx.restore();

      // Away Logo Box (Right side)
      const awayLogoX = listStartX + rowW - 24 - logoBoxSize;
      const awayLogoY = centerY - logoBoxSize / 2;

      roundRect(ctx, awayLogoX, awayLogoY, logoBoxSize, logoBoxSize, 16);
      ctx.fillStyle = '#06141B';
      ctx.fill();
      ctx.strokeStyle = '#253745';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (awayImg) {
        drawImageFitted(ctx, awayImg, awayLogoX + 10, awayLogoY + 10, logoBoxSize - 20, logoBoxSize - 20);
      } else {
        ctx.fillStyle = '#CCD0CF';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(awayName.slice(0, 3).toUpperCase(), awayLogoX + logoBoxSize / 2, centerY);
      }

      // Away Team Name
      const awayTextX = awayLogoX - 18;
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 23px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(awayName, awayTextX, centerY, maxTeamNameW);
      ctx.restore();
    }

    currentY += rowH + rowGap;
  }

  return canvas.toDataURL('image/png', 1.0);
}
