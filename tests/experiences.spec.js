import { test, expect } from '@playwright/test';
import { parseDraftAmount } from '../src/draft-amount.js';
async function open(page) {
  await page.goto('/?page=experiences');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}

test('draft amounts parse exactly without rounding or unsafe integers', () => {
  for (const [input, expected] of [['15.3', 1530], ['0.01', 1], ['0', 0], ['19.99', 1999], ['1.005', null], ['-1', null], ['1e2', null], ['0x10', null], ['NaN', null], ['', null], ['90071992547409.91', 9007199254740991], ['90071992547409.92', null]]) {
    expect(parseDraftAmount(input)).toBe(expected);
  }
});

test('catalogue direct visit is gated, validates title, and reload clears the draft', async ({ page }) => {
  await page.goto('/?page=experiences');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page).toHaveTitle('Experience catalogue · MeetDiscreet');
  await page.getByRole('button', { name: 'Add to draft', exact: true }).click();
  await expect(page.getByLabel('Experience title', { exact: true })).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('Enter a title');
  await page.getByRole('button', { name: 'Add fictional examples' }).click();
  await expect(page.locator('.catalogue-draft-list .experience-item')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('.catalogue-draft-list .experience-item')).toHaveCount(0);
  await expect(page.locator('#age-gate')).toBeHidden();
});

test('extra inputs disable/clear when included and editing updates the exact amount', async ({ page }) => {
  await open(page);
  const amount = page.getByLabel('Extra amount (currency pending)', { exact: true });
  await expect(amount).toBeDisabled();
  await page.getByLabel('Experience title', { exact: true }).fill('Fictional gallery afternoon');
  await page.getByLabel('Included in hourly rate', { exact: true }).uncheck();
  await amount.fill('1.005');
  await page.getByRole('button', { name: 'Add to draft', exact: true }).click();
  await expect(amount).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('no more than two decimal places');
  await amount.fill('15.25');
  await page.getByLabel('Extra applies', { exact: true }).selectOption('hourly');
  await page.getByRole('button', { name: 'Add to draft', exact: true }).click();
  await expect(page.locator('.catalogue-draft-list')).toContainText('15.25 · currency pending · per hour extra');
  await page.getByRole('button', { name: 'Edit Fictional gallery afternoon', exact: true }).click();
  await expect(amount).toHaveValue('15.25');
  await page.getByLabel('Included in hourly rate', { exact: true }).check();
  await expect(amount).toBeDisabled();
  await expect(amount).toHaveValue('');
  await page.getByRole('button', { name: 'Update draft item', exact: true }).click();
  await expect(page.locator('.catalogue-draft-list')).toContainText('Included in hourly rate');
  await expect(page.locator('.catalogue-draft-list')).not.toContainText('15.25');
});

test('visitor preview hides details and subscriber layout excludes not-offered items', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Add fictional examples' }).click();
  await page.getByLabel('Experience title', { exact: true }).fill('Not offered example');
  await page.getByLabel('Offer this experience in the draft', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Add to draft', exact: true }).click();
  await page.getByRole('button', { name: 'Preview catalogue', exact: true }).click();
  await expect(page.locator('.catalogue-preview-items .experience-item')).toHaveCount(0);
  await expect(page.locator('.catalogue-preview-items')).toContainText('SUBSCRIBER-ONLY PREVIEW');
  await page.getByRole('button', { name: 'Subscriber preview', exact: true }).click();
  await expect(page.locator('.catalogue-preview-items .experience-item')).toHaveCount(2);
  await expect(page.locator('.catalogue-preview-items')).not.toContainText('Not offered example');
  await page.getByRole('button', { name: 'Back to catalogue editing' }).click();
  await expect(page.locator('.catalogue-draft-list .experience-item')).toHaveCount(3);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['meetdiscreet.age-confirmed.v1']);
});

test('draft tools retain catalogue, sample fill is repeatable, and removal is real only in memory', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET') writes.push(request.url()); });
  await open(page);
  await page.getByRole('button', { name: 'Add fictional examples' }).click();
  await page.getByRole('button', { name: 'Add fictional examples' }).click();
  await expect(page.locator('.catalogue-draft-list .experience-item')).toHaveCount(2);
  await page.getByRole('link', { name: 'Profile draft', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make an introduction.' })).toBeVisible();
  await page.getByRole('link', { name: 'Experience catalogue', exact: true }).click();
  await expect(page.locator('.catalogue-draft-list .experience-item')).toHaveCount(2);
  await page.getByRole('button', { name: 'Remove Coffee and conversation', exact: true }).click();
  await expect(page.locator('.catalogue-draft-list .experience-item')).toHaveCount(1);
  expect(writes).toEqual([]);
});

test('draft text is not rendered as HTML and item edit can be cancelled', async ({ page }) => {
  await open(page);
  await page.getByLabel('Experience title', { exact: true }).fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Add to draft', exact: true }).click();
  await expect(page.locator('.catalogue-draft-list img')).toHaveCount(0);
  await expect(page.locator('.catalogue-draft-list')).toContainText('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Edit <img src=x onerror=alert(1)>', exact: true }).click();
  await page.getByLabel('Experience title', { exact: true }).fill('Unadded revision');
  await page.getByRole('button', { name: 'Cancel item edit', exact: true }).click();
  await expect(page.locator('.catalogue-draft-list')).not.toContainText('Unadded revision');
});

for (const width of [320, 390, 700, 1024, 1440]) {
  test(`experience catalogue at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await open(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Add fictional examples' }).click();
    await page.getByRole('button', { name: 'Preview catalogue', exact: true }).click();
    await page.getByRole('button', { name: 'Subscriber preview', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
