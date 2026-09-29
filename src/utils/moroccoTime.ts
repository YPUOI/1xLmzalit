/**
 * Morocco Time Utility
 * 
 * Official Decree: As of September 20, 2026, Morocco permanently observes Greenwich Mean Time (GMT / UTC+0).
 * Since older IANA tzdata tables in Node/browsers still assume GMT+1 for 'Africa/Casablanca',
 * using system 'Africa/Casablanca' erroneously advanced clocks by +1 hour (e.g. 12:05 instead of 11:05),
 * causing matches set for 11:xx to immediately expire while the user's phone in Morocco is still 11:xx!
 * 
 * This module explicitly enforces the real Moroccan GMT (UTC+0) standard (with optional GMT+1 toggle support).
 */

export const MOROCCO_DEFAULT_OFFSET_HOURS = 0; // GMT (UTC+0)

export function getStoredMoroccoOffset(): number {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('morocco_time_offset');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return MOROCCO_DEFAULT_OFFSET_HOURS;
}

export function setStoredMoroccoOffset(offsetHours: number): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('morocco_time_offset', String(offsetHours));
  }
}

/**
 * Returns formatted live time in Morocco (e.g. "11:05" or "11:05:30")
 * Strictly matching the user's phone in Morocco (GMT / UTC+0).
 */
export function getMoroccoCurrentTimeFormatted(includeSeconds = false, offsetHours = getStoredMoroccoOffset()): string {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const moroccoDate = new Date(utcMs + (offsetHours * 3600000));
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = pad(moroccoDate.getHours());
  const m = pad(moroccoDate.getMinutes());
  if (includeSeconds) {
    const s = pad(moroccoDate.getSeconds());
    return `${h}:${m}:${s}`;
  }
  return `${h}:${m}`;
}

/**
 * Formats any ISO string or Date into "YYYY-MM-DDTHH:mm" in Morocco's timezone (GMT).
 * Suitable for pre-filling or editing `<input type="datetime-local" />`.
 */
export function formatMoroccoInput(isoOrDateStr: string, offsetHours = getStoredMoroccoOffset()): string {
  if (!isoOrDateStr) return '';
  const d = new Date(isoOrDateStr);
  if (isNaN(d.getTime())) return '';

  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
  const moroccoDate = new Date(utcMs + (offsetHours * 3600000));

  const pad = (n: number) => String(n).padStart(2, '0');
  const y = moroccoDate.getFullYear();
  const m = pad(moroccoDate.getMonth() + 1);
  const day = pad(moroccoDate.getDate());
  const h = pad(moroccoDate.getHours());
  const min = pad(moroccoDate.getMinutes());

  return `${y}-${m}-${day}T${h}:${min}`;
}

/**
 * Parses a datetime string entered by the admin in Morocco time (YYYY-MM-DDTHH:mm)
 * and returns the exact ISO 8601 UTC string.
 */
export function parseMoroccoDateTime(dateStr: string, offsetHours = getStoredMoroccoOffset()): string {
  if (!dateStr) return '';
  const clean = dateStr.replace(' ', 'T').slice(0, 16);
  const [datePart, timePart] = clean.split('T');
  if (!datePart || !timePart) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }

  const [y, m, d] = datePart.split('-').map(Number);
  const [h, min] = timePart.split(':').map(Number);

  // Time is entered in Morocco time (UTC + offsetHours)
  // To get UTC: subtract offsetHours
  const utcTime = Date.UTC(y, m - 1, d, h - offsetHours, min);
  return new Date(utcTime).toISOString();
}

/**
 * Formats a deadline into a clear English string in Morocco time
 * e.g. "Sep 28, 2026, 11:30 AM (🇲🇦 GMT)"
 */
export function formatEnglishDeadlineMorocco(deadlineStr: string, offsetHours = getStoredMoroccoOffset()): string {
  const d = new Date(deadlineStr);
  if (isNaN(d.getTime())) return deadlineStr;

  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
  const moroccoDate = new Date(utcMs + (offsetHours * 3600000));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[moroccoDate.getMonth()];
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(moroccoDate.getDate());
  const year = moroccoDate.getFullYear();

  let hours = moroccoDate.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = pad(hours);
  const minutes = pad(moroccoDate.getMinutes());

  const offsetTag = offsetHours === 0 ? 'GMT' : `GMT+${offsetHours}`;
  return `${month} ${day}, ${year}, ${formattedHours}:${minutes} ${ampm} (🇲🇦 ${offsetTag})`;
}

/**
 * Universal date/time formatter for Morocco GMT (UTC+0)
 * e.g. "Oct 21, 2026, 08:00 PM (🇲🇦 GMT)"
 */
export function formatDateTimeMoroccoGmt(dateInput?: string | number | Date, offsetHours = getStoredMoroccoOffset()): string {
  if (!dateInput) dateInput = new Date();
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
  const moroccoDate = new Date(utcMs + (offsetHours * 3600000));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[moroccoDate.getMonth()];
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(moroccoDate.getDate());
  const year = moroccoDate.getFullYear();

  let hours = moroccoDate.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = pad(hours);
  const minutes = pad(moroccoDate.getMinutes());

  const offsetTag = offsetHours === 0 ? 'GMT' : `GMT+${offsetHours}`;
  return `${month} ${day}, ${year}, ${formattedHours}:${minutes} ${ampm} (🇲🇦 ${offsetTag})`;
}

