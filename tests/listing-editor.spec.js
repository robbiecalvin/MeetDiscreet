import { test, expect } from '@playwright/test';
async function open(page) {
  await page.goto('/?page=create-listing');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}

test('direct editor visit is age gated and restores route after confirmation', async ({ page }) => {
  await page.goto('/?page=create-listing');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page).toHaveTitle('Create a listing · MeetDiscreet');
  await expect(page.getByRole('heading', { name: 'Put a plan into words.' })).toBeVisible();
  await expect(page.locator('.view-dock')).toBeHidden();
  await expect(page.locator('.editor-notice')).toContainText('Nothing is saved or published');
});

test('required whitespace validation is associated and focuses invalid title', async ({ page }) => {
  await open(page);
  await page.getByLabel('Ad title', { exact: true }).fill('     ');
  await page.getByLabel('Describe your plan', { exact: true }).fill('                    ');
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('highlighted fields');
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Ad title', { exact: true })).toBeFocused();
  await expect(page.locator('.editor-preview')).toBeHidden();
});

test('Offering preview safely renders input, edits and never submits or publishes', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET') writes.push(request.url()); });
  await open(page);
  await page.getByRole('button', { name: 'Use a fictional example' }).click();
  await page.getByLabel('Ad title', { exact: true }).fill('<img src=x onerror=alert(1)> coffee');
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  await expect(page.locator('.draft-preview-card')).toContainText('<img src=x onerror=alert(1)> coffee');
  await expect(page.locator('.draft-preview-card img')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Your draft preview' })).toBeFocused();
  await expect(page.locator('.draft-preview-card')).toContainText('OFFERING · DRAFT ONLY');
  await expect(page.locator('.editor-preview')).toContainText('not saved, published, or added to discovery');
  await page.getByRole('button', { name: 'Back to editing' }).click();
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue('<img src=x onerror=alert(1)> coffee');
  await expect(page.getByLabel('Ad title', { exact: true })).toBeFocused();
  expect(writes).toEqual([]);
});

test('Looking For author preview is distinct and optional area can be empty', async ({ page }) => {
  await open(page);
  await page.getByLabel('Listing type', { exact: true }).selectOption('looking');
  await expect(page.locator('.editor-author')).toContainText('demo member');
  await page.getByRole('button', { name: 'Use a fictional example' }).click();
  await page.getByLabel('General area (optional)', { exact: true }).fill('');
  await page.getByLabel('City', { exact: true }).selectOption('Montréal');
  await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
  await expect(page.locator('.draft-preview-card')).toContainText('LOOKING FOR · DRAFT ONLY');
  await expect(page.locator('.draft-preview-card')).toContainText('Montréal');
  await expect(page.locator('.draft-preview-card')).not.toContainText('Mount Pleasant');
});

test('in-app draft survives navigation, clear resets, and refresh discards it', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Use a fictional example' }).click();
  await page.getByLabel('Ad title', { exact: true }).fill('My fictional coffee plan');
  await page.getByRole('link', { name: 'Back to discovery', exact: false }).click();
  await page.locator('header [data-editor-link]').click();
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue('My fictional coffee plan');
  await page.getByRole('button', { name: 'Clear draft', exact: true }).click();
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Use a fictional example' }).click();
  await page.reload();
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue('');
  await expect(page.locator('#age-gate')).toBeHidden();
});

for (const width of [320, 390, 700, 1024, 1440]) {
  test(`listing editor and preview layout at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'I am 18 or older' }).click();
    await page.locator('header [data-editor-link]').click();
    await expect(page.locator('#editor-view')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Use a fictional example' }).click();
    await page.getByRole('button', { name: 'Preview draft', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('.editor-preview')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
