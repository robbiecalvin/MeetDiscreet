import { test, expect } from '@playwright/test';
async function open(page, mode = 'sign-in') {
  await page.goto(`/?page=${mode}`);
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
}
for (const [mode, title] of [['sign-in', 'Good to see you again.'], ['register', 'A new connection starts here.'], ['recover-account', 'Let’s find your way back.']]) {
  test(`account ${mode} is gated and survives refresh without creating a session`, async ({ page }) => {
    await page.goto(`/?page=${mode}`);
    await expect(page.locator('#app')).toBeHidden();
    await page.getByRole('button', { name: 'I am 18 or older' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.locator('.view-dock')).toBeHidden();
    await expect(page.locator('.account-preview-note')).toContainText('nothing is sent or saved');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.locator('#age-gate')).toBeHidden();
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['meetdiscreet.age-confirmed.v1']);
  });
}

test('sign-in validates, shows/hides fictional password, clears fields, and sends no request', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET') writes.push(request.url()); });
  await open(page);
  await page.getByLabel('Email', { exact: true }).fill('not-an-email');
  await page.getByRole('button', { name: 'Check sign-in preview' }).click();
  await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Email', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Use fictional example' }).click();
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Check sign-in preview' }).click();
  await expect(page.getByRole('status')).toContainText('you have not been signed in');
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('');
  expect(writes).toEqual([]);
});

test('registration checks mismatch and explicit adult confirmation without creating an account', async ({ page }) => {
  await open(page, 'register');
  await page.getByRole('button', { name: 'Use fictional example' }).click();
  const adult = page.getByLabel('I confirm I am 18 or older.');
  await expect(adult).not.toBeChecked();
  await page.getByRole('button', { name: 'Check registration preview' }).click();
  await expect(adult).toHaveAttribute('aria-invalid', 'true');
  await adult.check();
  await page.getByLabel('Confirm password', { exact: true }).fill('a-different-fictional-password');
  await page.getByRole('button', { name: 'Check registration preview' }).click();
  await expect(page.getByLabel('Confirm password', { exact: true })).toBeFocused();
  await expect(page.getByText('Passwords must match in the preview.')).toBeVisible();
  await page.getByLabel('Confirm password', { exact: true }).fill('fictional-demo-only');
  await page.getByRole('button', { name: 'Check registration preview' }).click();
  await expect(page.getByRole('status')).toContainText('No account, role, session, or policy acceptance was created');
  await expect(adult).not.toBeChecked();
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
});

test('recovery validates email and states no email or reset link was sent', async ({ page }) => {
  await open(page);
  await page.getByRole('link', { name: 'Forgot your password?' }).click();
  await expect(page).toHaveURL(/page=recover-account/);
  await expect(page.locator('.account-form input[type=password]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Use fictional example' }).click();
  await page.getByRole('button', { name: 'Check recovery preview' }).click();
  await expect(page.getByRole('status')).toContainText('no email was sent and no reset link was created');
  await page.getByRole('link', { name: 'Back to sign in', exact: true }).click();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('');
});

test('leaving account screens removes credential fields and discovery filters persist', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await page.getByRole('searchbox').fill('maya');
  await page.locator('header [data-account-link]').click();
  await page.getByRole('button', { name: 'Use fictional example' }).click();
  await page.getByRole('link', { name: 'Back to discovery', exact: false }).click();
  await expect(page.locator('#account-view input')).toHaveCount(0);
  await expect(page.getByRole('searchbox')).toHaveValue('maya');
  await page.goBack();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('');
});

for (const width of [320, 390, 700, 1024, 1440]) {
  test(`account layout at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await open(page);
    await page.getByRole('link', { name: 'Create account', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A new connection starts here.');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
