// Real SDK + mocked HTTP service. Hosted auth/email behaviour is not validated here.
import { test, expect } from '@playwright/test';
const userId = '11111111-1111-4111-8111-111111111111';
const listingId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: '2026-11-08T00:00:00Z' };
function session(profile = user) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: userId, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })}.mock_signature`;
  return { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'mock_refresh_token', user: profile };
}
async function mockBackend(page, options = {}) {
  const state = { user: { ...user, user_metadata: {} }, availability: null, profile: options.savedSummaries ? { owner_id: userId } : null, catalogue: options.savedSummaries ? [{ title: 'Coffee' }] : null, listings: options.savedSummaries ? [{ id: listingId }] : [], requests: [], recoveryRedirect: null };
  await page.route('https://backend-test.supabase.co/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const body = request.postDataJSON();
    state.requests.push({ path: url.pathname, method, body });
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(data) });
    if (method === 'OPTIONS') return respond({});
    if (url.pathname === '/auth/v1/token') {
      if (options.failSignIn || (options.failReauthentication && state.requests.filter(r => r.path === '/auth/v1/token').length > 1)) return respond({ code: 'invalid_credentials', msg: 'Invalid credentials' }, 400);
      return respond(session(state.user));
    }
    if (url.pathname === '/auth/v1/signup') { state.user = { ...state.user, user_metadata: body.data }; return respond({ ...state.user, identities: [{ id: userId, user_id: userId }] }); }
    if (url.pathname === '/auth/v1/recover') { state.recoveryRedirect = url.searchParams.get('redirect_to'); return respond({}); }
    if (url.pathname === '/auth/v1/user') {
      if (options.failPasswordUpdate && method === 'PUT') return respond({ message: 'Password rejected' }, 422);
      if (method === 'PUT' && body?.data) {
        if (options.failIntentUpdate) return respond({ message: 'Rejected' }, 403);
        state.user = { ...state.user, user_metadata: { ...state.user.user_metadata, ...body.data } };
      }
      return respond(state.user);
    }
    if (url.pathname === '/auth/v1/logout') return respond({});
    if (url.pathname === '/rest/v1/availability_drafts') {
      if (options.missingAvailabilityMigration) return respond({ message: 'Table missing' }, 404);
      if (method === 'POST') { state.availability = body; return respond(null, 201); }
      if (method === 'DELETE') { const exists = state.availability !== null; state.availability = null; return respond(exists ? [{ owner_id: userId }] : []); }
      return respond(state.availability ? [state.availability] : []);
    }
    if (url.pathname === '/rest/v1/experience_catalogue_drafts') {
      if (options.missingCatalogueMigration) return respond({ message: 'Table missing' }, 404);
      if (method === 'DELETE') {
        if (options.failDelete) return respond({ message: 'Denied' }, 403);
        const exists = state.catalogue !== null; state.catalogue = null;
        return respond(exists ? [{ owner_id: userId }] : []);
      }
      if (method === 'POST') { state.catalogue = body.items; return respond(null, 201); }
      return respond(state.catalogue === null ? [] : [{ items: state.catalogue }]);
    }
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
      if (method === 'HEAD') return route.fulfill({ status: 200, headers: { 'content-range': `0-0/${state.listings.length}`, 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'content-range' } });
      if (method === 'POST') { state.listings.push({ ...body, id: listingId }); return respond({ id: listingId }, 201); }
      if (method === 'DELETE') {
        if (options.failDelete) return respond({ message: 'Denied' }, 403);
        state.listings = []; return respond({ id: listingId });
      }
      if (method === 'PATCH') { state.listings = [{ ...body, id: listingId }]; return respond({ id: listingId }); }
      const idFilter = url.searchParams.get('id');
      return respond(idFilter ? state.listings.filter(row => `eq.${row.id}` === idFilter) : state.listings);
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

for (const intent of ['user', 'provider']) {
test(`registration stores ${intent} intent without role grants and requires email confirmation`, async ({ page }) => {
  const state = await mockBackend(page);
  await enter(page, '/?page=register');
  await expect(page.getByRole('button', { name: 'Use fictional example' })).toHaveCount(0);
  await page.getByLabel('Username', { exact: true }).fill('TestUser');
  await page.getByRole('radio', { name: intent === 'user' ? 'User' : 'Provider', exact: true }).check();
  await page.getByLabel('Email', { exact: true }).fill('test@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('test-password-not-real');
  await page.getByLabel('Confirm password', { exact: true }).fill('test-password-not-real');
  await page.getByLabel('I confirm I am 18 or older.').check();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.locator('.account-preview-result')).toContainText('check your email for confirmation');
  const request = state.requests.find((item) => item.path === '/auth/v1/signup');
  expect(request.body.data).toEqual({ requested_username: 'TestUser', onboarding_intent: intent });
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
});

}

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
  await expect(page.locator('.account-overview > [role=status]')).toContainText('test@example.invalid');
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
  await expect(page.locator('.account-overview > [role=status]')).toContainText('Sign in to manage');
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

test('private experience catalogue saves and reloads with pending amounts intact', async ({ page }) => {
  const state = await mockBackend(page);
  await signIn(page);
  await enter(page, '/?page=experiences');
  await page.getByRole('button', { name: 'Add fictional examples' }).click();
  await page.getByLabel('Experience title', { exact: true }).fill('Private extra');
  await page.getByLabel('Included in hourly rate', { exact: true }).uncheck();
  await page.getByLabel('Extra amount (currency pending)', { exact: true }).fill('12.50');
  await page.getByLabel('Extra applies', { exact: true }).selectOption('hourly');
  await page.getByRole('button', { name: 'Add to draft', exact: true }).click();
  await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Private experience catalogue saved');
  expect(state.catalogue).toHaveLength(3);
  expect(state.catalogue[2]).toMatchObject({ minor: 1250, included: false, feeType: 'hourly' });
  expect(state.catalogue[0]).not.toHaveProperty('id');
  expect(state.catalogue[0]).not.toHaveProperty('currency');
  await page.reload();
  await expect(page.locator('.catalogue-empty')).toContainText('No experiences');
  await page.getByRole('button', { name: 'Load my experience catalogue' }).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('catalogue was loaded');
  await expect(page.locator('.catalogue-owner')).toContainText('Coffee and conversation');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('.catalogue-owner')).not.toContainText('Coffee and conversation');
});
test('missing catalogue migration reports a recoverable error', async ({ page }) => {
  await mockBackend(page, { missingCatalogueMigration: true });
  await signIn(page);
  await enter(page, '/?page=experiences');
  await page.getByRole('button', { name: 'Load my experience catalogue' }).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Unable to complete');
  await expect(page.getByRole('button', { name: 'Load my experience catalogue' })).toBeEnabled();
});

for (const failDelete of [false, true]) {
  test(`catalogue deletion ${failDelete ? 'failure keeps stored items' : 'preserves local items and supports saving again'}`, async ({ page }) => {
    const state = await mockBackend(page, { failDelete });
    await signIn(page);
    await enter(page, '/?page=experiences');
    await page.getByRole('button', { name: 'Add fictional examples' }).click();
    await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
    const status = page.locator('.private-draft-controls [role=status]');
    await expect(status).toContainText('catalogue saved');
    const remove = page.getByRole('button', { name: 'Delete saved experience catalogue', exact: true });
    page.once('dialog', dialog => dialog.dismiss());
    await remove.click();
    expect(state.requests.filter(r => r.method === 'DELETE')).toHaveLength(0);
    page.once('dialog', dialog => dialog.accept());
    await remove.click();
    if (failDelete) {
      await expect(status).toContainText('Unable to complete');
      expect(state.catalogue).toHaveLength(2);
      await expect(remove).toBeEnabled();
    } else {
      await expect(status).toContainText('catalogue deleted');
      expect(state.catalogue).toBeNull();
      await page.getByRole('button', { name: 'Load my experience catalogue' }).click();
      await expect(status).toContainText('No private experience catalogue found');
      await expect(page.locator('.catalogue-owner')).toContainText('Coffee and conversation');
      page.once('dialog', dialog => dialog.accept());
      await remove.click();
      await expect(status).toContainText('No saved private experience catalogue found to delete');
      await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
      await expect(status).toContainText('catalogue saved');
      expect(state.catalogue).toHaveLength(2);
    }
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  });
}

for (const scenario of ['success', 'reauthentication', 'update']) {
  test(`password change ${scenario} checks current password and clears credentials`, async ({ page }) => {
    const state = await mockBackend(page, { failReauthentication: scenario === 'reauthentication', failPasswordUpdate: scenario === 'update' });
    await signIn(page);
    await page.locator('[data-account-link]').click();
    await page.getByRole('link', { name: 'Change password', exact: true }).click();
    const old = page.getByLabel('Current password', { exact: true });
    const next = page.getByLabel('New password', { exact: true });
    const confirm = page.getByLabel('Confirm new password', { exact: true });
    await old.fill('old-test-password');
    await next.fill('new-test-password');
    await confirm.fill('mismatch');
    await page.getByRole('button', { name: 'Change password', exact: true }).click();
    await expect(page.locator('#account-view [role=status]')).toContainText('must match');
    expect(state.requests.filter(r => r.path === '/auth/v1/token')).toHaveLength(1);
    await confirm.fill('new-test-password');
    await page.getByRole('button', { name: 'Show new password', exact: true }).click();
    await expect(next).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Change password', exact: true }).click();
    const message = scenario === 'success' ? 'Your password was changed.' : scenario === 'reauthentication' ? 'Unable to verify your current password' : 'Unable to change your password';
    await expect(page.locator('#account-view [role=status]')).toContainText(message);
    for (const field of [old, next, confirm]) {
      await expect(field).toHaveValue('');
      await expect(field).toHaveAttribute('type', 'password');
    }
    expect(state.requests.filter(r => r.path === '/auth/v1/user' && r.method === 'PUT')).toHaveLength(scenario === 'reauthentication' ? 0 : 1);
    await page.setViewportSize({ width: 390, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (scenario === 'success') await page.screenshot({ path: '/tmp/account-security-mobile.png', fullPage: true });
    await old.fill('discard-on-signout');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(old).toHaveCount(0);
    await expect(page.locator('#account-view [role=status]')).toContainText('Sign in with your email');
  });
}

test('account draft summaries show real saved/empty states and refresh independently', async ({ page }) => {
  const state = await mockBackend(page, { savedSummaries: true });
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await expect(page.locator('[data-draft-summary=profile]')).toHaveText('Private profile draft saved');
  await expect(page.locator('[data-draft-summary=listings]')).toHaveText('1 saved private listing draft');
  await expect(page.locator('[data-draft-summary=experiences]')).toHaveText('1 saved catalogue item');
  state.profile = null; state.listings = []; state.catalogue = [];
  await page.getByRole('button', { name: 'Refresh profile draft status' }).click();
  await page.getByRole('button', { name: 'Refresh listing drafts status' }).click();
  await page.getByRole('button', { name: 'Refresh experience catalogue status' }).click();
  await expect(page.locator('[data-draft-summary=profile]')).toHaveText('No saved profile draft');
  await expect(page.locator('[data-draft-summary=listings]')).toHaveText('0 saved private listing drafts');
  await expect(page.locator('[data-draft-summary=experiences]')).toHaveText('0 saved catalogue items');
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.getByRole('heading', { level: 1 }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/account-summaries-mobile.png', fullPage: true });
});
test('missing catalogue setup does not block profile or listing summaries', async ({ page }) => {
  await mockBackend(page, { missingCatalogueMigration: true });
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await expect(page.locator('[data-draft-summary=experiences]')).toContainText('Saved status unavailable');
  await expect(page.locator('[data-draft-summary=profile]')).toHaveText('No saved profile draft');
  await expect(page.locator('[data-draft-summary=listings]')).toHaveText('0 saved private listing drafts');
  await expect(page.getByRole('button', { name: 'Refresh experience catalogue status' })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Edit profile draft' })).toBeVisible();
});

test('private profile refresh warns for unsaved edits but not after saving or sign-out', async ({ page }) => {
  await mockBackend(page);
  await signIn(page);
  await page.locator('footer [data-profile-editor-link]').click();
  await page.getByRole('button', { name: 'Use fictional profile' }).click();
  let warnings = 0;
  const dismiss = async dialog => { expect(dialog.type()).toBe('beforeunload'); warnings++; await dialog.dismiss(); };
  page.once('dialog', dismiss);
  await page.reload({ timeout: 1500 }).catch(() => {});
  expect(warnings).toBe(1);
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Maya');
  await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Private profile draft saved');
  page.on('dialog', async dialog => { warnings++; await dialog.accept(); });
  await page.reload();
  expect(warnings).toBe(1);
  await page.getByRole('button', { name: 'Load my profile draft', exact: true }).click();
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Maya');
  await page.reload();
  expect(warnings).toBe(1);
  await page.getByLabel('Display name', { exact: true }).fill('Unsaved private edit');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('');
  await page.reload();
  expect(warnings).toBe(1);
});

test('saved listing library filters drafts and opens the selected owner draft', async ({ page }) => {
  const state = await mockBackend(page);
  state.listings = [
    { id: listingId, owner_id: userId, kind: 'offering', title: 'Coffee in Vancouver', description: 'A private coffee outing draft for testing.', city: 'Vancouver', area: 'Kitsilano', activity: 'Coffee' },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', owner_id: userId, kind: 'looking', title: 'Gallery afternoon', description: 'A private gallery outing draft for testing.', city: 'Toronto', area: '', activity: 'Culture' },
  ];
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await page.getByRole('link', { name: 'Manage listing drafts' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Saved listing drafts.');
  await expect(page.locator('.library-card')).toHaveCount(2);
  await page.getByLabel('Listing type', { exact: true }).selectOption('looking');
  await expect(page.locator('.library-card')).toHaveCount(1);
  await page.getByLabel('Search saved drafts').fill('Vancouver');
  await expect(page.locator('.library-list')).toContainText('No drafts match');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.library-card')).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.getByRole('heading', { level: 1 }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/listing-library-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Edit Gallery afternoon' }).click();
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue('Gallery afternoon');
  await expect(page.getByLabel('Listing type', { exact: true })).toHaveValue('looking');
  await expect(page.locator('.editor-notice[role=status]')).toContainText('Editing a saved');
  await page.getByLabel('Ad title', { exact: true }).fill('Retained gallery edit');
  await page.locator('[data-account-link]').click();
  await page.getByRole('link', { name: 'Manage listing drafts' }).click();
  await page.getByRole('link', { name: 'Edit Gallery afternoon' }).click();
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue('Retained gallery edit');
  await page.getByLabel('Ad title', { exact: true }).fill('Gallery afternoon');
  await page.reload();
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue('Gallery afternoon');
  await page.goto('/?page=create-listing&draft=cccccccc-cccc-4ccc-8ccc-cccccccccccc');
  await expect(page.locator('.editor-errors')).toContainText('unavailable for this account');
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue('');
  await page.goto('/?page=my-listings');
  await expect(page.locator('.library-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('.library-card')).toHaveCount(0);
  await expect(page.locator('.listing-library [role=status]')).toContainText('Unable to load saved drafts');
});
test('saved listing library shows empty state and starts a clean listing', async ({ page }) => {
  await mockBackend(page);
  await signIn(page);
  await enter(page, '/?page=my-listings');
  await expect(page.locator('.library-list')).toContainText('No saved listing drafts yet');
  await page.getByRole('link', { name: 'Start a new listing' }).click();
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue('');
  await expect(page.locator('.editor-notice[role=status]')).toContainText('New private draft');
});

test('listing library sorts and opens an unsaved duplicate without updating its source', async ({ page }) => {
  const state = await mockBackend(page);
  const original = { id: listingId, owner_id: userId, kind: 'offering', title: 'Zebra coffee plan', description: 'A fictional private coffee outing draft.', city: 'Vancouver', area: '', activity: 'Coffee' };
  state.listings = [original, { ...original, id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'Art gallery plan' }];
  await signIn(page);
  await enter(page, '/?page=my-listings');
  await expect(page.locator('.library-card h2').first()).toHaveText('Zebra coffee plan');
  await page.getByLabel('Sort drafts').selectOption('title');
  await expect(page.locator('.library-card h2').first()).toHaveText('Art gallery plan');
  await page.getByRole('link', { name: 'Duplicate Zebra coffee plan', exact: true }).click();
  await expect(page.getByLabel('Ad title', { exact: true })).toHaveValue('Zebra coffee plan');
  await expect(page.locator('.editor-errors')).toContainText('Unsaved copy loaded');
  await expect(page.locator('.editor-notice[role=status]')).toContainText('New private draft');
  expect(page.url()).not.toContain('copy=');
  expect(state.requests.filter(r => r.method === 'POST' && r.path === '/rest/v1/listing_drafts')).toHaveLength(0);
  await page.getByLabel('Ad title', { exact: true }).fill('Copied coffee plan');
  await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Private listing draft saved');
  expect(state.listings).toHaveLength(3);
  expect(state.listings[0].title).toBe('Zebra coffee plan');
  expect(state.requests.filter(r => r.method === 'PATCH')).toHaveLength(0);
});
for (const failDelete of [false, true]) {
  test(`library deletion ${failDelete ? 'failure keeps the card' : 'requires confirmation and removes the card'}`, async ({ page }) => {
    const state = await mockBackend(page, { failDelete });
    state.listings = [{ id: listingId, owner_id: userId, kind: 'looking', title: 'Private library plan', description: 'An unpublished private library draft.', city: 'Vancouver', area: '', activity: 'Coffee' }];
    await signIn(page);
    await enter(page, '/?page=my-listings');
    const remove = page.getByRole('button', { name: 'Delete draft: Private library plan' });
    await expect(remove).toBeVisible();
    page.once('dialog', dialog => dialog.dismiss());
    await remove.click();
    expect(state.requests.filter(r => r.method === 'DELETE')).toHaveLength(0);
    page.once('dialog', dialog => dialog.accept());
    await remove.click();
    if (failDelete) {
      await expect(page.locator('.library-card [role=status]')).toContainText('Unable to delete');
      await expect(page.locator('.library-card')).toHaveCount(1);
      await expect(remove).toBeEnabled();
    } else {
      await expect(page.locator('.library-card')).toHaveCount(0);
      await expect(page.locator('.listing-library > [role=status]')).toContainText('Private draft deleted');
      expect(state.listings).toHaveLength(0);
    }
  });
}

test('availability draft clears on sign-out without writing to the backend', async ({ page }) => {
  const state = await mockBackend(page);
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await page.getByRole('link', { name: 'Edit availability draft' }).click();
  await page.getByLabel('Schedule time zone').selectOption('UTC');
  await page.getByLabel('Starts at').fill('09:00');
  await page.getByLabel('Ends at').fill('12:00');
  await page.getByRole('button', { name: 'Add time window', exact: true }).click();
  await expect(page.locator('.availability-window')).toHaveCount(1);
  expect(state.requests.filter(value => value.path.startsWith('/rest/v1/') && ['POST', 'PATCH', 'DELETE'].includes(value.method))).toHaveLength(0);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('.availability-window')).toHaveCount(0);
  await expect(page.getByLabel('Schedule time zone')).toHaveValue('');
});

test('private availability saves, reloads, summarizes, and deletes without reserving anything', async ({ page }) => {
  const state = await mockBackend(page);
  await signIn(page);
  await enter(page, '/?page=availability');
  await page.getByLabel('Schedule time zone').selectOption('America/Vancouver');
  await page.getByLabel('Starts at').fill('09:00');
  await page.getByLabel('Ends at').fill('12:00');
  await page.getByRole('button', { name: 'Add time window', exact: true }).click();
  await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
  const status = page.locator('.private-draft-controls [role=status]');
  await expect(status).toContainText('Private availability draft saved');
  expect(state.availability.owner_id).toBe(userId);
  expect(state.availability.windows).toEqual([{ day: 1, start: '09:00', end: '12:00' }]);
  expect(state.availability).not.toHaveProperty('published');
  await page.reload();
  await expect(page.locator('.availability-window')).toHaveCount(0);
  await page.getByRole('button', { name: 'Load my availability draft' }).click();
  await expect(status).toContainText('draft was loaded');
  await expect(page.getByLabel('Schedule time zone')).toHaveValue('America/Vancouver');
  await expect(page.locator('.availability-window')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/private-availability-mobile.png', fullPage: true });
  await page.locator('[data-account-link]').click();
  await expect(page.locator('[data-draft-summary=availability]')).toHaveText('1 saved weekly window · America/Vancouver');
  await page.getByRole('link', { name: 'Edit availability draft' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete saved availability draft' }).click();
  await expect(status).toContainText('Saved availability draft deleted');
  expect(state.availability).toBeNull();
  await expect(page.locator('.availability-window')).toHaveCount(1);
  await page.getByRole('button', { name: 'Load my availability draft' }).click();
  await expect(status).toContainText('No private availability draft found');
});
test('availability handles a missing migration without claiming save success', async ({ page }) => {
  await mockBackend(page, { missingAvailabilityMigration: true });
  await signIn(page);
  await enter(page, '/?page=availability');
  await page.getByRole('button', { name: 'Load my availability draft' }).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Unable to complete');
  await expect(page.getByRole('button', { name: 'Load my availability draft' })).toBeEnabled();
});

test('existing account can choose provider onboarding and revisit a user starting point', async ({ page }) => {
  const state = await mockBackend(page);
  await signIn(page);
  await page.getByRole('link', { name: 'Open your account', exact: true }).click();
  await page.getByRole('button', { name: 'Use Provider starting point' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build your provider introduction.');
  await expect(page.locator('.provider-setup .account-tool-card')).toHaveCount(4);
  expect(state.user.user_metadata).toEqual({ onboarding_intent: 'provider' });
  const update = state.requests.find(value => value.method === 'PUT' && value.body?.data);
  expect(update.body.data).toEqual({ onboarding_intent: 'provider' });
  expect(update.body).not.toHaveProperty('app_metadata');
  expect(update.body).not.toHaveProperty('role');
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/provider-setup-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Back to account', exact: false }).click();
  await expect(page.getByRole('button', { name: 'Use Provider starting point' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Use User starting point' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your next shared moment.');
  await expect(page.getByRole('link', { name: 'Open my listing drafts' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to account', exact: false }).click();
  await expect(page.locator('.account-starting-point [role=status]')).toHaveText('Getting started as User.');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Use User starting point' })).toHaveAttribute('aria-pressed', 'true');
  expect(state.user.app_metadata).toEqual(user.app_metadata);
  await page.getByRole('link', { name: 'Explore provider setup', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('.provider-setup .account-tool-card')).toHaveCount(0);
  await expect(page.locator('.provider-setup > [role=status]')).toContainText('Sign in to start');
});
test('failed starting-point update does not report provider setup as selected', async ({ page }) => {
  await mockBackend(page, { failIntentUpdate: true });
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await page.getByRole('button', { name: 'Use Provider starting point' }).click();
  await expect(page.locator('.account-starting-point [role=status]')).toContainText('Unable to save');
  await expect(page.getByRole('button', { name: 'Use Provider starting point' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Use Provider starting point' })).toBeEnabled();
});
