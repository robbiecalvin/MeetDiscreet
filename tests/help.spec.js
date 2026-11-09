import { test, expect } from '@playwright/test';
const ageKey = 'meetdiscreet.age-confirmed.v1';

test('direct help is readable without confirming age and ordinary discovery stays gated', async ({ page }) => {
  await page.goto('/?page=help');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What would you like to know?');
  await expect(page).toHaveTitle('Help · MeetDiscreet');
  await expect(page.locator('#app')).toBeHidden();
  await expect(page.locator('#age-gate')).toBeHidden();
  expect(await page.evaluate((key) => localStorage.getItem(key), ageKey)).toBeNull();
  await page.reload();
  await expect(page.locator('#help-shell')).toBeVisible();
  await page.getByRole('link', { name: 'Explore discovery', exact: false }).click();
  await expect(page.locator('#age-gate')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
});

test('search and topic filters combine and empty reset restores answers', async ({ page }) => {
  await page.goto('/?page=help');
  await expect(page.getByRole('status')).toHaveText('10 answers');
  await page.getByLabel('Topic', { exact: true }).selectOption('drafts');
  await expect(page.getByRole('status')).toHaveText('2 answers');
  await page.getByLabel('Search help', { exact: true }).fill('refresh');
  await expect(page.getByRole('status')).toHaveText('1 answer');
  await expect(page.getByText('Why did my draft disappear after refreshing?', { exact: true })).toBeVisible();
  await expect(page.locator('.help-results details')).toHaveAttribute('open', '');
  await page.getByLabel('Search help', { exact: true }).fill('xyznoanswer');
  await expect(page.getByRole('heading', { name: 'No matching answers yet.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear help filters' }).click();
  await expect(page.getByRole('status')).toHaveText('10 answers');
  await expect(page.getByLabel('Search help', { exact: true })).toBeFocused();
});

test('help from gate, nested guidelines, refresh and return preserve source without confirming', async ({ page }) => {
  await page.goto('/?profile=maya');
  await page.locator('#age-gate [data-help-link]').click();
  await page.getByRole('link', { name: 'Read the guidelines', exact: false }).click();
  await expect(page.locator('#guidelines-shell')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '← Return to where I was', exact: true }).click();
  await expect(page.locator('#help-shell')).toBeVisible();
  await page.getByRole('button', { name: '← Return to where I was', exact: true }).click();
  await expect(page).toHaveURL(/profile=maya/);
  await expect(page.locator('#age-gate')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), ageKey)).toBeNull();
});

test('help links to editor remain gated and support is not a submission form', async ({ page }) => {
  await page.goto('/?page=help');
  await expect(page.locator('.help-support-note')).toContainText('No support inbox or report submission is connected');
  await expect(page.locator('#help-shell form, #help-shell textarea, #help-shell input[type=email]')).toHaveCount(0);
  const summary = page.getByText('How do I contact support or report a concern?', { exact: true });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.help-results details').last()).toHaveAttribute('open', '');
  await page.getByRole('link', { name: 'Try a listing draft', exact: false }).click();
  await expect(page).toHaveURL(/page=create-listing/);
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page.getByRole('heading', { name: 'Put a plan into words.' })).toBeVisible();
});

test('confirmed user returns to filtered discovery and browser history works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await page.getByRole('searchbox').fill('maya');
  await page.locator('footer [data-help-link]').click();
  await page.goBack();
  await expect(page.getByRole('searchbox')).toHaveValue('maya');
  await page.goForward();
  await expect(page.locator('#help-shell')).toBeVisible();
  await page.getByRole('button', { name: '← Return to where I was', exact: true }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('maya');
  await expect(page.locator('.provider-card')).toHaveCount(1);
});

for (const width of [320, 390, 700, 1024, 1440]) {
  test(`help reader at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/?page=help');
    await expect(page.getByLabel('Search help', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByLabel('Search help', { exact: true }).fill('profiles');
    await expect(page.locator('.help-results details').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}
