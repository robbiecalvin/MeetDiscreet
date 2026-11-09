// Real SDK + mocked HTTP service. Hosted auth/email behaviour is not validated here.
import { test, expect } from '@playwright/test';
const userId = '11111111-1111-4111-8111-111111111111';
const listingId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: '2026-11-08T00:00:00Z' };
function session() {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: userId, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })}.mock_signature`;
  return { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'mock_refresh_token', user };
}
async function mockBackend(page, options = {}) {
  const state = { profile: null, listings: [], requests: [], recoveryRedirect: null };
  await page.route('https://backend-test.supabase.co/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const body = request.postDataJSON();
    state.requests.push({ path: url.pathname, method, body });
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(data) });
    if (method === 'OPTIONS') return respond({});
    if (url.pathname === '/auth/v1/token') {
      if (options.failSignIn) return respond({ code: 'invalid_credentials', msg: 'Invalid credentials' }, 400);
      return respond(session());
    }
    if (url.pathname === '/auth/v1/signup') return respond({ ...user, identities: [{ id: userId, user_id: userId }] });
    if (url.pathname === '/auth/v1/recover') { state.recoveryRedirect = url.searchParams.get('redirect_to'); return respond({}); }
    if (url.pathname === '/auth/v1/user') return respond(user);
    if (url.pathname === '/auth/v1/logout') return respond({});
    if (url.pathname === '/rest/v1/profile_drafts') {
      if (method === 'DELETE') {
        if (options.failDelete) return respond({ message: 'Denied' }, 403);
        const deleted = state.profile; state.profile = null;
        return respond(deleted ? [{ owner_id: userId }] : []);
      }
      if (method === 'POST') { state.profile = { ...body, created_at: '2026-11-08T00:00:00Z', updated_at: '2026-11-08T00:00:00Z' }; return respond(null, 201); }
      return respond(state.profile ? [state.profile] : []);
    }
    if (url.pathname === '/rest/v1/listing_drafts') {
      if (method === 'POST') { state.listings.push({ ...body, id: listingId }); return respond({ id: listingId }, 201); }
      if (method === 'DELETE') {
        if (options.failDelete) return respond({ message: 'Denied' }, 403);
        state.listings = []; return respond({ id: listingId });
      }
      if (method === 'PATCH') { state.listings = [{ ...body, id: listingId }]; return respond({ id: listingId }); }
      return respond(state.listings);
    }
    return respond({ message: 'Unexpected mocked endpoint' }, 404);
  });
  return state;
}
async function enter(page, path = '/?page=sign-in') {
  await page.goto(path);
  if (await page.locator('#age-gate').isVisible()) await page.getByRole('button', { name: 'I am 18 or older' }).click();
}
async function signIn(page) {
  await enter(page);
  await page.getByLabel('Email', { exact: true }).fill('test@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('test-password-not-real');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.account-preview-result')).toContainText('Signed in to the development backend');
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
}

test('SDK sign-in, private profile save/reload, and sign-out state clearing', async ({ page }) => {
  const state = await mockBackend(page);
  await signIn(page);
  await page.locator('footer [data-profile-editor-link]').click();
  await page.getByRole('button', { name: 'Use fictional profile' }).click();
  await page.getByLabel('Display name', { exact: true }).fill('Private test profile');
  await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Private profile draft saved');
  expect(state.profile.owner_id).toBe(userId);
  expect(state.profile.display_name).toBe('Private test profile');
  expect(state.profile).not.toHaveProperty('role');
  await page.reload();
  await expect(page.locator('[data-account-link]')).toHaveText('Account');
  await page.getByRole('button', { name: 'Load my profile draft', exact: true }).click();
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Private test profile');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('[data-account-link]')).toHaveText('Sign in');
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Load my profile draft', exact: true }).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Sign in before saving');
});

test('listing drafts are saved and loaded without becoming discovery ads', async ({ page }) => {
  const state = await mockBackend(page);
  await signIn(page);
  await page.locator('header [data-editor-link]').click();
  await page.getByRole('button', { name: 'Use a fictional example' }).click();
  await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Private listing draft saved');
  expect(state.listings[0].owner_id).toBe(userId);
  expect(state.listings[0]).not.toHaveProperty('published_at');
  await page.getByRole('button', { name: 'Start a new draft', exact: true }).click();
  await page.getByRole('button', { name: 'Load my listing drafts', exact: true }).click();
  await page.locator('.saved-draft-choices article > button').first().click();
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue(state.listings[0].title);
  await page.getByRole('link', { name: 'Back to discovery', exact: false }).click();
  await expect(page.locator('.provider-card')).toHaveCount(10);
});

test('registration sends no role metadata and requires provider confirmation', async ({ page }) => {
  const state = await mockBackend(page);
  await enter(page, '/?page=register');
  await expect(page.getByRole('button', { name: 'Use fictional example' })).toHaveCount(0);
  await page.getByLabel('Username', { exact: true }).fill('TestUser');
  await page.getByLabel('Email', { exact: true }).fill('test@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('test-password-not-real');
  await page.getByLabel('Confirm password', { exact: true }).fill('test-password-not-real');
  await page.getByLabel('I confirm I am 18 or older.').check();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.locator('.account-preview-result')).toContainText('check your email for confirmation');
  const request = state.requests.find((item) => item.path === '/auth/v1/signup');
  expect(request.body.data).toEqual({ requested_username: 'TestUser' });
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
});

test('failed sign-in never claims success and credentials clear', async ({ page }) => {
  await mockBackend(page, { failSignIn: true });
  await enter(page);
  await page.getByLabel('Email', { exact: true }).fill('test@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('wrong-test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.account-preview-result')).toContainText('Unable to sign in');
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeHidden();
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
});

test('recovery uses same-origin callback and PKCE flow identifier survives URL scrubbing', async ({ page }) => {
  const state = await mockBackend(page);
  await enter(page, '/?page=recover-account');
  await page.getByLabel('Email', { exact: true }).fill('test@example.invalid');
  await page.getByRole('button', { name: 'Send recovery email', exact: true }).click();
  await expect(page.locator('.account-preview-result')).toContainText('If this email is eligible');
  const redirect = new URL(state.recoveryRedirect);
  expect(redirect.origin).toBe('http://127.0.0.1:5175');
  expect(redirect.searchParams.get('page')).toBe('auth-callback');
  expect(redirect.searchParams.get('type')).toBe('recovery');
  const flowId = redirect.searchParams.get('sb_flow_id');
  const callback = `/?page=auth-callback&type=recovery&code=mock_code${flowId ? `&sb_flow_id=${flowId}` : ''}`;
  await page.goto(callback);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose a new password.');
  expect(page.url()).not.toContain('code=');
  expect(page.url()).not.toContain('sb_flow_id');
  await page.getByLabel('Password', { exact: true }).fill('new-test-password');
  await page.getByLabel('Confirm password', { exact: true }).fill('new-test-password');
  await page.getByRole('button', { name: 'Update password', exact: true }).click();
  await expect(page.locator('.account-preview-result')).toContainText('password was updated');
});

for (const failDelete of [false, true]) {
  test(`saved listing deletion ${failDelete ? 'failure preserves the draft' : 'requires confirmation and resets selection'}`, async ({ page }) => {
    const state = await mockBackend(page, { failDelete });
    await signIn(page);
    await page.locator('header [data-editor-link]').click();
    await page.getByRole('button', { name: 'Use a fictional example' }).click();
    await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
    await expect(page.locator('.private-draft-controls [role=status]').first()).toContainText('Private listing draft saved');
    await page.getByRole('button', { name: 'Load my listing drafts', exact: true }).click();
    const remove = page.getByRole('button', { name: 'Delete draft:', exact: false });
    await expect(remove).toBeVisible();
    page.once('dialog', dialog => dialog.dismiss());
    await remove.click();
    expect(state.requests.filter(r => r.method === 'DELETE')).toHaveLength(0);
    page.once('dialog', dialog => dialog.accept());
    await remove.click();
    if (failDelete) {
      await expect(page.locator('.saved-draft-item [role=status]')).toContainText('Unable to delete');
      await expect(remove).toBeEnabled();
      expect(state.listings).toHaveLength(1);
    } else {
      await expect(page.locator('.saved-draft-item')).toContainText('Private draft deleted');
      await expect(page.locator('.editor-notice[role=status]')).toContainText('New private draft');
      expect(state.listings).toHaveLength(0);
      const request = state.requests.find(r => r.method === 'DELETE');
      expect(request.path).toBe('/rest/v1/listing_drafts');
      await expect(page.getByLabel('Ad title', { exact: true })).not.toHaveValue('');
    }
  });
}

 test('account overview verifies session, links tools, and clears identity on sign-out', async ({ page }) => {
  await mockBackend(page);
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your account.');
  await expect(page.locator('.account-overview [role=status]')).toContainText('test@example.invalid');
  await expect(page.getByRole('link', { name: 'Manage listing drafts' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open experience tools' })).toBeVisible();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator('.account-tool-grid')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/account-overview-${width}.png`, fullPage: true });
  }
  await page.getByRole('link', { name: 'Edit profile draft' }).click();
  await expect(page).toHaveURL(/page=edit-profile/);
  await page.locator('[data-account-link]').click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('.account-overview [role=status]')).toContainText('Sign in to manage');
  await expect(page.locator('.account-overview')).not.toContainText('test@example.invalid');
  await expect(page.getByRole('link', { name: 'Manage listing drafts' })).toHaveCount(0);
 });

for (const failDelete of [false, true]) {
  test(`profile draft deletion ${failDelete ? 'failure allows retry' : 'preserves editor text and account'}`, async ({ page }) => {
    const state = await mockBackend(page, { failDelete });
    await signIn(page);
    await page.locator('footer [data-profile-editor-link]').click();
    await page.getByRole('button', { name: 'Use fictional profile' }).click();
    await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
    const status = page.locator('.private-draft-controls [role=status]');
    await expect(status).toContainText('Private profile draft saved');
    const remove = page.getByRole('button', { name: 'Delete saved profile draft', exact: true });
    page.once('dialog', dialog => dialog.dismiss());
    await remove.click();
    expect(state.requests.filter(r => r.method === 'DELETE')).toHaveLength(0);
    page.once('dialog', dialog => dialog.accept());
    await remove.click();
    if (failDelete) {
      await expect(status).toContainText('Unable to complete');
      await expect(remove).toBeEnabled();
      expect(state.profile).not.toBeNull();
    } else {
      await expect(status).toContainText('Saved private profile draft deleted');
      expect(state.profile).toBeNull();
      await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Maya');
      await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Load my profile draft', exact: true }).click();
      await expect(status).toContainText('No private profile draft found');
      page.once('dialog', dialog => dialog.accept());
      await remove.click();
      await expect(status).toContainText('No saved private profile draft found to delete');
    }
  });
}
