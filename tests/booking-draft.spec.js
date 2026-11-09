import { test, expect } from '@playwright/test';
import { bookingDraftErrors, validCalendarDate, durationLabel } from '../src/booking-draft-rules.js';
async function open(page) {
  await page.goto('/?page=booking-draft');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}
test('booking draft validates real calendar dates, explicit zones and exact whole-minute durations', () => {
  expect(validCalendarDate('2028-02-29')).toBe(true);
  expect(validCalendarDate('2027-02-29')).toBe(false);
  expect(validCalendarDate('2026-04-31')).toBe(false);
  expect(validCalendarDate('0000-01-01')).toBe(false);
  expect(durationLabel(90)).toBe('1 hour 30 minutes');
  const draft = { provider: 'maya', activity: 'Culture', date: '2030-06-15', time: '14:00', timeZone: 'America/Vancouver', duration: '120', venue: '', expenses: '', notes: '' };
  expect(bookingDraftErrors(draft, ['maya'])).toEqual([]);
  for (const value of ['0', '-1', '1.5', '1e2', '9007199254740992']) expect(bookingDraftErrors({ ...draft, duration: value }, ['maya'])).toContainEqual(['duration', 'Enter a positive whole number of minutes.']);
  expect(bookingDraftErrors({ ...draft, provider: 'not-a-provider' }, ['maya'])[0][0]).toBe('provider');
  expect(bookingDraftErrors({ ...draft, timeZone: 'Unknown/Zone' }, ['maya'])[0][0]).toBe('timeZone');
});
test('booking draft is gated, validates fields and reviews without submitting or storing', async ({ page }) => {
  const writes = [];
  page.on('request', request => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) writes.push(request.url()); });
  await page.goto('/?page=booking-draft');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page).toHaveTitle('Booking request preview · MeetDiscreet');
  await page.getByRole('button', { name: 'Review booking draft' }).click();
  await expect(page.getByLabel('Fictional provider', { exact: true })).toBeFocused();
  await expect(page.locator('#booking-provider-error')).toContainText('Choose a fictional provider');
  await page.getByRole('button', { name: 'Use a fictional booking plan' }).click();
  await page.getByRole('button', { name: 'Review booking draft' }).click();
  await expect(page.locator('.booking-review')).toContainText('Maya · Vancouver');
  await expect(page.locator('.booking-review')).toContainText('2 hours');
  await expect(page.locator('.booking-review')).toContainText('Not calculated in this preview');
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['meetdiscreet.age-confirmed.v1']);
});
test('booking review escapes notes and preserves edits only during internal navigation', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Use a fictional booking plan' }).click();
  await page.getByLabel('Requests or notes (optional)', { exact: true }).fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Review booking draft' }).click();
  await expect(page.locator('.booking-summary')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.booking-summary img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit booking draft' }).click();
  await page.getByRole('link', { name: 'Back to User setup', exact: false }).click();
  await page.getByRole('link', { name: 'Preview a booking request', exact: true }).click();
  await expect(page.getByLabel('Fictional provider', { exact: true })).toHaveValue('maya');
  await page.reload();
  await expect(page.getByLabel('Fictional provider', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Use a fictional booking plan' }).click();
  await page.getByRole('button', { name: 'Clear booking draft' }).click();
  await expect(page.getByLabel('Fictional provider', { exact: true })).toHaveValue('');
});
for (const width of [390, 1440]) {
  test(`booking draft and review layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await open(page);
    await page.getByRole('button', { name: 'Use a fictional booking plan' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/booking-editor-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Review booking draft' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/booking-review-${width}.png`, fullPage: true });
  });
}
