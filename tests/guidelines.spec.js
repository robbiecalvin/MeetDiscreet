import { test, expect } from '@playwright/test';
const ageKey = 'meetdiscreet.age-confirmed.v1';

test('direct guidelines access does not confirm age or expose discovery', async ({ page }) => {
  await page.goto('/?page=guidelines');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Community Guidelines & Boundaries');
  await expect(page.locator('#age-gate')).toBeHidden();
  await expect(page.locator('#app')).toBeHidden();
  expect(await page.evaluate((key) => localStorage.getItem(key), ageKey)).toBeNull();
  await expect(page.locator('.policy-preview-note')).toContainText('not connected');
  await page.getByRole('button', { name: '← Return to where I was', exact: true }).click();
  await expect(page.locator('#age-gate')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
});

test('gate-policy-refresh-return preserves the original profile destination', async ({ page }) => {
  await page.goto('/?profile=maya');
  await page.locator('#age-gate [data-guidelines-link]').click();
  await expect(page.locator('#guidelines-shell')).toBeVisible();
  await expect(page.locator('#age-gate')).toBeHidden();
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('link', { name: 'Share content with permission', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: '← Return to where I was', exact: true }).click();
  await expect(page).toHaveURL(/profile=maya/);
  await expect(page.locator('#age-gate')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), ageKey)).toBeNull();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page.getByRole('heading', { name: 'Maya, 28' })).toBeVisible();
});

test('policy history preserves the gate and section jump focus', async ({ page }) => {
  await page.goto('/?ad=gallery');
  await page.locator('#age-gate [data-guidelines-link]').click();
  await page.goBack();
  await expect(page.locator('#age-gate')).toBeVisible();
  await page.goForward();
  await expect(page.locator('#guidelines-shell')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  const link = page.getByRole('link', { name: 'Your participation is always your choice', exact: true });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#personal-boundaries')).toBeFocused();
  await expect(page.locator('#personal-boundaries')).toBeInViewport();
  await expect(page.locator('#app')).toBeHidden();
  expect(await page.evaluate((key) => localStorage.getItem(key), ageKey)).toBeNull();
});

test('confirmed user can read guidelines and return with filters intact', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await page.getByRole('searchbox').fill('maya');
  await page.locator('footer [data-guidelines-link]').click();
  await expect(page.locator('#guidelines-shell')).toBeVisible();
  await page.getByRole('button', { name: 'Return to where I was', exact: true }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('maya');
  await expect(page.locator('.provider-card')).toHaveCount(1);
  await expect(page.locator('#age-gate')).toBeHidden();
});

test('guidelines exit has the agreed fallback and no fake reporting form', async ({ page }) => {
  await page.route('https://www.google.com/', (route) => route.fulfill({ body: '<h1>Exit destination</h1>', contentType: 'text/html' }));
  await page.goto('/?page=guidelines');
  await expect(page.locator('#reporting-and-review')).toContainText('does not collect or submit reports');
  await expect(page.locator('#guidelines-shell form')).toHaveCount(0);
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await expect(page).toHaveURL('https://www.google.com/');
});

for (const width of [320, 390, 700, 1024, 1440]) {
  test(`guidelines reader at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/?page=guidelines');
    await expect(page.getByRole('navigation', { name: 'On this page' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Reporting, blocking, and fair review', exact: true }).click();
    await expect(page.locator('#reporting-and-review')).toBeFocused();
    expect(errors).toEqual([]);
  });
}
