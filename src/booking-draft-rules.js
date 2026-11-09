import { validTimeZone } from './weekly-schedule.js';
export const bookingActivities = ['Coffee', 'Dining', 'Culture', 'Outdoors'];
export function validCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(0); date.setUTCHours(0, 0, 0, 0); date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export function bookingDraftErrors(draft, providerIds) {
  const errors = [];
  if (!providerIds.includes(draft.provider)) errors.push(['provider', 'Choose a fictional provider.']);
  if (!bookingActivities.includes(draft.activity)) errors.push(['activity', 'Choose an activity idea.']);
  if (!validCalendarDate(draft.date)) errors.push(['date', 'Choose a valid calendar date.']);
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) errors.push(['time', 'Choose a valid local start time.']);
  if (!validTimeZone(draft.timeZone)) errors.push(['timeZone', 'Choose the time zone for your plan.']);
  if (!/^[1-9]\d*$/.test(draft.duration) || !Number.isSafeInteger(Number(draft.duration))) errors.push(['duration', 'Enter a positive whole number of minutes.']);
  for (const [key, max] of [['venue', 200], ['expenses', 240], ['notes', 1000]]) {
    if (draft[key].length > max) errors.push([key, `Use at most ${max} characters.`]);
  }
  return errors;
}
export function durationLabel(minutes) {
  const hours = Math.floor(minutes / 60); const remainder = minutes % 60;
  return [hours ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : '', remainder ? `${remainder} ${remainder === 1 ? 'minute' : 'minutes'}` : ''].filter(Boolean).join(' ');
}
