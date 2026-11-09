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
  const state = { user: { ...user, user_metadata: {} }, providerApplication: null, applicationFeedback: [], applicationSubmissions: [], historyFailure: false, applicationSubmissionCounter: 0, userProfile: null, roles: ['user'], capabilities: [], reviewApplications: [], reviewAccessEvents: [], availability: null, profile: options.savedSummaries ? { owner_id: userId } : null, catalogue: options.savedSummaries ? [{ title: 'Coffee' }] : null, listings: options.savedSummaries ? [{ id: listingId }] : [], requests: [], recoveryRedirect: null };
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
    if (url.pathname === '/rest/v1/provider_application_submissions') {
      if (state.historyFailure) return respond({message:'History unavailable'},404);
      return respond(state.applicationSubmissions.filter(row => `eq.${row.owner_id}` === url.searchParams.get('owner_id')).slice(0,Number(url.searchParams.get('limit'))));
    }
    if (url.pathname === '/rest/v1/provider_application_feedback') {
      if (url.searchParams.has('submission_id')) return respond(state.applicationFeedback.filter(row => row.owner_id === state.user.id && url.searchParams.get('submission_id').includes(row.submission_id)));
      return respond(state.applicationFeedback.filter(row => row.owner_id === state.user.id).slice(-1).map(({note,created_at}) => ({note,created_at})));
    }
    if (url.pathname === '/rest/v1/rpc/can_request_provider_application_changes') return respond(state.roles.some(role => ['moderator','admin'].includes(role)) && state.capabilities.includes('provider_application_review') && state.capabilities.includes('provider_application_feedback'));
    if (url.pathname === '/rest/v1/rpc/request_provider_application_changes') {
      const allowed = state.roles.some(role => ['moderator','admin'].includes(role)) && state.capabilities.includes('provider_application_review') && state.capabilities.includes('provider_application_feedback');
      const row = state.reviewApplications.find(value => value.owner_id === body.p_owner);
      if (!allowed || body.p_expected_reviewer !== state.user.id || body.p_owner === state.user.id || row?.state !== 'submitted' || row.submission_id !== body.p_submission) return respond({message:'Denied or stale submission'},409);
      row.state = 'changes_requested';
      state.applicationFeedback.push({owner_id:row.owner_id,submission_id:row.submission_id,note:body.p_note,created_at:'2026-11-09T00:00:00Z'});
      return respond(row);
    }
    if (url.pathname === '/rest/v1/rpc/can_review_provider_applications') {
      if (options.missingReviewMigration) return respond({ message: 'Unavailable' }, 404);
      return respond(state.roles.some(role => ['moderator','admin'].includes(role)) && state.capabilities.includes('provider_application_review'));
    }
    if (['/rest/v1/rpc/list_provider_applications_for_review','/rest/v1/rpc/get_provider_application_for_review'].includes(url.pathname)) {
      if (options.missingReviewMigration) return respond({ message: 'Unavailable' }, 404);
      const allowed = state.roles.some(role => ['moderator','admin'].includes(role)) && state.capabilities.includes('provider_application_review');
      if (!allowed || body.p_expected_reviewer !== state.user.id) return respond({ message: 'Denied' }, 403);
      const submitted = state.reviewApplications.filter(row => row.state === 'submitted').sort((a,b) => a.submitted_at.localeCompare(b.submitted_at) || a.owner_id.localeCompare(b.owner_id));
      if (url.pathname.endsWith('/get_provider_application_for_review')) {
        const row = submitted.find(value => value.owner_id === body.p_owner);
        if (row) state.reviewAccessEvents.push({ action: 'application_opened', owner: row.owner_id });
        return respond(row ? [row] : []);
      }
      state.reviewAccessEvents.push({ action: 'queue_list' });
      return respond(submitted.filter(row => !body.p_after_submitted_at || row.submitted_at > body.p_after_submitted_at || (row.submitted_at === body.p_after_submitted_at && row.owner_id > body.p_after_owner)).slice(0,body.p_limit).map(({owner_id,display_name,city,submitted_at,updated_at}) => ({owner_id,display_name,city,submitted_at,updated_at})));
    }
    if (url.pathname === '/rest/v1/provider_applications') {
      if (options.missingApplicationMigration) return respond({ message: 'Table missing' }, 404);
      return respond(state.providerApplication ? [state.providerApplication] : []);
    }
    if (url.pathname.startsWith('/rest/v1/rpc/') && url.pathname.includes('provider_application')) {
      if (options.missingApplicationMigration || options.failApplicationMutation) return respond({ message: 'Unavailable' }, 400);
      if (body.p_expected_owner !== state.user.id) return respond({ message: 'Account changed' }, 403);
      if (url.pathname.endsWith('/save_provider_application')) {
        if (state.providerApplication?.state === 'submitted') return respond({ message: 'Locked' }, 409);
        state.providerApplication = { owner_id: userId, display_name: body.p_display_name.trim(), city: body.p_city.trim(), introduction: body.p_introduction.trim(), state: 'draft', submitted_at: null, withdrawn_at: null };
      } else if (url.pathname.endsWith('/submit_provider_application')) {
        if (!state.roles.includes('user') || state.providerApplication?.state !== 'draft') return respond({ message: 'Denied' }, 403);
        state.providerApplication = { ...state.providerApplication, state: 'submitted', submitted_at: '2026-11-09T00:00:00Z', submission_id: `66666666-6666-4666-8666-${String(++state.applicationSubmissionCounter).padStart(12,'0')}` };
      } else {
        if (state.providerApplication?.state !== 'submitted') return respond({ message: 'Denied' }, 403);
        state.providerApplication = { ...state.providerApplication, state: 'withdrawn', withdrawn_at: '2026-11-09T01:00:00Z' };
      }
      return respond(state.providerApplication);
    }
    if (url.pathname === '/rest/v1/account_roles') {
      if (options.missingRoleMigration) return respond({ message: 'Table missing' }, 404);
      return respond(state.roles.map(role => ({ role })));
    }
    if (url.pathname === '/rest/v1/user_profile_drafts') {
      if (options.missingUserProfileMigration) return respond({ message: 'Table missing' }, 404);
      if (method === 'POST') { state.userProfile = body; return respond(null, 201); }
      if (method === 'DELETE') { const exists = state.userProfile !== null; state.userProfile = null; return respond(exists ? [{ owner_id: userId }] : []); }
      return respond(state.userProfile ? [state.userProfile] : []);
    }
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
      if (method === 'POST') { const id = state.listings.some(row => row.id === listingId) ? `dddddddd-dddd-4ddd-8ddd-${String(state.listings.length + 1).padStart(12, '0')}` : listingId; state.listings.push({ ...body, id }); return respond({ id }, 201); }
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
  await page.getByRole('link', { name: 'Edit provider profile draft' }).click();
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
  await page.getByRole('button', { name: 'Refresh provider profile draft status' }).click();
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
  await expect(page.getByRole('link', { name: 'Edit provider profile draft' })).toBeVisible();
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

test('User profile saves and reloads independently from provider drafts and clears on sign-out', async ({ page }) => {
  const state = await mockBackend(page);
  state.profile = { owner_id: userId, display_name: 'Separate provider draft' };
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await page.getByRole('link', { name: 'Edit User profile draft', exact: true }).click();
  await page.getByRole('button', { name: 'Use fictional User profile' }).click();
  await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
  const status = page.locator('.private-draft-controls [role=status]');
  await expect(status).toContainText('Private User profile draft saved');
  expect(state.userProfile.owner_id).toBe(userId);
  expect(state.userProfile.prefer_not_to_say).toBe(true);
  expect(state.userProfile.gender_description).toBe('');
  expect(state.profile.display_name).toBe('Separate provider draft');
  await page.reload();
  await page.getByRole('button', { name: 'Load my User profile draft' }).click();
  await expect(page.getByLabel('User username', { exact: true })).toHaveValue('demo-alex');
  await page.locator('[data-account-link]').click();
  await expect(page.locator('[data-draft-summary=user-profile]')).toHaveText('Private User profile draft saved');
  await page.getByRole('link', { name: 'Edit User profile draft', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete saved User profile draft' }).click();
  await expect(status).toContainText('Saved User profile draft deleted');
  expect(state.userProfile).toBeNull();
  expect(state.profile.display_name).toBe('Separate provider draft');
  await expect(page.getByLabel('User username', { exact: true })).toHaveValue('demo-alex');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('User username', { exact: true })).toHaveValue('');
});
test('User profile migration errors allow retry without claiming storage success', async ({ page }) => {
  await mockBackend(page, { missingUserProfileMigration: true });
  await signIn(page);
  await enter(page, '/?page=edit-user-profile');
  await page.getByRole('button', { name: 'Load my User profile draft' }).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Unable to complete');
  await expect(page.getByRole('button', { name: 'Load my User profile draft' })).toBeEnabled();
});

for (const [path, action, kind, newAction] of [
  ['user-setup', 'Open my listing drafts', 'looking', 'Start a Looking For draft'],
  ['provider-setup', 'Draft an Offering', 'offering', 'Start an Offering draft'],
]) {
  test(`${path} selects the matching listing type and returns to its filtered library`, async ({ page }) => {
    const state = await mockBackend(page);
    state.listings = [
      { id: listingId, owner_id: userId, kind: 'offering', title: 'Offering coffee plan', description: 'An existing private companion offering.', city: 'Vancouver', area: '', activity: 'Coffee' },
      { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', owner_id: userId, kind: 'looking', title: 'Looking for gallery company', description: 'An existing private Looking For plan.', city: 'Vancouver', area: '', activity: 'Culture' },
    ];
    await signIn(page);
    await enter(page, `/?page=${path}`);
    await page.getByRole('link', { name: action, exact: true }).click();
    await expect(page.locator('#library-type:visible, #listing-category:visible')).toHaveValue(kind);
    await expect(page.locator('.library-card')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('#library-type:visible, #listing-category:visible')).toHaveValue(kind);
    await page.getByRole('link', { name: newAction, exact: true }).click();
    await expect(page.locator('#library-type:visible, #listing-category:visible')).toHaveValue(kind);
    await page.getByRole('button', { name: 'Use a fictional example' }).click();
    await page.getByRole('button', { name: 'Save private draft', exact: true }).click();
    await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Private listing draft saved');
    expect(state.listings[2].kind).toBe(kind);
    await page.getByRole('link', { name: 'Back to my listings', exact: false }).click();
    await expect(page.locator('#library-type:visible, #listing-category:visible')).toHaveValue(kind);
    await expect(page.locator('.library-card')).toHaveCount(2);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.locator('.library-card')).toHaveCount(3);
  });
}

test('booking preview makes no backend writes and clears private plan fields on sign-out', async ({ page }) => {
  const state = await mockBackend(page);
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await page.getByRole('link', { name: 'Build a booking draft', exact: true }).click();
  await page.getByRole('button', { name: 'Use a fictional booking plan' }).click();
  await page.getByRole('button', { name: 'Review booking draft' }).click();
  await expect(page.locator('.booking-review')).toContainText('Maya');
  expect(state.requests.filter(value => value.path.startsWith('/rest/v1/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(value.method))).toHaveLength(0);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Fictional provider', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Requests or notes (optional)', { exact: true })).toHaveValue('');
});

test('editable Provider preference does not grant Provider or administrative roles', async ({ page }) => {
  const state = await mockBackend(page);
  state.user.user_metadata = { onboarding_intent: 'provider', role: 'admin', roles: ['provider', 'admin'] };
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await expect(page.locator('[data-account-permissions]')).toHaveText('Assigned roles: User. Provider role: Not assigned.');
  await expect(page.getByRole('button', { name: 'Use Provider starting point' })).toHaveAttribute('aria-pressed', 'true');
  state.roles = ['user', 'provider'];
  await page.getByRole('button', { name: 'Refresh account permissions' }).click();
  await expect(page.locator('[data-account-permissions]')).toContainText('Provider role: Assigned');
  const roleRequests = state.requests.filter(value => value.path === '/rest/v1/account_roles');
  expect(roleRequests.length).toBeGreaterThan(0);
  expect(roleRequests.every(value => value.method === 'GET')).toBe(true);
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/account-permissions-mobile.png', fullPage: true });
});
test('missing role schema reports unavailable permissions without granting fallback access', async ({ page }) => {
  await mockBackend(page, { missingRoleMigration: true });
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await expect(page.locator('[data-account-permissions]')).toContainText('Unable to verify account permissions');
  await expect(page.locator('[data-account-permissions]')).not.toContainText('Assigned roles:');
  await expect(page.getByRole('button', { name: 'Refresh account permissions' })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Edit User profile draft', exact: true })).toBeVisible();
});

test('provider application saves, submits, locks, withdraws and preserves roles', async ({ page }) => {
  const state = await mockBackend(page);
  await signIn(page);
  await enter(page, '/?page=provider-setup');
  await page.getByRole('link', { name: 'Prepare provider application', exact: true }).click();
  await expect(page.locator('.application-state')).toHaveText('No saved application.');
  await page.getByLabel('Provider display name', { exact: true }).fill('  Test Provider  ');
  await page.getByLabel('General city', { exact: true }).fill('Vancouver');
  await page.getByLabel('Provider application introduction', { exact: true }).fill('A private introduction for the development queue.');
  await expect(page.getByRole('button', { name: 'Submit saved application' })).toBeDisabled();
  await page.getByRole('button', { name: 'Save application draft', exact: true }).click();
  await expect(page.locator('#provider-application-feedback')).toContainText('draft saved privately');
  await expect(page.getByLabel('Provider display name', { exact: true })).toHaveValue('Test Provider');
  await expect(page.getByRole('button', { name: 'Submit saved application' })).toBeEnabled();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Submit saved application' }).click();
  expect(state.providerApplication.state).toBe('draft');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Submit saved application' }).click();
  await expect(page.locator('.application-state')).toHaveText('Application status: submitted.');
  await expect(page.getByLabel('Provider display name', { exact: true })).toBeDisabled();
  expect(state.roles).toEqual(['user']);
  await page.reload();
  await expect(page.locator('.application-state')).toHaveText('Application status: submitted.');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Withdraw application', exact: true }).click();
  await expect(page.locator('.application-state')).toHaveText('Application status: withdrawn.');
  await expect(page.getByLabel('Provider display name', { exact: true })).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/provider-application-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Save application draft', exact: true }).click();
  await expect(page.locator('.application-state')).toHaveText('Application status: draft.');
  const writes = state.requests.filter(value => value.path.includes('/rpc/') && value.path.includes('provider_application'));
  expect(writes.every(value => value.body.p_expected_owner === userId)).toBe(true);
  expect(writes.some(value => Object.hasOwn(value.body, 'state') || Object.hasOwn(value.body, 'role'))).toBe(false);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Provider display name', { exact: true })).toHaveValue('');
});
test('provider application storage failures remain retryable without false submission', async ({ page }) => {
  await mockBackend(page, { missingApplicationMigration: true });
  await signIn(page);
  await enter(page, '/?page=provider-application');
  await expect(page.locator('#provider-application-feedback')).toContainText('Unable to complete');
  await expect(page.locator('.application-state')).toHaveText('Application status has not been loaded.');
  await expect(page.getByRole('button', { name: 'Submit saved application' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Reload application' })).toBeEnabled();
});

for (const operation of ['save', 'withdraw']) {
  test(`failed provider application ${operation} keeps its previous state and allows retry`, async ({ page }) => {
    const state = await mockBackend(page, { failApplicationMutation: true });
    if (operation === 'withdraw') state.providerApplication = { owner_id: userId, display_name: 'Submitted Provider', city: 'Vancouver', introduction: 'A saved private introduction.', state: 'submitted' };
    await signIn(page);
    await enter(page, '/?page=provider-application');
    if (operation === 'save') {
      await expect(page.locator('.application-state')).toHaveText('No saved application.');
      await page.getByLabel('Provider display name', { exact: true }).fill('Unsaved Provider');
      await page.getByRole('button', { name: 'Save application draft', exact: true }).click();
    } else {
      await expect(page.locator('.application-state')).toHaveText('Application status: submitted.');
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Withdraw application', exact: true }).click();
    }
    await expect(page.locator('#provider-application-feedback')).toContainText('Unable to complete');
    await expect(page.getByRole('button', { name: operation === 'save' ? 'Save application draft' : 'Withdraw application', exact: true })).toBeEnabled();
    await expect(page.locator('.application-state')).toHaveText(operation === 'save' ? 'No saved application.' : 'Application status: submitted.');
    expect(state.roles).toEqual(['user']);
  });
}

function reviewRows(count) {
  return Array.from({ length: count }, (_, index) => ({ owner_id: `44444444-4444-4444-8444-${String(index + 1).padStart(12,'0')}`, display_name: `Applicant ${String(index + 1).padStart(2,'0')}`, city: 'Vancouver', introduction: index === 0 ? '<img src=x onerror=alert(1)> Private submitted introduction.' : 'Private submitted introduction.', state: 'submitted', submitted_at: `2026-11-08T10:${String(index).padStart(2,'0')}:00Z`, updated_at: `2026-11-08T10:${String(index).padStart(2,'0')}:00Z` }));
}
test('assigned staff review access paginates, escapes introductions and clears on revocation', async ({ page }) => {
  const state = await mockBackend(page);
  state.roles = ['user','moderator']; state.capabilities = ['provider_application_review']; state.reviewApplications = reviewRows(23);
  await signIn(page);
  await page.locator('[data-account-link]').click();
  await page.getByRole('link', { name: 'Open provider review queue', exact: true }).click();
  await expect(page.locator('.review-card')).toHaveCount(20);
  await page.getByRole('button', { name: 'Next applications', exact: true }).click();
  await expect(page.locator('.review-card')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Next applications', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Previous applications', exact: true }).click();
  await expect(page.locator('.review-card')).toHaveCount(20);
  await page.getByRole('button', { name: 'Inspect Applicant 01', exact: true }).click();
  await expect(page.locator('.review-introduction')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.review-detail img')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/provider-review-mobile.png' });
  await page.locator('.review-detail').screenshot({ path: '/tmp/provider-review-detail-mobile.png' });
  expect(state.reviewAccessEvents.some(value => value.action === 'application_opened')).toBe(true);
  state.capabilities = [];
  await page.getByRole('button', { name: 'Refresh review queue', exact: true }).click();
  await expect(page.locator('.review-status')).toContainText('does not have assigned');
  await expect(page.locator('.review-card')).toHaveCount(0);
  await expect(page.locator('.review-introduction')).toHaveCount(0);
  expect(state.requests.filter(value => value.path.endsWith('/save_provider_application') || value.path.endsWith('/submit_provider_application') || value.path.endsWith('/withdraw_provider_application'))).toHaveLength(0);
  state.capabilities = ['provider_application_review'];
  await page.getByRole('button', { name: 'Refresh review queue', exact: true }).click();
  await expect(page.locator('.review-card')).toHaveCount(20);
  await page.getByRole('button', { name: 'Inspect Applicant 01', exact: true }).click();
  await expect(page.locator('.review-introduction')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('.review-card')).toHaveCount(0);
  await expect(page.locator('.review-introduction')).toHaveCount(0);
});
for (const [label, roles, capabilities] of [['User with forged metadata',['user'],[]],['Moderator without capability',['user','moderator'],[]],['User with capability only',['user'],['provider_application_review']]]) {
  test(`${label} cannot load the staff application queue`, async ({ page }) => {
    const state = await mockBackend(page); state.roles = roles; state.capabilities = capabilities;
    state.user.user_metadata = { role: 'admin', capabilities: ['provider_application_review'] }; state.reviewApplications = reviewRows(1);
    await signIn(page);
    await enter(page, '/?page=provider-review');
    await expect(page.locator('.review-status')).toContainText('does not have assigned');
    await expect(page.locator('.review-card')).toHaveCount(0);
    expect(state.requests.filter(value => value.path.endsWith('/list_provider_applications_for_review'))).toHaveLength(0);
  });
}
test('withdrawn intake cannot remain open in the review queue', async ({ page }) => {
  const state = await mockBackend(page); state.roles = ['user','admin']; state.capabilities = ['provider_application_review']; state.reviewApplications = reviewRows(1);
  await signIn(page); await enter(page, '/?page=provider-review');
  await expect(page.locator('.review-card')).toHaveCount(1);
  state.reviewApplications[0].state = 'withdrawn';
  await page.getByRole('button', { name: 'Inspect Applicant 01', exact: true }).click();
  await expect(page.locator('.review-status')).toContainText('No submitted applications');
  await expect(page.locator('.review-card')).toHaveCount(0);
  await expect(page.locator('.review-introduction')).toHaveCount(0);
});
test('missing staff review schema reports unavailable data without fallback records', async ({ page }) => {
  await mockBackend(page, { missingReviewMigration: true });
  await signIn(page); await enter(page, '/?page=provider-review');
  await expect(page.locator('.review-status')).toContainText('Unable to verify review access');
  await expect(page.locator('.review-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Refresh review queue' })).toBeEnabled();
});

test('scoped staff can request changes to the inspected version but cannot decide on a replaced version', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  const state = await mockBackend(page); state.roles = ['user','moderator']; state.capabilities = ['provider_application_review','provider_application_feedback'];
  state.reviewApplications = reviewRows(1); state.reviewApplications[0].submission_id = '66666666-6666-4666-8666-000000000001';
  await signIn(page); await enter(page, '/?page=provider-review');
  await page.getByRole('button', { name: 'Inspect Applicant 01', exact: true }).click();
  await page.getByLabel('Changes the applicant should make', { exact: true }).fill('Please clarify your offered experiences.');
  await page.locator('.review-feedback-form').screenshot({path:'/tmp/provider-feedback-form.png'});
  state.reviewApplications[0].submission_id = '66666666-6666-4666-8666-000000000002';
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  await expect(page.locator('.review-feedback-form [role=status]')).toContainText('Unable to request changes');
  expect(state.applicationFeedback).toHaveLength(0);
  await page.getByRole('button', { name: 'Refresh review queue' }).click();
  await page.getByRole('button', { name: 'Inspect Applicant 01', exact: true }).click();
  await page.getByLabel('Changes the applicant should make', { exact: true }).fill('Please clarify your offered experiences.');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Request changes', exact: true }).click();
  await expect(page.locator('.review-card')).toHaveCount(0);
  expect(state.applicationFeedback).toHaveLength(1);
  expect(state.applicationFeedback[0].submission_id).toBe('66666666-6666-4666-8666-000000000002');
  expect(state.roles).toEqual(['user','moderator']);
});
test('applicant sees escaped change notes, edits and resubmits without gaining Provider access', async ({ page }) => {
  const state = await mockBackend(page);
  state.providerApplication = {owner_id:userId,display_name:'Applicant',city:'Vancouver',introduction:'Original introduction',state:'changes_requested',submission_id:'66666666-6666-4666-8666-000000000099'};
  state.applicationFeedback = [{owner_id:userId,note:'<img src=x onerror=alert(1)> Clarify your introduction.',created_at:'2026-11-09T00:00:00Z'}];
  await signIn(page); await enter(page, '/?page=provider-application');
  await expect(page.locator('.application-state')).toContainText('changes requested');
  await expect(page.locator('.application-review-note')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.application-review-note img')).toHaveCount(0);
  await page.getByLabel('Provider application introduction', { exact: true }).fill('Revised introduction');
  await page.getByRole('button', {name:'Save application draft',exact:true}).click();
  await expect(page.locator('.application-state')).toContainText('draft');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', {name:'Submit saved application',exact:true}).click();
  await expect(page.locator('.application-state')).toContainText('submitted');
  await expect(page.locator('.application-review-note')).toBeHidden();
  expect(state.providerApplication.submission_id).not.toBe('66666666-6666-4666-8666-000000000099');
  expect(state.roles).toEqual(['user']);
});


test('private submission history is explicit, bounded and associates escaped feedback with its version', async ({ page }) => {
  const state = await mockBackend(page);
  state.applicationSubmissions = Array.from({length:22}, (_, index) => ({id:`version-${index}`,owner_id:userId,display_name:`Private introduction ${index}`,city:'Vancouver',introduction:'<img src=x onerror=alert(1)> Original text',submitted_at:'2026-11-09T12:00:00Z'}));
  state.applicationFeedback = [{owner_id:userId,submission_id:'version-1',note:'<script>Clarify activities</script>',created_at:'2026-11-09T13:00:00Z'}];
  await page.setViewportSize({width:390,height:844});
  await signIn(page); await enter(page,'/?page=provider-application');
  await expect(page.getByRole('button',{name:'Save application draft',exact:true})).toBeEnabled();
  expect(state.requests.some(row => row.path.endsWith('/provider_application_submissions'))).toBe(false);
  await page.getByRole('button',{name:'Load submission history',exact:true}).click();
  await expect(page.locator('.application-history [role=status]')).toHaveText('20 recent submissions loaded.');
  await expect(page.locator('.application-history details')).toHaveCount(20);
  await page.locator('.application-history summary').nth(1).click();
  await expect(page.locator('.application-history details').nth(1)).toContainText('<script>Clarify activities</script>');
  await expect(page.locator('.application-history details').first()).not.toContainText('Clarify activities');
  await expect(page.locator('.application-history img,.application-history script')).toHaveCount(0);
  await page.locator('.application-history details').nth(1).screenshot({path:'/tmp/provider-submission-history-mobile.png'});
  await page.getByRole('button',{name:'Save application draft',exact:true}).click();
  await expect(page.locator('.application-history details')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Save application draft',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Load submission history',exact:true}).click();
  await expect(page.locator('.application-history details')).toHaveCount(20);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.locator('.application-history details')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Original text');
});

test('history errors clear previous private versions and allow retry without claiming an empty history', async ({ page }) => {
  const state = await mockBackend(page);
  state.applicationSubmissions = [{id:'version-1',owner_id:userId,display_name:'Private old text',city:'Vancouver',introduction:'Original text',submitted_at:'2026-11-09T12:00:00Z'}];
  await signIn(page); await enter(page,'/?page=provider-application');
  await expect(page.getByRole('button',{name:'Save application draft',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Load submission history',exact:true}).click();
  await expect(page.locator('.application-history details')).toHaveCount(1);
  state.historyFailure = true;
  await page.getByRole('button',{name:'Refresh submission history',exact:true}).click();
  await expect(page.locator('.application-history [role=status]')).toContainText('Submission history unavailable');
  await expect(page.locator('.application-history details')).toHaveCount(0);
  state.historyFailure = false; state.applicationSubmissions = [];
  await page.getByRole('button',{name:'Refresh submission history',exact:true}).click();
  await expect(page.locator('.application-history [role=status]')).toHaveText('No submitted introductions found.');
});
