/**
 * UEFA Champions League Prediction Ticket / Card Generator
 * Upgraded to match the application's signature dark aesthetic:
 * Palette: #06141B (Dark Base), #11212D (Card Surface), #253745 (Border), #4A5C6A (Steel Accent),
 * #9BA8AB (Muted Text), #CCD0CF (Primary Text), #EAA81B (Gold Accent), #10B981 (Emerald)
 * 
 * Strictly adheres to Morocco official GMT (UTC+0) time standards across all card timestamps.
 */

import { Match, Team, Prediction } from '../types';
import { getTeamEnglishName } from '../data/clubPresets';
import { formatDateTimeMoroccoGmt } from './moroccoTime';

export interface CardGenerationOptions {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  prediction: Prediction;
  memberName: string;
  downloadDate?: Date | string;
}

export const formatDateTimeEn = formatDateTimeMoroccoGmt;

/**
 * Draw an image fitted proportionally (aspect ratio preserved, no distortion) inside a target rectangle
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
 * Draw a rounded rectangle path with 100% glitch-free geometry.
 * Uses native ctx.roundRect when available or quadratic curves (never arcTo, which has WebKit tangent bugs).
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
 * Draw the official 1xlmzalit vector logo directly onto canvas
 */
function drawXlmzalitVector(ctx: CanvasRenderingContext2D, startX: number, startY: number, scale: number = 0.55) {
  ctx.save();
  ctx.translate(startX, startY);
  ctx.scale(scale, scale);

  // 1: Top Cyan Arrowhead (#00D9F5)
  ctx.fillStyle = '#00D9F5';
  ctx.beginPath();
  ctx.moveTo(44, 10);
  ctx.lineTo(44, 38);
  ctx.lineTo(22, 38);
  ctx.lineTo(22, 30);
  ctx.lineTo(6, 38);
  ctx.lineTo(38, 10);
  ctx.closePath();
  ctx.fill();

  // 1: Main Stem (#CCD0CF)
  ctx.fillStyle = '#CCD0CF';
  ctx.fillRect(22, 38, 22, 52);

  // 1: Bottom Golden Triangle (#EAA81B)
  ctx.fillStyle = '#EAA81B';
  ctx.beginPath();
  ctx.moveTo(22, 90);
  ctx.lineTo(22, 106);
  ctx.lineTo(10, 98);
  ctx.closePath();
  ctx.fill();

  // x: Connected cross (#CCD0CF)
  ctx.fillStyle = '#CCD0CF';
  ctx.beginPath();
  ctx.moveTo(44, 48);
  ctx.lineTo(56, 38);
  ctx.lineTo(71, 55);
  ctx.lineTo(85, 38);
  ctx.lineTo(99, 38);
  ctx.lineTo(79, 62);
  ctx.lineTo(99, 90);
  ctx.lineTo(85, 90);
  ctx.lineTo(71, 70);
  ctx.lineTo(56, 90);
  ctx.lineTo(44, 90);
  ctx.lineTo(63, 65);
  ctx.closePath();
  ctx.fill();

  // l: First tall stem
  ctx.fillRect(107, 10, 18, 80);

  // m: Triple arched shape
  ctx.beginPath();
  ctx.moveTo(133, 38);
  ctx.lineTo(149, 38);
  ctx.lineTo(149, 47);
  ctx.bezierCurveTo(152, 40, 159, 38, 165, 38);
  ctx.bezierCurveTo(172, 38, 178, 41, 181, 48);
  ctx.bezierCurveTo(185, 41, 192, 38, 199, 38);
  ctx.bezierCurveTo(208, 38, 212, 44, 212, 54);
  ctx.lineTo(212, 90);
  ctx.lineTo(196, 90);
  ctx.lineTo(196, 58);
  ctx.bezierCurveTo(196, 52, 193, 50, 189, 50);
  ctx.bezierCurveTo(184, 50, 180, 53, 180, 59);
  ctx.lineTo(180, 90);
  ctx.lineTo(164, 90);
  ctx.lineTo(164, 58);
  ctx.bezierCurveTo(164, 52, 161, 50, 157, 50);
  ctx.bezierCurveTo(152, 50, 150, 53, 150, 59);
  ctx.lineTo(150, 90);
  ctx.lineTo(133, 90);
  ctx.closePath();
  ctx.fill();

  // z: Dynamic sharp letter
  ctx.beginPath();
  ctx.moveTo(220, 38);
  ctx.lineTo(260, 38);
  ctx.lineTo(260, 50);
  ctx.lineTo(237, 78);
  ctx.lineTo(260, 78);
  ctx.lineTo(260, 90);
  ctx.lineTo(220, 90);
  ctx.lineTo(220, 78);
  ctx.lineTo(243, 50);
  ctx.lineTo(220, 50);
  ctx.closePath();
  ctx.fill();

  // a: Geometric circular letter
  ctx.beginPath();
  ctx.arc(277, 68, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(285, 48, 15, 42);

  // l: Second stem with angled top
  ctx.beginPath();
  ctx.moveTo(308, 24);
  ctx.lineTo(326, 10);
  ctx.lineTo(326, 90);
  ctx.lineTo(308, 90);
  ctx.closePath();
  ctx.fill();

  // i: Stem (#CCD0CF) & Golden Dot (#EAA81B)
  ctx.fillRect(334, 38, 18, 52);
  ctx.fillStyle = '#EAA81B';
  ctx.beginPath();
  ctx.arc(343, 22, 10, 0, Math.PI * 2);
  ctx.fill();

  // t: Cross letter
  ctx.fillStyle = '#CCD0CF';
  ctx.fillRect(360, 20, 16, 70);
  ctx.fillRect(352, 38, 38, 12);

  ctx.beginPath(); // Clear path before restore
  ctx.restore();
}

/**
 * Main export: generates a high-definition 1080x1380 PNG Data URL matching the new dark theme
 */
export async function generatePredictionCardImage(options: CardGenerationOptions): Promise<string> {
  const { match, homeTeam, awayTeam, prediction, memberName } = options;

  const width = 1080;
  const height = 1380;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot initialize 2D canvas context');

  // Preload team logos safely
  const [homeImg, awayImg] = await Promise.all([
    loadImgSafe(homeTeam.logo),
    loadImgSafe(awayTeam.logo)
  ]);

  // 1. BASE DARK BACKGROUND (#06141B palette with subtle vignette)
  ctx.fillStyle = '#06141B';
  ctx.fillRect(0, 0, width, height);

  // Smooth ambient radial vignette
  const centerGlow = ctx.createRadialGradient(width / 2, height * 0.45, 100, width / 2, height * 0.45, width * 0.7);
  centerGlow.addColorStop(0, '#0D212D');
  centerGlow.addColorStop(0.65, '#06141B');
  centerGlow.addColorStop(1, '#030B0F');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, width, height);

  // Subtle starry constellation pattern (matching UCL theme)
  const starSeeds = [
    [100, 80], [320, 65], [920, 95], [160, 380], [920, 360],
    [90, 880], [990, 860], [210, 1260], [860, 1240], [540, 230],
    [480, 750], [600, 750]
  ];
  ctx.fillStyle = '#CCD0CF';
  for (const [sx, sy] of starSeeds) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Very subtle tech grid pattern
  ctx.strokeStyle = 'rgba(155, 168, 171, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 40; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 40; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. OUTER CARD FRAME (Styled in #253745 and #4A5C6A)
  const margin = 32;
  const cardW = width - margin * 2;
  const cardH = height - margin * 2;

  // Outer border with subtle metallic steel & gold accent
  const borderGrad = ctx.createLinearGradient(margin, margin, margin + cardW, margin + cardH);
  borderGrad.addColorStop(0, '#4A5C6A');
  borderGrad.addColorStop(0.3, '#253745');
  borderGrad.addColorStop(0.7, '#253745');
  borderGrad.addColorStop(1, '#EAA81B');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.5;
  roundRect(ctx, margin, margin, cardW, cardH, 26);
  ctx.stroke();

  // Fine inner frame
  ctx.strokeStyle = 'rgba(155, 168, 171, 0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, margin + 6, margin + 6, cardW - 12, cardH - 12, 20);
  ctx.stroke();

  // 3. HEADER: 1XLMZALIT LOGO & UCL PILL
  drawXlmzalitVector(ctx, margin + 28, margin + 26, 0.62);

  // Subtitle next to logo
  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.fillText('OFFICIAL PREDICTION TICKET • UCL 2026/2027', margin + 30, margin + 104);

  // Tournament Badge (Top Right)
  const badgeRight = margin + cardW - 28;
  const badgeY = margin + 28;
  const badgeW = 290;
  const badgeH = 50;

  roundRect(ctx, badgeRight - badgeW, badgeY, badgeW, badgeH, 14);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Small Pill
  roundRect(ctx, badgeRight - badgeW + 8, badgeY + 8, 60, 34, 8);
  ctx.fillStyle = '#06141B';
  ctx.fill();
  ctx.strokeStyle = '#4A5C6A';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#EAA81B';
  ctx.font = '900 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UCL', badgeRight - badgeW + 38, badgeY + 30);

  // Tournament Title in Arabic
  ctx.fillStyle = '#CCD0CF';
  ctx.font = 'bold 15px "Cairo", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('بطولة دوري أبطال أوروبا', badgeRight - 16, badgeY + 31);

  // 4. MEMBER DETAILS CARD & TIMESTAMPS (Strictly Morocco GMT)
  const userBoxY = margin + 128;
  roundRect(ctx, margin + 24, userBoxY, cardW - 48, 115, 20);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Member Avatar
  const avatarX = margin + 74;
  const avatarY = userBoxY + 57;
  const avatarRadius = 36;

  ctx.strokeStyle = '#4A5C6A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#06141B';
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius - 2, 0, Math.PI * 2);
  ctx.fill();

  const cleanMemberName = (memberName || prediction.username || 'Contestant').replace(/^@+/, '').trim();
  const userInitial = (cleanMemberName || 'U').charAt(0).toUpperCase();
  ctx.fillStyle = '#CCD0CF';
  ctx.font = '900 30px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(userInitial, avatarX, avatarY + 11);

  // Member Name Text (Name that appears in standings)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 12px "Segoe UI", sans-serif';
  ctx.fillText('PREDICTED BY MEMBER', avatarX + 48, userBoxY + 38);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 26px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText(`@${cleanMemberName}`, avatarX + 48, userBoxY + 70);

  // Verified Badge (Emerald accent)
  roundRect(ctx, avatarX + 48, userBoxY + 80, 150, 22, 6);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.fillText('★ VERIFIED PREDICTION', avatarX + 58, userBoxY + 95);

  // Morocco GMT Timestamps on the Right (Stacked and cleanly formatted with no overlap for phone view)
  const rightEdgeX = margin + cardW - 36;
  ctx.textAlign = 'right';

  // Prediction Timestamp
  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.fillText('PREDICTION TIME (MOROCCO GMT):', rightEdgeX, userBoxY + 40);

  const predictionDateGmt = formatDateTimeMoroccoGmt(prediction.updatedAt, 0);
  ctx.fillStyle = '#CCD0CF';
  ctx.font = 'bold 13px "Segoe UI", monospace';
  ctx.fillText(predictionDateGmt, rightEdgeX, userBoxY + 58);

  // Download / Generation Timestamp
  const currentDownloadTime = options.downloadDate || new Date();
  const downloadDateGmt = formatDateTimeMoroccoGmt(currentDownloadTime, 0);

  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.fillText('TICKET GENERATED (MOROCCO GMT):', rightEdgeX, userBoxY + 84);

  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 13px "Segoe UI", monospace';
  ctx.fillText(downloadDateGmt, rightEdgeX, userBoxY + 102);

  // 5. MATCH KICKOFF TIME BANNER (Strictly Morocco GMT)
  const matchHeaderY = userBoxY + 135;
  roundRect(ctx, margin + 24, matchHeaderY, cardW - 48, 50, 14);
  ctx.fillStyle = '#06141B';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const kickoffTimeGmt = formatDateTimeMoroccoGmt(match.deadline, 0);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#EAA81B';
  ctx.font = '900 14px "Segoe UI", sans-serif';
  ctx.fillText(`⚽ MATCH KICK-OFF: ${kickoffTimeGmt.toUpperCase()}`, width / 2, matchHeaderY + 31);

  // 6. MAIN FACE-OFF & SCOREBOARD SHOWCASE
  const faceOffY = matchHeaderY + 70;
  const faceOffH = 265;

  roundRect(ctx, margin + 24, faceOffY, cardW - 48, faceOffH, 22);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // LEFT: Home Team Logo & Name
  const homeX = margin + 175;
  const homeY = faceOffY + 115;
  const logoContainerRadius = 58;

  // Home Logo Circle Container
  ctx.save();
  ctx.beginPath();
  ctx.arc(homeX, homeY, logoContainerRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#06141B';
  ctx.fill();
  ctx.strokeStyle = '#4A5C6A';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (homeImg) {
    drawImageFitted(ctx, homeImg, homeX - 48, homeY - 48, 96, 96);
  } else {
    ctx.fillStyle = '#CCD0CF';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((homeTeam.name || 'H').substring(0, 3).toUpperCase(), homeX, homeY + 8);
  }
  ctx.restore();

  // Home Name
  ctx.fillStyle = '#CCD0CF';
  ctx.font = '900 23px "Cairo", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(getTeamEnglishName(homeTeam.name), homeX, homeY + 90);

  // "HOME" Pill
  roundRect(ctx, homeX - 38, homeY + 104, 76, 22, 6);
  ctx.fillStyle = '#06141B';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.fillText('HOME', homeX, homeY + 119);

  // RIGHT: Away Team Logo & Name
  const awayX = margin + cardW - 175;
  const awayY = homeY;

  // Away Logo Circle Container
  ctx.save();
  ctx.beginPath();
  ctx.arc(awayX, awayY, logoContainerRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#06141B';
  ctx.fill();
  ctx.strokeStyle = '#4A5C6A';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (awayImg) {
    drawImageFitted(ctx, awayImg, awayX - 48, awayY - 48, 96, 96);
  } else {
    ctx.fillStyle = '#CCD0CF';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((awayTeam.name || 'A').substring(0, 3).toUpperCase(), awayX, awayY + 8);
  }
  ctx.restore();

  // Away Name
  ctx.fillStyle = '#CCD0CF';
  ctx.font = '900 23px "Cairo", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(getTeamEnglishName(awayTeam.name), awayX, awayY + 90);

  // "AWAY" Pill
  roundRect(ctx, awayX - 38, awayY + 104, 76, 22, 6);
  ctx.fillStyle = '#06141B';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.fillText('AWAY', awayX, awayY + 119);

  // CENTER: Predicted Scoreboard Box
  const scoreBoxW = 275;
  const scoreBoxH = 175;
  const scoreBoxX = (width - scoreBoxW) / 2;
  const scoreBoxY = faceOffY + 45;

  roundRect(ctx, scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 20);
  ctx.fillStyle = '#06141B';
  ctx.fill();
  ctx.strokeStyle = '#EAA81B';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Score Box Header Tab
  roundRect(ctx, scoreBoxX + 20, scoreBoxY - 14, scoreBoxW - 40, 28, 8);
  ctx.fillStyle = '#EAA81B';
  ctx.fill();
  ctx.fillStyle = '#06141B';
  ctx.font = '900 12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PREDICTED SCORE', width / 2, scoreBoxY + 5);

  // The Score Numbers
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 78px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${prediction.homeScore}  -  ${prediction.awayScore}`, width / 2, scoreBoxY + 108);

  // Subtext under scores
  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 12px "Segoe UI", sans-serif';
  ctx.fillText('FULL TIME RESULT', width / 2, scoreBoxY + 148);

  // 7. GOAL SCORERS SECTION
  const scorersY = faceOffY + faceOffH + 22;
  const scorersH = 265;

  roundRect(ctx, margin + 24, scorersY, cardW - 48, scorersH, 20);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Section Header: GOAL SCORERS
  ctx.textAlign = 'center';
  ctx.fillStyle = '#CCD0CF';
  ctx.font = '900 15px "Segoe UI", sans-serif';
  ctx.fillText('⚽ PREDICTED GOAL SCORERS ⚽', width / 2, scorersY + 34);

  // Vertical Center Divider Line
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2, scorersY + 48);
  ctx.lineTo(width / 2, scorersY + scorersH - 20);
  ctx.stroke();

  // Left Column: Home Scorers
  const homeColX = margin + 50;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#CCD0CF';
  ctx.font = '900 16px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText(`${getTeamEnglishName(homeTeam.name)} (${prediction.homeScore})`, homeColX, scorersY + 68);

  if (prediction.homeScorers && prediction.homeScorers.length > 0) {
    prediction.homeScorers.slice(0, 5).forEach((scorer, idx) => {
      const sy = scorersY + 104 + idx * 30;
      ctx.fillStyle = '#EAA81B';
      ctx.font = '14px sans-serif';
      ctx.fillText('⚽', homeColX, sy);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px "Cairo", "Segoe UI", sans-serif';
      ctx.fillText(scorer || 'Unassigned', homeColX + 26, sy);
    });
  } else {
    ctx.fillStyle = '#9BA8AB';
    ctx.font = 'italic 14px "Segoe UI", sans-serif';
    ctx.fillText('No goals predicted for this side', homeColX, scorersY + 105);
  }

  // Right Column: Away Scorers
  const awayColX = width / 2 + 28;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#CCD0CF';
  ctx.font = '900 16px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText(`${getTeamEnglishName(awayTeam.name)} (${prediction.awayScore})`, awayColX, scorersY + 68);

  if (prediction.awayScorers && prediction.awayScorers.length > 0) {
    prediction.awayScorers.slice(0, 5).forEach((scorer, idx) => {
      const sy = scorersY + 104 + idx * 30;
      ctx.fillStyle = '#EAA81B';
      ctx.font = '14px sans-serif';
      ctx.fillText('⚽', awayColX, sy);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px "Cairo", "Segoe UI", sans-serif';
      ctx.fillText(scorer || 'Unassigned', awayColX + 26, sy);
    });
  } else {
    ctx.fillStyle = '#9BA8AB';
    ctx.font = 'italic 14px "Segoe UI", sans-serif';
    ctx.fillText('No goals predicted for this side', awayColX, scorersY + 105);
  }

  // 8. MAN OF THE MATCH (MVP) BANNER
  const mvpY = scorersY + scorersH + 20;
  const mvpH = 92;

  roundRect(ctx, margin + 24, mvpY, cardW - 48, mvpH, 18);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#EAA81B';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Trophy Graphic
  ctx.fillStyle = '#EAA81B';
  ctx.font = '34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏆', margin + 74, mvpY + 56);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#EAA81B';
  ctx.font = '900 13px "Segoe UI", sans-serif';
  ctx.fillText('PREDICTED MAN OF THE MATCH (MVP)', margin + 116, mvpY + 34);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 25px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText(prediction.mvp ? prediction.mvp.trim() : 'Not Specified', margin + 116, mvpY + 67);

  // 9. FOOTER WATERMARK & AUTHENTICITY CODE (Bottom-right extra details deleted as requested)
  const footerY = height - margin - 28;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 12px "Segoe UI", monospace';
  const ticketId = `TKT-UCL26-${match.id.substring(0, 6).toUpperCase()}-${(cleanMemberName || 'USR').substring(0, 4).toUpperCase()}`;
  ctx.fillText(`TICKET ID: ${ticketId} • OFFICIAL VERIFIED ENTRY`, margin + 26, footerY);

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Triggers instant browser download of a base64 Data URL as PNG
 */
export function downloadDataUrlAsPng(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
