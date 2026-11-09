import { test, expect } from '@playwright/test';
async function open(page) {
  await page.goto('/?page=provider-application');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}
async function fill(page) {
  await page.getByLabel('Provider display name', { exact: true }).fill('Fictional Provider');
  await page.getByLabel('General city', { exact: true }).fill('Vancouver');
  await page.getByLabel('Provider application introduction', { exact: true }).fill('A fictional introduction for layout review.');
}
test('application route is gated and backend-disabled preview never submits or stores', async ({ page }) => {
  const writes = [];
  page.on('request', request => { if (['POST','PUT','PATCH','DELETE'].includes(request.method())) writes.push(request.url()); });
  await page.goto('/?page=provider-application');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page).toHaveTitle('Provider application · MeetDiscreet');
  await fill(page);
  await page.getByRole('button', { name: 'Check application preview' }).click();
  await expect(page.locator('#provider-application-feedback')).toContainText('Nothing was saved or submitted');
  await expect(page.getByRole('button', { name: 'Submit saved application' })).toBeHidden();
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['meetdiscreet.age-confirmed.v1']);
});
test('application text survives internal navigation and clears on refresh in preview mode', async ({ page }) => {
  await open(page); await fill(page);
  await page.getByRole('link', { name: 'Back to provider setup', exact: false }).click();
  await page.getByRole('link', { name: 'Prepare provider application', exact: true }).click();
  await expect(page.getByLabel('Provider display name', { exact: true })).toHaveValue('Fictional Provider');
  await page.reload();
  await expect(page.getByLabel('Provider display name', { exact: true })).toHaveValue('');
});
for (const width of [390, 1440]) {
  test(`provider application layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await open(page); await fill(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/provider-application-${width}.png`, fullPage: true });
  });
}
