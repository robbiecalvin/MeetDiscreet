import { test, expect } from '@playwright/test';
async function open(page) {
  await page.goto('/?page=edit-profile');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}

test('profile editor is age gated and its draft is not persisted on reload', async ({ page }) => {
  await page.goto('/?page=edit-profile');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page).toHaveTitle('Profile editor · MeetDiscreet');
  await expect(page.locator('.view-dock')).toBeHidden();
  await page.getByRole('button', { name: 'Use fictional profile' }).click();
  await page.reload();
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('');
  await expect(page.locator('#age-gate')).toBeHidden();
});

test('profile identity and adult age validation focus invalid fields', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Preview profile draft', exact: true }).click();
  await expect(page.getByLabel('Display name', { exact: true })).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('highlighted fields');
  await page.getByRole('button', { name: 'Use fictional profile' }).click();
  await page.getByLabel('Age', { exact: true }).fill('17');
  await page.getByRole('button', { name: 'Preview profile draft', exact: true }).click();
  await expect(page.getByLabel('Age', { exact: true })).toBeFocused();
  await expect(page.getByText('Enter a whole-number age of 18 or older.')).toBeVisible();
  await page.getByLabel('Age', { exact: true }).fill('28.5');
  await page.getByRole('button', { name: 'Preview profile draft', exact: true }).click();
  await expect(page.locator('.profile-draft-preview')).toBeHidden();
});

test('audience controls change only the safe draft preview and preserve edits', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET') writes.push(request.url()); });
  await open(page);
  await page.getByRole('button', { name: 'Use fictional profile' }).click();
  await page.getByLabel('Display name', { exact: true }).fill('<img src=x onerror=alert(1)>');
  await page.getByLabel('Biography (optional)', { exact: true }).fill('A fictional member biography for layout review.');
  await page.getByRole('button', { name: 'Preview profile draft', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your profile draft' })).toBeFocused();
  await expect(page.locator('.profile-draft-card')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.profile-draft-card img')).toHaveCount(0);
  await expect(page.locator('.profile-draft-card')).not.toContainText('A fictional member biography for layout review.');
  await page.getByRole('button', { name: 'Member preview', exact: true }).click();
  await expect(page.locator('.profile-draft-card')).toContainText('A fictional member biography for layout review.');
  await expect(page.locator('.profile-draft-card')).toContainText('Books');
  await page.getByRole('button', { name: 'Subscriber preview', exact: true }).click();
  await expect(page.locator('.profile-draft-card')).toContainText('does not grant subscription access');
  await page.getByRole('button', { name: 'Visitor preview', exact: true }).click();
  await expect(page.locator('.profile-draft-card')).not.toContainText('A fictional member biography for layout review.');
  await page.getByRole('button', { name: 'Back to profile editing' }).click();
  await expect(page.getByLabel('Biography (optional)', { exact: true })).toHaveValue('A fictional member biography for layout review.');
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['meetdiscreet.age-confirmed.v1']);
});

test('profile draft survives in-app navigation and clear never changes public fixtures', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Use fictional profile' }).click();
  await page.getByLabel('Display name', { exact: true }).fill('Changed fictional name');
  await page.getByRole('link', { name: 'Back to discovery', exact: false }).click();
  await page.locator('footer [data-profile-editor-link]').click();
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Changed fictional name');
  await page.getByRole('button', { name: 'Clear profile draft', exact: true }).click();
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('');
  await page.getByRole('link', { name: 'Back to discovery', exact: false }).click();
  await page.locator('[data-provider=maya]').click();
  await expect(page.getByRole('heading', { name: 'Maya, 28' })).toBeVisible();
});

test('registration links through provider setup to the demo editor without creating an account', async ({ page }) => {
  await page.goto('/?page=register');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await page.getByRole('link', { name: 'Explore provider setup', exact: true }).click();
  await page.getByRole('link', { name: 'Introduce yourself', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make an introduction.' })).toBeVisible();
  await expect(page.locator('#account-view input')).toHaveCount(0);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['meetdiscreet.age-confirmed.v1']);
});

for (const width of [320, 390, 700, 1024, 1440]) {
  test(`profile draft form and audience previews at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await open(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Use fictional profile' }).click();
    await page.getByRole('button', { name: 'Preview profile draft', exact: true }).click();
    await page.getByRole('button', { name: 'Member preview', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('.profile-draft-card')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
