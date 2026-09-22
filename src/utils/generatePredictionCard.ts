/**
 * Generates a high-resolution UEFA Champions League broadcast style
 * prediction ticket/card image using HTML5 Canvas.
 */

import { Match, Team, Prediction } from '../types';
import { getTeamEnglishName } from '../data/clubPresets';

export interface CardGenerationOptions {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  prediction: Prediction;
  memberName: string;
  downloadDate?: Date | string;
}

/**
 * Format timestamp into English (e.g. "Oct 21, 2026 • 08:00 PM")
 */
export function formatDateTimeEn(dateInput: string | number | Date | undefined): string {
  if (!dateInput) return new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

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
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without anonymous if it was data URL or local
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
 * Draw a rounded rectangle
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
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
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

  // 1: Main Stem (White)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(22, 38, 22, 52);

  // 1: Bottom Golden Triangle (#EAA81B)
  ctx.fillStyle = '#EAA81B';
  ctx.beginPath();
  ctx.moveTo(22, 90);
  ctx.lineTo(22, 106);
  ctx.lineTo(10, 98);
  ctx.closePath();
  ctx.fill();

  // x: Connected cross (White)
  ctx.fillStyle = '#FFFFFF';
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

  // i: Stem (White) & Golden Dot (#EAA81B)
  ctx.fillRect(334, 38, 18, 52);
  ctx.fillStyle = '#EAA81B';
  ctx.beginPath();
  ctx.arc(343, 22, 10, 0, Math.PI * 2);
  ctx.fill();

  // t: Cross letter
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(360, 20, 16, 70);
  ctx.fillRect(352, 38, 38, 12);

  ctx.restore();
}

/**
 * Main export: generates a high-definition 1080x1350 PNG Data URL
 */
export async function generatePredictionCardImage(options: CardGenerationOptions): Promise<string> {
  const { match, homeTeam, awayTeam, prediction, memberName } = options;

  const width = 1080;
  const height = 1350;

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

  // 1. BACKGROUND GRADIENT & AMBIENT GLOW
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#030B17');
  bgGrad.addColorStop(0.3, '#05142E');
  bgGrad.addColorStop(0.7, '#040F22');
  bgGrad.addColorStop(1, '#02060F');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Cyan ambient top-left glow
  const cyanGlow = ctx.createRadialGradient(200, 150, 20, 200, 150, 450);
  cyanGlow.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
  cyanGlow.addColorStop(1, 'rgba(0, 229, 255, 0)');
  ctx.fillStyle = cyanGlow;
  ctx.fillRect(0, 0, width, height);

  // Purple/Indigo ambient right glow
  const purpleGlow = ctx.createRadialGradient(880, 550, 20, 880, 550, 500);
  purpleGlow.addColorStop(0, 'rgba(139, 92, 246, 0.14)');
  purpleGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.fillStyle = purpleGlow;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid lines & stars
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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

  // Draw twinkling stars
  const starSeeds = [
    [120, 80], [350, 60], [920, 90], [180, 420], [890, 380],
    [100, 900], [980, 850], [250, 1250], [820, 1220]
  ];
  ctx.fillStyle = '#FFFFFF';
  for (const [sx, sy] of starSeeds) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. OUTER BROADCAST CARD FRAME (Double glowing border)
  const margin = 36;
  const cardW = width - margin * 2;
  const cardH = height - margin * 2;

  // Outer border with gradient
  const borderGrad = ctx.createLinearGradient(margin, margin, margin + cardW, margin + cardH);
  borderGrad.addColorStop(0, '#00E5FF');
  borderGrad.addColorStop(0.5, '#3B82F6');
  borderGrad.addColorStop(1, '#EAA81B');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 3.5;
  roundRect(ctx, margin, margin, cardW, cardH, 28);
  ctx.stroke();

  // Subtle inner border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, margin + 8, margin + 8, cardW - 16, cardH - 16, 22);
  ctx.stroke();

  // 3. HEADER: LOGO & UCL TOURNAMENT BADGE
  // Top Left: 1xlmzalit Logo
  drawXlmzalitVector(ctx, margin + 32, margin + 30, 0.65);

  // Subtitle next to logo
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 15px "Segoe UI", sans-serif';
  ctx.fillText('OFFICIAL PREDICTION TICKET', margin + 34, margin + 112);

  // Top Right: Tournament Pill & v1.0 Badge
  const badgeRight = margin + cardW - 32;
  const badgeY = margin + 34;

  // Badge Container
  roundRect(ctx, badgeRight - 280, badgeY, 280, 52, 14);
  ctx.fillStyle = 'rgba(4, 30, 52, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // v1.0 small pill inside
  roundRect(ctx, badgeRight - 270, badgeY + 10, 56, 32, 8);
  ctx.fillStyle = '#041E34';
  ctx.fill();
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#00E5FF';
  ctx.font = '900 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('v1.0', badgeRight - 242, badgeY + 31);

  // Tournament title
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 16px "Cairo", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('بطولة دوري أبطال أوروبا', badgeRight - 16, badgeY + 32);

  // 4. MEMBER DETAILS & SUBMISSION TIMESTAMP (ENGLISH)
  const userBoxY = margin + 140;
  roundRect(ctx, margin + 28, userBoxY, cardW - 56, 115, 20);
  ctx.fillStyle = 'rgba(10, 25, 52, 0.65)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Member Avatar Ring
  const avatarX = margin + 78;
  const avatarY = userBoxY + 57;
  const avatarRadius = 38;

  const ringGrad = ctx.createLinearGradient(avatarX - 40, avatarY - 40, avatarX + 40, avatarY + 40);
  ringGrad.addColorStop(0, '#00E5FF');
  ringGrad.addColorStop(1, '#EAA81B');
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#021124';
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius - 2, 0, Math.PI * 2);
  ctx.fill();

  // Initial letter
  const userInitial = (memberName || 'U').charAt(0).toUpperCase();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 32px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(userInitial, avatarX, avatarY + 11);

  // Member Name text & status
  ctx.textAlign = 'left';
  ctx.fillStyle = '#38BDF8';
  ctx.font = '900 13px "Segoe UI", sans-serif';
  ctx.fillText('PREDICTED BY MEMBER', avatarX + 54, userBoxY + 40);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 28px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText(`@${memberName || 'Contestant'}`, avatarX + 54, userBoxY + 74);

  // Verified Badge
  roundRect(ctx, avatarX + 54, userBoxY + 84, 150, 22, 6);
  ctx.fillStyle = 'rgba(234, 168, 27, 0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(234, 168, 27, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#FBBF24';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.fillText('★ VERIFIED PREDICTION', avatarX + 64, userBoxY + 99);

  // English Timestamps on Right Side: Date of Prediction & Date of Download
  const rightEdgeX = margin + cardW - 46;
  ctx.textAlign = 'right';

  // 1) Prediction Date
  ctx.fillStyle = '#94A3B8';
  ctx.font = '900 11px "Segoe UI", sans-serif';
  ctx.fillText('PREDICTION DATE:', rightEdgeX - 180, userBoxY + 48);

  const predictionDateStr = formatDateTimeEn(prediction.updatedAt);
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.fillText(predictionDateStr, rightEdgeX, userBoxY + 48);

  // 2) Download Date
  const currentDownloadTime = options.downloadDate || new Date();
  const downloadDateStr = formatDateTimeEn(currentDownloadTime);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '900 11px "Segoe UI", sans-serif';
  ctx.fillText('DOWNLOAD DATE:', rightEdgeX - 180, userBoxY + 82);

  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.fillText(downloadDateStr, rightEdgeX, userBoxY + 82);

  // 5. MATCH HEADER & ENGLISH MATCH KICKOFF TIME
  const matchHeaderY = userBoxY + 138;
  roundRect(ctx, margin + 28, matchHeaderY, cardW - 56, 52, 14);
  ctx.fillStyle = 'rgba(7, 19, 43, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Match Kickoff English label
  const englishDeadline = formatDateTimeEn(match.deadline);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FBBF24';
  ctx.font = '900 14px "Segoe UI", sans-serif';
  ctx.fillText(`UEFA CHAMPIONS LEAGUE 2026/2027 • KICK-OFF: ${englishDeadline.toUpperCase()}`, width / 2, matchHeaderY + 32);

  // 6. MAIN SHOWCASE: HOME vs AWAY & PREDICTED SCORE
  const faceOffY = matchHeaderY + 75;
  const faceOffH = 260;

  roundRect(ctx, margin + 28, faceOffY, cardW - 56, faceOffH, 24);
  const faceOffGrad = ctx.createLinearGradient(0, faceOffY, 0, faceOffY + faceOffH);
  faceOffGrad.addColorStop(0, 'rgba(11, 28, 62, 0.85)');
  faceOffGrad.addColorStop(1, 'rgba(5, 15, 34, 0.95)');
  ctx.fillStyle = faceOffGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // LEFT: Home Team Logo & Name
  const homeX = margin + 170;
  const homeY = faceOffY + 110;
  const logoContainerRadius = 60;

  // Home Logo Circle Container
  ctx.save();
  ctx.beginPath();
  ctx.arc(homeX, homeY, logoContainerRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#030D1E';
  ctx.fill();
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  if (homeImg) {
    // Preserve natural aspect ratio without height compression or distortion
    drawImageFitted(ctx, homeImg, homeX - 50, homeY - 50, 100, 100);
  } else {
    // Fallback graphic
    ctx.fillStyle = '#0A2540';
    ctx.beginPath();
    ctx.arc(homeX, homeY, logoContainerRadius - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((homeTeam.name || 'H').substring(0, 3).toUpperCase(), homeX, homeY + 9);
  }
  ctx.restore();

  // Home Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px "Cairo", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(getTeamEnglishName(homeTeam.name), homeX, homeY + 90);

  // "HOME" pill
  roundRect(ctx, homeX - 40, homeY + 104, 80, 22, 6);
  ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
  ctx.fill();
  ctx.fillStyle = '#00E5FF';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.fillText('HOME', homeX, homeY + 119);

  // RIGHT: Away Team Logo & Name
  const awayX = margin + cardW - 170;
  const awayY = homeY;

  // Away Logo Circle Container
  ctx.save();
  ctx.beginPath();
  ctx.arc(awayX, awayY, logoContainerRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#030D1E';
  ctx.fill();
  ctx.strokeStyle = '#A855F7';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  if (awayImg) {
    // Preserve natural aspect ratio without height compression or distortion
    drawImageFitted(ctx, awayImg, awayX - 50, awayY - 50, 100, 100);
  } else {
    // Fallback graphic
    ctx.fillStyle = '#0A2540';
    ctx.beginPath();
    ctx.arc(awayX, awayY, logoContainerRadius - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((awayTeam.name || 'A').substring(0, 3).toUpperCase(), awayX, awayY + 9);
  }
  ctx.restore();

  // Away Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px "Cairo", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(getTeamEnglishName(awayTeam.name), awayX, awayY + 90);

  // "AWAY" pill
  roundRect(ctx, awayX - 40, awayY + 104, 80, 22, 6);
  ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
  ctx.fill();
  ctx.fillStyle = '#C084FC';
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.fillText('AWAY', awayX, awayY + 119);

  // CENTER SCOREBOARD BOX
  const scoreBoxW = 280;
  const scoreBoxH = 175;
  const scoreBoxX = (width - scoreBoxW) / 2;
  const scoreBoxY = faceOffY + 38;

  roundRect(ctx, scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 20);
  ctx.fillStyle = '#020917';
  ctx.fill();
  ctx.strokeStyle = '#EAA81B';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Score Box Header
  roundRect(ctx, scoreBoxX + 18, scoreBoxY - 14, scoreBoxW - 36, 28, 8);
  ctx.fillStyle = '#EAA81B';
  ctx.fill();
  ctx.fillStyle = '#020813';
  ctx.font = '900 12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PREDICTED SCORE', width / 2, scoreBoxY + 5);

  // The Scores
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 76px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';

  // Neon shadow on numbers
  ctx.shadowColor = '#00E5FF';
  ctx.shadowBlur = 18;
  ctx.fillText(`${prediction.homeScore}  -  ${prediction.awayScore}`, width / 2, scoreBoxY + 108);
  ctx.shadowBlur = 0; // reset

  // Sub-badge under scores
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 12px "Segoe UI", sans-serif';
  ctx.fillText('FULL TIME RESULT', width / 2, scoreBoxY + 148);

  // 7. GOAL SCORERS SECTION
  const scorersY = faceOffY + faceOffH + 24;
  const scorersH = 260;

  roundRect(ctx, margin + 28, scorersY, cardW - 56, scorersH, 20);
  ctx.fillStyle = 'rgba(7, 20, 44, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Section Header: GOAL SCORERS
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00E5FF';
  ctx.font = '900 15px "Segoe UI", sans-serif';
  ctx.fillText('⚽ PREDICTED GOAL SCORERS ⚽', width / 2, scorersY + 34);

  // Vertical divider line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2, scorersY + 48);
  ctx.lineTo(width / 2, scorersY + scorersH - 20);
  ctx.stroke();

  // Left Column: Home Scorers
  const homeColX = margin + 54;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#38BDF8';
  ctx.font = '900 16px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText(`${getTeamEnglishName(homeTeam.name)} (${prediction.homeScore})`, homeColX, scorersY + 68);

  if (prediction.homeScorers && prediction.homeScorers.length > 0) {
    prediction.homeScorers.slice(0, 5).forEach((scorer, idx) => {
      const sy = scorersY + 102 + idx * 30;
      ctx.fillStyle = '#EAA81B';
      ctx.font = '14px sans-serif';
      ctx.fillText('⚽', homeColX, sy);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px "Cairo", "Segoe UI", sans-serif';
      ctx.fillText(scorer || 'Unassigned', homeColX + 26, sy);
    });
  } else {
    ctx.fillStyle = '#64748B';
    ctx.font = 'italic 14px "Segoe UI", sans-serif';
    ctx.fillText('No goals predicted for this side', homeColX, scorersY + 105);
  }

  // Right Column: Away Scorers
  const awayColX = width / 2 + 26;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#C084FC';
  ctx.font = '900 16px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText(`${getTeamEnglishName(awayTeam.name)} (${prediction.awayScore})`, awayColX, scorersY + 68);

  if (prediction.awayScorers && prediction.awayScorers.length > 0) {
    prediction.awayScorers.slice(0, 5).forEach((scorer, idx) => {
      const sy = scorersY + 102 + idx * 30;
      ctx.fillStyle = '#EAA81B';
      ctx.font = '14px sans-serif';
      ctx.fillText('⚽', awayColX, sy);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px "Cairo", "Segoe UI", sans-serif';
      ctx.fillText(scorer || 'Unassigned', awayColX + 26, sy);
    });
  } else {
    ctx.fillStyle = '#64748B';
    ctx.font = 'italic 14px "Segoe UI", sans-serif';
    ctx.fillText('No goals predicted for this side', awayColX, scorersY + 105);
  }

  // 8. MAN OF THE MATCH (MVP) BANNER
  const mvpY = scorersY + scorersH + 20;
  const mvpH = 95;

  roundRect(ctx, margin + 28, mvpY, cardW - 56, mvpH, 18);
  const mvpGrad = ctx.createLinearGradient(margin, mvpY, margin + cardW, mvpY);
  mvpGrad.addColorStop(0, 'rgba(40, 26, 4, 0.85)');
  mvpGrad.addColorStop(0.5, 'rgba(65, 45, 10, 0.95)');
  mvpGrad.addColorStop(1, 'rgba(40, 26, 4, 0.85)');
  ctx.fillStyle = mvpGrad;
  ctx.fill();
  ctx.strokeStyle = '#EAA81B';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Trophy Icon Graphic
  ctx.fillStyle = '#FBBF24';
  ctx.font = '36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏆', margin + 80, mvpY + 58);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#FBBF24';
  ctx.font = '900 14px "Segoe UI", sans-serif';
  ctx.fillText('PREDICTED MAN OF THE MATCH (MVP)', margin + 124, mvpY + 36);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 26px "Cairo", "Segoe UI", sans-serif';
  ctx.fillText(prediction.mvp ? prediction.mvp.trim() : 'Not Specified', margin + 124, mvpY + 69);

  // 9. FOOTER WATERMARK & AUTHENTICITY CODE
  const footerY = height - margin - 35;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 12px "Segoe UI", sans-serif';
  const ticketId = `TKT-UCL26-${match.id.substring(0, 6).toUpperCase()}-${(prediction.username || 'USR').substring(0, 4).toUpperCase()}`;
  ctx.fillText(`TICKET ID: ${ticketId} • OFFICIAL VERIFIED ENTRY`, margin + 30, footerY);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#00E5FF';
  ctx.font = 'bold 12px "Segoe UI", sans-serif';
  ctx.fillText('1xlmzalit.ai • UEFA Champions League Predictor', margin + cardW - 30, footerY);

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
