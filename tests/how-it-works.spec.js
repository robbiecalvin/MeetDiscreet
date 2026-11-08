import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/?page=how-it-works');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}

test('how it works direct route, age gate, title and reload', async ({ page }) => {
  await page.goto('/?page=how-it-works');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Good company. Clear expectations.');
  await expect(page.locator('#discovery-view')).toBeHidden();
  await expect(page.locator('.view-dock')).toBeHidden();
  await expect(page).toHaveTitle('How it works · MeetDiscreet');
  await expect(page.locator('.desktop-nav [aria-current=page]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('#how-view')).toBeVisible();
  await expect(page.locator('#age-gate')).toBeHidden();
});

test('journeys switch with correct pressed state', async ({ page }) => {
  await open(page);
  await expect(page.locator('.journey-steps li')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Find your kind of company' })).toBeVisible();
  await page.getByRole('button', { name: 'For companions', exact: true }).click();
  await expect(page.getByRole('button', { name: 'For companions', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'For users', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('heading', { name: 'Create your profile', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'For users', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Find your kind of company' })).toBeVisible();
});

test('reference plans preserve exact amounts and product boundaries', async ({ page }) => {
  await open(page);
  const plans = page.locator('.reference-plan');
  await expect(plans).toHaveCount(3);
  await expect(plans.nth(0)).toContainText('$11.99');
  await expect(plans.nth(1)).toContainText('$5.99');
  await expect(plans.nth(2)).toContainText('$19.99');
  await expect(plans.nth(2)).toContainText('$59.99');
  await expect(plans.nth(0)).toContainText('per companion');
  await expect(plans.nth(1)).toContainText('Does not unlock companion content or communication');
  await expect(page.locator('.how-plans')).toContainText('Currency, renewal, cancellation, and tax policies remain pending');
  await expect(page.locator('.reference-plan button, .reference-plan input')).toHaveCount(0);
});

test('FAQ keyboard disclosure and discovery return preserve filters and history', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await page.getByRole('searchbox').fill('maya');
  await page.locator('.desktop-nav [data-how-link]').click();
  await expect(page.locator('.desktop-nav [data-how-link]')).toHaveAttribute('aria-current', 'page');
  const summary = page.getByText('Does one subscription unlock every companion?', { exact: true });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.how-faq details').first()).toHaveAttribute('open', '');
  await expect(page.getByText('No. An individual subscription applies to the selected companion.', { exact: false })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('searchbox')).toHaveValue('maya');
  await page.goForward();
  await expect(page.locator('#how-view')).toBeVisible();
  await page.getByRole('link', { name: 'Explore discovery', exact: true }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('maya');
  await expect(page.locator('.provider-card')).toHaveCount(1);
});

for (const width of [320, 390, 700, 1024, 1440]) {
  test(`how it works layout and mobile footer navigation at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await open(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Back to discovery', exact: false }).click();
    await page.locator('footer [data-how-link]').click();
    await expect(page.locator('#how-view')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
