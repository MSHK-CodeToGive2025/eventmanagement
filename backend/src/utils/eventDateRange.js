/**
 * Compute event-level startDate/endDate from sessions (HKT) so the event is
 * considered "active" until the last session ends. Used by reminder service filter
 * and by event create/update to keep event dates in sync with sessions.
 */
export function getEventDateRangeFromSessions(sessions) {
  if (!sessions || sessions.length === 0) return null;
  let minStart = null;
  let maxEnd = null;
  for (const s of sessions) {
    const d = new Date(s.date);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    const parseTime = (t) => {
      const parts = String(t || '').trim().split(':').map(x => Number(x.trim()));
      const h = Number.isFinite(parts[0]) ? parts[0] : 0;
      const min = Number.isFinite(parts[1]) ? parts[1] : 0;
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    };
    const startTime = parseTime(s.startTime);
    const endTime = parseTime(s.endTime);
    const sessionStart = new Date(`${dateStr}T${startTime}:00+08:00`);
    let sessionEnd = new Date(`${dateStr}T${endTime}:00+08:00`);
    if (sessionEnd <= sessionStart) sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);
    if (minStart === null || sessionStart < minStart) minStart = sessionStart;
    if (maxEnd === null || sessionEnd > maxEnd) maxEnd = sessionEnd;
  }
  return minStart && maxEnd ? { startDate: minStart, endDate: maxEnd } : null;
}
