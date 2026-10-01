/**
 * UEFA Champions League Standings / Leaderboard Card Generator
 * Upgraded to match the application's signature dark aesthetic:
 * Palette: #06141B (Dark Base), #11212D (Card Surface), #253745 (Border), #4A5C6A (Steel Accent),
 * #9BA8AB (Muted Text), #CCD0CF (Primary Text), #EAA81B (Gold Accent), #10B981 (Emerald)
 * 
 * Generates an official, publication-ready HD image dynamically and tightly sized.
 * Employs rock-solid, glitch-free quadratic curve geometry and native roundRect
 * to eliminate stray lines, ghost artifacts, and edge bleeding across all devices.
 */

import { AppUser } from '../types';
import { formatDateTimeMoroccoGmt } from './moroccoTime';

export interface StandingsCardOptions {
  users: AppUser[];
  userStats: Record<string, { exactScoreCount: number; correctMvpCount: number; correctScorersCount: number }>;
  generatedDate?: Date | string;
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
 * Draw the official 1xlmzalit vector logo directly onto canvas with isolated path state
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
  ctx.closePath();
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
  ctx.closePath();
  ctx.fill();

  // t: Cross letter
  ctx.fillStyle = '#CCD0CF';
  ctx.fillRect(360, 20, 16, 70);
  ctx.fillRect(352, 38, 38, 12);

  ctx.beginPath(); // Clear path before restore
  ctx.restore();
}

/**
 * Generate a dynamic high-definition PNG Data URL for the current standings
 * dynamically and tightly sized without any glitches or unused space.
 */
export async function generateStandingsCardImage(options: StandingsCardOptions): Promise<string> {
  const { users, userStats, generatedDate } = options;

  const width = 1080;
  const margin = 28;
  const cardW = width - margin * 2;

  // Header & Banner layout (compact and clean)
  const bannerY = margin + 92;
  const bannerH = 40;

  // Standings table: directly below banner
  const displayedUsers = users.slice(0, 18);
  const rowCount = displayedUsers.length;
  const rowH = 48;
  const tableHeaderH = 46;
  const tablePadding = 12;
  const tableH = rowCount > 0 ? (tableHeaderH + rowCount * rowH + tablePadding) : 90;
  const tableY = bannerY + bannerH + 16;

  // Footer: placed below table with clean 22px breathing room from the card border
  const footerY = tableY + tableH + 30;
  const cardH = footerY + 22 - margin;
  const height = cardH + margin * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot initialize 2D canvas context');

  // 1. BASE DARK BACKGROUND
  ctx.fillStyle = '#06141B';
  ctx.fillRect(0, 0, width, height);

  // Smooth ambient radial vignette tailored to dynamic height
  const centerGlow = ctx.createRadialGradient(width / 2, height * 0.35, 60, width / 2, height * 0.35, width * 0.7);
  centerGlow.addColorStop(0, '#0D212D');
  centerGlow.addColorStop(0.65, '#06141B');
  centerGlow.addColorStop(1, '#030B0F');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, width, height);

  // Subtle starry constellation pattern
  const starSeeds = [
    [90, 60], [280, 50], [920, 65], [160, 220], [950, 200],
    [90, 420], [990, 400], [180, 580], [890, 540], [540, 140]
  ];
  ctx.fillStyle = '#CCD0CF';
  for (const [sx, sy] of starSeeds) {
    if (sy < height - 30) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. OUTER CARD FRAME (Solid clean border, zero bleed)
  const borderGrad = ctx.createLinearGradient(margin, margin, margin + cardW, margin + cardH);
  borderGrad.addColorStop(0, '#4A5C6A');
  borderGrad.addColorStop(0.3, '#253745');
  borderGrad.addColorStop(0.7, '#253745');
  borderGrad.addColorStop(1, '#EAA81B');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2;
  roundRect(ctx, margin, margin, cardW, cardH, 20);
  ctx.stroke();

  // 3. HEADER: 1XLMZALIT LOGO & UCL BADGE
  drawXlmzalitVector(ctx, margin + 24, margin + 20, 0.54);

  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 12.5px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('OFFICIAL LEADERBOARD • UCL 2026/2027', margin + 26, margin + 82);

  // Tournament Badge (Top Right)
  const badgeRight = margin + cardW - 24;
  const badgeY = margin + 20;
  const badgeW = 310;
  const badgeH = 46;

  roundRect(ctx, badgeRight - badgeW, badgeY, badgeW, badgeH, 12);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // UCL Pill
  roundRect(ctx, badgeRight - badgeW + 8, badgeY + 7, 56, 32, 8);
  ctx.fillStyle = '#06141B';
  ctx.fill();
  ctx.strokeStyle = '#4A5C6A';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#EAA81B';
  ctx.font = '900 12.5px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UCL', badgeRight - badgeW + 36, badgeY + 28);

  ctx.fillStyle = '#CCD0CF';
  ctx.font = 'bold 14.5px "Cairo", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ترتيب بطولة دوري أبطال أوروبا', badgeRight - 14, badgeY + 29);

  // 4. TIMESTAMP BANNER (Strictly Morocco GMT)
  roundRect(ctx, margin + 20, bannerY, cardW - 40, bannerH, 10);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const formattedDate = formatDateTimeMoroccoGmt(generatedDate || new Date(), 0);
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 12.5px "Segoe UI", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`🏆 CURRENT STANDINGS • AS OF: ${formattedDate.toUpperCase()}`, width / 2, bannerY + 25);

  // 5. OFFICIAL STANDINGS TABLE (Clean, direct, and tightly proportioned)
  roundRect(ctx, margin + 20, tableY, cardW - 40, tableH, 16);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Table Header Row
  const thY = tableY + 30;
  ctx.fillStyle = '#9BA8AB';
  ctx.font = '900 12px "Segoe UI", sans-serif';

  const colRank = margin + 44;
  const colMember = margin + 120;
  const colScores = margin + 550;
  const colMvp = margin + 680;
  const colScorers = margin + 800;
  const colPts = margin + cardW - 44;

  ctx.textAlign = 'left';
  ctx.fillText('RANK', colRank, thY);
  ctx.fillText('MEMBER', colMember, thY);

  ctx.textAlign = 'center';
  ctx.fillText('EXACT SCORES', colScores, thY);
  ctx.fillText('MVPs', colMvp, thY);
  ctx.fillText('SCORERS', colScorers, thY);

  ctx.textAlign = 'right';
  ctx.fillText('TOTAL POINTS', colPts, thY);

  // Divider under TH
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(margin + 32, tableY + 44);
  ctx.lineTo(margin + cardW - 32, tableY + 44);
  ctx.stroke();

  if (rowCount === 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9BA8AB';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText('No contenders registered yet', width / 2, tableY + 70);
  } else {
    // Table Rows (only the exact number of users, perfectly tight)
    displayedUsers.forEach((user, idx) => {
      const rowY = tableY + 48 + idx * rowH;
      const rank = idx + 1;
      const stats = userStats[user.username] || { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };

      // Row alternating background
      if (idx % 2 === 1) {
        ctx.fillStyle = 'rgba(6, 20, 27, 0.45)';
        ctx.fillRect(margin + 22, rowY, cardW - 44, rowH);
      }

      // Rank Badge Box
      const rankBadgeW = 38;
      const rankBadgeH = 26;
      const rankBadgeY = rowY + (rowH - rankBadgeH) / 2;
      roundRect(ctx, colRank, rankBadgeY, rankBadgeW, rankBadgeH, 6);

      if (rank === 1) {
        ctx.fillStyle = '#EAA81B';
        ctx.fill();
        ctx.fillStyle = '#06141B';
      } else if (rank === 2) {
        ctx.fillStyle = '#CCD0CF';
        ctx.fill();
        ctx.fillStyle = '#06141B';
      } else if (rank === 3) {
        ctx.fillStyle = '#CD7F32';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.fillStyle = '#253745';
        ctx.fill();
        ctx.fillStyle = '#9BA8AB';
      }
      ctx.font = '900 13px "Segoe UI", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`#${rank}`, colRank + rankBadgeW / 2, rankBadgeY + 18);

      // Member Name & Special Embellishment for Top 3
      ctx.textAlign = 'left';
      let namePrefix = '';
      if (rank === 1) {
        ctx.fillStyle = '#FDE047';
        namePrefix = '👑 ';
      } else if (rank === 2) {
        ctx.fillStyle = '#FFFFFF';
        namePrefix = '🥈 ';
      } else if (rank === 3) {
        ctx.fillStyle = '#FFFFFF';
        namePrefix = '🥉 ';
      } else {
        ctx.fillStyle = '#CCD0CF';
      }
      ctx.font = 'bold 15px "Cairo", "Segoe UI", sans-serif';
      const cleanName = (user.username || 'Contestant').replace(/^@+/, '');
      const truncatedName = cleanName.length > 18 ? cleanName.substring(0, 17) + '…' : cleanName;
      ctx.fillText(`${namePrefix}@${truncatedName}`, colMember, rowY + rowH * 0.62);

      // Stats Columns (centered cleanly under each column header)
      ctx.fillStyle = '#CCD0CF';
      ctx.font = 'bold 13.5px "Segoe UI", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${stats.exactScoreCount || 0}`, colScores, rowY + rowH * 0.62);
      ctx.fillText(`${stats.correctMvpCount || 0}`, colMvp, rowY + rowH * 0.62);
      ctx.fillText(`${stats.correctScorersCount || 0}`, colScorers, rowY + rowH * 0.62);

      // Points Badge on Right
      ctx.textAlign = 'right';
      const ptsBadgeW = 88;
      const ptsBadgeH = 30;
      const ptsBadgeY = rowY + (rowH - ptsBadgeH) / 2;
      roundRect(ctx, colPts - ptsBadgeW, ptsBadgeY, ptsBadgeW, ptsBadgeH, 8);

      if (rank === 1) {
        ctx.fillStyle = 'rgba(234, 168, 27, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#EAA81B';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#EAA81B';
      } else {
        ctx.fillStyle = 'rgba(37, 55, 69, 0.65)';
        ctx.fill();
        ctx.strokeStyle = '#253745';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = rank === 2 ? '#CCD0CF' : rank === 3 ? '#CD7F32' : '#CCD0CF';
      }

      ctx.font = '900 13.5px "Segoe UI", monospace';
      ctx.fillText(`${user.points || 0} pts`, colPts - 10, ptsBadgeY + 20);
    });
  }

  // 6. FOOTER AUTHENTICITY CODE (Clean and well-padded)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 11px "Segoe UI", monospace';
  ctx.fillText('1XLMZALIT OFFICIAL STANDINGS • VERIFIED & LOCKED ENTRY', margin + 24, footerY);

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
