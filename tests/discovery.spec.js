import { test, expect } from '@playwright/test';
const key = 'meetdiscreet.age-confirmed.v1';
const day = 24 * 60 * 60 * 1000;
async function confirm(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}

test('gate blocks discovery and Escape; accessible policies do not confirm age', async ({ page }) => {
  await page.goto('/?interest=coffee#main');
  await expect(page.getByRole('dialog', { name: 'Good company.' })).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#age-gate')).toBeVisible();
  await page.getByRole('button', { name: 'Privacy', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Privacy · prototype notice' })).toBeVisible();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page.locator('#age-gate')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page.locator('#app')).toBeVisible();
  expect(page.url()).toContain('/?interest=coffee#main');
  await page.reload();
  await expect(page.locator('#age-gate')).toBeHidden();
});

test('gate expires after 30 days and rejects future confirmations', async ({ page }) => {
  for (const time of [Date.now() - 31 * day, Date.now() + day, 'invalid']) {
    await page.addInitScript(({ key, time }) => localStorage.setItem(key, time), { key, time: String(time) });
    await page.goto('/');
    await expect(page.locator('#age-gate')).toBeVisible();
  }
});

test('storage failure permits only the current visit', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage disabled'); };
    Storage.prototype.setItem = () => { throw new Error('Storage disabled'); };
  });
  await confirm(page);
  await expect(page.locator('#app')).toBeVisible();
  await page.reload();
  await expect(page.locator('#age-gate')).toBeVisible();
});

test('Exit uses external referrer and agreed direct-visit fallback', async ({ page }) => {
  for (const referrer of [null, 'https://example.com/previous']) {
    const destination = referrer || 'https://www.google.com/';
    await page.route(destination, (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Previous destination</h1>' }));
    await page.goto('/', referrer ? { referer: referrer } : {});
    await page.getByRole('button', { name: 'Exit', exact: true }).click();
    await expect(page).toHaveURL(destination);
  }
});

test('provider filtering, empty reset, and profile navigation', async ({ page }) => {
  await confirm(page);
  await expect(page.locator('.provider-card')).toHaveCount(10);
  await page.getByLabel('Online now').check();
  await expect(page.locator('.provider-card')).toHaveCount(6);
  await page.getByLabel('Online now').uncheck();
  await page.getByRole('button', { name: /Filters/ }).click();
  await page.getByLabel('Shared interest').selectOption('Coffee');
  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page.locator('.provider-card')).toHaveCount(2);
  await page.getByRole('searchbox').fill('no-such-person');
  await expect(page.getByText('No company found just yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.provider-card')).toHaveCount(10);
  await page.locator('.provider-card').first().click();
  await expect(page.getByRole('heading', { name: 'Alex, 29' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to discovery' }).click();
  await expect(page.locator('#profile-view')).toBeHidden();
  await expect(page.locator('.provider-card').first()).toBeFocused();
  await page.getByLabel('Explore a city').selectOption('Toronto');
  await expect(page.locator('.provider-card')).toHaveCount(1);
});

test('ads switch, category, search, and chronological fixture order', async ({ page }) => {
  await confirm(page);
  await page.getByRole('button', { name: 'Explore the ads' }).click();
  await expect(page.locator('.ad-card')).toHaveCount(4);
  await expect(page.locator('.ad-card h3').first()).toHaveText('An afternoon for art & a little conversation');
  await page.getByRole('button', { name: 'Looking For', exact: true }).click();
  await expect(page.locator('.ad-card')).toHaveCount(2);
  await page.getByRole('searchbox').fill('music');
  await expect(page.locator('.ad-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'View ad' }).click();
  await expect(page.getByRole('region',{name:'Looking For public summary',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Back to Looking For ads',exact:false}).click();
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: 'Back to people' }).click();
  await expect(page.locator('.provider-card')).toHaveCount(10);
});

for (const width of [320, 390, 700, 1024, 1440]) {
  test(`responsive layout at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await confirm(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const boxes = await page.locator('.provider-card').evaluateAll((cards) => cards.map((card) => {
      const { x, y, width, height } = card.getBoundingClientRect();
      return { x, y, width, height };
    }));
    expect(boxes[0].height).toBeGreaterThan(boxes[0].width);
    if (width <= 700) {
      expect(boxes[0].y).toBe(boxes[1].y);
      expect(boxes[1].y).toBe(boxes[2].y);
      expect(boxes[3].y).toBeGreaterThan(boxes[0].y);
    }
    await page.getByRole('button', { name: 'Explore the ads' }).click();
    const ads = await page.locator('.ad-card').evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().y));
    expect(ads[1]).toBeGreaterThan(ads[0]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
