import { test, expect } from '@playwright/test';

test('direct profile visit preserves destination through gate and refresh', async ({ page }) => {
  await page.goto('/?profile=maya');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page.getByRole('heading', { name: 'Maya, 28' })).toBeVisible();
  await expect(page.locator('#discovery-view')).toBeHidden();
  await expect(page.locator('.view-dock')).toBeHidden();
  await expect(page).toHaveTitle('Maya · MeetDiscreet');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Maya, 28' })).toBeVisible();
  await expect(page.locator('#age-gate')).toBeHidden();
});

test('profile labels access tiers without exposing biography or granting subscription', async ({ page }) => {
  await page.goto('/?profile=alex');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page.getByText('MEMBER PREVIEW', { exact: true })).toBeVisible();
  await expect(page.getByText('SUBSCRIBER PREVIEW', { exact: true })).toBeVisible();
  await expect(page.locator('#profile-view')).not.toContainText('Slow mornings, good coffee');
  await expect(page.locator('.locked-preview')).toHaveCount(3);
  await expect(page.locator('.locked-preview img, .locked-preview video')).toHaveCount(0);
  await expect(page.locator('.profile-section h2')).toHaveText(['A little introduction', 'The things we connect over', 'A little more to look forward to', 'Time, well spent', 'Find a moment that works']);
  await page.getByRole('button', { name: 'Subscribe to connect' }).click();
  await expect(page.locator('#detail-dialog')).toContainText('no payment is taken and no access is granted');
  await expect(page.locator('#detail-dialog')).toContainText('$11.99/month');
  await expect(page.locator('#detail-dialog input')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Subscribe to connect' })).toBeFocused();
});

test('back/forward and explicit return preserve discovery filters', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await page.getByRole('searchbox').fill('maya');
  await page.locator('.provider-card').click();
  await expect(page).toHaveURL(/profile=maya/);
  await page.goBack();
  await expect(page.getByRole('searchbox')).toHaveValue('maya');
  await expect(page.locator('.provider-card')).toHaveCount(1);
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Maya, 28' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to discovery' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('maya');
  await expect(page.locator('.provider-card')).toBeFocused();
});

test('unknown profile has usable recovery', async ({ page }) => {
  await page.goto('/?profile=unknown');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page.getByRole('heading', { name: 'This profile isn’t here.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Subscribe to connect' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to discovery' }).click();
  await expect(page.locator('.provider-card')).toHaveCount(10);
});

for (const width of [320, 390, 700, 1024, 1440]) {
  test(`profile layout and subscription action at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/?profile=maya');
    await page.getByRole('button', { name: 'I am 18 or older' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const button = page.getByRole('button', { name: 'Subscribe to connect' });
    if (width <= 700) {
      const box = await button.boundingBox();
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      expect(box.y).toBeGreaterThan(700);
      await button.click();
      await expect(page.locator('#detail-dialog')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
