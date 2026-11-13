// Real SDK + mocked HTTP service. Hosted auth/email behaviour is not validated here.
import { readFile } from 'node:fs/promises';
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
  const state = { profileFeedback:[], profileReviewEvents:[], profilePublications:[], profilePublication:null, bookingPlan: null, user: { ...user, user_metadata: {} }, providerApplication: null, applicationApprovals: [], targetRoles: ['user'], approvalFailure: false, applicationFeedback: [], applicationActivity: [], activityFailure: false, applicationSubmissions: [], historyFailure: false, applicationSubmissionCounter: 0, userProfile: null, roles: ['user'], capabilities: [], reviewApplications: [], reviewAccessEvents: [], availability: null, profile: options.savedSummaries ? { owner_id: userId } : null, catalogue: options.savedSummaries ? [{ title: 'Coffee' }] : null, listings: options.savedSummaries ? [{ id: listingId }] : [], requests: [], recoveryRedirect: null };
  await page.route('https://backend-test.supabase.co/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const body = request.postDataJSON();
    state.requests.push({ path: url.pathname, query: url.searchParams.toString(), method, body });
    const respond = (data, status = 200, extraHeaders = {}) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', ...extraHeaders }, body: JSON.stringify(data) });
    if (method === 'OPTIONS') return respond({});
    if (url.pathname === '/auth/v1/token') {
      if (options.failSignIn || (options.failReauthentication && state.requests.filter(r => r.path === '/auth/v1/token').length > 1)) return respond({ code: 'invalid_credentials', msg: 'Invalid credentials' }, 400);
      return respond(session(state.user));
    }
    if (url.pathname === '/auth/v1/signup') { state.user = { ...state.user, user_metadata: body.data }; return respond({ ...state.user, identities: [{ id: userId, user_id: userId }] }); }
    if (url.pathname === '/auth/v1/recover') { state.recoveryRedirect = url.searchParams.get('redirect_to'); return respond({}); }
    if (url.pathname === '/auth/v1/user') {
      if (method === 'PUT' && body?.email) {
        if (options.failEmailChange) return respond({message:'Email unavailable'},422);
        state.user = options.immediateEmailChange ? {...state.user,email:body.email,new_email:''} : {...state.user,new_email:body.email};
      }

      if (options.failPasswordUpdate && method === 'PUT' && body?.password) return respond({ message: 'Password rejected' }, 422);
      if (method === 'PUT' && body?.data) {
        if (options.failIntentUpdate) return respond({ message: 'Rejected' }, 403);
        state.user = { ...state.user, user_metadata: { ...state.user.user_metadata, ...body.data } };
      }
      return respond(state.user);
    }
    if (url.pathname === '/auth/v1/logout') {
      if (url.searchParams.get('scope') === 'local' && options.failLocalLogout) return respond({message:'Unavailable'},500);
      if (url.searchParams.get('scope') === 'others' && options.failOtherSessionLogout) return respond({message:'Unavailable'},options.otherSessionFailureStatus || 500);
      return respond({});
    }
    if (url.pathname === '/rest/v1/booking_plan_drafts') {
      if (options.missingBookingPlanMigration || options.failBookingPlanOperation) return respond({message:'Plan unavailable'},404);
      if (method === 'POST') { if(body.owner_id !== state.user.id) return respond({message:'Wrong owner'},403); state.bookingPlan = body; return respond(null); }
      if (method === 'DELETE') { const removed = state.bookingPlan; state.bookingPlan = null; return respond(removed ? [{owner_id:removed.owner_id}] : []); }
      return respond(state.bookingPlan ? [state.bookingPlan] : []);
    }
    if (url.pathname === '/rest/v1/provider_application_events') {
      if (state.activityFailure) return respond({message:'Activity unavailable'},404);
      return respond(state.applicationActivity.filter(row => `eq.${row.owner_id}` === url.searchParams.get('owner_id')).slice(0,Number(url.searchParams.get('limit'))));
    }
    if (url.pathname === '/rest/v1/provider_application_submissions') {
      if (state.historyFailure) return respond({message:'History unavailable'},404);
      return respond(state.applicationSubmissions.filter(row => `eq.${row.owner_id}` === url.searchParams.get('owner_id')).slice(0,Number(url.searchParams.get('limit'))));
    }
    if (url.pathname === '/rest/v1/provider_application_approvals') {
      if(options.missingApprovalMigration)return respond({message:'Unavailable'},404);
      return respond(state.applicationApprovals.filter(row=>row.owner_id===state.user.id && (!url.searchParams.has('submission_id') || url.searchParams.get('submission_id').includes(row.submission_id))).map(({owner_id,submission_id,approved_at})=>({owner_id,submission_id,approved_at})));
    }
    if(url.pathname==='/rest/v1/rpc/list_my_provider_approvals') {
      if(options.missingApprovalHistoryMigration)return respond({message:'History unavailable'},404);
      const allowed=state.roles.includes('admin') && state.capabilities.includes('provider_application_review') && state.capabilities.includes('provider_application_approval');
      if(!allowed || body.p_expected_reviewer!==state.user.id)return respond({message:'Denied'},403);
      state.reviewAccessEvents.push({action:'approval_history_list'});
      const values=state.applicationApprovals.filter(row=>row.reviewer_id===state.user.id && (!body.p_before_approved_at || row.approved_at<body.p_before_approved_at || (row.approved_at===body.p_before_approved_at && row.approval_id<body.p_before_id))).sort((a,b)=>b.approved_at.localeCompare(a.approved_at)||b.approval_id.localeCompare(a.approval_id));
      return respond(values.slice(0,body.p_limit).map(({approval_id,owner_id,submission_id,approved_at,display_name,city,submitted_at})=>({approval_id,owner_id,submission_id,approved_at,display_name,city,submitted_at})));
    }
    if(url.pathname==='/rest/v1/rpc/can_approve_provider_applications') {
      if(options.missingApprovalMigration)return respond({message:'Unavailable'},404);
      return respond(state.roles.includes('admin') && state.capabilities.includes('provider_application_review') && state.capabilities.includes('provider_application_approval'));
    }
    if(url.pathname==='/rest/v1/rpc/approve_provider_application') {
      const allowed=state.roles.includes('admin') && state.capabilities.includes('provider_application_review') && state.capabilities.includes('provider_application_approval');
      const row=state.reviewApplications.find(value=>value.owner_id===body.p_owner);
      if(options.missingApprovalMigration || state.approvalFailure || !allowed || body.p_expected_reviewer!==state.user.id || body.p_owner===state.user.id || row?.state!=='submitted' || row.submission_id!==body.p_submission || !state.targetRoles.includes('user')) return respond({message:'Denied or stale approval'},409);
      row.state='approved';if(!state.targetRoles.includes('provider'))state.targetRoles.push('provider');
      state.applicationApprovals.push({approval_id:`88888888-8888-4888-8888-${String(state.applicationApprovals.length+1).padStart(12,'0')}`,owner_id:row.owner_id,submission_id:row.submission_id,reviewer_id:state.user.id,approved_at:'2026-11-10T18:00:00Z',display_name:row.display_name,city:row.city,submitted_at:row.submitted_at});
      return respond(row);
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
    if (['/rest/v1/rpc/list_provider_applications_for_review','/rest/v1/rpc/search_provider_applications_for_review','/rest/v1/rpc/get_provider_application_for_review'].includes(url.pathname)) {
      if (options.missingReviewMigration) return respond({ message: 'Unavailable' }, 404);
      const allowed = state.roles.some(role => ['moderator','admin'].includes(role)) && state.capabilities.includes('provider_application_review');
      if (!allowed || body.p_expected_reviewer !== state.user.id) return respond({ message: 'Denied' }, 403);
      const isSearch=url.pathname.endsWith('/search_provider_applications_for_review');
      if(isSearch && options.missingReviewSearchMigration)return respond({message:'Search unavailable'},404);
      const needle=isSearch ? body.p_query.trim().toLowerCase() : '';
      const submitted = state.reviewApplications.filter(row => row.state === 'submitted' && (!needle || `${row.display_name} ${row.city}`.toLowerCase().includes(needle))).sort((a,b) => a.submitted_at.localeCompare(b.submitted_at) || a.owner_id.localeCompare(b.owner_id));
      if (url.pathname.endsWith('/get_provider_application_for_review')) {
        const row = submitted.find(value => value.owner_id === body.p_owner);
        if (row) state.reviewAccessEvents.push({ action: 'application_opened', owner: row.owner_id });
        return respond(row ? [row] : []);
      }
      state.reviewAccessEvents.push({ action: isSearch ? 'queue_search' : 'queue_list' });
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
        if (['submitted','approved'].includes(state.providerApplication?.state)) return respond({ message: 'Locked' }, 409);
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
    if(url.pathname==='/rest/v1/rpc/can_give_profile_publication_feedback') {
      if(options.missingProfileFeedbackMigration)return respond({message:'Missing'},404);
      return respond(state.roles.some(role=>['moderator','admin'].includes(role))&&state.capabilities.includes('profile_publication_review')&&state.capabilities.includes('profile_publication_feedback'));
    }
    if(['/rest/v1/rpc/get_profile_revision_feedback','/rest/v1/rpc/record_profile_revision_feedback'].includes(url.pathname)) {
      if(options.missingProfileFeedbackMigration)return respond({message:'Missing'},404);
      const allowed=state.roles.some(role=>['moderator','admin'].includes(role))&&state.capabilities.includes('profile_publication_review')&&state.capabilities.includes('profile_publication_feedback');
      if(!allowed||body.p_expected_reviewer!==state.user.id)return respond({message:'Denied'},403);
      const copy=state.profilePublications.find(row=>row.id===body.p_submission&&!row.withdrawn_at);
      if(url.pathname.endsWith('/get_profile_revision_feedback')){state.profileReviewEvents.push({action:'feedback_opened',submission_id:body.p_submission});return respond(copy?state.profileFeedback.filter(row=>row.submission_id===copy.id).map(({submission_id,note,created_at})=>({submission_id,note,created_at})):[]);}
      if(!copy||copy.owner_id===state.user.id||!body.p_note?.trim()||body.p_note.trim().length>1000||state.profileFeedback.some(row=>row.submission_id===copy.id))return respond({message:'Unavailable or duplicate'},409);
      const feedback={submission_id:copy.id,reviewer_id:state.user.id,note:body.p_note.trim(),created_at:'2026-11-13T20:00:00Z'};state.profileFeedback.push(feedback);state.profileReviewEvents.push({action:'feedback_recorded',submission_id:copy.id});const {submission_id,note,created_at}=feedback;return respond({submission_id,note,created_at});
    }
    if(url.pathname==='/rest/v1/profile_publication_feedback') {
      if(options.missingProfileFeedbackMigration)return respond({message:'Missing'},404);
      const id=url.searchParams.get('submission_id')?.replace('eq.','');const copy=[...state.profilePublications,...(state.profilePublication?[state.profilePublication]:[])].find(row=>row.id===id&&row.owner_id===state.user.id);
      return respond(copy?state.profileFeedback.filter(row=>row.submission_id===id).map(({submission_id,note,created_at})=>({submission_id,note,created_at})):[]);
    }
    if (['/rest/v1/rpc/can_review_profile_publications','/rest/v1/rpc/list_profile_publications_for_review','/rest/v1/rpc/search_profile_publications_for_review','/rest/v1/rpc/get_profile_publication_for_review'].includes(url.pathname)) {
      if(options.missingProfileReviewMigration)return respond({message:'Missing'},404);
      const allowed=state.roles.some(role=>['moderator','admin'].includes(role))&&state.capabilities.includes('profile_publication_review');
      if(url.pathname.endsWith('/can_review_profile_publications'))return respond(allowed);
      if(!allowed||body.p_expected_reviewer!==state.user.id)return respond({message:'Denied'},403);
      const isSearch=url.pathname.endsWith('/search_profile_publications_for_review');
      if(isSearch&&options.missingProfileSearchMigration)return respond({message:'Missing search'},404);
      const needle=isSearch?body.p_query.trim().toLowerCase():'';
      const rows=state.profilePublications.filter(row=>!row.withdrawn_at&&(!needle||`${row.public_fields.display_name||''} ${row.public_fields.city||''}`.toLowerCase().includes(needle))).sort((a,b)=>a.submitted_at.localeCompare(b.submitted_at)||a.id.localeCompare(b.id));
      if(url.pathname.endsWith('/get_profile_publication_for_review')) {
        const row=rows.find(value=>value.id===body.p_submission);if(row)state.profileReviewEvents.push({action:'copy_opened',submission_id:row.id});
        return respond(row?[{...row,public_fields:Object.fromEntries(['display_name','username','adult_age','tagline','city','area','photo_index'].map(key=>[key,row.public_fields[key]??null]))}]:[]);
      }
      state.profileReviewEvents.push({action:isSearch?'queue_search':'queue_list'});
      return respond(rows.filter(row=>!body.p_after_submitted_at||row.submitted_at>body.p_after_submitted_at||(row.submitted_at===body.p_after_submitted_at&&row.id>body.p_after_id)).slice(0,body.p_limit).map(({id,owner_id,public_fields,submitted_at,source_updated_at})=>({id,owner_id,display_name:public_fields.display_name,city:public_fields.city,submitted_at,source_updated_at})));
    }
    if (url.pathname === '/rest/v1/profile_publication_submissions') {
      if(options.missingProfileSubmissionMigration)return respond({message:'Missing'},404);
      if(url.searchParams.has('withdrawn_at')) {
        const row=state.profilePublication;
        return respond(row&&row.owner_id===state.user.id&&!row.withdrawn_at?[row]:[]);
      }
      let rows=state.profilePublications.length?state.profilePublications:(state.profilePublication?[state.profilePublication]:[]);
      rows=rows.filter(row=>row.owner_id===state.user.id).sort((a,b)=>b.submitted_at.localeCompare(a.submitted_at)||b.id.localeCompare(a.id));
      const cursor=url.searchParams.get('or');
      if(cursor){const timestamp=cursor.match(/submitted_at\.lt\.([^,]+)/)[1];const id=cursor.match(/id\.lt\.([a-f0-9-]+)/i)[1];rows=rows.filter(row=>row.submitted_at<timestamp||(row.submitted_at===timestamp&&row.id<id));}
      return respond(rows.slice(0,Number(url.searchParams.get('limit')||21)));
    }
    if (url.pathname === '/rest/v1/rpc/submit_private_profile_copy') {
      if(options.missingProfileSubmissionMigration)return respond({message:'Missing'},404);
      if(body.p_expected_owner!==state.user.id||!state.roles.includes('user')||!state.roles.includes('provider'))return respond({message:'Denied'},403);
      const profile=state.profile;
      if(!profile||!body.p_source_updated_at||profile.updated_at!==body.p_source_updated_at||!profile.username||!profile.adult_age||(state.profilePublication&&!state.profilePublication.withdrawn_at))return respond({message:'Source changed or pending'},409);
      state.profilePublication={id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',owner_id:state.user.id,source_updated_at:profile.updated_at,submitted_at:'2026-11-10T20:00:00Z',withdrawn_at:null,public_fields:Object.fromEntries(['display_name','username','adult_age','tagline','city','area','photo_index'].map(key=>[key,profile[key]??null]))};
      return respond(state.profilePublication);
    }
    if (url.pathname === '/rest/v1/rpc/withdraw_private_profile_copy') {
      if(options.missingProfileSubmissionMigration)return respond({message:'Missing'},404);
      if(body.p_expected_owner!==state.user.id||!state.profilePublication||state.profilePublication.owner_id!==state.user.id||body.p_submission!==state.profilePublication.id||state.profilePublication.withdrawn_at)return respond({message:'Denied'},403);
      state.profilePublication.withdrawn_at='2026-11-10T21:00:00Z';return respond(state.profilePublication);
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
      if (method === 'GET' && request.headers().prefer?.includes('count=exact')) return respond(state.listings.slice(0,1000),200,{'content-range':`0-${Math.max(0,state.listings.length-1)}/${options.backupListingCount ?? state.listings.length}`,'Access-Control-Expose-Headers':'content-range'});
      if (method === 'HEAD') {
        if (options.failListingSummary) return respond({message:'Denied'},403);
        const kind = url.searchParams.get('kind')?.replace(/^eq\./,'');
        const count = options.invalidListingSummaryCount ? '*' : state.listings.filter(row => !kind || row.kind === kind).length;
        return route.fulfill({ status: 200, headers: { 'content-range': `0-0/${count}`, 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'content-range' } });
      }
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
    await expect(page.locator('#account-security-status')).toContainText('must match');
    expect(state.requests.filter(r => r.path === '/auth/v1/token')).toHaveLength(1);
    await confirm.fill('new-test-password');
    await page.getByRole('button', { name: 'Show new password', exact: true }).click();
    await expect(next).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Change password', exact: true }).click();
    const message = scenario === 'success' ? 'Your password was changed.' : scenario === 'reauthentication' ? 'Unable to verify your current password' : 'Unable to change your password';
    await expect(page.locator('#account-security-status')).toContainText(message);
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
    await expect(page.locator('#account-security-status')).toContainText('Sign in with your email');
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
  await page.getByRole('link', { name: 'Start provider application', exact: true }).click();
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
  const submitted = state.reviewApplications[0].submitted_at;
  const localDate = await page.evaluate(value => new Date(value).toLocaleString(undefined, { timeZoneName: 'short' }), submitted);
  await expect(page.locator('.review-card').first().locator('time')).toHaveAttribute('datetime', new Date(submitted).toISOString());
  await expect(page.locator('.review-card').first().locator('.review-submitted')).toHaveText(`Submitted ${localDate}`);
  await expect(page.locator('.review-detail time')).toHaveAttribute('datetime', new Date(submitted).toISOString());
  await expect(page.locator('.review-detail .review-submitted')).toHaveText(`Submitted ${localDate}`);
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
  page.once('dialog', dialog => dialog.accept());
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


test('account application status follows saved state and links to requested revisions without exposing the introduction', async ({ page }) => {
  const state = await mockBackend(page);
  await signIn(page); await page.locator('[data-account-link]').click();
  const status = page.locator('[data-application-status]');
  await expect(status).toHaveText('No provider application saved yet.');
  for (const [value,message,label] of [
    ['draft','Private application draft saved.','Continue application draft'],
    ['submitted','Application submitted for review. Provider access has not been approved.','View submitted application'],
    ['withdrawn','Application withdrawn. Save revisions before submitting again.','Revise application'],
    ['changes_requested','Changes requested. Read your feedback, revise and resubmit.','Review requested changes'],
  ]) {
    state.providerApplication = {owner_id:userId,state:value,introduction:'PRIVATE INTRODUCTION NOT FOR DASHBOARD'};
    await page.getByRole('button',{name:'Refresh application status',exact:true}).click();
    await expect(status).toHaveText(message);
    await expect(page.getByRole('link',{name:label,exact:true})).toHaveAttribute('href','?page=provider-application');
    await expect(page.locator('.account-overview')).not.toContainText('PRIVATE INTRODUCTION');
  }
  await page.setViewportSize({width:390,height:844});
  await status.locator('..').screenshot({path:'/tmp/account-application-status-mobile.png'});
  await page.getByRole('link',{name:'Review requested changes',exact:true}).click();
  await expect(page.locator('.application-state')).toContainText('changes requested');
});

test('missing application schema does not block account tools or imply an empty application', async ({ page }) => {
  await mockBackend(page,{missingApplicationMigration:true,savedSummaries:true});
  await signIn(page); await page.locator('[data-account-link]').click();
  await expect(page.locator('[data-application-status]')).toContainText('Application status unavailable');
  await expect(page.locator('[data-draft-summary=profile]')).toHaveText('Private profile draft saved');
  await expect(page.getByRole('link',{name:'Open provider application',exact:true})).toBeVisible();
});


test('application activity shows bounded private state history and clears on failure, mutation and sign-out', async ({ page }) => {
  const state = await mockBackend(page);
  state.applicationActivity = Array.from({length:23},(_,index) => ({event_id:23-index,owner_id:userId,state:['draft','changes_requested','submitted','withdrawn'][index%4],occurred_at:'2026-11-09T12:00:00Z'}));
  await signIn(page); await enter(page,'/?page=provider-application');
  await expect(page.getByRole('button',{name:'Save application draft',exact:true})).toBeEnabled();
  expect(state.requests.some(row => row.path.endsWith('/provider_application_events'))).toBe(false);
  await page.getByRole('button',{name:'Load application activity',exact:true}).click();
  await expect(page.locator('.application-activity li')).toHaveCount(20);
  await expect(page.locator('.application-activity li').nth(1)).toContainText('Changes requested');
  await page.setViewportSize({width:390,height:844});
  await page.locator('.application-activity').screenshot({path:'/tmp/provider-application-activity-mobile.png'});
  state.activityFailure = true;
  await page.getByRole('button',{name:'Refresh application activity',exact:true}).click();
  await expect(page.locator('.application-activity [role=status]')).toContainText('Application activity unavailable');
  await expect(page.locator('.application-activity li')).toHaveCount(0);
  state.activityFailure = false;
  await page.getByRole('button',{name:'Refresh application activity',exact:true}).click();
  await expect(page.locator('.application-activity li')).toHaveCount(20);
  await page.getByRole('button',{name:'Save application draft',exact:true}).click();
  await expect(page.locator('.application-activity li')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Save application draft',exact:true})).toBeEnabled();
  state.applicationActivity = [];
  await page.getByRole('button',{name:'Load application activity',exact:true}).click();
  await expect(page.locator('.application-activity [role=status]')).toHaveText('No application activity recorded yet.');
  state.applicationActivity = [{event_id:1,owner_id:userId,state:'submitted',occurred_at:'2026-11-09T12:00:00Z'}];
  await page.getByRole('button',{name:'Refresh application activity',exact:true}).click();
  await expect(page.locator('.application-activity li')).toHaveCount(1);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.locator('.application-activity li')).toHaveCount(0);
  await expect(page.locator('.application-activity [role=status]')).toHaveText('');
});


test('booking plans save partial text, reload privately and delete without sending or cancelling a booking', async ({ page }) => {
  const state = await mockBackend(page);
  page.on('dialog',dialog=>dialog.accept());
  await signIn(page); await enter(page,'/?page=booking-draft&provider=maya&offering=gallery');
  await page.getByLabel('Requests or notes (optional)',{exact:true}).fill('Private unfinished plan');
  await page.getByLabel('Requested duration (minutes)',{exact:true}).fill('1.5');
  await page.getByRole('button',{name:'Save private draft',exact:true}).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Check the highlighted fields');
  expect(state.bookingPlan).toBeNull();
  await page.getByLabel('Requested duration (minutes)',{exact:true}).fill('');
  await page.getByRole('button',{name:'Save private draft',exact:true}).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Private booking plan saved');
  expect(state.bookingPlan.owner_id).toBe(userId);
  expect(state.bookingPlan.plan.sourceOffering).toBe('gallery');
  expect(state.bookingPlan.plan.date).toBe('');
  await page.locator('[data-account-link]').click();
  await expect(page.locator('[data-draft-summary=booking-plan]')).toHaveText('Private booking plan saved');
  await page.getByRole('link',{name:'Build a booking draft',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'Load my booking plan',exact:true}).click();
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('Private unfinished plan');
  await expect(page.getByRole('link',{name:'View source Offering',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Delete saved booking plan',exact:true}).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('no booking was cancelled');
  expect(state.bookingPlan).toBeNull();
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('Private unfinished plan');
  await page.setViewportSize({width:390,height:844});
  await page.locator('.private-draft-controls').screenshot({path:'/tmp/private-booking-plan-controls-mobile.png'});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('');
  expect(state.requests.filter(row => row.method === 'POST' && row.path.startsWith('/rest/v1/')).every(row => row.path.endsWith('/booking_plan_drafts'))).toBe(true);
});

test('missing booking plan schema preserves editor text and does not claim a saved or empty plan', async ({ page }) => {
  await mockBackend(page,{missingBookingPlanMigration:true});
  await signIn(page); await enter(page,'/?page=booking-draft');
  await page.getByLabel('Requests or notes (optional)',{exact:true}).fill('Keep my unsaved idea');
  await page.getByRole('button',{name:'Save private draft',exact:true}).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Unable to complete');
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Load my booking plan',exact:true}).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Unable to complete');
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('Keep my unsaved idea');
});


test('loading a saved booking plan preserves text edited while the network response is pending', async ({ page }) => {
  const state = await mockBackend(page);
  state.bookingPlan = {owner_id:userId,plan:{sourceOffering:'',provider:'',activity:'',date:'',time:'',timeZone:'',duration:'',venue:'',expenses:'',notes:'Older saved notes'}};
  await signIn(page); await enter(page,'/?page=booking-draft');
  let release; const waiting = new Promise(resolve=>{release=resolve;});
  let requested; const started = new Promise(resolve=>{requested=resolve;});
  await page.route('**/rest/v1/booking_plan_drafts*',async route=> { requested(); await waiting; await route.fallback(); });
  await page.getByRole('button',{name:'Load my booking plan',exact:true}).click();
  await started;
  await page.getByLabel('Requests or notes (optional)',{exact:true}).fill('New text typed during loading');
  release();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Current plan kept because you edited');
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('New text typed during loading');
  expect(state.bookingPlan.plan.notes).toBe('Older saved notes');
});


test('User setup resumes a saved private booking plan and refreshes saved presence independently', async ({ page }) => {
  const state = await mockBackend(page);
  state.bookingPlan = {owner_id:userId,plan:{sourceOffering:'gallery',provider:'maya',activity:'Culture',date:'',time:'',timeZone:'',duration:'',venue:'',expenses:'',notes:'Private plan to resume'}};
  await signIn(page); await enter(page,'/?page=user-setup');
  await expect(page.locator('[data-booking-plan-summary]')).toHaveText('Private booking plan saved');
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-booking-plan-summary]').locator('..').screenshot({path:'/tmp/user-resume-plan-mobile.png'});
  await page.getByRole('link',{name:'Resume saved booking plan',exact:true}).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Your private booking plan was loaded');
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('Private plan to resume');
  await expect(page).not.toHaveURL(/resume=/);
  await page.getByRole('link',{name:'Back to User setup',exact:false}).click();
  state.bookingPlan = null;
  await page.getByRole('button',{name:'Refresh saved booking plan status',exact:true}).click();
  await expect(page.locator('[data-booking-plan-summary]')).toHaveText('No saved booking plan');
  await expect(page.getByRole('link',{name:'Resume saved booking plan',exact:true})).toBeHidden();
});

test('resuming a saved plan protects dirty local text when replacement is cancelled', async ({ page }) => {
  const state = await mockBackend(page);
  state.bookingPlan = {owner_id:userId,plan:{sourceOffering:'',provider:'maya',activity:'',date:'',time:'',timeZone:'',duration:'',venue:'',expenses:'',notes:'Stored plan'}};
  await signIn(page); await enter(page,'/?page=booking-draft');
  await page.getByLabel('Requests or notes (optional)',{exact:true}).fill('Keep this local plan');
  await page.getByRole('link',{name:'Back to User setup',exact:false}).click();
  await expect(page.getByRole('link',{name:'Resume saved booking plan',exact:true})).toBeVisible();
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('link',{name:'Resume saved booking plan',exact:true}).click();
  await expect(page.locator('.private-draft-controls [role=status]')).toContainText('Load cancelled');
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('Keep this local plan');
  await expect(page).not.toHaveURL(/resume=/);
});

test('unavailable saved-plan status keeps User setup navigation usable and supports retry', async ({ page }) => {
  const options = {missingBookingPlanMigration:true};
  await mockBackend(page,options);
  await signIn(page); await enter(page,'/?page=user-setup');
  await expect(page.locator('[data-booking-plan-summary]')).toContainText('Saved plan status unavailable');
  await expect(page.getByRole('link',{name:'Resume saved booking plan',exact:true})).toBeHidden();
  await expect(page.getByRole('link',{name:'Explore discovery',exact:true})).toBeVisible();
  options.missingBookingPlanMigration = false;
  await page.getByRole('button',{name:'Refresh saved booking plan status',exact:true}).click();
  await expect(page.locator('[data-booking-plan-summary]')).toHaveText('No saved booking plan');
});


test('direct resume waits behind the age gate and then loads the verified owner plan', async ({ page }) => {
  const state = await mockBackend(page);
  state.bookingPlan = {owner_id:userId,plan:{sourceOffering:'',provider:'maya',activity:'',date:'',time:'',timeZone:'',duration:'',venue:'',expenses:'',notes:'Cold-start private plan'}};
  await signIn(page);
  await page.evaluate(()=>localStorage.removeItem('meetdiscreet.age-confirmed.v1'));
  const before = state.requests.filter(row => row.path === '/rest/v1/booking_plan_drafts').length;
  await page.goto('/?page=booking-draft&resume=1');
  await expect(page.locator('#app')).toBeHidden();
  await expect(page).toHaveURL(/resume=1/);
  expect(state.requests.filter(row => row.path === '/rest/v1/booking_plan_drafts')).toHaveLength(before);
  await page.getByRole('button',{name:'I am 18 or older'}).click();
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('Cold-start private plan');
  await expect(page).not.toHaveURL(/resume=/);
});


for (const scenario of ['success','reauthentication','revoke','denied-401','denied-403','denied-404']) {
  test(`other-session sign-out ${scenario} verifies password, uses only others scope and keeps current session`, async ({ page }) => {
    const state = await mockBackend(page,{failReauthentication:scenario==='reauthentication',failOtherSessionLogout:scenario==='revoke'||scenario.startsWith('denied-'),otherSessionFailureStatus:scenario.startsWith('denied-') ? Number(scenario.slice(-3)) : 500});
    await signIn(page); await enter(page,'/?page=account-security');
    const password = page.getByLabel('Current password to sign out other sessions',{exact:true});
    await password.fill('test-password-not-real');
    page.once('dialog',dialog=>dialog.accept());
    await page.getByRole('button',{name:'Sign out other sessions',exact:true}).click();
    const status = page.locator('#other-sessions-status');
    await expect(status).toContainText(scenario==='success' ? 'Other sessions can no longer renew' : scenario==='reauthentication' ? 'Unable to verify your current password' : 'Unable to sign out other sessions');
    await expect(password).toHaveValue('');
    await expect(password).toHaveAttribute('type','password');
    const logout = state.requests.filter(row=>row.path==='/auth/v1/logout');
    expect(logout).toHaveLength(scenario==='reauthentication' ? 0 : 1);
    if (logout.length) expect(logout[0].query).toBe('scope=others');
    await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Change password',exact:true})).toBeEnabled();
    if (scenario==='success') {
      await page.setViewportSize({width:390,height:844});
      await page.locator('.account-sessions').screenshot({path:'/tmp/account-other-sessions-mobile.png'});
    }
  });
}
test('cancelling other-session sign-out clears the password and makes no authentication or logout request', async ({ page }) => {
  const state = await mockBackend(page); await signIn(page); await enter(page,'/?page=account-security');
  await page.getByLabel('Current password to sign out other sessions',{exact:true}).fill('test-password-not-real');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Sign out other sessions',exact:true}).click();
  await expect(page.locator('#other-sessions-status')).toHaveText('No other sessions were changed.');
  await expect(page.getByLabel('Current password to sign out other sessions',{exact:true})).toHaveValue('');
  expect(state.requests.filter(row=>row.path==='/auth/v1/token')).toHaveLength(1);
  expect(state.requests.filter(row=>row.path==='/auth/v1/logout')).toHaveLength(0);
});


test('other-session revocation locks password changes during reauthentication and clears secret fields', async ({ page }) => {
  await mockBackend(page); await signIn(page); await enter(page,'/?page=account-security');
  await page.getByLabel('New password',{exact:true}).fill('unused-new-password');
  await page.getByLabel('Current password for email change',{exact:true}).fill('unused-email-password');
  await page.getByRole('button',{name:'Show new password',exact:true}).click();
  let release; const gate = new Promise(resolve=>{release=resolve;});
  let requested; const started = new Promise(resolve=>{requested=resolve;});
  await page.route('**/auth/v1/token*',async route=>{requested();await gate;await route.fallback();});
  await page.getByLabel('Current password to sign out other sessions',{exact:true}).fill('test-password-not-real');
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Sign out other sessions',exact:true}).click();
  await started;
  await expect(page.getByRole('button',{name:'Change password',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Request email change',exact:true})).toBeDisabled();
  await expect(page.getByLabel('Current password for email change',{exact:true})).toHaveValue('');
  await expect(page.getByLabel('Current password to sign out other sessions',{exact:true})).toHaveValue('');
  await expect(page.getByLabel('New password',{exact:true})).toHaveValue('');
  await expect(page.getByLabel('New password',{exact:true})).toHaveAttribute('type','password');
  release();
  await expect(page.locator('#other-sessions-status')).toContainText('Other sessions can no longer renew');
  await expect(page.getByRole('button',{name:'Change password',exact:true})).toBeEnabled();
});


for (const failure of [false,true]) {
  test(`current-session sign-out clears private drafts with server revocation ${failure ? 'unavailable' : 'confirmed'}`, async ({ page }) => {
    const state = await mockBackend(page,{failLocalLogout:failure});
    await signIn(page); await enter(page,'/?page=booking-draft');
    await page.getByLabel('Requests or notes (optional)',{exact:true}).fill('Private local plan to clear');
    await page.getByRole('button',{name:'Sign out',exact:true}).click();
    await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeHidden();
    await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('');
    await expect(page.locator('.session-notice')).toContainText(failure ? 'server could not confirm revocation' : 'Signed out of this session.');
    const logout = state.requests.filter(row=>row.path==='/auth/v1/logout');
    expect(logout).toHaveLength(1); expect(logout[0].query).toBe('scope=local');
    await page.reload();
    await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeHidden();
    await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('');
  });
}


test('local sign-out removes private content before a stalled revocation request finishes', async ({ page }) => {
  await mockBackend(page,{failLocalLogout:true}); await signIn(page); await enter(page,'/?page=booking-draft');
  await page.getByLabel('Requests or notes (optional)',{exact:true}).fill('Private pending plan');
  let release; const gate = new Promise(resolve=>{release=resolve;});
  let requested; const started = new Promise(resolve=>{requested=resolve;});
  await page.route('**/auth/v1/logout*',async route=>{requested();await gate;await route.fallback();});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await started;
  await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeHidden();
  await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('');
  release();
  await expect(page.locator('.session-notice')).toContainText('server could not confirm revocation');
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.locator('.session-notice').screenshot({path:'/tmp/local-signout-notice-mobile.png'});
});


for (const mode of ['pending','immediate','reauthentication','update']) {
  test(`email change ${mode} verifies the password and preserves provider confirmation state`, async ({ page }) => {
    const state = await mockBackend(page,{failReauthentication:mode==='reauthentication',failEmailChange:mode==='update',immediateEmailChange:mode==='immediate'});
    await signIn(page); await enter(page,'/?page=account-security');
    await page.getByLabel('New email address',{exact:true}).fill('new-address@example.invalid');
    await page.getByLabel('Confirm new email address',{exact:true}).fill('new-address@example.invalid');
    const password = page.getByLabel('Current password for email change',{exact:true});
    await password.fill('test-password-not-real');
    page.once('dialog',dialog=>dialog.accept());
    await page.getByRole('button',{name:'Request email change',exact:true}).click();
    const text = mode==='pending' ? 'Email change awaiting confirmation' : mode==='immediate' ? 'Your account email was updated' : mode==='reauthentication' ? 'Unable to verify your current password' : 'Unable to request the email change';
    await expect(page.locator('#email-change-status')).toContainText(text);
    await expect(password).toHaveValue('');
    await expect(password).toHaveAttribute('type','password');
    const updates = state.requests.filter(row=>row.path==='/auth/v1/user' && row.method==='PUT' && row.body?.email);
    expect(updates).toHaveLength(mode==='reauthentication' ? 0 : 1);
    if (updates.length) {
      expect(updates[0].body.email).toBe('new-address@example.invalid');
      expect(new URLSearchParams(updates[0].query).get('redirect_to')).toBe('http://127.0.0.1:5175/?page=auth-callback');
      expect(updates[0].body.data).toBeUndefined();
    }
    expect(state.roles).toEqual(['user']);
    if (mode==='pending') {
      await expect(page.locator('.email-current')).toContainText('test@example.invalid');
      await expect(page.locator('.account-email')).toContainText('Pending email: new-address@example.invalid');
      await page.setViewportSize({width:390,height:844});
      await page.locator('.account-email').screenshot({path:'/tmp/account-email-change-mobile.png'});
      await page.reload();
      await expect(page.locator('.account-email')).toContainText('Pending email: new-address@example.invalid');
      await expect(page.locator('.email-current')).toContainText('test@example.invalid');
    }
    if (mode==='immediate') {
      await expect(page.locator('.email-current')).toContainText('new-address@example.invalid');
      await page.getByLabel('Current password',{exact:true}).fill('test-password-not-real');
      await page.getByLabel('New password',{exact:true}).fill('new-test-password');
      await page.getByLabel('Confirm new password',{exact:true}).fill('new-test-password');
      await page.getByRole('button',{name:'Change password',exact:true}).click();
      await expect(page.locator('#account-security-status')).toContainText('Your password was changed');
      expect(state.requests.filter(row=>row.path==='/auth/v1/token').at(-1).body.email).toBe('new-address@example.invalid');
    }
  });
}
test('email change validates matching addresses and cancellation clears the password without sending', async ({ page }) => {
  const state = await mockBackend(page); await signIn(page); await enter(page,'/?page=account-security');
  const button = page.getByRole('button',{name:'Request email change',exact:true});
  await page.getByLabel('New email address',{exact:true}).fill('new-address@example.invalid');
  await page.getByLabel('Confirm new email address',{exact:true}).fill('other-address@example.invalid');
  await page.getByLabel('Current password for email change',{exact:true}).fill('test-password-not-real');
  await button.click();
  await expect(page.locator('#email-change-status')).toContainText('must match');
  await page.getByLabel('Confirm new email address',{exact:true}).fill('new-address@example.invalid');
  page.once('dialog',dialog=>dialog.dismiss());
  await button.click();
  await expect(page.locator('#email-change-status')).toHaveText('No email change was requested.');
  await expect(page.getByLabel('Current password for email change',{exact:true})).toHaveValue('');
  expect(state.requests.filter(row=>row.path==='/auth/v1/token')).toHaveLength(1);
  expect(state.requests.filter(row=>row.path==='/auth/v1/user' && row.method==='PUT')).toHaveLength(0);
});


function backupProfile() { return {owner_id:userId,username:'private-owner',adult_age:29,display_name:'Private backup name',tagline:'',city:'Vancouver',area:'',photo_index:2,biography:'Private saved introduction',interests:'Coffee',extra_secret:'DO NOT INCLUDE THIS EXTRA FIELD'}; }
test('selected saved draft download contains projected owner records and no authentication or unselected data',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const state=await mockBackend(page);state.profile=backupProfile();state.bookingPlan={owner_id:userId,plan:{notes:'Private saved plan'}};
  await signIn(page);await enter(page,'/?page=draft-backup');
  await page.getByLabel('Provider profile draft',{exact:true}).check();await page.getByLabel('Unsent booking plan',{exact:true}).check();
  const ready=page.waitForEvent('download');await page.getByRole('button',{name:'Download selected saved drafts',exact:true}).click();const download=await ready;
  expect(download.suggestedFilename()).toBe('meetdiscreet-saved-drafts.json');
  const text=await readFile(await download.path(),'utf8');const copy=JSON.parse(text);
  expect(copy.format).toBe('meetdiscreet-saved-drafts');expect(copy.version).toBe(1);expect(Object.keys(copy.drafts)).toEqual(['provider-profile','booking-plan']);
  expect(copy.drafts['provider-profile'][0].display_name).toBe('Private backup name');expect(copy.drafts['booking-plan'][0].plan.notes).toBe('Private saved plan');
  expect(text).not.toContain(userId);expect(text).not.toContain('DO NOT INCLUDE');expect(text).not.toContain('mock_refresh_token');expect(text).not.toContain('access_token');
  expect(state.requests.filter(row=>row.path.startsWith('/rest/v1/')).every(row=>row.method==='GET')).toBe(true);
  await expect(page.locator('.backup-status')).toContainText('2 saved records');
  await expect(page.locator('.backup-status')).toBeFocused();
  expect(await page.locator('.skip-link').evaluate(link=>link.getBoundingClientRect().bottom<=0)).toBe(true);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'/tmp/draft-backup-mobile.png',fullPage:true});
});
test('a missing selected draft table prevents a partial file and supports retry',async({page})=>{
  const options={missingCatalogueMigration:true};const state=await mockBackend(page,options);state.profile=backupProfile();
  const downloads=[];page.on('download',value=>downloads.push(value));await signIn(page);await enter(page,'/?page=draft-backup');
  await page.getByLabel('Provider profile draft',{exact:true}).check();await page.getByLabel('Experience catalogue',{exact:true}).check();
  await page.getByRole('button',{name:'Download selected saved drafts',exact:true}).click();
  await expect(page.locator('.backup-status')).toContainText('No new file was prepared');expect(downloads).toHaveLength(0);
  await expect(page.locator('.draft-backup')).not.toContainText('Private saved introduction');
  options.missingCatalogueMigration=false;
  const ready=page.waitForEvent('download');await page.getByRole('button',{name:'Download selected saved drafts',exact:true}).click();await ready;
  await expect(page.locator('.backup-status')).toContainText('1 saved record');
});
test('listing download refuses incomplete counts and exports complete owner listing rows on retry',async({page})=>{
  const options={backupListingCount:2};const state=await mockBackend(page,options);
  state.listings=[{owner_id:userId,id:listingId,kind:'looking',title:'Private plan',description:'An unpriced saved plan',city:'Vancouver',area:'',activity:'Coffee'}];
  const downloads=[];page.on('download',value=>downloads.push(value));await signIn(page);await enter(page,'/?page=draft-backup');
  await page.getByLabel('Listing drafts',{exact:true}).check();await page.getByRole('button',{name:'Download selected saved drafts',exact:true}).click();
  await expect(page.locator('.backup-status')).toContainText('Not all saved listings were returned');expect(downloads).toHaveLength(0);
  options.backupListingCount=1;
  const ready=page.waitForEvent('download');await page.getByRole('button',{name:'Download selected saved drafts',exact:true}).click();const download=await ready;
  const copy=JSON.parse(await readFile(await download.path(),'utf8'));expect(copy.drafts.listings).toHaveLength(1);expect(copy.drafts.listings[0].id).toBe(listingId);expect(copy.drafts.listings[0].owner_id).toBeUndefined();
});
test('sign-out during a saved draft read prevents a late private download',async({page})=>{
  const state=await mockBackend(page);state.profile=backupProfile();await signIn(page);await enter(page,'/?page=draft-backup');
  await page.getByLabel('Provider profile draft',{exact:true}).check();
  const downloads=[];page.on('download',value=>downloads.push(value));
  let release;const gate=new Promise(resolve=>{release=resolve;});let requested;const started=new Promise(resolve=>{requested=resolve;});
  await page.route('**/rest/v1/profile_drafts*',async route=>{requested();await gate;await route.fallback();});
  await page.getByRole('button',{name:'Download selected saved drafts',exact:true}).click();await started;
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.locator('.backup-status')).toHaveText('Sign in to download your saved drafts.');
  release();await page.waitForLoadState('networkidle');expect(downloads).toHaveLength(0);
});

test('draft download reads no saved tables until an explicit nonempty selection',async({page})=>{
  const state=await mockBackend(page);await signIn(page);await enter(page,'/?page=draft-backup');
  await expect(page.getByRole('button',{name:'Download selected saved drafts',exact:true})).toBeVisible();
  expect(state.requests.filter(row=>row.path.startsWith('/rest/v1/'))).toHaveLength(0);
  await page.getByRole('button',{name:'Download selected saved drafts',exact:true}).click();
  await expect(page.locator('.backup-status')).toHaveText('Choose at least one draft type.');
  expect(state.requests.filter(row=>row.path.startsWith('/rest/v1/'))).toHaveLength(0);
});


test('authorized Admin approves the exact submitted version, retains User and refreshes the queue',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','admin'];state.capabilities=['provider_application_review','provider_application_approval','provider_application_feedback'];state.reviewApplications=reviewRows(1);state.reviewApplications[0].submission_id='66666666-6666-4666-8666-000000000001';
  await signIn(page);await enter(page,'/?page=provider-review');await page.getByRole('button',{name:'Inspect Applicant 01',exact:true}).click();
  const approve=page.getByRole('button',{name:'Approve Provider access',exact:true});await expect(approve).toBeVisible();
  await page.setViewportSize({width:390,height:844});await page.locator('.review-approval').screenshot({path:'/tmp/provider-pilot-approval-mobile.png'});
  state.reviewApplications[0].submission_id='66666666-6666-4666-8666-000000000002';page.once('dialog',dialog=>dialog.accept());await approve.click();
  await expect(page.locator('.review-approval [role=status]')).toContainText('Unable to confirm approval');expect(state.targetRoles).toEqual(['user']);expect(state.applicationApprovals).toHaveLength(0);
  await page.getByRole('button',{name:'Refresh review queue',exact:true}).click();await page.getByRole('button',{name:'Inspect Applicant 01',exact:true}).click();
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Approve Provider access',exact:true}).click();expect(state.applicationApprovals).toHaveLength(0);
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Approve Provider access',exact:true}).click();
  await expect(page.locator('.review-card')).toHaveCount(0);await expect(page.locator('.review-status')).toContainText('approval recorded');expect(state.targetRoles).toEqual(['user','provider']);expect(state.applicationApprovals).toHaveLength(1);expect(state.applicationApprovals[0].submission_id).toBe('66666666-6666-4666-8666-000000000002');
});
for(const [label,roles,capabilities,missing] of [
  ['Moderator with approval capability',['user','moderator'],['provider_application_review','provider_application_approval'],false],
  ['Admin without approval capability',['user','admin'],['provider_application_review'],false],
  ['Admin with missing approval migration',['user','admin'],['provider_application_review','provider_application_approval'],true],
]) {
  test(`${label} retains permitted inspection without an approval action`,async({page})=>{
    const state=await mockBackend(page,{missingApprovalMigration:missing});state.roles=roles;state.capabilities=capabilities;state.reviewApplications=reviewRows(1);state.reviewApplications[0].submission_id='66666666-6666-4666-8666-000000000001';state.user.user_metadata={role:'admin',approval:true};
    await signIn(page);await enter(page,'/?page=provider-review');await page.getByRole('button',{name:'Inspect Applicant 01',exact:true}).click();
    await expect(page.locator('.review-introduction')).toBeVisible();await expect(page.getByRole('button',{name:'Approve Provider access',exact:true})).toHaveCount(0);
    await expect(page.locator('.staff-approval-history')).toBeHidden();
    expect(state.requests.filter(row=>row.path.endsWith('/approve_provider_application'))).toHaveLength(0);
  });
}
test('revoked Admin approval scope cannot turn an open inspection into a grant',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','admin'];state.capabilities=['provider_application_review','provider_application_approval'];state.reviewApplications=reviewRows(1);state.reviewApplications[0].submission_id='66666666-6666-4666-8666-000000000001';
  await signIn(page);await enter(page,'/?page=provider-review');await page.getByRole('button',{name:'Inspect Applicant 01',exact:true}).click();
  await expect(page.getByRole('button',{name:'Approve Provider access',exact:true})).toBeVisible();state.capabilities=['provider_application_review'];
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Approve Provider access',exact:true}).click();
  await expect(page.locator('.review-approval [role=status]')).toContainText('Unable to confirm approval');expect(state.targetRoles).toEqual(['user']);expect(state.applicationApprovals).toHaveLength(0);
});
test('approved applicant sees immutable history and both roles while current role revocation remains distinct',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','provider'];const submission='66666666-6666-4666-8666-000000000001';
  state.providerApplication={owner_id:userId,display_name:'Approved applicant',city:'Vancouver',introduction:'Approved version',state:'approved',submission_id:submission};
  state.applicationSubmissions=[{id:submission,owner_id:userId,display_name:'Approved applicant',city:'Vancouver',introduction:'Approved version',submitted_at:'2026-11-10T17:00:00Z'}];
  state.applicationApprovals=[{owner_id:userId,submission_id:submission,reviewer_id:'44444444-4444-4444-8444-000000000001',approved_at:'2026-11-10T18:00:00Z'}];
  state.applicationActivity=[{event_id:1,owner_id:userId,state:'approved',occurred_at:'2026-11-10T18:00:00Z'}];
  await signIn(page);await enter(page,'/?page=provider-application');await expect(page.locator('.application-state')).toContainText('approved');
  await expect(page.getByLabel('Provider display name',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Save application draft',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Withdraw application',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Load submission history',exact:true}).click();await page.locator('.application-history summary').click();await expect(page.locator('.application-history')).toContainText('Pilot access approval');
  await page.getByRole('button',{name:'Load application activity',exact:true}).click();await expect(page.locator('.application-activity')).toContainText('Pilot Provider application approved');
  await page.locator('[data-account-link]').click();await expect(page.locator('[data-account-permissions]')).toContainText('Assigned roles: User, Provider.');await expect(page.getByRole('link',{name:'Explore user setup',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'View approved application',exact:true})).toBeVisible();
  state.roles=['user'];await page.getByRole('button',{name:'Refresh account permissions',exact:true}).click();await expect(page.locator('[data-account-permissions]')).toContainText('Provider role: Not assigned');await expect(page.locator('[data-application-status]')).toContainText('Application approved');
});


function ownApprovalRows(count,reviewer=userId) {
  return Array.from({length:count},(_,index)=>({approval_id:`88888888-8888-4888-8888-${String(index+1).padStart(12,'0')}`,reviewer_id:reviewer,owner_id:`77777777-7777-4777-8777-${String(index+1).padStart(12,'0')}`,submission_id:`66666666-6666-4666-8666-${String(index+1).padStart(12,'0')}`,approved_at:'2026-11-10T18:00:00Z',submitted_at:'2026-11-10T17:00:00Z',display_name:index===0?'<img src=x onerror=alert(1)> History applicant':`History applicant ${index+1}`,city:'Vancouver',introduction:'PRIVATE INTRODUCTION MUST NOT APPEAR IN HISTORY'}));
}
test.describe('own Administrator decision history',()=>{
  test.use({timezoneId:'America/Vancouver'});
test('Admin own approval history is explicit, paginated, escaped and excludes another reviewer decisions',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','admin'];state.capabilities=['provider_application_review','provider_application_approval'];state.applicationApprovals=[...ownApprovalRows(24),{...ownApprovalRows(1,'33333333-3333-4333-8333-333333333333')[0],approval_id:'99999999-9999-4999-8999-999999999999',owner_id:'99999999-9999-4999-8999-000000000001',submission_id:'55555555-5555-4555-8555-000000000001',display_name:'Other reviewer decision'}];
  await signIn(page);await enter(page,'/?page=provider-review');await expect(page.getByRole('button',{name:'Load my approval decisions',exact:true})).toBeVisible();
  expect(state.requests.filter(row=>row.path.endsWith('/list_my_provider_approvals'))).toHaveLength(0);
  await page.getByRole('button',{name:'Load my approval decisions',exact:true}).click();await expect(page.locator('.staff-approval-card')).toHaveCount(20);
  await expect(page.locator('.staff-approval-history')).not.toContainText('Other reviewer decision');await expect(page.locator('.staff-approval-history')).not.toContainText('PRIVATE INTRODUCTION');
  await page.getByRole('button',{name:'Older approvals',exact:true}).click();await expect(page.locator('.staff-approval-card')).toHaveCount(4);
  await expect(page.locator('.staff-approval-history')).toContainText('<img src=x onerror=alert(1)>');await expect(page.locator('.staff-approval-history img')).toHaveCount(0);
  await page.setViewportSize({width:390,height:844});await page.locator('.staff-approval-history').screenshot({path:'/tmp/staff-own-approval-history-mobile.png'});
  await page.getByRole('button',{name:'Newer approvals',exact:true}).click();await expect(page.locator('.staff-approval-card')).toHaveCount(20);
  expect(state.reviewAccessEvents.filter(row=>row.action==='approval_history_list')).toHaveLength(3);expect(state.targetRoles).toEqual(['user']);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.locator('.staff-approval-card')).toHaveCount(0);
});
test('revoked history scope clears displayed decisions and queue refresh removes the history control',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','admin'];state.capabilities=['provider_application_review','provider_application_approval'];state.applicationApprovals=ownApprovalRows(1);
  await signIn(page);await enter(page,'/?page=provider-review');await page.getByRole('button',{name:'Load my approval decisions',exact:true}).click();await expect(page.locator('.staff-approval-card')).toHaveCount(1);
  state.capabilities=['provider_application_review'];await page.getByRole('button',{name:'Refresh my approval decisions',exact:true}).click();await expect(page.locator('.staff-history-status')).toContainText('unavailable');await expect(page.locator('.staff-approval-card')).toHaveCount(0);
  await page.getByRole('button',{name:'Refresh review queue',exact:true}).click();await expect(page.locator('.staff-approval-history')).toBeHidden();
});
test('missing approval history setup keeps inspection and authorized approval available without fabricated history',async({page})=>{
  const state=await mockBackend(page,{missingApprovalHistoryMigration:true});state.roles=['user','admin'];state.capabilities=['provider_application_review','provider_application_approval'];state.reviewApplications=reviewRows(1);state.reviewApplications[0].submission_id='66666666-6666-4666-8666-000000000001';
  await signIn(page);await enter(page,'/?page=provider-review');await page.getByRole('button',{name:'Load my approval decisions',exact:true}).click();await expect(page.locator('.staff-history-status')).toContainText('unavailable');await expect(page.locator('.staff-approval-card')).toHaveCount(0);
  await page.getByRole('button',{name:'Inspect Applicant 01',exact:true}).click();await expect(page.getByRole('button',{name:'Approve Provider access',exact:true})).toBeVisible();
});

});


test('review search matches name/city across keyset pages, refreshes the same query and clears to the normal queue',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','moderator'];state.capabilities=['provider_application_review'];state.reviewApplications=reviewRows(26).map((row,index)=>({...row,city:index<24?'North Vancouver':'Toronto'}));
  await signIn(page);await enter(page,'/?page=provider-review');const search=page.getByLabel('Search pending applications',{exact:true});
  await search.fill('north VANCOUVER');await page.getByRole('button',{name:'Search queue',exact:true}).click();await expect(page.locator('.review-card')).toHaveCount(20);await expect(page.locator('.review-status')).toContainText('Search active');
  await page.getByRole('button',{name:'Next applications',exact:true}).click();await expect(page.locator('.review-card')).toHaveCount(4);
  await page.getByRole('button',{name:'Previous applications',exact:true}).click();await expect(page.locator('.review-card')).toHaveCount(20);
  await page.getByRole('button',{name:'Refresh review queue',exact:true}).click();await expect(page.locator('.review-card')).toHaveCount(20);
  expect(state.requests.filter(row=>row.path.endsWith('/search_provider_applications_for_review')).every(row=>row.body.p_query==='north VANCOUVER')).toBe(true);
  await page.setViewportSize({width:390,height:844});await page.locator('.review-search').screenshot({path:'/tmp/provider-review-search-mobile.png'});
  await page.getByRole('button',{name:'Clear queue search',exact:true}).click();await expect(search).toHaveValue('');await expect(page.locator('.review-status')).not.toContainText('Search active');await expect(page.locator('.review-card')).toHaveCount(20);
});
test('literal search, no matches and missing search setup remain distinct and can return to the normal queue',async({page})=>{
  const options={missingReviewSearchMigration:false};const state=await mockBackend(page,options);state.roles=['user','moderator'];state.capabilities=['provider_application_review'];state.reviewApplications=reviewRows(1);state.reviewApplications[0].display_name='Literal %_ Applicant';
  await signIn(page);await enter(page,'/?page=provider-review');const input=page.getByLabel('Search pending applications',{exact:true});const button=page.getByRole('button',{name:'Search queue',exact:true});
  await input.fill('%_');await button.click();await expect(page.locator('.review-card')).toHaveCount(1);
  await input.fill('missing applicant');await button.click();await expect(page.locator('.review-status')).toContainText('No submitted applications match');await expect(page.locator('.review-card')).toHaveCount(0);
  options.missingReviewSearchMigration=true;await input.fill('Literal');await button.click();await expect(page.locator('.review-status')).toContainText('Unable to load matching');await expect(page.locator('.review-card')).toHaveCount(0);
  await page.getByRole('button',{name:'Clear queue search',exact:true}).click();await expect(page.locator('.review-card')).toHaveCount(1);
});
test('a slower earlier queue search cannot overwrite a newer query result',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','moderator'];state.capabilities=['provider_application_review'];state.reviewApplications=reviewRows(2).map((row,index)=>({...row,city:index===0?'Slow City':'Fast City'}));
  await signIn(page);await enter(page,'/?page=provider-review');await expect(page.locator('.review-card')).toHaveCount(2);
  let release;const gate=new Promise(resolve=>{release=resolve;});let requested;const started=new Promise(resolve=>{requested=resolve;});
  await page.route('**/rest/v1/rpc/search_provider_applications_for_review',async route=>{if(route.request().postDataJSON().p_query==='Slow City'){requested();await gate;}await route.fallback();});
  const input=page.getByLabel('Search pending applications',{exact:true});const button=page.getByRole('button',{name:'Search queue',exact:true});
  await input.fill('Slow City');await button.click();await started;await input.fill('Fast City');await button.click();await expect(page.locator('.review-card')).toHaveCount(1);await expect(page.locator('.review-card')).toContainText('Fast City');
  release();await page.waitForLoadState('networkidle');await expect(page.locator('.review-card')).toHaveCount(1);await expect(page.locator('.review-card')).toContainText('Fast City');
});


test('unsent staff feedback is preserved when queue actions are cancelled and cleared on confirmed discard or sign-out', async ({page}) => {
  const state = await mockBackend(page); state.roles=['user','moderator'];
  state.capabilities=['provider_application_review','provider_application_feedback'];
  state.reviewApplications=reviewRows(23);
  for (const row of state.reviewApplications) row.submission_id='66666666-6666-4666-8666-000000000001';
  await signIn(page); await enter(page,'/?page=provider-review');
  await page.getByRole('button',{name:'Inspect Applicant 01',exact:true}).click();
  const note=page.getByLabel('Changes the applicant should make',{exact:true});
  await note.fill('Keep this unsent note.');
  expect(await page.evaluate(() => { const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented; })).toBe(true);
  await page.getByLabel('Search pending applications',{exact:true}).fill('Applicant 02');
  const requests=state.requests.length;
  for (const name of ['Close application details','Refresh review queue','Next applications','Search queue','Clear queue search','Inspect Applicant 02']) {
    page.once('dialog',dialog=>dialog.dismiss());
    await page.getByRole('button',{name,exact:true}).click();
    await expect(note).toHaveValue('Keep this unsent note.');
  }
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('link',{name:'Back to account',exact:false}).click();
  await expect(note).toHaveValue('Keep this unsent note.');
  expect(state.requests.length).toBe(requests);
  expect(state.applicationFeedback).toHaveLength(0);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Search queue',exact:true}).click();
  await expect(page.locator('.review-card')).toHaveCount(1);
  await expect(note).toHaveCount(0);
  await page.getByRole('button',{name:'Inspect Applicant 02',exact:true}).click();
  await expect(note).toHaveValue('');
  expect(await page.evaluate(() => { const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented; })).toBe(false);
  await note.fill('Clear on sign-out without a discard prompt.');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(note).toHaveCount(0);
  expect(state.applicationFeedback).toHaveLength(0);
});


test('provider setup follows application state with independent saved status refresh and no inferred Provider role', async ({page}) => {
  const state=await mockBackend(page);
  await signIn(page);await enter(page,'/?page=provider-setup');
  const status=page.locator('.provider-application-summary [data-application-status]');
  await expect(status).toHaveText('No provider application saved yet.');
  await expect(page.getByRole('link',{name:'Start provider application',exact:true})).toBeVisible();
  for (const [value,label,message] of [
    ['draft','Continue application draft','Private application draft saved.'],
    ['submitted','View submitted application','Application submitted for review.'],
    ['changes_requested','Review requested changes','Changes requested.'],
    ['withdrawn','Revise application','Application withdrawn.'],
    ['approved','View approved application','Application approved for the development pilot.'],
  ]) {
    state.providerApplication={owner_id:userId,state:value,introduction:'SECRET APPLICATION INTRODUCTION'};
    await page.getByRole('button',{name:'Refresh application status',exact:true}).click();
    await expect(status).toContainText(message);
    await expect(page.getByRole('link',{name:label,exact:true})).toHaveAttribute('href','?page=provider-application');
  }
  await expect(page.locator('[data-account-permissions]')).toContainText('Provider role: Not assigned');
  await expect(page.locator('.provider-setup')).not.toContainText('SECRET APPLICATION INTRODUCTION');
  const profile=page.locator('.account-tool-card').filter({has:page.getByRole('heading',{name:'1. Introduce yourself',exact:true})});
  await expect(profile.locator('[role=status]')).toHaveText('No saved profile draft');
  state.profile={owner_id:userId,display_name:'SECRET PROFILE NAME'};
  await profile.getByRole('button',{name:'Refresh profile saved status',exact:true}).click();
  await expect(profile.locator('[role=status]')).toHaveText('Private profile draft saved');
  await expect(page.locator('.provider-setup')).not.toContainText('SECRET PROFILE NAME');
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.provider-application-summary').screenshot({path:'/tmp/provider-setup-application-mobile.png'});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(status).toHaveCount(0);
  await expect(page.locator('.provider-setup .account-tool-card')).toHaveCount(0);
});

test('provider setup missing application schema is unavailable while draft tools remain usable and retry recovers', async ({page}) => {
  const options={missingApplicationMigration:true};const state=await mockBackend(page,options);
  await signIn(page);await enter(page,'/?page=provider-setup');
  const status=page.locator('.provider-application-summary [data-application-status]');
  await expect(status).toContainText('Application status unavailable');
  await expect(page.getByRole('link',{name:'Prepare provider application',exact:true})).toBeVisible();
  await expect(page.locator('.account-tool-card')).toHaveCount(4);
  await expect(page.getByRole('button',{name:'Refresh profile saved status',exact:true})).toBeEnabled();
  options.missingApplicationMigration=false;
  state.providerApplication={owner_id:userId,state:'changes_requested'};
  await page.getByRole('button',{name:'Refresh application status',exact:true}).click();
  await expect(status).toContainText('Changes requested');
  await page.getByRole('link',{name:'Review requested changes',exact:true}).click();
  await expect(page.locator('.application-state')).toContainText('changes requested');
});


test('User setup refreshes owner profile and Looking For counts without loading draft content or counting Offerings',async({page})=>{
  const state=await mockBackend(page);
  state.listings=[{id:'looking-one',owner_id:userId,kind:'looking',description:'PRIVATE LISTING TEXT'},{id:'offering-one',owner_id:userId,kind:'offering'}];
  await signIn(page);await enter(page,'/?page=user-setup');
  const profile=page.locator('[data-draft-summary=user-profile]');
  const looking=page.locator('[data-draft-summary=looking-listings]');
  await expect(profile).toHaveText('No saved User profile draft');
  await expect(looking).toHaveText('1 saved private Looking For draft');
  state.userProfile={owner_id:userId,display_name:'PRIVATE USER NAME'};
  state.listings.push({id:'looking-two',owner_id:userId,kind:'looking'});
  await page.getByRole('button',{name:'Refresh User profile saved status',exact:true}).click();
  await page.getByRole('button',{name:'Refresh Looking For saved status',exact:true}).click();
  await expect(profile).toHaveText('Private User profile draft saved');
  await expect(looking).toHaveText('2 saved private Looking For drafts');
  const countRequest=state.requests.find(r=>r.path==='/rest/v1/listing_drafts' && r.method==='HEAD');
  const query=new URLSearchParams(countRequest.query);
  expect(query.get('owner_id')).toBe(`eq.${userId}`);expect(query.get('kind')).toBe('eq.looking');expect(query.get('select')).toBe('id');
  expect(state.requests.filter(r=>r.path==='/rest/v1/user_profile_drafts').every(r=>new URLSearchParams(r.query).get('select')==='owner_id')).toBe(true);
  await expect(page.locator('.user-setup')).not.toContainText('PRIVATE USER NAME');
  await expect(page.locator('.user-setup')).not.toContainText('PRIVATE LISTING TEXT');
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await looking.locator('..').screenshot({path:'/tmp/user-setup-looking-status-mobile.png'});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(profile).toHaveCount(0);await expect(looking).toHaveCount(0);
});

test('User setup distinguishes unavailable draft summaries from empty records and retries independently',async({page})=>{
  const options={missingUserProfileMigration:true,failListingSummary:true};
  const state=await mockBackend(page,options);
  await signIn(page);await enter(page,'/?page=user-setup');
  const profile=page.locator('[data-draft-summary=user-profile]');const looking=page.locator('[data-draft-summary=looking-listings]');
  await expect(profile).toContainText('Saved status unavailable');await expect(looking).toContainText('Saved status unavailable');
  await expect(page.locator('[data-booking-plan-summary]')).toHaveText('No saved booking plan');
  await expect(page.getByRole('link',{name:'Open my listing drafts',exact:true})).toBeVisible();
  options.missingUserProfileMigration=false;
  await page.getByRole('button',{name:'Refresh User profile saved status',exact:true}).click();
  await expect(profile).toHaveText('No saved User profile draft');await expect(looking).toContainText('Saved status unavailable');
  options.failListingSummary=false;options.invalidListingSummaryCount=true;
  await page.getByRole('button',{name:'Refresh Looking For saved status',exact:true}).click();
  await expect(looking).toContainText('Saved status unavailable');
  options.invalidListingSummaryCount=false;state.listings=[];
  await page.getByRole('button',{name:'Refresh Looking For saved status',exact:true}).click();
  await expect(looking).toHaveText('0 saved private Looking For drafts');
});


test('listing library pages complete metadata, resets pages for filters/sort/refresh and keeps selected filters', async ({page})=>{
  const state=await mockBackend(page);
  state.listings=Array.from({length:25},(_,index)=>({id:`dddddddd-dddd-4ddd-8ddd-${String(index+1).padStart(12,'0')}`,owner_id:userId,kind:index%2?'offering':'looking',title:`Draft ${String(index+1).padStart(2,'0')}`,city:'Vancouver',area:'',activity:'Coffee',description:'SECRET FULL LISTING CONTENT',updated_at:new Date(Date.UTC(2026,10,10,18,60-index)).toISOString()}));
  await signIn(page);await enter(page,'/?page=my-listings');
  const cards=page.locator('.library-card');const status=page.locator('.listing-library > [role=status]');
  await expect(cards).toHaveCount(12);await expect(status).toContainText('Showing 1–12');
  await page.getByRole('button',{name:'Next draft page',exact:true}).click();
  await expect(cards.first()).toContainText('Draft 13');await expect(status).toBeFocused();
  await page.getByRole('button',{name:'Next draft page',exact:true}).click();
  await expect(cards).toHaveCount(1);await expect(cards.first()).toContainText('Draft 25');
  await expect(page.getByRole('button',{name:'Next draft page',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Previous draft page',exact:true}).click();await expect(cards.first()).toContainText('Draft 13');
  await page.getByLabel('Sort drafts',{exact:true}).selectOption('oldest');await expect(cards.first()).toContainText('Draft 25');
  await page.getByLabel('Search saved drafts',{exact:true}).fill('Draft 0');await expect(cards).toHaveCount(9);
  await expect(page.getByRole('button',{name:'Next draft page',exact:true})).toBeHidden();
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(cards.first()).toContainText('Draft 01');
  await page.getByLabel('Listing type',{exact:true}).selectOption('looking');await expect(cards).toHaveCount(12);
  await page.getByRole('button',{name:'Next draft page',exact:true}).click();await expect(cards).toHaveCount(1);
  await page.getByRole('button',{name:'Refresh drafts',exact:true}).click();await expect(cards).toHaveCount(12);
  await expect(page.getByLabel('Listing type',{exact:true})).toHaveValue('looking');await expect(status).toContainText('13 of 25 saved drafts');
  const request=state.requests.find(r=>r.path==='/rest/v1/listing_drafts'&&r.method==='GET');const query=new URLSearchParams(request.query);
  expect(query.get('select')).toBe('id,owner_id,kind,title,city,area,activity,updated_at');expect(query.get('owner_id')).toBe(`eq.${userId}`);expect(query.get('limit')).toBe('1000');
  await expect(page.locator('.listing-library')).not.toContainText('SECRET FULL LISTING CONTENT');
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.listing-library > .editor-actions').last().screenshot({path:'/tmp/listing-library-pagination-mobile.png'});
});

test('listing library refuses incomplete or other-owner metadata instead of presenting partial search results',async({page})=>{
  const options={backupListingCount:2};const state=await mockBackend(page,options);
  state.listings=[{id:listingId,owner_id:userId,kind:'looking',title:'Private test plan',city:'Vancouver',area:'',activity:'Coffee'}];
  await signIn(page);await enter(page,'/?page=my-listings');
  const cards=page.locator('.library-card');const status=page.locator('.listing-library > [role=status]');
  await expect(status).toContainText('Unable to load saved drafts completely');await expect(cards).toHaveCount(0);
  options.backupListingCount=1;await page.getByRole('button',{name:'Refresh drafts',exact:true}).click();await expect(cards).toHaveCount(1);
  state.listings[0].owner_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  await page.getByRole('button',{name:'Refresh drafts',exact:true}).click();await expect(status).toContainText('Unable to load saved drafts completely');await expect(cards).toHaveCount(0);
  state.listings[0].owner_id=userId;options.backupListingCount=1001;
  await page.getByRole('button',{name:'Refresh drafts',exact:true}).click();await expect(status).toContainText('up to 1,000 drafts');await expect(cards).toHaveCount(0);
  options.backupListingCount=1;await page.getByRole('button',{name:'Refresh drafts',exact:true}).click();await expect(cards).toHaveCount(1);
});

test('Provider saved public preview loads explicitly, projects public fields and refreshes only saved values',async({page})=>{
  const state=await mockBackend(page);
  state.profile={owner_id:userId,display_name:'<img src=x onerror=alert(1)> Saved name',username:'saved-user',adult_age:28,tagline:'Saved introduction',city:'Vancouver',area:'Kitsilano',photo_index:2,biography:'PRIVATE MEMBER BIOGRAPHY',interests:'PRIVATE MEMBER INTERESTS'};
  await signIn(page);await enter(page,'/?page=provider-setup');
  const panel=page.locator('.saved-public-profile-preview');
  await expect(panel.getByRole('button',{name:'Review saved public profile',exact:true})).toBeVisible();
  expect(state.requests.some(r=>r.path==='/rest/v1/profile_drafts'&&new URLSearchParams(r.query).get('select')?.includes('adult_age'))).toBe(false);
  await panel.getByRole('button',{name:'Review saved public profile',exact:true}).click();
  await expect(panel.locator('[role=status]')).toContainText('Saved public fields loaded');
  await expect(panel).toContainText('<img src=x onerror=alert(1)> Saved name');
  await expect(panel).toContainText('@saved-user');await expect(panel).toContainText('Age 28');
  await expect(panel.locator('img')).toHaveCount(0);await expect(panel).not.toContainText('PRIVATE MEMBER');
  const request=state.requests.find(r=>r.path==='/rest/v1/profile_drafts'&&new URLSearchParams(r.query).get('select')?.includes('adult_age'));
  const query=new URLSearchParams(request.query);expect(query.get('select')).toBe('owner_id,display_name,username,adult_age,tagline,city,area,photo_index,updated_at');expect(query.get('owner_id')).toBe(`eq.${userId}`);
  state.profile.display_name='Updated saved name';await expect(panel).not.toContainText('Updated saved name');
  await panel.getByRole('button',{name:'Refresh saved public profile',exact:true}).click();await expect(panel).toContainText('Updated saved name');
  await expect(panel.locator('[role=status]')).toBeFocused();
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await panel.screenshot({path:'/tmp/saved-public-profile-mobile.png'});
  expect(state.requests.filter(r=>r.method==='POST'&&r.path.startsWith('/rest/'))).toHaveLength(0);
});

test('Provider saved public preview distinguishes empty, incomplete and unavailable data and clears stale fields on failure',async({page})=>{
  const state=await mockBackend(page);let denied=false;
  await page.route('**/rest/v1/profile_drafts*',async route=>{
    if(denied&&new URL(route.request().url()).searchParams.get('select')?.includes('adult_age'))return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({message:'Denied'})});
    await route.fallback();
  });
  await signIn(page);await enter(page,'/?page=provider-setup');const panel=page.locator('.saved-public-profile-preview');
  await panel.getByRole('button',{name:'Review saved public profile',exact:true}).click();await expect(panel.locator('[role=status]')).toContainText('No saved profile draft');
  state.profile={owner_id:userId,display_name:'Saved partial profile',username:'',adult_age:null,city:'',photo_index:null};
  await panel.getByRole('button',{name:'Review saved public profile',exact:true}).click();
  await expect(panel.getByRole('heading',{name:'Fields to revisit',exact:true})).toBeVisible();
  await expect(panel.locator('li')).toHaveText(['Username','Adult age','City','Main photo selection']);
  await expect(panel.getByRole('img')).toHaveCount(0);
  denied=true;await panel.getByRole('button',{name:'Refresh saved public profile',exact:true}).click();
  await expect(panel.locator('[role=status]')).toContainText('Saved public preview unavailable');await expect(panel).not.toContainText('Saved partial profile');
  denied=false;state.profile.owner_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  await panel.getByRole('button',{name:'Refresh saved public profile',exact:true}).click();await expect(panel.locator('[role=status]')).toContainText('Saved public preview unavailable');
  state.profile.owner_id=userId;await panel.getByRole('button',{name:'Refresh saved public profile',exact:true}).click();await expect(panel).toContainText('Saved partial profile');
});

test('sign-out while a saved public preview is loading cannot repopulate private fields',async({page})=>{
  const state=await mockBackend(page);state.profile={owner_id:userId,display_name:'LATE PRIVATE SAVED NAME'};
  let release,started;const gate=new Promise(resolve=>{release=resolve;});const requested=new Promise(resolve=>{started=resolve;});
  await page.route('**/rest/v1/profile_drafts*',async route=>{
    if(new URL(route.request().url()).searchParams.get('select')?.includes('adult_age')){started();await gate;}
    await route.fallback();
  });
  await signIn(page);await enter(page,'/?page=provider-setup');
  await page.getByRole('button',{name:'Review saved public profile',exact:true}).click();await requested;
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.locator('.saved-public-profile-preview')).toHaveCount(0);
  release();await page.waitForLoadState('networkidle');
  await expect(page.locator('.provider-setup')).not.toContainText('LATE PRIVATE SAVED NAME');
});


function savedSubmissionProfile() { return {owner_id:userId,display_name:'Saved public name',username:'saved-provider',adult_age:28,tagline:'Coffee and galleries',city:'Vancouver',area:'Kitsilano',photo_index:2,biography:'SECRET MEMBER BIOGRAPHY',updated_at:'2026-11-10T19:00:00Z'}; }
test('private profile submission captures the reviewed version, survives draft edits and permits withdrawal after role revocation',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','provider'];state.profile=savedSubmissionProfile();
  await signIn(page);await enter(page,'/?page=provider-setup');const panel=page.locator('.profile-submission');
  const submit=panel.getByRole('button',{name:'Submit private profile copy',exact:true});await expect(submit).toBeDisabled();
  await page.getByRole('button',{name:'Review saved public profile',exact:true}).click();await expect(submit).toBeEnabled();
  page.once('dialog',dialog=>dialog.dismiss());await submit.click();expect(state.profilePublication).toBeNull();
  page.once('dialog',dialog=>dialog.accept());await submit.click();await expect(panel.locator('[role=status]')).toContainText('Private profile copy recorded');
  expect(state.profilePublication.public_fields.display_name).toBe('Saved public name');expect(state.profilePublication.public_fields).not.toHaveProperty('biography');
  const request=state.requests.find(r=>r.path.endsWith('/submit_private_profile_copy'));expect(request.body).toEqual({p_expected_owner:userId,p_source_updated_at:'2026-11-10T19:00:00Z'});
  state.profile.display_name='Later private name';state.profile.updated_at='2026-11-10T19:30:00Z';
  await page.getByRole('button',{name:'Refresh saved public profile',exact:true}).click();await expect(submit).toBeDisabled();
  await panel.getByRole('button',{name:'Check my private profile submission',exact:true}).click();await expect(panel).toContainText('Saved public name');await expect(panel).not.toContainText('Later private name');await expect(panel).not.toContainText('SECRET MEMBER');
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await panel.screenshot({path:'/tmp/private-profile-submission-mobile.png'});
  state.roles=['user'];page.once('dialog',dialog=>dialog.accept());await panel.getByRole('button',{name:'Withdraw private profile copy',exact:true}).click();
  await expect(panel.locator('[role=status]')).toHaveText('No pending private profile submission.');expect(state.profilePublication.withdrawn_at).toBeTruthy();expect(state.profile.display_name).toBe('Later private name');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(panel).toHaveCount(0);
});

test('private profile submission rejects changed saved versions and metadata-only Provider claims without reporting success',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','provider'];state.profile=savedSubmissionProfile();
  await signIn(page);await enter(page,'/?page=provider-setup');const panel=page.locator('.profile-submission');
  await page.getByRole('button',{name:'Review saved public profile',exact:true}).click();await expect(panel.getByRole('button',{name:'Submit private profile copy',exact:true})).toBeEnabled();state.profile.updated_at='2026-11-10T19:30:00Z';
  page.once('dialog',dialog=>dialog.accept());await panel.getByRole('button',{name:'Submit private profile copy',exact:true}).click();await expect(panel.locator('[role=status]')).toContainText('Unable to confirm');expect(state.profilePublication).toBeNull();
  await expect(panel.getByRole('button',{name:'Submit private profile copy',exact:true})).toBeDisabled();
  state.roles=['user'];state.user.user_metadata={role:'provider'};
  await page.getByRole('button',{name:'Refresh saved public profile',exact:true}).click();page.once('dialog',dialog=>dialog.accept());await panel.getByRole('button',{name:'Submit private profile copy',exact:true}).click();await expect(panel.locator('[role=status]')).toContainText('Unable to confirm');expect(state.profilePublication).toBeNull();
  state.roles=['user','provider'];await page.getByRole('button',{name:'Refresh saved public profile',exact:true}).click();page.once('dialog',dialog=>dialog.accept());await panel.getByRole('button',{name:'Submit private profile copy',exact:true}).click();await expect(panel.locator('[role=status]')).toContainText('Private profile copy recorded');
});

test('missing private submission setup is unavailable while saved profile review stays usable',async({page})=>{
  const options={missingProfileSubmissionMigration:true};const state=await mockBackend(page,options);state.profile=savedSubmissionProfile();
  await signIn(page);await enter(page,'/?page=provider-setup');const panel=page.locator('.profile-submission');
  await panel.getByRole('button',{name:'Check my private profile submission',exact:true}).click();await expect(panel.locator('[role=status]')).toContainText('Unable to confirm');
  await page.getByRole('button',{name:'Review saved public profile',exact:true}).click();await expect(page.locator('.saved-public-profile-content')).toContainText('Saved public name');
  options.missingProfileSubmissionMigration=false;await panel.getByRole('button',{name:'Check my private profile submission',exact:true}).click();await expect(panel.locator('[role=status]')).toHaveText('No pending private profile submission.');
});

function profileCopyRows(count=22) {
  return Array.from({length:count},(_,index)=>({id:`ffffffff-ffff-4fff-8fff-${String(count-index).padStart(12,'0')}`,owner_id:userId,submitted_at:'2026-11-10T20:00:00.123456+00:00',source_updated_at:'2026-11-10T19:00:00Z',withdrawn_at:index?'2026-11-10T21:00:00Z':null,public_fields:{display_name:index?`Recorded copy ${index+1}`:'<img src=x onerror=alert(1)> Recorded copy',username:'recorded-user',adult_age:28,city:'Vancouver',biography:'UNEXPECTED MEMBER FIELD'}}));
}
test('owner profile copy history includes withdrawals, pages tied timestamps precisely and renders only recorded public fields',async({page})=>{
  const state=await mockBackend(page);state.roles=['user'];state.profilePublications=profileCopyRows();
  await signIn(page);await enter(page,'/?page=provider-setup');const history=page.locator('.profile-submission-history');
  await expect(history.getByRole('button',{name:'Load my profile copy history',exact:true})).toBeVisible();
  expect(state.requests.filter(r=>r.path==='/rest/v1/profile_publication_submissions')).toHaveLength(0);
  await history.getByRole('button',{name:'Load my profile copy history',exact:true}).click();
  await expect(history.locator('.staff-approval-card')).toHaveCount(20);await expect(history.locator('[role=status]')).toBeFocused();
  await expect(history).toContainText('<img src=x onerror=alert(1)> Recorded copy');await expect(history.locator('img')).toHaveCount(0);
  await history.locator('summary').first().click();await expect(history.locator('details').first()).toContainText('recorded-user');await expect(history).not.toContainText('UNEXPECTED MEMBER FIELD');
  const local=await page.evaluate(value=>new Date(value).toLocaleString(undefined,{timeZoneName:'short'}),state.profilePublications[0].submitted_at);
  await expect(history.locator('time').first()).toHaveText(local);await expect(history.locator('time').first()).toHaveAttribute('datetime',state.profilePublications[0].submitted_at);
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await history.locator('.staff-approval-card').first().screenshot({path:'/tmp/profile-copy-history-mobile.png'});
  await history.getByRole('button',{name:'Older profile copies',exact:true}).click();await expect(history.locator('.staff-approval-card')).toHaveCount(2);await expect(history.getByRole('button',{name:'Older profile copies',exact:true})).toBeDisabled();
  const request=state.requests.filter(r=>r.path==='/rest/v1/profile_publication_submissions').at(-1);const query=new URLSearchParams(request.query);expect(query.get('owner_id')).toBe(`eq.${userId}`);expect(query.get('limit')).toBe('21');expect(query.get('or')).toContain('2026-11-10T20:00:00.123456+00:00');expect(query.get('or')).toContain('id.lt.ffffffff-ffff-4fff-8fff-000000000003');
  await history.getByRole('button',{name:'Newer profile copies',exact:true}).click();await expect(history.locator('.staff-approval-card')).toHaveCount(20);
  await history.getByRole('button',{name:'Refresh my profile copy history',exact:true}).click();await expect(history.locator('.staff-approval-card')).toHaveCount(20);
  expect(state.roles).toEqual(['user']);
});

test('profile copy history distinguishes missing setup, empty results and wrong-owner responses with clean retry',async({page})=>{
  const options={missingProfileSubmissionMigration:true};const state=await mockBackend(page,options);
  await signIn(page);await enter(page,'/?page=provider-setup');const history=page.locator('.profile-submission-history');
  await history.getByRole('button',{name:'Load my profile copy history',exact:true}).click();await expect(history.locator('[role=status]')).toContainText('history unavailable');
  options.missingProfileSubmissionMigration=false;await history.getByRole('button',{name:'Retry my profile copy history',exact:true}).click();await expect(history.locator('[role=status]')).toHaveText('No private profile copies on this page.');
  state.profilePublications=profileCopyRows(1);await history.getByRole('button',{name:'Refresh my profile copy history',exact:true}).click();await expect(history.locator('.staff-approval-card')).toHaveCount(1);
  await page.route('**/rest/v1/profile_publication_submissions*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{...profileCopyRows(1)[0],owner_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}])}));
  await history.getByRole('button',{name:'Refresh my profile copy history',exact:true}).click();await expect(history.locator('[role=status]')).toContainText('history unavailable');await expect(history.locator('.staff-approval-card')).toHaveCount(0);
  await page.unroute('**/rest/v1/profile_publication_submissions*');await history.getByRole('button',{name:'Retry my profile copy history',exact:true}).click();await expect(history.locator('.staff-approval-card')).toHaveCount(1);
});

test('pending-copy refresh invalidates in-flight history and sign-out removes recorded copies',async({page})=>{
  const state=await mockBackend(page);state.profilePublications=profileCopyRows(1);
  let release,started,blocked=false;const gate=new Promise(resolve=>{release=resolve;});const requested=new Promise(resolve=>{started=resolve;});
  await page.route('**/rest/v1/profile_publication_submissions*',async route=>{if(!blocked&&new URL(route.request().url()).searchParams.has('order')){blocked=true;started();await gate;}await route.fallback();});
  await signIn(page);await enter(page,'/?page=provider-setup');const history=page.locator('.profile-submission-history');
  await history.getByRole('button',{name:'Load my profile copy history',exact:true}).click();await requested;
  await page.getByRole('button',{name:'Check my private profile submission',exact:true}).click();await expect(page.locator('.profile-submission > [role=status]')).toHaveText('No pending private profile submission.');
  release();await page.waitForLoadState('networkidle');await expect(history.locator('.staff-approval-card')).toHaveCount(0);
  await history.getByRole('button',{name:'Load my profile copy history',exact:true}).click();await expect(history.locator('.staff-approval-card')).toHaveCount(1);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(history).toHaveCount(0);
});


test('conversation preview opens from account and sign-out clears local messages and composer text',async({page})=>{
  await mockBackend(page);await signIn(page);await page.locator('[data-account-link]').click();
  await page.getByRole('link',{name:'Preview conversations',exact:true}).click();
  await expect(page).toHaveTitle('Conversation preview · MeetDiscreet');await page.getByRole('button',{name:'Open Maya preview',exact:true}).click();
  await page.getByLabel('Try a preview message',{exact:true}).fill('LOCAL TEXT TO REMOVE ON SIGNOUT');await page.getByRole('button',{name:'Preview message',exact:true}).click();
  await page.getByLabel('Try a preview message',{exact:true}).fill('UNSENT COMPOSER TO REMOVE');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.locator('.messages-preview')).not.toContainText('LOCAL TEXT TO REMOVE ON SIGNOUT');
  await expect(page.getByRole('heading',{name:'Choose a conversation',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Open Maya preview',exact:true}).click();await expect(page.getByLabel('Try a preview message',{exact:true})).toHaveValue('');await expect(page.locator('.message-bubble')).toHaveCount(2);
});

test('local photo workspace opens from Provider setup and sign-out removes device previews without storage requests',async({page})=>{
  const state=await mockBackend(page);await signIn(page);await enter(page,'/?page=provider-setup');
  await page.getByRole('link',{name:'Try the local photo workspace',exact:true}).click();await expect(page).toHaveTitle('Photo workspace preview · MeetDiscreet');
  await page.getByLabel('Choose test photos',{exact:true}).setInputFiles({name:'fictional-test-photo.png',mimeType:'image/png',buffer:await readFile(new URL('../public/images/demo-portraits.png',import.meta.url))});
  await expect(page.locator('.photo-preview-card')).toHaveCount(1);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.locator('.photo-preview img')).toHaveCount(0);await expect(page.getByRole('button',{name:'Clear photo workspace',exact:true})).toBeDisabled();
  expect(state.requests.filter(value=>value.path.startsWith('/storage/'))).toEqual([]);
});

function profileReviewRows(count=23){return profileCopyRows(count).map((row,index)=>({...row,owner_id:`99999999-aaaa-4bbb-8ccc-${String(index+1).padStart(12,'0')}`,withdrawn_at:index===count-1?'2026-11-10T21:00:00Z':null,public_fields:{...row.public_fields,display_name:index===count-2?'<img src=x> Recorded owner':`Recorded owner ${index+1}`}}));}
test('assigned profile inspectors paginate recorded copies safely and clear private records after scope loss and sign-out',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','moderator'];state.capabilities=['profile_publication_review'];state.profilePublications=profileReviewRows();
  await signIn(page);await page.locator('[data-account-link]').click();await page.getByRole('link',{name:'Open profile submission review',exact:true}).click();
  await expect(page.locator('.profile-review-card')).toHaveCount(20);await page.getByRole('button',{name:'Next profile copies',exact:true}).click();await expect(page.locator('.profile-review-card')).toHaveCount(2);await page.getByRole('button',{name:'Previous profile copies',exact:true}).click();await expect(page.locator('.profile-review-card')).toHaveCount(20);
  await page.locator('.profile-review-card').first().getByRole('button').click();const detail=page.locator('.profile-review-detail');await expect(detail).toContainText('<img src=x> Recorded owner');await expect(detail.locator('img')).toHaveCount(0);await expect(detail).not.toContainText('UNEXPECTED MEMBER FIELD');await expect(detail.getByRole('heading',{name:'Recorded public fields',exact:true})).toBeFocused();
  await page.setViewportSize({width:390,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await detail.screenshot({path:'/tmp/profile-review-detail-mobile.png'});
  expect(state.profileReviewEvents.some(value=>value.action==='copy_opened')).toBe(true);await page.getByRole('button',{name:'Close profile copy',exact:true}).click();await expect(page.getByRole('button',{name:'Refresh profile review queue',exact:true})).toBeFocused();
  state.capabilities=[];await page.getByRole('button',{name:'Refresh profile review queue',exact:true}).click();await expect(page.locator('.profile-review > [role=status]')).toContainText('does not have assigned');await expect(page.locator('.profile-review-card')).toHaveCount(0);await expect(detail).toBeHidden();
  state.capabilities=['profile_publication_review'];await page.getByRole('button',{name:'Refresh profile review queue',exact:true}).click();await expect(page.locator('.profile-review-card')).toHaveCount(20);await page.locator('.profile-review-card').first().getByRole('button').click();await expect(detail).toBeVisible();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.locator('.profile-review-card')).toHaveCount(0);await expect(page.locator('.profile-review-detail')).toBeHidden();expect(state.roles).toEqual(['user','moderator']);
});
for(const [label,roles,capabilities] of [
  ['User with a capability only',['user'],['profile_publication_review']],
  ['Moderator with intake review only',['user','moderator'],['provider_application_review']],
  ['Admin with Provider approval only',['user','admin'],['provider_application_review','provider_application_approval']],
])test(`${label} cannot inspect profile-publication copies`,async({page})=>{
  const state=await mockBackend(page);state.roles=roles;state.capabilities=capabilities;state.user.user_metadata={role:'admin',capability:'profile_publication_review'};state.profilePublications=profileReviewRows(1).map(row=>({...row,withdrawn_at:null}));
  await signIn(page);await enter(page,'/?page=profile-review');await expect(page.locator('.profile-review > [role=status]')).toContainText('does not have assigned');await expect(page.locator('.profile-review-card')).toHaveCount(0);
  expect(state.requests.filter(value=>value.path.endsWith('/list_profile_publications_for_review'))).toHaveLength(0);
});
test('missing profile inspection setup leaves intake review usable and a withdrawn copy disappears on inspection',async({page})=>{
  const options={missingProfileReviewMigration:true};const state=await mockBackend(page,options);state.roles=['user','moderator'];state.capabilities=['provider_application_review','profile_publication_review'];state.profilePublications=profileReviewRows(1).map(row=>({...row,withdrawn_at:null}));
  await signIn(page);await page.locator('[data-account-link]').click();await expect(page.getByRole('link',{name:'Open provider review queue',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Open profile submission review',exact:true})).toBeHidden();
  await enter(page,'/?page=profile-review');await expect(page.locator('.profile-review > [role=status]')).toContainText('Unable to verify');
  options.missingProfileReviewMigration=false;await page.getByRole('button',{name:'Refresh profile review queue',exact:true}).click();await expect(page.locator('.profile-review-card')).toHaveCount(1);
  state.profilePublications[0].withdrawn_at='2026-11-10T21:00:00Z';await page.locator('.profile-review-card').getByRole('button').click();await expect(page.locator('.profile-review > [role=status]')).toHaveText('No pending profile copies on this page.');await expect(page.locator('.profile-review-detail')).toBeHidden();
});
test('a delayed profile inspection cannot repopulate private fields after sign-out',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','moderator'];state.capabilities=['profile_publication_review'];state.profilePublications=profileReviewRows(1).map(row=>({...row,withdrawn_at:null}));
  let release,started;const gate=new Promise(resolve=>{release=resolve;});const requested=new Promise(resolve=>{started=resolve;});
  await page.route('**/rest/v1/rpc/get_profile_publication_for_review',async route=>{started();await gate;await route.fallback();});
  await signIn(page);await enter(page,'/?page=profile-review');await page.locator('.profile-review-card').getByRole('button').click();await requested;
  await page.getByRole('button',{name:'Sign out',exact:true}).click();release();await page.waitForLoadState('networkidle');await expect(page.locator('.profile-review-card')).toHaveCount(0);await expect(page.locator('.profile-review-detail')).toBeHidden();
});

test('profile review search retains its name/city query across pages and refresh, then clears to the original queue',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','moderator'];state.capabilities=['profile_publication_review'];state.profilePublications=profileReviewRows(27);state.profilePublications.forEach((row,index)=>row.public_fields.city=index<24?'North Vancouver':'Toronto');
  await signIn(page);await enter(page,'/?page=profile-review');await expect(page.locator('.profile-review-card')).toHaveCount(20);
  await page.getByLabel('Search pending profile copies',{exact:true}).fill('north VANCOUVER');await page.getByRole('button',{name:'Search profile copies',exact:true}).click();await expect(page.locator('.profile-review > [role=status]')).toContainText('Search active');
  await page.getByRole('button',{name:'Next profile copies',exact:true}).click();await expect(page.locator('.profile-review-card')).toHaveCount(4);await page.getByRole('button',{name:'Previous profile copies',exact:true}).click();await expect(page.locator('.profile-review-card')).toHaveCount(20);
  await page.getByRole('button',{name:'Refresh profile review queue',exact:true}).click();await expect(page.locator('.profile-review > [role=status]')).toContainText('Search active');
  expect(state.requests.filter(row=>row.path.endsWith('/search_profile_publications_for_review')).every(row=>row.body.p_query==='north VANCOUVER')).toBe(true);
  await page.setViewportSize({width:390,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('.profile-review .review-search').screenshot({path:'/tmp/profile-review-search-mobile.png'});
  await page.getByRole('button',{name:'Clear profile search',exact:true}).click();await expect(page.getByLabel('Search pending profile copies',{exact:true})).toHaveValue('');await expect(page.locator('.profile-review > [role=status]')).not.toContainText('Search active');
});
test('profile review search treats wildcards literally, distinguishes missing setup and restores default listing with Clear',async({page})=>{
  const options={missingProfileSearchMigration:false};const state=await mockBackend(page,options);state.roles=['user','moderator'];state.capabilities=['profile_publication_review'];state.profilePublications=profileReviewRows(2);state.profilePublications[0].public_fields.display_name='Literal %_ copy';
  await signIn(page);await enter(page,'/?page=profile-review');const input=page.getByLabel('Search pending profile copies',{exact:true});
  await input.fill('%_');await page.getByRole('button',{name:'Search profile copies',exact:true}).click();await expect(page.locator('.profile-review-card')).toHaveCount(1);
  await input.fill('no matching name');await page.getByRole('button',{name:'Search profile copies',exact:true}).click();await expect(page.locator('.profile-review > [role=status]')).toHaveText('No pending profile copies match this search.');
  options.missingProfileSearchMigration=true;await input.fill('%_');await page.getByRole('button',{name:'Search profile copies',exact:true}).click();await expect(page.locator('.profile-review > [role=status]')).toContainText('Unable to load matching');await expect(page.locator('.profile-review-card')).toHaveCount(0);
  await page.getByRole('button',{name:'Clear profile search',exact:true}).click();await expect(page.locator('.profile-review-card')).toHaveCount(1);
});
test('a slow profile search cannot replace a newer search result',async({page})=>{
  const state=await mockBackend(page);state.roles=['user','moderator'];state.capabilities=['profile_publication_review'];state.profilePublications=profileReviewRows(3);state.profilePublications[0].public_fields.city='Slow City';state.profilePublications[1].public_fields.city='Fast City';
  let started,release;const requested=new Promise(resolve=>{started=resolve;});const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/rest/v1/rpc/search_profile_publications_for_review',async route=>{if(route.request().postDataJSON().p_query==='Slow City'){started();await gate;}await route.fallback();});
  await signIn(page);await enter(page,'/?page=profile-review');const input=page.getByLabel('Search pending profile copies',{exact:true});await input.fill('Slow City');await page.getByRole('button',{name:'Search profile copies',exact:true}).click();await requested;
  await input.fill('Fast City');await page.getByRole('button',{name:'Search profile copies',exact:true}).click();await expect(page.locator('.profile-review-card')).toHaveCount(1);await expect(page.locator('.profile-review-card')).toContainText('Fast City');
  release();await page.waitForLoadState('networkidle');await expect(page.locator('.profile-review-card')).toHaveCount(1);await expect(page.locator('.profile-review-card')).toContainText('Fast City');
});

test('booking inbox preview is linked from User setup and resets example context after sign-out without booking writes',async({page})=>{
  const state=await mockBackend(page);await signIn(page);await enter(page,'/?page=user-setup');
  await page.getByRole('link',{name:'Explore example requests',exact:true}).click();await expect(page).toHaveTitle('Booking inbox preview · MeetDiscreet');
  await page.getByRole('button',{name:'Calendar view',exact:true}).click();await page.getByRole('button',{name:'Provider example',exact:true}).click();await page.getByRole('button',{name:'View example: Coffee and a catch-up',exact:true}).click();await expect(page.locator('.booking-example-detail')).toContainText('distinct from confirmed');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByRole('button',{name:'User example',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('heading',{name:'Choose an example request',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'List view',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('.booking-calendar')).toBeHidden();
  expect(state.requests.filter(value=>value.method==='POST'&&value.path.startsWith('/rest/'))).toEqual([]);
});


test('sign-out clears local booking revision drafts without saving or submitting a proposal',async({page})=>{
  const state=await mockBackend(page);await signIn(page);await enter(page,'/?page=booking-inbox-preview');await page.getByRole('button',{name:'View example: A gallery afternoon',exact:true}).click();await page.locator('.booking-local-revision summary').click();
  await page.getByLabel('Local revision notes (optional)',{exact:true}).fill('LOCAL PROPOSAL TO CLEAR');await page.getByRole('button',{name:'Review local revision',exact:true}).click();await expect(page.locator('.booking-local-revision')).toContainText('LOCAL PROPOSAL TO CLEAR');
  await page.locator('.booking-example-activity summary').click();await page.locator('.booking-example-activity').getByRole('button',{name:'Newest first',exact:true}).click();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.locator('.booking-local-revision')).toHaveCount(0);await page.getByRole('button',{name:'View example: A gallery afternoon',exact:true}).click();await page.locator('.booking-local-revision summary').click();await expect(page.getByLabel('Local revision notes (optional)',{exact:true})).not.toHaveValue('LOCAL PROPOSAL TO CLEAR');await page.locator('.booking-example-activity summary').click();await expect(page.locator('.booking-example-activity').getByRole('button',{name:'Oldest first',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(state.requests.filter(value=>value.method==='POST'&&value.path.startsWith('/rest/'))).toEqual([]);
});

test('scoped profile staff record immutable private feedback with discard protection and an in-flight queue lock',async({page})=>{
 const state=await mockBackend(page);state.roles=['user','moderator'];state.capabilities=['profile_publication_review','profile_publication_feedback'];state.profilePublications=profileReviewRows(2);
 await signIn(page);await enter(page,'/?page=profile-review');await page.locator('.profile-review-card').getByRole('button').click();const note=page.getByLabel('Revision feedback for this profile copy',{exact:true});await note.fill('Please clarify <img src=x> the public tagline.');
 const before=state.requests.length;page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Refresh profile review queue',exact:true}).click();await expect(note).toHaveValue('Please clarify <img src=x> the public tagline.');expect(state.requests.length).toBe(before);
 await page.setViewportSize({width:390,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('.profile-feedback').screenshot({path:'/tmp/profile-feedback-form-mobile.png'});
 page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Record revision feedback',exact:true}).click();expect(state.profileFeedback).toHaveLength(0);
 let release,started;const gate=new Promise(resolve=>{release=resolve;});const requested=new Promise(resolve=>{started=resolve;});await page.route('**/rest/v1/rpc/record_profile_revision_feedback',async route=>{started();await gate;await route.fallback();});
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Record revision feedback',exact:true}).click();await requested;await page.getByRole('button',{name:'Refresh profile review queue',exact:true}).click();await expect(page.locator('.profile-review > [role=status]')).toContainText('Wait for the feedback operation');await expect(note).toBeDisabled();release();
 await expect(page.locator('.profile-feedback > [role=status]')).toContainText('Revision feedback recorded');await expect(page.locator('.profile-feedback-note')).toContainText('<img src=x>');await expect(page.locator('.profile-feedback img')).toHaveCount(0);await expect(note).toHaveCount(0);expect(state.profileFeedback).toHaveLength(1);expect(state.profilePublications[0].withdrawn_at).toBeNull();expect(state.roles).toEqual(['user','moderator']);
});
for(const missing of [false,true])test(`profile inspection remains usable ${missing?'without feedback setup':'without feedback capability'}`,async({page})=>{
 const state=await mockBackend(page,{missingProfileFeedbackMigration:missing});state.roles=['user','moderator'];state.capabilities=['profile_publication_review',...(missing?['profile_publication_feedback']:[])];state.profilePublications=profileReviewRows(2);
 await signIn(page);await enter(page,'/?page=profile-review');await page.locator('.profile-review-card').getByRole('button').click();await expect(page.locator('.profile-review-detail')).toBeVisible();await expect(page.getByRole('button',{name:'Record revision feedback',exact:true})).toHaveCount(0);expect(state.requests.filter(row=>row.path.endsWith('/record_profile_revision_feedback'))).toEqual([]);
});
test('owners read version-bound feedback without reviewer identity and can revisit a withdrawn copy in history',async({page})=>{
 const state=await mockBackend(page);const old={id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',owner_id:userId,source_updated_at:'2026-11-10T19:00:00Z',submitted_at:'2026-11-10T20:00:00Z',withdrawn_at:null,public_fields:{display_name:'Original copy'}};state.profilePublication=old;state.profileFeedback=[{submission_id:old.id,reviewer_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',note:'Please revise <script> the tagline.',created_at:'2026-11-13T20:00:00Z'}];
 await signIn(page);await enter(page,'/?page=provider-setup');await page.getByRole('button',{name:'Check my private profile submission',exact:true}).click();const pending=page.locator('.profile-submission');await pending.getByRole('button',{name:'Check feedback for this copy',exact:true}).click();await expect(pending.locator('output')).toContainText('Revision feedback for this recorded copy');await expect(pending.locator('.profile-feedback-note')).toHaveText('Please revise <script> the tagline.');await expect(pending.locator('script')).toHaveCount(0);
 const request=state.requests.find(row=>row.path==='/rest/v1/profile_publication_feedback');expect(new URLSearchParams(request.query).get('select')).toBe('submission_id,note,created_at');await expect(pending).not.toContainText('bbbbbbbb-bbbb');
 old.withdrawn_at='2026-11-13T21:00:00Z';const next={...old,id:'ffffffff-ffff-4fff-8fff-ffffffffffff',public_fields:{display_name:'New copy'},submitted_at:'2026-11-13T22:00:00Z',withdrawn_at:null};state.profilePublication=next;state.profilePublications=[old,next];
 await page.getByRole('button',{name:'Check my private profile submission',exact:true}).click();await pending.getByRole('button',{name:'Check feedback for this copy',exact:true}).click();await expect(pending.locator('output')).toHaveText('No revision feedback recorded for this copy.');await expect(pending.locator('.profile-feedback-note')).toHaveText('');
 await page.getByRole('button',{name:'Load my profile copy history',exact:true}).click();const card=page.locator('.profile-submission-history .staff-approval-card').filter({has:page.getByRole('heading',{name:'Original copy',exact:true})});await card.getByText('View recorded public fields',{exact:true}).click();await card.getByRole('button',{name:'Check feedback for this copy',exact:true}).click();await expect(card.locator('.profile-feedback-note')).toContainText('Please revise');
});
for(const failure of ['withdrawn','revoked'])test(`profile feedback ${failure} failure preserves the note without success and refresh clears it after confirmation`,async({page})=>{
 const state=await mockBackend(page);state.roles=['user','moderator'];state.capabilities=['profile_publication_review','profile_publication_feedback'];state.profilePublications=profileReviewRows(2);
 await signIn(page);await enter(page,'/?page=profile-review');await page.locator('.profile-review-card').getByRole('button').click();const note=page.getByLabel('Revision feedback for this profile copy',{exact:true});await note.fill('Keep this draft after an unconfirmed write.');
 if(failure==='withdrawn')state.profilePublications[0].withdrawn_at='2026-11-13T20:00:00Z';else state.capabilities=['profile_publication_review'];page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Record revision feedback',exact:true}).click();await expect(page.locator('.profile-feedback > [role=status]')).toContainText('Unable to confirm');await expect(note).toHaveValue('Keep this draft after an unconfirmed write.');expect(state.profileFeedback).toHaveLength(0);
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Refresh profile review queue',exact:true}).click();await expect(note).toHaveCount(0);
});
test('staff cannot give profile feedback to their own copy',async({page})=>{
 const state=await mockBackend(page);state.roles=['user','provider','moderator'];state.capabilities=['profile_publication_review','profile_publication_feedback'];state.profilePublications=profileReviewRows(2);state.profilePublications[0].owner_id=userId;
 await signIn(page);await enter(page,'/?page=profile-review');await page.locator('.profile-review-card').getByRole('button').click();await expect(page.locator('.profile-review-detail')).toBeVisible();await expect(page.getByRole('button',{name:'Record revision feedback',exact:true})).toHaveCount(0);
});

test('owner compares a recorded profile copy with explicitly loaded saved public fields without writes',async({page})=>{
 const state=await mockBackend(page);state.roles=['user','provider'];
 const recorded={display_name:'Recorded name',username:'recorded-user',adult_age:28,city:'Vancouver',area:'Kitsilano',tagline:'Original tagline',photo_index:0};
 state.profilePublication={id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',owner_id:userId,submitted_at:'2026-11-10T20:00:00Z',source_updated_at:'2026-11-10T19:00:00Z',withdrawn_at:null,public_fields:recorded};
 state.profile={owner_id:userId,...recorded,display_name:'<img src=x onerror=alert(1)> Saved name',photo_index:2,updated_at:'2026-11-13T20:00:00Z',biography:'PRIVATE BIOGRAPHY',interests:'PRIVATE INTERESTS'};
 await signIn(page);await enter(page,'/?page=provider-setup');await page.getByRole('button',{name:'Check my private profile submission',exact:true}).click();
 const compare=page.locator('.profile-submission .profile-copy-comparison');await compare.locator('summary').click();
 const reads=()=>state.requests.filter(r=>r.path==='/rest/v1/profile_drafts'&&new URLSearchParams(r.query).get('select')?.includes('adult_age'));
 expect(reads()).toHaveLength(0);await compare.getByRole('button',{name:'Load saved fields for comparison',exact:true}).click();
 await expect(compare.locator('[aria-live=polite]')).toContainText('2 of 7 public fields differ');await expect(compare.locator('tbody tr')).toHaveCount(7);
 await expect(compare).toContainText('<img src=x onerror=alert(1)> Saved name');await expect(compare.locator('img')).toHaveCount(0);await expect(compare).not.toContainText('PRIVATE');await expect(compare.locator('[data-changed=true]')).toHaveCount(2);
 expect(new URLSearchParams(reads()[0].query).get('select')).toBe('owner_id,display_name,username,adult_age,tagline,city,area,photo_index,updated_at');expect(new URLSearchParams(reads()[0].query).get('owner_id')).toBe(`eq.${userId}`);
 state.profile={owner_id:userId,...recorded,updated_at:'2026-11-13T21:00:00Z'};await expect(compare).not.toContainText('All seven public fields match');await compare.getByRole('button',{name:'Refresh saved-field comparison',exact:true}).click();await expect(compare.locator('[aria-live=polite]')).toContainText('All seven public fields match');
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(width!==320)await compare.screenshot({path:`/tmp/profile-comparison-${width}.png`});}
 state.profile.owner_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';await compare.getByRole('button',{name:'Refresh saved-field comparison',exact:true}).click();await expect(compare.locator('[aria-live=polite]')).toContainText('Comparison unavailable');await expect(compare.locator('table')).toHaveCount(0);
 state.profile=null;await compare.getByRole('button',{name:'Refresh saved-field comparison',exact:true}).click();await expect(compare).toContainText('No saved profile draft to compare');await expect(compare.locator('table')).toHaveCount(0);
 expect(state.requests.filter(r=>['POST','PATCH','DELETE'].includes(r.method)&&r.path.startsWith('/rest/'))).toHaveLength(0);
});

test('history comparison is bound to its recorded copy and a late load cannot restore it after sign-out',async({page})=>{
 const state=await mockBackend(page);state.roles=['user','provider'];state.profilePublications=[{id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',owner_id:userId,submitted_at:'2026-11-10T20:00:00Z',source_updated_at:'2026-11-10T19:00:00Z',withdrawn_at:'2026-11-11T20:00:00Z',public_fields:{display_name:'Withdrawn record',photo_index:0}}];state.profile={owner_id:userId,display_name:'Saved fields',updated_at:'2026-11-13T20:00:00Z'};
 await signIn(page);await enter(page,'/?page=provider-setup');await page.getByRole('button',{name:'Load my profile copy history',exact:true}).click();const card=page.locator('.profile-submission-history .staff-approval-card').first();await card.locator('summary').first().click();const comparison=card.locator('.profile-copy-comparison');await comparison.locator('summary').click();
 await comparison.getByRole('button',{name:'Load saved fields for comparison',exact:true}).click();await expect(comparison).toContainText('Withdrawn record');await expect(comparison).toContainText('Saved fields');
 let release;const wait=new Promise(resolve=>release=resolve);let started;const seen=new Promise(resolve=>started=resolve);
 await page.route('**/rest/v1/profile_drafts*',async route=>{if(new URL(route.request().url()).searchParams.get('select')?.includes('adult_age')){started();await wait;}await route.fallback();});
 await comparison.getByRole('button',{name:'Refresh saved-field comparison',exact:true}).click();await seen;await page.getByRole('button',{name:'Sign out',exact:true}).click();const finished=page.waitForResponse(response=>response.url().includes('/rest/v1/profile_drafts')&&response.request().method()==='GET');release();await finished;await page.waitForLoadState('networkidle');await expect(page.locator('.profile-copy-comparison')).toHaveCount(0);await expect(page.locator('#account-view')).not.toContainText('Withdrawn record');
});
