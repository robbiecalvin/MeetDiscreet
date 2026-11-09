import { test, expect } from '@playwright/test';
import { windowError, orderedWindows, validTimeZone } from '../src/weekly-schedule.js';
async function open(page) {
  await page.goto('/?page=availability');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}
async function add(page, day = '1', start = '09:00', end = '12:00') {
  await page.getByLabel('Weekday', { exact: true }).selectOption(day);
  await page.getByLabel('Starts at').fill(start);
  await page.getByLabel('Ends at').fill(end);
  await page.getByRole('button', { name: 'Add time window', exact: true }).click();
}
test('weekly draft rules reject overlaps and overnight windows without treating adjacency as conflict', () => {
  const windows = [{ id: 1, day: 1, start: '09:00', end: '12:00' }];
  expect(windowError(windows, { day: 1, start: '11:00', end: '13:00' })).toContain('overlaps');
  expect(windowError(windows, { day: 1, start: '12:00', end: '13:00' })).toBe('');
  expect(windowError(windows, { day: 1, start: '09:00', end: '12:00' }, 1)).toBe('');
  expect(windowError(windows, { day: 2, start: '11:00', end: '13:00' })).toBe('');
  expect(windowError([], { day: 1, start: '22:00', end: '02:00' })).toContain('Overnight');
  expect(windowError([], { day: 1, start: '24:00', end: '25:00' })).toContain('valid start');
  expect(validTimeZone('America/Vancouver')).toBe(true);
  expect(validTimeZone('Imaginary/Place')).toBe(false);
  expect(orderedWindows([{ day: 0, start: '09:00' }, { day: 1, start: '12:00' }, { day: 1, start: '09:00' }])).toEqual([{ day: 1, start: '09:00' }, { day: 1, start: '12:00' }, { day: 0, start: '09:00' }]);
});
test('availability route is gated, requires timezone, previews and clears on refresh', async ({ page }) => {
  await page.goto('/?page=availability');
  await expect(page.locator('#age-gate')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page).toHaveTitle('Availability draft · MeetDiscreet');
  await add(page);
  await expect(page.locator('#availability-error')).toContainText('valid schedule time zone');
  await page.getByLabel('Schedule time zone').selectOption('America/Vancouver');
  await page.getByRole('button', { name: 'Add time window', exact: true }).click();
  await expect(page.locator('.availability-window')).toHaveCount(1);
  await page.getByRole('button', { name: 'Preview weekly draft' }).click();
  await expect(page.locator('.availability-preview')).toContainText('America/Vancouver');
  await expect(page.locator('.availability-preview')).toContainText('Monday · 09:00–12:00');
  await page.reload();
  await expect(page.locator('.availability-window')).toHaveCount(0);
  await expect(page.getByLabel('Schedule time zone')).toHaveValue('');
});
test('weekly windows edit, reject overlap, retain during tool navigation and remove', async ({ page }) => {
  await open(page);
  await page.getByLabel('Schedule time zone').selectOption('UTC');
  await add(page);
  await add(page, '1', '11:00', '13:00');
  await expect(page.locator('#availability-error')).toContainText('overlaps');
  await expect(page.locator('.availability-window')).toHaveCount(1);
  await page.getByRole('button', { name: 'Edit Monday · 09:00–12:00', exact: true }).click();
  await page.getByLabel('Ends at').fill('13:00');
  await page.getByRole('button', { name: 'Update time window' }).click();
  await expect(page.locator('.availability-window')).toContainText('09:00–13:00');
  await page.getByRole('link', { name: 'Experience catalogue', exact: true }).click();
  await page.getByRole('link', { name: 'Availability draft', exact: true }).click();
  await expect(page.locator('.availability-window')).toContainText('09:00–13:00');
  await page.getByRole('button', { name: 'Remove Monday · 09:00–13:00', exact: true }).click();
  await expect(page.locator('.availability-window')).toHaveCount(0);
  await add(page, '2', '18:00', '20:00');
  await page.getByRole('button', { name: 'Clear schedule draft' }).click();
  await expect(page.locator('.availability-window')).toHaveCount(0);
  await expect(page.getByLabel('Schedule time zone')).toHaveValue('');
});
for (const width of [390, 1440]) {
  test(`weekly availability layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await open(page);
    await page.getByLabel('Schedule time zone').selectOption('America/Vancouver');
    await add(page);
    await add(page, '4', '15:00', '18:00');
    await page.getByRole('button', { name: 'Preview weekly draft' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/availability-${width}.png`, fullPage: true });
  });
}
