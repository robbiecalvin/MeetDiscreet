export const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function validTimeZone(value) {
  if (!value) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}
export function windowError(windows, candidate, editingId = null) {
  if (!Number.isInteger(candidate.day) || candidate.day < 0 || candidate.day > 6) return 'Choose a weekday.';
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!time.test(candidate.start) || !time.test(candidate.end)) return 'Enter valid start and end times.';
  if (candidate.start >= candidate.end) return 'End must be after start. Overnight windows are not supported in this draft editor.';
  if (windows.some(value => value.id !== editingId && value.day === candidate.day && candidate.start < value.end && candidate.end > value.start)) return 'This window overlaps another window on the same day.';
  return '';
}
export function orderedWindows(windows) {
  return [...windows].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7) || a.start.localeCompare(b.start));
}
