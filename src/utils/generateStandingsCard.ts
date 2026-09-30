/**
 * UEFA Champions League Standings / Leaderboard Card Generator
 * Upgraded to match the application's signature dark aesthetic:
 * Palette: #06141B (Dark Base), #11212D (Card Surface), #253745 (Border), #4A5C6A (Steel Accent),
 * #9BA8AB (Muted Text), #CCD0CF (Primary Text), #EAA81B (Gold Accent), #10B981 (Emerald)
 * 
 * Generates an official, publication-ready HD 1080x1520 image of the current standings.
 */

import { AppUser } from '../types';
import { formatDateTimeMoroccoGmt } from './moroccoTime';

export interface StandingsCardOptions {
  users: AppUser[];
  userStats: Record<string, { exactScoreCount: number; correctMvpCount: number; correctScorersCount: number }>;
  generatedDate?: Date | string;
}

/**
 * Draw a rounded rectangle path
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

  ctx.restore();
}

/**
 * Generate a high-definition 1080x1520 PNG Data URL for the current standings
 */
export async function generateStandingsCardImage(options: StandingsCardOptions): Promise<string> {
  const { users, userStats, generatedDate } = options;

  const width = 1080;
  const height = 1520;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot initialize 2D canvas context');

  // 1. BASE DARK BACKGROUND
  ctx.fillStyle = '#06141B';
  ctx.fillRect(0, 0, width, height);

  // Smooth ambient radial vignette
  const centerGlow = ctx.createRadialGradient(width / 2, height * 0.35, 100, width / 2, height * 0.35, width * 0.7);
  centerGlow.addColorStop(0, '#0D212D');
  centerGlow.addColorStop(0.65, '#06141B');
  centerGlow.addColorStop(1, '#030B0F');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, width, height);

  // Subtle starry constellation pattern
  const starSeeds = [
    [90, 90], [280, 70], [920, 95], [160, 360], [950, 340],
    [90, 880], [990, 860], [180, 1420], [890, 1400], [540, 210]
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

  // 2. OUTER CARD FRAME
  const margin = 32;
  const cardW = width - margin * 2;
  const cardH = height - margin * 2;

  const borderGrad = ctx.createLinearGradient(margin, margin, margin + cardW, margin + cardH);
  borderGrad.addColorStop(0, '#4A5C6A');
  borderGrad.addColorStop(0.3, '#253745');
  borderGrad.addColorStop(0.7, '#253745');
  borderGrad.addColorStop(1, '#EAA81B');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.5;
  roundRect(ctx, margin, margin, cardW, cardH, 26);
  ctx.stroke();

  // 3. HEADER: 1XLMZALIT LOGO & UCL BADGE
  drawXlmzalitVector(ctx, margin + 28, margin + 26, 0.62);

  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('OFFICIAL LEADERBOARD • UCL 2026/2027', margin + 30, margin + 104);

  // Tournament Badge (Top Right)
  const badgeRight = margin + cardW - 28;
  const badgeY = margin + 28;
  const badgeW = 320;
  const badgeH = 50;

  roundRect(ctx, badgeRight - badgeW, badgeY, badgeW, badgeH, 14);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // UCL Pill
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

  ctx.fillStyle = '#CCD0CF';
  ctx.font = 'bold 15px "Cairo", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ترتيب بطولة دوري أبطال أوروبا', badgeRight - 16, badgeY + 31);

  // 4. TIMESTAMP BANNER (Strictly Morocco GMT)
  const bannerY = margin + 124;
  roundRect(ctx, margin + 24, bannerY, cardW - 48, 46, 12);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const formattedDate = formatDateTimeMoroccoGmt(generatedDate || new Date(), 0);
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 13px "Segoe UI", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`🏆 CURRENT STANDINGS • AS OF: ${formattedDate.toUpperCase()}`, width / 2, bannerY + 29);

  // 5. TOP 3 PODIUM SECTION
  const top3Y = bannerY + 62;
  const top3H = 175;
  const topUsers = users.slice(0, 3);

  const colGap = 16;
  const colW = (cardW - 48 - colGap * 2) / 3;

  // Podium columns: [2nd, 1st, 3rd] or [1st, 2nd, 3rd]
  // Let's lay them out in standard order [1st, 2nd, 3rd] with 1st highlighted
  topUsers.forEach((user, idx) => {
    const colX = margin + 24 + idx * (colW + colGap);
    const rank = idx + 1;
    const stats = userStats[user.username] || { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };

    roundRect(ctx, colX, top3Y, colW, top3H, 18);
    ctx.fillStyle = rank === 1 ? '#182C3D' : '#11212D';
    ctx.fill();
    ctx.strokeStyle = rank === 1 ? '#EAA81B' : rank === 2 ? '#CCD0CF' : '#CD7F32';
    ctx.lineWidth = rank === 1 ? 2 : 1.2;
    ctx.stroke();

    // Rank Badge
    roundRect(ctx, colX + 16, top3Y + 14, 44, 28, 8);
    ctx.fillStyle = rank === 1 ? '#EAA81B' : rank === 2 ? '#CCD0CF' : '#CD7F32';
    ctx.fill();
    ctx.fillStyle = '#06141B';
    ctx.font = '900 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${rank}`, colX + 38, top3Y + 33);

    // Crown for #1
    if (rank === 1) {
      ctx.font = '18px sans-serif';
      ctx.fillText('👑', colX + colW - 30, top3Y + 34);
    }

    // Avatar Initial Circle
    const avatarX = colX + 42;
    const avatarY = top3Y + 76;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, 22, 0, Math.PI * 2);
    ctx.fillStyle = rank === 1 ? '#EAA81B' : '#253745';
    ctx.fill();
    ctx.strokeStyle = '#4A5C6A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = rank === 1 ? '#06141B' : '#CCD0CF';
    ctx.font = '900 18px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(user.username.charAt(0).toUpperCase(), avatarX, avatarY + 6);

    // Member Name
    ctx.textAlign = 'left';
    ctx.fillStyle = rank === 1 ? '#FDE047' : '#FFFFFF';
    ctx.font = '900 18px "Cairo", "Segoe UI", sans-serif';
    const truncatedName = user.username.length > 14 ? user.username.substring(0, 13) + '…' : user.username;
    ctx.fillText(`@${truncatedName}`, colX + 72, top3Y + 82);

    // Points Pill
    roundRect(ctx, colX + 16, top3Y + 114, colW - 32, 42, 10);
    ctx.fillStyle = '#06141B';
    ctx.fill();
    ctx.strokeStyle = '#253745';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = rank === 1 ? '#EAA81B' : '#CCD0CF';
    ctx.font = '900 17px "Segoe UI", monospace';
    ctx.fillText(`${user.points || 0} PTS`, colX + colW / 2, top3Y + 140);
  });

  // 6. FULL STANDINGS TABLE
  const tableY = top3Y + top3H + 24;
  const tableH = height - margin - tableY - 50;

  roundRect(ctx, margin + 24, tableY, cardW - 48, tableH, 18);
  ctx.fillStyle = '#11212D';
  ctx.fill();
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Table Header Row
  const thY = tableY + 36;
  ctx.fillStyle = '#9BA8AB';
  ctx.font = '900 12px "Segoe UI", sans-serif';

  const colRank = margin + 50;
  const colMember = margin + 130;
  const colScores = margin + 510;
  const colMvp = margin + 660;
  const colScorers = margin + 790;
  const colPts = margin + cardW - 65;

  ctx.textAlign = 'left';
  ctx.fillText('RANK', colRank, thY);
  ctx.fillText('MEMBER', colMember, thY);
  ctx.fillText('EXACT SCORES', colScores, thY);
  ctx.fillText('MVPs', colMvp, thY);
  ctx.fillText('SCORERS', colScorers, thY);

  ctx.textAlign = 'right';
  ctx.fillText('TOTAL POINTS', colPts, thY);

  // Divider under TH
  ctx.strokeStyle = '#253745';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin + 36, tableY + 50);
  ctx.lineTo(margin + cardW - 36, tableY + 50);
  ctx.stroke();

  // Table Rows (display up to 14 users)
  const maxRows = 14;
  const displayedUsers = users.slice(0, maxRows);
  const rowH = Math.min(54, (tableH - 65) / Math.max(displayedUsers.length, 1));

  displayedUsers.forEach((user, idx) => {
    const rowY = tableY + 60 + idx * rowH;
    const rank = idx + 1;
    const stats = userStats[user.username] || { exactScoreCount: 0, correctMvpCount: 0, correctScorersCount: 0 };

    // Row alternating background
    if (idx % 2 === 1) {
      ctx.fillStyle = 'rgba(6, 20, 27, 0.4)';
      ctx.fillRect(margin + 26, rowY - 6, cardW - 52, rowH);
    }

    // Rank Number
    ctx.textAlign = 'left';
    ctx.fillStyle = rank === 1 ? '#EAA81B' : rank === 2 ? '#CCD0CF' : rank === 3 ? '#CD7F32' : '#9BA8AB';
    ctx.font = '900 15px "Segoe UI", monospace';
    ctx.fillText(`#${rank}`, colRank, rowY + rowH * 0.55);

    // Member Name
    ctx.fillStyle = rank === 1 ? '#FDE047' : '#FFFFFF';
    ctx.font = 'bold 15px "Cairo", "Segoe UI", sans-serif';
    const nameDisplay = `@${user.username}`;
    ctx.fillText(nameDisplay, colMember, rowY + rowH * 0.55);

    // Stats
    ctx.fillStyle = '#CCD0CF';
    ctx.font = 'bold 14px "Segoe UI", monospace';
    ctx.fillText(`${stats.exactScoreCount || 0}`, colScores + 35, rowY + rowH * 0.55);
    ctx.fillText(`${stats.correctMvpCount || 0}`, colMvp + 15, rowY + rowH * 0.55);
    ctx.fillText(`${stats.correctScorersCount || 0}`, colScorers + 25, rowY + rowH * 0.55);

    // Points Badge on Right
    ctx.textAlign = 'right';
    roundRect(ctx, colPts - 86, rowY + rowH * 0.2, 86, rowH * 0.65, 8);
    ctx.fillStyle = rank === 1 ? 'rgba(234, 168, 27, 0.2)' : 'rgba(37, 55, 69, 0.6)';
    ctx.fill();
    ctx.strokeStyle = rank === 1 ? '#EAA81B' : '#253745';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = rank === 1 ? '#EAA81B' : '#CCD0CF';
    ctx.font = '900 14px "Segoe UI", monospace';
    ctx.fillText(`${user.points || 0} pts`, colPts - 10, rowY + rowH * 0.64);
  });

  // 7. FOOTER AUTHENTICITY CODE
  const footerY = height - margin - 18;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9BA8AB';
  ctx.font = 'bold 12px "Segoe UI", monospace';
  ctx.fillText('1XLMZALIT OFFICIAL STANDINGS • VERIFIED & LOCKED ENTRY', margin + 26, footerY);

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
