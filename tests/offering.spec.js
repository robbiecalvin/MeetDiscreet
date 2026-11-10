import { test, expect } from '@playwright/test';
async function enter(page, path) {
  await page.goto(path);
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}

test('direct Offering visit survives age confirmation and refresh', async ({ page }) => {
  await page.goto('/?ad=gallery');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('An afternoon for art & a little conversation');
  await expect(page.locator('#discovery-view')).toBeHidden();
  await expect(page.locator('#profile-view')).toBeHidden();
  await expect(page.locator('.view-dock')).toBeHidden();
  await expect(page.locator('.offering-section h2')).toHaveText(['A little more about the plan', 'Around the neighbourhood', 'General rate', 'Availability']);
  await expect(page.locator('#offering-view')).toContainText('No general rate has been published');
  await expect(page.locator('#offering-view')).toContainText('No dates have been published');
  await page.reload();
  await expect(page.locator('#age-gate')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('An afternoon for art & a little conversation');
});

test('ad list to detail to profile and back retains the filtered list and focus', async ({ page }) => {
  await enter(page, '/');
  await page.getByRole('button', { name: 'Explore the ads' }).click();
  await page.getByRole('searchbox').fill('gallery');
  await expect(page.locator('.ad-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'View ad', exact: true }).click();
  await expect(page).toHaveURL(/ad=gallery/);
  await page.getByRole('link', { name: 'View companion profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Maya, 28' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to ad', exact: false }).click();
  await expect(page).toHaveURL(/ad=gallery/);
  await page.getByRole('link', { name: 'Back to ads', exact: false }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('gallery');
  await expect(page.locator('.ad-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'View ad', exact: true })).toBeFocused();
});

test('related ads and browser history open the correct provider', async ({ page }) => {
  await enter(page, '/?ad=gallery');
  await expect(page.locator('.related-offering')).toHaveCount(3);
  await page.getByRole('link', { name: 'Make a dinner reservation worth keeping' }).click();
  await expect(page).toHaveURL(/ad=dinner/);
  await page.getByRole('link', { name: 'James, 34', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'James, 34' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/ad=dinner/);
  await page.goBack();
  await expect(page).toHaveURL(/ad=gallery/);
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make a dinner reservation worth keeping');
});

for (const id of ['missing']) {
  test(`unknown or non-Offering ad ${id} recovers without exposing a full post`, async ({ page }) => {
    await enter(page, `/?ad=${id}`);
    await expect(page.getByRole('heading', { name: 'This Offering ad isn’t here.' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View companion profile' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Back to ads', exact: false }).click();
    await expect(page.locator('.ad-card')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Offering', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });
}

test('Offering title links open details and unrelated-city ads have no related content', async ({ page }) => {
  await enter(page, '/');
  await page.getByRole('button', { name: 'Explore the ads' }).click();
  await page.getByRole('link', { name: 'An afternoon for art & a little conversation', exact: true }).click();
  await expect(page).toHaveURL(/ad=gallery/);
  await page.goto('/?ad=toronto');
  await expect(page.locator('.related-offering')).toHaveCount(0);
  await expect(page.locator('.offering-provider')).toContainText('Sam, 30');
});

for (const width of [320, 390, 700, 1024, 1440]) {
  test(`Offering layout at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await enter(page, '/?ad=gallery');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const action = page.getByRole('link', { name: 'View companion profile', exact: true });
    if (width <= 700) {
      const box = await action.boundingBox();
      expect(box.y).toBeGreaterThan(700);
      expect(box.y + box.height).toBeLessThanOrEqual(844);
    }
    await action.click();
    await expect(page.getByRole('heading', { name: 'Maya, 28' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
