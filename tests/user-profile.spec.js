import { test, expect } from '@playwright/test';
async function open(page) {
  await page.goto('/?page=edit-user-profile');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}
test('User profile is gated and validates adult declaration and nondisclosure choice', async ({ page }) => {
  await page.goto('/?page=edit-user-profile');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page).toHaveTitle('User profile draft · MeetDiscreet');
  await expect(page.getByLabel('Prefer not to say', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Gender description', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Preview User profile', exact: true }).click();
  await expect(page.locator('#user-profile-error')).toContainText('draft username');
  await page.getByLabel('User username', { exact: true }).fill('test-user');
  await page.getByLabel('Adult age (draft declaration)', { exact: true }).fill('17');
  await page.getByRole('button', { name: 'Preview User profile', exact: true }).click();
  await expect(page.locator('#user-profile-error')).toContainText('18 or older');
  await page.getByLabel('Adult age (draft declaration)', { exact: true }).fill('30');
  await page.getByLabel('Prefer not to say', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Preview User profile', exact: true }).click();
  await expect(page.locator('#user-profile-error')).toContainText('Describe your gender');
  await page.getByLabel('Gender description', { exact: true }).fill('Self-described');
  await page.getByRole('button', { name: 'Preview User profile', exact: true }).click();
  await expect(page.locator('.user-profile-preview')).toContainText('Gender: Self-described');
});
test('User preview escapes input, retains internal drafts, and clears on refresh', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Use fictional User profile' }).click();
  await page.getByLabel('Display name (optional)', { exact: true }).fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Preview User profile', exact: true }).click();
  await expect(page.locator('.user-profile-preview h3')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.user-profile-preview img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Back to User profile editing' }).click();
  await page.getByRole('link', { name: 'Back to User setup', exact: false }).click();
  await page.getByRole('link', { name: 'Edit User profile draft', exact: true }).click();
  await expect(page.getByLabel('User username', { exact: true })).toHaveValue('demo-alex');
  await page.reload();
  await expect(page.getByLabel('User username', { exact: true })).toHaveValue('');
});
for (const width of [390, 1440]) {
  test(`User profile draft layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await open(page);
    await page.getByRole('button', { name: 'Use fictional User profile' }).click();
    await page.getByRole('button', { name: 'Preview User profile', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/user-profile-${width}.png`, fullPage: true });
  });
}
