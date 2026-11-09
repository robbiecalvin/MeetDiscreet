import { test, expect } from '@playwright/test';
test('staff review route is age gated and backend-disabled builds reveal no application fixtures', async ({ page }) => {
  const requests = [];
  page.on('request', request => { if (request.url().includes('/rest/v1/')) requests.push(request.url()); });
  await page.goto('/?page=provider-review');
  await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await expect(page).toHaveTitle('Provider review queue · MeetDiscreet');
  await expect(page.locator('.review-status')).toContainText('explicitly assigned staff permissions');
  await expect(page.locator('.review-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Refresh review queue' })).toBeHidden();
  expect(requests).toEqual([]);
});
