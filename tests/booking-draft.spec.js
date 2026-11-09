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


test('profile preview carries the selected fictional provider into an unsent plan and back', async ({ page }) => {
  const writes = [];
  page.on('request',request => {if (['POST','PUT','PATCH','DELETE'].includes(request.method())) writes.push(request.url());});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?profile=alex');
  await page.getByRole('button',{name:'I am 18 or older'}).click();
  await page.locator('.subscription-card').screenshot({path:'/tmp/profile-plan-entry-mobile.png'});
  await page.getByRole('link',{name:'Preview a booking plan',exact:true}).click();
  await expect(page.getByLabel('Fictional provider',{exact:true})).toHaveValue('alex');
  await page.getByLabel('Requests or notes (optional)',{exact:true}).fill('Keep this plan while browsing.');
  await page.getByRole('link',{name:'View fictional profile',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Alex, 29',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Preview a booking plan',exact:true}).click();
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('Keep this plan while browsing.');
  expect(writes).toEqual([]);
});

test('another profile keeps the current plan until an explicit confirmed replacement', async ({ page }) => {
  await open(page);
  await page.getByRole('button',{name:'Use a fictional booking plan'}).click();
  await page.getByLabel('Fictional provider',{exact:true}).selectOption('alex');
  await page.getByRole('link',{name:'View fictional profile',exact:true}).click();
  await page.getByRole('link',{name:'Back to discovery',exact:false}).click();
  await page.locator('[data-provider="maya"]').click();
  await page.getByRole('link',{name:'Preview a booking plan',exact:true}).click();
  await expect(page.getByLabel('Fictional provider',{exact:true})).toHaveValue('alex');
  await expect(page.getByLabel('Activity idea',{exact:true})).toHaveValue('Culture');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Start a new draft with Maya',exact:true}).click();
  await expect(page.getByLabel('Fictional provider',{exact:true})).toHaveValue('alex');
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Start a new draft with Maya',exact:true}).click();
  await expect(page.getByLabel('Fictional provider',{exact:true})).toHaveValue('maya');
  await expect(page.getByLabel('Activity idea',{exact:true})).toHaveValue('');
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('');
});

test('direct provider plan links stay gated and unknown provider context is rejected', async ({ page }) => {
  await page.goto('/?page=booking-draft&provider=maya');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button',{name:'I am 18 or older'}).click();
  await expect(page.getByLabel('Fictional provider',{exact:true})).toHaveValue('maya');
  await page.goto('/?page=booking-draft&provider=%3Cimg%20src=x%3E');
  await expect(page.getByLabel('Fictional provider',{exact:true})).toHaveValue('');
  await expect(page.locator('.booking-context')).toContainText('fictional provider is unavailable');
  await expect(page.locator('.booking-context img')).toHaveCount(0);
});
