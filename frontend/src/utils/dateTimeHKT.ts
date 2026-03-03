/**
 * Format dates and times in Hong Kong time (Asia/Hong_Kong) with " HKT" suffix
 * for consistent display across the UI and messages.
 */
const HKT = 'Asia/Hong_Kong';

/**
 * Format a date in HKT (e.g. "Mar 4, 2026 HKT" or "Tuesday, March 4, 2026 HKT").
 */
export function formatDateHKT(
  date: Date,
  options: { weekday?: boolean } = {}
): string {
  const d = date instanceof Date ? date : new Date(date);
  const formatted = d.toLocaleDateString('en-US', {
    weekday: options.weekday ? 'long' : undefined,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: HKT,
  });
  return `${formatted} HKT`;
}

/**
 * Format a time in HKT (e.g. "2:45 PM HKT").
 */
export function formatTimeHKT(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const formatted = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: HKT,
  });
  return `${formatted} HKT`;
}

/**
 * Format date and time in HKT (e.g. "Mar 4, 2026, 2:45 PM HKT").
 */
export function formatDateTimeHKT(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const datePart = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: HKT,
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: HKT,
  });
  return `${datePart}, ${timePart} HKT`;
}

/**
 * Format session display: date in HKT + time range with HKT suffix.
 * startTime/endTime are strings like "02:45", "03:40" (already in local/HKT).
 */
export function formatSessionDateTimeHKT(
  sessionDate: Date,
  startTime: string,
  endTime: string
): string {
  const dateStr = formatDateHKT(sessionDate).replace(' HKT', '');
  return `${dateStr} • ${startTime} - ${endTime} HKT`;
}
