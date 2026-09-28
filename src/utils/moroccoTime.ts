/**
 * Utility functions for handling Moroccan Time (Africa/Casablanca, GMT+1)
 * Ensures that admin fixture scheduling and prediction deadlines strictly adhere to Morocco's official time.
 */

export const MOROCCO_TIMEZONE = 'Africa/Casablanca';

/**
 * Parses a datetime string entered by the admin in Morocco time (YYYY-MM-DDTHH:mm)
 * and returns the exact ISO 8601 UTC string (e.g. 2026-10-15T20:00:00.000Z).
 */
export function parseMoroccoDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.replace(' ', 'T').slice(0, 16);
  const [datePart, timePart] = clean.split('T');
  if (!datePart || !timePart) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }

  const [y, m, d] = datePart.split('-').map(Number);
  const [h, min] = timePart.split(':').map(Number);

  let guess = new Date(Date.UTC(y, m - 1, d, h, min));

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MOROCCO_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });

  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(guess);
    const getPart = (type: string) => Number(parts.find(p => p.type === type)?.value || 0);
    const casaH = getPart('hour') === 24 ? 0 : getPart('hour');
    const casaMin = getPart('minute');
    const casaD = getPart('day');
    const casaM = getPart('month');
    const casaY = getPart('year');

    const casaTime = Date.UTC(casaY, casaM - 1, casaD, casaH, casaMin);
    const targetTime = Date.UTC(y, m - 1, d, h, min);
    const diff = targetTime - casaTime;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff);
  }

  return guess.toISOString();
}

/**
 * Formats any ISO string or Date into "YYYY-MM-DDTHH:mm" in Morocco's timezone.
 * Suitable for pre-filling or editing `<input type="datetime-local" />`.
 */
export function formatMoroccoInput(isoOrDateStr: string): string {
  if (!isoOrDateStr) return '';
  const d = new Date(isoOrDateStr);
  if (isNaN(d.getTime())) return '';

  const str = new Intl.DateTimeFormat('sv-SE', {
    timeZone: MOROCCO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);

  return str.replace(' ', 'T');
}

/**
 * Returns the current date and time in Morocco as "YYYY-MM-DDTHH:mm".
 */
export function getMoroccoNowInputString(): string {
  return formatMoroccoInput(new Date().toISOString());
}

/**
 * Returns formatted live time in Morocco (e.g. "12:00" or "12:00:30")
 */
export function getMoroccoCurrentTimeFormatted(includeSeconds = false): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: MOROCCO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false
  }).format(new Date());
}

/**
 * Formats a deadline into a clear English string in Morocco time
 * e.g. "Nov 11, 2026, 09:00 PM"
 */
export function formatEnglishDeadlineMorocco(deadlineStr: string): string {
  const d = new Date(deadlineStr);
  if (isNaN(d.getTime())) return deadlineStr;
  return d.toLocaleString('en-US', {
    timeZone: MOROCCO_TIMEZONE,
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
