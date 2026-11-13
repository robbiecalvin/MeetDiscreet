import { test, expect } from '@playwright/test';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { validatePublicBackendConfig } from '../src/backend/config.js';
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const listing = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let db;
async function asUser(id, role = 'authenticated') {
  await db.exec(`reset role; set request.jwt.claim.sub = '${id}'; set role ${role};`);
}
test.beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb not null default '{}'::jsonb);
    insert into auth.users(id) values ('${alice}'), ('${bob}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;`);
  await db.exec(await readFile(new URL('../supabase/migrations/202611080001_private_drafts.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611090001_experience_drafts.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611090002_availability_drafts.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611090003_user_profile_drafts.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611090004_account_roles.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611090005_provider_applications.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611090006_provider_review_queue.sql', import.meta.url), 'utf8'));
  await asUser(alice);
  await db.query('select * from public.save_provider_application($1,$2,$3,$4)', [alice,'Legacy introduction','Vancouver','Submitted before the versioning upgrade.']);
  await db.query('select * from public.submit_provider_application($1)', [alice]);
  await db.exec('reset role');
  await db.exec(await readFile(new URL('../supabase/migrations/202611090007_provider_submission_feedback.sql', import.meta.url), 'utf8'));
  expect((await db.query('select submission_id from public.provider_applications where owner_id=$1', [alice])).rows[0].submission_id).toBeTruthy();
  expect((await db.query('select introduction from public.provider_application_submissions')).rows[0].introduction).toBe('Submitted before the versioning upgrade.');
  await db.exec(await readFile(new URL('../supabase/migrations/202611090008_booking_plan_drafts.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611100001_provider_application_approval.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611100002_provider_approval_history.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611100003_provider_review_search.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611100004_private_profile_submissions.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611100005_profile_publication_review.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611130001_profile_review_search.sql', import.meta.url), 'utf8'));
});
test.afterAll(async () => { await db.close(); });
test.beforeEach(async () => {
  await db.exec('reset role; truncate public.profile_publication_review_access_events, public.profile_publication_submissions, public.provider_application_approvals, public.booking_plan_drafts, public.listing_drafts, public.profile_drafts, public.experience_catalogue_drafts, public.availability_drafts, public.user_profile_drafts, public.provider_applications, public.provider_application_events, public.provider_application_submissions, public.provider_application_feedback, public.staff_capabilities, public.staff_capability_events, public.provider_review_access_events;');
  await asUser(alice);
});

test('owner can create, read, update, and delete their own private drafts', async () => {
  await db.exec(`insert into public.profile_drafts(display_name, biography) values ('Alice', 'Private member draft');
    insert into public.listing_drafts(id,kind,title,description,city,activity) values ('${listing}','offering','Coffee plan','A private draft with enough description.','Vancouver','Coffee');`);
  expect((await db.query('select biography from public.profile_drafts')).rows).toEqual([{ biography: 'Private member draft' }]);
  await db.exec("update public.profile_drafts set display_name='Updated Alice'; update public.listing_drafts set title='Updated coffee';");
  expect((await db.query('select title from public.listing_drafts')).rows[0].title).toBe('Updated coffee');
  await db.exec('delete from public.listing_drafts; delete from public.profile_drafts;');
  expect((await db.query('select * from public.profile_drafts')).rows).toHaveLength(0);
});

test('another user cannot read, update, delete, or take ownership of either draft type', async () => {
  await db.exec(`insert into public.profile_drafts(display_name) values ('Alice');
    insert into public.listing_drafts(id,kind,title,description,city,activity) values ('${listing}','looking','Gallery plan','A private draft with enough description.','Vancouver','Culture');`);
  await asUser(bob);
  expect((await db.query('select * from public.profile_drafts')).rows).toHaveLength(0);
  expect((await db.query('select * from public.listing_drafts')).rows).toHaveLength(0);
  expect((await db.query(`update public.profile_drafts set display_name='Stolen' where owner_id='${alice}' returning *`)).rows).toHaveLength(0);
  expect((await db.query(`update public.listing_drafts set owner_id='${bob}' where id='${listing}' returning *`)).rows).toHaveLength(0);
  expect((await db.query(`delete from public.listing_drafts where id='${listing}' returning *`)).rows).toHaveLength(0);
  expect((await db.query(`delete from public.profile_drafts where owner_id='${alice}' returning *`)).rows).toHaveLength(0);
  await asUser(alice);
  expect((await db.query('select display_name from public.profile_drafts')).rows[0].display_name).toBe('Alice');
  expect((await db.query('select * from public.listing_drafts')).rows).toHaveLength(1);
  await expect(db.exec(`update public.profile_drafts set owner_id='${bob}'`)).rejects.toThrow(/row-level security/i);
  await expect(db.exec(`update public.listing_drafts set owner_id='${bob}'`)).rejects.toThrow(/row-level security/i);
});

test('spoofed owner inserts are rejected for profiles and listings', async () => {
  await expect(db.exec(`insert into public.profile_drafts(owner_id, display_name) values ('${bob}','Spoofed')`)).rejects.toThrow(/row-level security/i);
  await expect(db.exec(`insert into public.listing_drafts(owner_id,kind,title,description,city,activity) values ('${bob}','offering','Spoofed plan','A private draft with enough description.','Vancouver','Coffee')`)).rejects.toThrow(/row-level security/i);
});

test('anonymous requests have no draft grants and null user identity exposes no rows', async () => {
  await db.exec("insert into public.profile_drafts(display_name) values ('Alice');");
  await asUser('', 'anon');
  for (const sql of ['select * from public.profile_drafts', 'select * from public.listing_drafts', "insert into public.profile_drafts(display_name) values ('Anonymous')", "update public.profile_drafts set display_name='Anonymous'", 'delete from public.profile_drafts']) {
    await expect(db.exec(sql)).rejects.toThrow(/permission denied/i);
  }
  await asUser('');
  expect((await db.query('select * from public.profile_drafts')).rows).toHaveLength(0);
});

test('database rejects invalid draft payloads and has no role or publish fields to forge', async () => {
  await expect(db.exec("insert into public.profile_drafts(adult_age) values (17)")).rejects.toThrow(/check constraint/i);
  await expect(db.exec("insert into public.listing_drafts(kind,title,description,city,activity) values ('offering','x','too short','Vancouver','Coffee')")).rejects.toThrow(/check constraint/i);
  await expect(db.exec("insert into public.profile_drafts(role) values ('administrator')")).rejects.toThrow(/column.*role.*does not exist/i);
  await expect(db.exec("insert into public.listing_drafts(published_at) values (now())")).rejects.toThrow(/column.*published_at.*does not exist/i);
});

test('browser configuration rejects privileged keys and arbitrary destinations', () => {
  const publicKey = 'sb_publishable_test_key';
  expect(validatePublicBackendConfig({ enabled: false })).toEqual({ enabled: false, url: '', key: '' });
  expect(validatePublicBackendConfig({ enabled: true, url: 'https://example.supabase.co', key: publicKey }).url).toBe('https://example.supabase.co');
  for (const key of ['sb_secret_test_key', 'service_role', 'eyJhbGciOiJIUzI1NiJ9']) {
    expect(() => validatePublicBackendConfig({ enabled: true, url: 'https://example.supabase.co', key })).toThrow();
  }
  for (const url of ['http://example.supabase.co', 'https://example.com', 'https://example.supabase.co.evil.test', 'https://example.supabase.co/path', 'https://user:password@example.supabase.co']) {
    expect(() => validatePublicBackendConfig({ enabled: true, url, key: publicKey })).toThrow();
  }
});

test('private experience catalogues enforce ownership and validate nested draft values', async () => {
  const item = { title: 'Coffee', description: '', included: false, offered: true, minor: 1500, feeType: 'once' };
  const insert = value => db.query('insert into public.experience_catalogue_drafts(items) values ($1::jsonb)', [JSON.stringify(value)]);
  await insert([item]);
  expect((await db.query('select items from public.experience_catalogue_drafts')).rows[0].items).toEqual([item]);
  await asUser(bob);
  expect((await db.query('select * from public.experience_catalogue_drafts')).rows).toHaveLength(0);
  expect((await db.query('delete from public.experience_catalogue_drafts returning *')).rows).toHaveLength(0);
  expect((await db.query("update public.experience_catalogue_drafts set items='[]' returning *")).rows).toHaveLength(0);
  await expect(db.query('insert into public.experience_catalogue_drafts(owner_id) values ($1)', [alice])).rejects.toThrow(/row-level security/i);
  await asUser('', 'anon');
  await expect(db.query('select * from public.experience_catalogue_drafts')).rejects.toThrow(/permission denied/i);
  await asUser(alice);
  await expect(db.query('update public.experience_catalogue_drafts set owner_id=$1', [bob])).rejects.toThrow(/row-level security/i);
  await db.exec('delete from public.experience_catalogue_drafts');
  for (const value of [null, {}, [null], [{ ...item, minor: -1 }], [{ ...item, minor: 1.5 }], [{ ...item, minor: 9007199254740992 }], [{ ...item, included: true }], [{ ...item, title: '' }], [{ ...item, offered: null }], [{ ...item, role: 'admin' }]]) {
    await expect(insert(value)).rejects.toThrow(/check constraint/i);
  }
  await insert([]);
  expect((await db.query('select items from public.experience_catalogue_drafts')).rows[0].items).toEqual([]);
});

test('availability drafts enforce owner isolation and reject invalid zones or overlapping windows', async () => {
  const first = { day: 1, start: '09:00', end: '12:00' };
  const insert = (zone, windows) => db.query('insert into public.availability_drafts(time_zone,windows) values ($1,$2::jsonb)', [zone, JSON.stringify(windows)]);
  await insert('America/Vancouver', [first]);
  await asUser(bob);
  expect((await db.query('select * from public.availability_drafts')).rows).toHaveLength(0);
  expect((await db.query('delete from public.availability_drafts returning *')).rows).toHaveLength(0);
  expect((await db.query("update public.availability_drafts set time_zone='UTC' returning *")).rows).toHaveLength(0);
  await expect(db.query("insert into public.availability_drafts(owner_id,time_zone) values ($1,'UTC')", [alice])).rejects.toThrow(/row-level security/i);
  await asUser('', 'anon');
  await expect(db.query('select * from public.availability_drafts')).rejects.toThrow(/permission denied/i);
  await asUser(alice);
  await expect(db.query('update public.availability_drafts set owner_id=$1', [bob])).rejects.toThrow(/row-level security/i);
  await db.exec('delete from public.availability_drafts');
  for (const [zone, windows] of [['Invalid/Zone', []], ['UTC', null], ['UTC', [{}]], ['UTC', [{ ...first, day: 1.5 }]], ['UTC', [{ ...first, start: '24:00' }]], ['UTC', [{ ...first, start: '20:00', end: '02:00' }]], ['UTC', [{ ...first, role: 'admin' }]], ['UTC', [first, { day: 1, start: '11:00', end: '13:00' }]], ['UTC', [first, { day: 1.0, start: '09:00', end: '12:00' }]]]) {
    await expect(insert(zone, windows)).rejects.toThrow(/check constraint/i);
  }
  await insert('UTC', [first, { day: 1, start: '12:00', end: '13:00' }]);
  await db.exec("update public.availability_drafts set time_zone='America/Toronto'");
  expect((await db.query('select windows from public.availability_drafts')).rows[0].windows).toHaveLength(2);
});

test('User profile drafts are owner-only, validate declarations, and stay separate from provider profiles', async () => {
  await db.exec("insert into public.profile_drafts(display_name) values ('Provider draft'); insert into public.user_profile_drafts(username,adult_age,display_name) values ('alice',30,'User draft');");
  await asUser(bob);
  expect((await db.query('select * from public.user_profile_drafts')).rows).toHaveLength(0);
  expect((await db.query('delete from public.user_profile_drafts returning *')).rows).toHaveLength(0);
  expect((await db.query("update public.user_profile_drafts set display_name='Stolen' returning *")).rows).toHaveLength(0);
  await expect(db.query('insert into public.user_profile_drafts(owner_id) values ($1)', [alice])).rejects.toThrow(/row-level security/i);
  await asUser('', 'anon');
  await expect(db.query('select * from public.user_profile_drafts')).rejects.toThrow(/permission denied/i);
  await asUser(alice);
  await expect(db.exec('update public.user_profile_drafts set adult_age=17')).rejects.toThrow(/check constraint/i);
  await expect(db.exec("update public.user_profile_drafts set gender_description='Private description'")).rejects.toThrow(/check constraint/i);
  await expect(db.exec('update public.user_profile_drafts set prefer_not_to_say=false')).rejects.toThrow(/check constraint/i);
  await expect(db.query('update public.user_profile_drafts set owner_id=$1', [bob])).rejects.toThrow(/row-level security/i);
  await db.exec("update public.user_profile_drafts set prefer_not_to_say=false,gender_description='Self-described',display_name='Updated User';");
  expect((await db.query('select display_name from public.user_profile_drafts')).rows[0].display_name).toBe('Updated User');
  await db.exec('delete from public.user_profile_drafts');
  expect((await db.query('select display_name from public.profile_drafts')).rows[0].display_name).toBe('Provider draft');
});

test('assigned account roles are owner-readable but cannot be self-granted, edited or removed', async () => {
  expect((await db.query('select role from public.account_roles')).rows).toEqual([{ role: 'user' }]);
  for (const sql of [
    `insert into public.account_roles(user_id,role) values ('${alice}','provider')`,
    `insert into public.account_roles(user_id,role) values ('${alice}','admin')`,
    `insert into public.account_roles(user_id,role) values ('${bob}','provider')`,
    "update public.account_roles set role='admin'",
    'delete from public.account_roles',
  ]) await expect(db.exec(sql)).rejects.toThrow(/permission denied/i);
  expect((await db.query(`select * from public.account_roles where user_id='${bob}'`)).rows).toHaveLength(0);
  await asUser('', 'anon');
  await expect(db.query('select * from public.account_roles')).rejects.toThrow(/permission denied/i);
  await expect(db.query("select public.has_account_role('user')")).rejects.toThrow(/permission denied/i);
});
test('server role checks use trusted rows for the current user rather than signup metadata', async () => {
  await asUser('', 'service_role');
  await db.query("insert into public.account_roles(user_id,role) values ($1,'provider')", [bob]);
  const audit = await db.query("select action,new_role,actor_database_role from public.account_role_events where new_user_id=$1 and new_role='provider' order by event_id desc limit 1", [bob]);
  expect(audit.rows).toEqual([{ action: 'INSERT', new_role: 'provider', actor_database_role: 'service_role' }]);
  await expect(db.exec('delete from public.account_role_events')).rejects.toThrow(/permission denied/i);
  await asUser(alice);
  await expect(db.query('select * from public.account_role_events')).rejects.toThrow(/permission denied/i);
  expect((await db.query("select public.has_account_role('user') as value")).rows[0].value).toBe(true);
  expect((await db.query("select public.has_account_role('provider') as value")).rows[0].value).toBe(false);
  expect((await db.query("select public.has_account_role('admin') as value")).rows[0].value).toBe(false);
  await asUser(bob);
  expect((await db.query("select public.has_account_role('provider') as value")).rows[0].value).toBe(true);
  await db.exec('reset role');
  await db.query("delete from public.account_roles where user_id=$1 and role='provider'", [bob]);
});
test('signup initializes only the basic User role even when metadata requests privileged roles', async () => {
  const charlie = '33333333-3333-4333-8333-333333333333';
  await db.exec('reset role');
  await db.query('insert into auth.users(id,raw_user_meta_data) values ($1,$2::jsonb)', [charlie, JSON.stringify({ onboarding_intent: 'provider', role: 'admin', roles: ['provider', 'admin'], publishing: true })]);
  await asUser(charlie);
  expect((await db.query('select role from public.account_roles')).rows).toEqual([{ role: 'user' }]);
  await db.exec('reset role'); await db.query('delete from auth.users where id=$1', [charlie]);
});

test('provider applications save, submit, lock editing, withdraw and record status history without role grants', async () => {
  const save = (name, city, intro) => db.query('select * from public.save_provider_application($1,$2,$3,$4)', [alice, name, city, intro]);
  await save('', '', '');
  await expect(db.query('select * from public.submit_provider_application($1)', [alice])).rejects.toThrow(/complete application/i);
  await save('\t', '\n', ' \n\t ');
  await expect(db.query('select * from public.submit_provider_application($1)', [alice])).rejects.toThrow(/complete application/i);
  await save('Provider introduction', 'Vancouver', 'A private introduction for the development intake queue.');
  expect((await db.query('select * from public.submit_provider_application($1)', [alice])).rows[0].state).toBe('submitted');
  await expect(save('Changed', 'Toronto', 'Cannot edit a submitted request.')).rejects.toThrow(/locked/i);
  await expect(db.query('select * from public.submit_provider_application($1)', [alice])).rejects.toThrow(/complete application/i);
  expect((await db.query('select * from public.withdraw_provider_application($1)', [alice])).rows[0].state).toBe('withdrawn');
  await save('Revised provider', 'Vancouver', 'A revised introduction.');
  expect((await db.query('select state from public.provider_application_events order by event_id')).rows.map(row => row.state)).toEqual(['draft','draft','draft','submitted','withdrawn','draft']);
  expect((await db.query("select public.has_account_role('provider') as value")).rows[0].value).toBe(false);
});
test('provider application RPCs bind the actor and deny cross-account access and direct status mutation', async () => {
  await db.query('select * from public.save_provider_application($1,$2,$3,$4)', [alice, 'Alice', 'Vancouver', 'Private intro']);
  await asUser(bob);
  expect((await db.query('select * from public.provider_applications')).rows).toHaveLength(0);
  expect((await db.query('select * from public.provider_application_events')).rows).toHaveLength(0);
  await expect(db.query('select * from public.save_provider_application($1,$2,$3,$4)', [alice, 'Spoofed', 'Toronto', 'Not owned'])).rejects.toThrow(/account changed/i);
  await expect(db.query('select * from public.submit_provider_application($1)', [alice])).rejects.toThrow(/account changed/i);
  await expect(db.query('select * from public.withdraw_provider_application($1)', [alice])).rejects.toThrow(/account changed/i);
  await asUser(alice);
  for (const sql of ["update public.provider_applications set state='submitted'", 'delete from public.provider_applications', "insert into public.provider_applications(owner_id) values ('" + bob + "')", 'delete from public.provider_application_events']) await expect(db.exec(sql)).rejects.toThrow(/permission denied/i);
  await asUser('', 'anon');
  await expect(db.query('select * from public.provider_applications')).rejects.toThrow(/permission denied/i);
  await expect(db.query('select * from public.submit_provider_application($1)', [alice])).rejects.toThrow(/permission denied/i);
  await asUser('');
  await expect(db.query('select * from public.save_provider_application($1,$2,$3,$4)', [alice, 'Invalid', 'City', 'Intro'])).rejects.toThrow(/not authenticated/i);
});
test('application submission checks assigned basic membership and rejects oversized data', async () => {
  await expect(db.query('select * from public.save_provider_application($1,$2,$3,$4)', [alice, 'x'.repeat(81), 'City', 'Intro'])).rejects.toThrow(/check constraint/i);
  await db.exec('reset role');
  await db.query("delete from public.account_roles where user_id=$1 and role='user'", [alice]);
  await asUser(alice);
  await db.query('select * from public.save_provider_application($1,$2,$3,$4)', [alice, 'Alice', 'City', 'Intro']);
  await expect(db.query('select * from public.submit_provider_application($1)', [alice])).rejects.toThrow(/membership required/i);
  await db.exec('reset role'); await db.query("insert into public.account_roles(user_id,role) values ($1,'user')", [alice]);
});

test('provider review requires both staff role and specific capability; metadata and self-assignment cannot grant it', async () => {
  await db.exec('reset role');
  await db.query('update auth.users set raw_user_meta_data=$1::jsonb where id=$2', [JSON.stringify({ role: 'admin', capabilities: ['provider_application_review'] }), alice]);
  await asUser(alice);
  const allowed = async () => (await db.query('select public.can_review_provider_applications() as value')).rows[0].value;
  expect(await allowed()).toBe(false);
  await expect(db.query('select * from public.list_provider_applications_for_review($1)', [alice])).rejects.toThrow(/assigned provider review access/i);
  await expect(db.query("insert into public.staff_capabilities(user_id,capability) values ($1,'provider_application_review')", [alice])).rejects.toThrow(/permission denied/i);
  await db.exec('reset role');
  await db.query("insert into public.staff_capabilities(user_id,capability) values ($1,'provider_application_review')", [alice]);
  await asUser(alice); expect(await allowed()).toBe(false);
  await db.exec('reset role');
  await db.query("insert into public.account_roles(user_id,role) values ($1,'moderator')", [alice]);
  await asUser(alice); expect(await allowed()).toBe(true);
  await expect(db.exec('delete from public.staff_capabilities')).rejects.toThrow(/permission denied/i);
  await expect(db.query('select * from public.provider_review_access_events')).rejects.toThrow(/permission denied/i);
  await db.exec('reset role');
  await db.query("delete from public.account_roles where user_id=$1 and role='moderator'", [alice]);
});
test('staff queue exposes submitted intake only, paginates and audits reads, and rejects withdrawn details', async () => {
  await db.query('select * from public.save_provider_application($1,$2,$3,$4)', [alice,'Alice introduction','Vancouver','Private Alice application']);
  await db.query('select * from public.submit_provider_application($1)', [alice]);
  await asUser(bob);
  await db.query('select * from public.save_provider_application($1,$2,$3,$4)', [bob,'Bob introduction','Toronto','Private Bob application']);
  await db.query('select * from public.submit_provider_application($1)', [bob]);
  await db.exec('reset role');
  await db.query("insert into public.account_roles(user_id,role) values ($1,'moderator')", [alice]);
  await db.query("insert into public.staff_capabilities(user_id,capability) values ($1,'provider_application_review')", [alice]);
  await db.query("update public.provider_applications set submitted_at='2026-11-08T10:00:00Z' where owner_id=$1", [alice]);
  await db.query("update public.provider_applications set submitted_at='2026-11-08T11:00:00Z' where owner_id=$1", [bob]);
  await asUser(alice);
  expect((await db.query('select * from public.provider_applications')).rows).toHaveLength(1);
  const first = (await db.query('select * from public.list_provider_applications_for_review($1,1)', [alice])).rows;
  expect(first[0].owner_id).toBe(alice);
  expect(first[0]).not.toHaveProperty('introduction');
  const second = (await db.query('select * from public.list_provider_applications_for_review($1,1,$2,$3)', [alice,first[0].submitted_at,first[0].owner_id])).rows;
  expect(second[0].owner_id).toBe(bob);
  expect((await db.query('select * from public.get_provider_application_for_review($1,$2)', [alice,bob])).rows[0].introduction).toBe('Private Bob application');
  await expect(db.query('select * from public.list_provider_applications_for_review($1)', [bob])).rejects.toThrow(/reviewer account changed/i);
  await expect(db.query('select * from public.list_provider_applications_for_review($1,null)', [alice])).rejects.toThrow(/invalid page size/i);
  await asUser(bob);
  await db.query('select * from public.withdraw_provider_application($1)', [bob]);
  await asUser(alice);
  expect((await db.query('select * from public.get_provider_application_for_review($1,$2)', [alice,bob])).rows).toHaveLength(0);
  await asUser('', 'service_role');
  expect((await db.query("select * from public.provider_review_access_events where action='application_opened'")).rows).toHaveLength(1);
  await expect(db.exec('delete from public.provider_review_access_events')).rejects.toThrow(/permission denied/i);
  await db.exec('reset role');
  await db.query("delete from public.account_roles where user_id=$1 and role='moderator'", [alice]);
});
test('Administrator role alone has no review access and revocation takes effect on the next request', async () => {
  await db.exec('reset role');
  await db.query("insert into public.account_roles(user_id,role) values ($1,'admin')", [alice]);
  await asUser(alice);
  expect((await db.query('select public.can_review_provider_applications() as value')).rows[0].value).toBe(false);
  await db.exec('reset role');
  await db.query("insert into public.staff_capabilities(user_id,capability) values ($1,'provider_application_review')", [alice]);
  await asUser(alice);
  expect((await db.query('select public.can_review_provider_applications() as value')).rows[0].value).toBe(true);
  await db.exec('reset role'); await db.query('delete from public.staff_capabilities where user_id=$1', [alice]);
  await asUser(alice);
  await expect(db.query('select * from public.list_provider_applications_for_review($1)', [alice])).rejects.toThrow(/assigned provider review access/i);
  await asUser('', 'anon');
  await expect(db.query('select * from public.list_provider_applications_for_review($1)', [alice])).rejects.toThrow(/permission denied/i);
  await db.exec('reset role'); await db.query("delete from public.account_roles where user_id=$1 and role='admin'", [alice]);
});

test('version-bound staff feedback unlocks a new draft and preserves the submitted text without role grants', async () => {
  await asUser(bob);
  await db.query('select * from public.save_provider_application($1,$2,$3,$4)', [bob,'Bob provider','Toronto','Original submitted text']);
  const original = (await db.query('select * from public.submit_provider_application($1)', [bob])).rows[0];
  await db.exec('reset role');
  await db.query("insert into public.account_roles(user_id,role) values ($1,'moderator')", [alice]);
  await db.query("insert into public.staff_capabilities(user_id,capability) values ($1,'provider_application_review'),($1,'provider_application_feedback')", [alice]);
  await asUser(alice);
  await db.query('select * from public.request_provider_application_changes($1,$2,$3,$4)', [alice,bob,original.submission_id,'Please clarify the experiences you plan to offer.']);
  await expect(db.query('select * from public.request_provider_application_changes($1,$2,$3,$4)', [alice,bob,original.submission_id,'Duplicate decision'])).rejects.toThrow(/changed or no longer pending/i);
  await asUser(bob);
  expect((await db.query('select state from public.provider_applications')).rows[0].state).toBe('changes_requested');
  expect((await db.query('select note from public.provider_application_feedback')).rows[0].note).toContain('clarify');
  await expect(db.query('select reviewer_id from public.provider_application_feedback')).rejects.toThrow(/permission denied/i);
  await expect(db.exec("update public.provider_application_submissions set introduction='Altered'")).rejects.toThrow(/permission denied/i);
  await db.query('select * from public.save_provider_application($1,$2,$3,$4)', [bob,'Bob provider','Toronto','Revised submitted text']);
  const next = (await db.query('select * from public.submit_provider_application($1)', [bob])).rows[0];
  expect(next.submission_id).not.toBe(original.submission_id);
  expect((await db.query('select introduction from public.provider_application_submissions order by submitted_at,id')).rows.map(row => row.introduction)).toContain('Original submitted text');
  expect((await db.query("select public.has_account_role('provider') as value")).rows[0].value).toBe(false);
  await asUser(alice);
  await expect(db.query('select * from public.request_provider_application_changes($1,$2,$3,$4)', [alice,bob,original.submission_id,'Stale decision'])).rejects.toThrow(/changed or no longer pending/i);
  await db.exec('reset role'); await db.query("delete from public.account_roles where user_id=$1 and role='moderator'", [alice]);
});
test('inspection capability alone cannot request changes or rewrite feedback history', async () => {
  await db.exec('reset role');
  await db.query("insert into public.account_roles(user_id,role) values ($1,'moderator')", [alice]);
  await db.query("insert into public.staff_capabilities(user_id,capability) values ($1,'provider_application_review')", [alice]);
  await asUser(alice);
  expect((await db.query('select public.can_request_provider_application_changes() as value')).rows[0].value).toBe(false);
  await expect(db.query('select * from public.request_provider_application_changes($1,$2,$3,$4)', [alice,bob,listing,'Request changes'])).rejects.toThrow(/feedback access/i);
  await expect(db.exec('delete from public.provider_application_feedback')).rejects.toThrow(/permission denied/i);
  await db.exec('reset role'); await db.query("delete from public.account_roles where user_id=$1 and role='moderator'", [alice]);
});

test('submission history and feedback reads remain owner-only even with an explicit foreign owner filter', async () => {
  await db.query('select * from public.save_provider_application($1,$2,$3,$4)', [alice,'Alice','Vancouver','Private original introduction']);
  const original = (await db.query('select * from public.submit_provider_application($1)',[alice])).rows[0];
  await db.exec('reset role');
  await db.query('insert into public.provider_application_feedback(owner_id,submission_id,reviewer_id,note) values($1,$2,$3,$4)',[alice,original.submission_id,bob,'Clarify your activities']);
  await asUser(alice);
  expect((await db.query('select introduction from public.provider_application_submissions')).rows).toHaveLength(1);
  expect((await db.query('select submission_id,note,created_at from public.provider_application_feedback')).rows[0].submission_id).toBe(original.submission_id);
  await asUser(bob);
  expect((await db.query('select introduction from public.provider_application_submissions where owner_id=$1',[alice])).rows).toEqual([]);
  expect((await db.query('select note from public.provider_application_feedback where owner_id=$1',[alice])).rows).toEqual([]);
  await asUser('', 'anon');
  await expect(db.query('select introduction from public.provider_application_submissions')).rejects.toThrow(/permission denied/i);
});


const partialPlan = () => ({sourceOffering:'',provider:'',activity:'',date:'',time:'',timeZone:'',duration:'',venue:'',expenses:'',notes:'Unsent private idea'});
test('private booking plans allow partial owner CRUD while denying other owners and anonymous reads', async () => {
  await db.query('insert into public.booking_plan_drafts(plan) values($1)',[partialPlan()]);
  expect((await db.query('select plan from public.booking_plan_drafts')).rows[0].plan.notes).toBe('Unsent private idea');
  await asUser(bob);
  expect((await db.query('select * from public.booking_plan_drafts where owner_id=$1',[alice])).rows).toEqual([]);
  expect((await db.query('update public.booking_plan_drafts set plan=$1 where owner_id=$2 returning owner_id',[partialPlan(),alice])).rows).toEqual([]);
  expect((await db.query('delete from public.booking_plan_drafts where owner_id=$1 returning owner_id',[alice])).rows).toEqual([]);
  await expect(db.query('insert into public.booking_plan_drafts(owner_id,plan) values($1,$2)',[alice,partialPlan()])).rejects.toThrow(/row.level security/i);
  await asUser('', 'anon');
  await expect(db.query('select * from public.booking_plan_drafts')).rejects.toThrow(/permission denied/i);
  await asUser(alice);
  await db.query('update public.booking_plan_drafts set plan=$1',[{...partialPlan(),notes:'Revised plan'}]);
  expect((await db.query('delete from public.booking_plan_drafts returning owner_id')).rows).toHaveLength(1);
});
test('booking plan storage rejects malformed proposals and authority fields without creating bookings or roles', async () => {
  for (const proposal of [
    {...partialPlan(),price:0}, {...partialPlan(),approved:true}, {...partialPlan(),notes:'x'.repeat(1001)},
    {...partialPlan(),duration:'1.5'}, {...partialPlan(),duration:'9007199254740992'}, {...partialPlan(),date:'2030-02-30'},
    {...partialPlan(),time:'25:00'}, {...partialPlan(),timeZone:'Unknown/Zone'}, {...partialPlan(),notes:null},
  ]) await expect(db.query('insert into public.booking_plan_drafts(plan) values($1)',[proposal])).rejects.toThrow(/check constraint/i);
  await db.query('insert into public.booking_plan_drafts(plan) values($1)',[{...partialPlan(),provider:'maya',activity:'Culture',date:'2030-06-15',time:'14:00',timeZone:'America/Vancouver',duration:'120'}]);
  expect((await db.query("select public.has_account_role('provider') as value")).rows[0].value).toBe(false);
});


test.describe('Administrator pilot Provider approval',()=>{
  test.afterEach(async()=>{
    await db.exec('reset role');
    await db.exec("delete from public.account_roles where role<>'user'");
    await db.query("insert into public.account_roles(user_id,role) values($1,'user'),($2,'user') on conflict do nothing",[alice,bob]);
  });
  async function pendingApplication() {
    await asUser(bob);
    await db.query('select * from public.save_provider_application($1,$2,$3,$4)',[bob,'Pilot applicant','Vancouver','A submitted introduction for pilot review.']);
    const app=(await db.query('select * from public.submit_provider_application($1)',[bob])).rows[0];
    await db.exec('reset role');
    await db.query("insert into public.account_roles(user_id,role) values($1,'admin') on conflict do nothing",[alice]);
    await db.query("insert into public.staff_capabilities(user_id,capability) values($1,'provider_application_review'),($1,'provider_application_approval')",[alice]);
    await asUser(alice);return app;
  }
  const approve=(owner,version,reviewer=alice)=>db.query('select * from public.approve_provider_application($1,$2,$3)',[reviewer,owner,version]);
  test('approval atomically records the reviewed version, grants Provider and retains User without self-grant APIs',async()=>{
    const app=await pendingApplication();
    expect((await db.query('select public.can_approve_provider_applications() as value')).rows[0].value).toBe(true);
    expect((await approve(bob,app.submission_id)).rows[0].state).toBe('approved');
    await expect(approve(bob,app.submission_id)).rejects.toThrow(/no longer pending/i);
    await asUser(bob);
    expect((await db.query('select role from public.account_roles order by role')).rows.map(row=>row.role)).toEqual(['provider','user']);
    expect((await db.query('select submission_id,approved_at from public.provider_application_approvals')).rows[0].submission_id).toBe(app.submission_id);
    await expect(db.query('select reviewer_id from public.provider_application_approvals')).rejects.toThrow(/permission denied/i);
    await expect(db.query('insert into public.provider_application_approvals(owner_id,submission_id,reviewer_id) values($1,$2,$3)',[bob,app.submission_id,bob])).rejects.toThrow(/permission denied/i);
    await expect(db.query('select * from public.save_provider_application($1,$2,$3,$4)',[bob,'Changed','Vancouver','Changed after approval'])).rejects.toThrow(/locked/i);
    await expect(db.query('select * from public.withdraw_provider_application($1)',[bob])).rejects.toThrow();
    await db.exec('reset role');
    expect((await db.query("select actor_user_id from public.account_role_events where action='INSERT' and new_user_id=$1 and new_role='provider'",[bob])).rows.at(-1).actor_user_id).toBe(alice);
    expect((await db.query('select count(*)::int as value from public.provider_application_approvals')).rows[0].value).toBe(1);
    await asUser(alice,'service_role');
    await expect(db.exec('delete from public.provider_application_approvals')).rejects.toThrow(/permission denied/i);
    await expect(approve(bob,app.submission_id)).rejects.toThrow(/permission denied/i);
  });
  test('Moderator, metadata, missing review/approval scopes and actor mismatch cannot approve',async()=>{
    const app=await pendingApplication();
    await db.exec('reset role');await db.query("update public.account_roles set role='moderator' where user_id=$1 and role='admin'",[alice]);await asUser(alice);
    await expect(approve(bob,app.submission_id)).rejects.toThrow(/administrator approval access/i);
    await db.exec('reset role');await db.query("update public.account_roles set role='admin' where user_id=$1 and role='moderator'",[alice]);
    await db.query("delete from public.staff_capabilities where user_id=$1 and capability='provider_application_approval'",[alice]);await asUser(alice);
    await expect(approve(bob,app.submission_id)).rejects.toThrow(/administrator approval access/i);
    await db.exec('reset role');await db.query("insert into public.staff_capabilities(user_id,capability) values($1,'provider_application_approval')",[alice]);await db.query("delete from public.staff_capabilities where user_id=$1 and capability='provider_application_review'",[alice]);await asUser(alice);
    await expect(approve(bob,app.submission_id)).rejects.toThrow(/administrator approval access/i);
    await expect(approve(bob,app.submission_id,bob)).rejects.toThrow(/account changed/i);
    await db.exec('reset role');await db.query("delete from public.account_roles where user_id=$1 and role='admin'",[alice]);await db.query("update auth.users set raw_user_meta_data=$1 where id=$2",[{role:'admin',capabilities:['provider_application_approval']},alice]);await asUser(alice);
    expect((await db.query('select public.can_approve_provider_applications() as value')).rows[0].value).toBe(false);
    await expect(approve(bob,app.submission_id)).rejects.toThrow(/administrator approval access/i);
    await db.exec('reset role');expect((await db.query('select count(*)::int as value from public.provider_application_approvals')).rows[0].value).toBe(0);
  });
  test('stale versions, withdrawn submissions, self-approval and revoked basic membership are denied',async()=>{
    const app=await pendingApplication();await asUser(bob);
    await db.query('select * from public.withdraw_provider_application($1)',[bob]);await asUser(alice);
    await expect(approve(bob,app.submission_id)).rejects.toThrow(/no longer pending/i);
    await asUser(bob);await db.query('select * from public.save_provider_application($1,$2,$3,$4)',[bob,'Revised','Vancouver','A revised submission for review.']);
    const revised=(await db.query('select * from public.submit_provider_application($1)',[bob])).rows[0];await asUser(alice);
    await expect(approve(bob,app.submission_id)).rejects.toThrow(/changed/i);
    await db.exec('reset role');await db.query("delete from public.account_roles where user_id=$1 and role='user'",[bob]);await asUser(alice);
    await expect(approve(bob,revised.submission_id)).rejects.toThrow(/basic User membership/i);
    await db.query('select * from public.save_provider_application($1,$2,$3,$4)',[alice,'Reviewer','Vancouver','My own application cannot be self-approved.']);
    const own=(await db.query('select * from public.submit_provider_application($1)',[alice])).rows[0];
    await expect(approve(alice,own.submission_id)).rejects.toThrow(/independent administrator/i);
    await db.exec('reset role');expect((await db.query('select count(*)::int as value from public.provider_application_approvals')).rows[0].value).toBe(0);
  });
  test('a failed role grant rolls back the approval record and application transition',async()=>{
    const app=await pendingApplication();await db.exec('reset role');
    await db.exec("create function public.test_reject_provider_grant() returns trigger language plpgsql as $$ begin raise exception 'Injected role grant failure'; end; $$; create trigger test_provider_grant_failure before insert on public.account_roles for each row when(new.role='provider') execute function public.test_reject_provider_grant();");
    try {
      await asUser(alice);await expect(approve(bob,app.submission_id)).rejects.toThrow(/Injected role grant failure/i);await db.exec('reset role');
      expect((await db.query('select state from public.provider_applications where owner_id=$1',[bob])).rows[0].state).toBe('submitted');
      expect((await db.query('select count(*)::int as value from public.provider_application_approvals')).rows[0].value).toBe(0);
      expect((await db.query("select count(*)::int as value from public.account_roles where user_id=$1 and role='provider'",[bob])).rows[0].value).toBe(0);
    } finally {await db.exec('reset role; drop trigger test_provider_grant_failure on public.account_roles; drop function public.test_reject_provider_grant();');}
    await asUser(alice);expect((await approve(bob,app.submission_id)).rows[0].state).toBe('approved');
  });
});


test.describe('own Administrator approval history',()=>{
  const applicants=Array.from({length:4},(_,index)=>`77777777-7777-4777-8777-${String(index+1).padStart(12,'0')}`);
  test.afterEach(async()=>{
    await db.exec('reset role');
    for(const id of applicants)await db.query('delete from auth.users where id=$1',[id]);
    await db.query("delete from public.account_roles where user_id in ($1,$2) and role<>'user'",[alice,bob]);
  });
  async function decisions() {
    await db.exec('reset role');
    for(const reviewer of [alice,bob]) {
      await db.query("insert into public.account_roles(user_id,role) values($1,'admin') on conflict do nothing",[reviewer]);
      await db.query("insert into public.staff_capabilities(user_id,capability) values($1,'provider_application_review'),($1,'provider_application_approval')",[reviewer]);
    }
    for(const [index,id] of applicants.entries()) {
      await db.exec('reset role');await db.query('insert into auth.users(id) values($1)',[id]);await asUser(id);
      await db.query('select * from public.save_provider_application($1,$2,$3,$4)',[id,`History applicant ${index+1}`,'Vancouver','Private submitted text not returned in history lists.']);
      const app=(await db.query('select * from public.submit_provider_application($1)',[id])).rows[0];
      const reviewer=index===3?bob:alice;await asUser(reviewer);
      await db.query('select * from public.approve_provider_application($1,$2,$3)',[reviewer,id,app.submission_id]);
    }
    await asUser(alice);
  }
  const history=(reviewer=alice,limit=2,time=null,id=null)=>db.query('select * from public.list_my_provider_approvals($1,$2,$3,$4)',[reviewer,limit,time,id]);
  test('history returns only decisions by the actual reviewer with stable pagination and minimal fields',async()=>{
    await decisions();const first=(await history()).rows;expect(first).toHaveLength(2);
    const next=(await history(alice,2,first.at(-1).approved_at,first.at(-1).approval_id)).rows;expect(next).toHaveLength(1);
    const all=[...first,...next];expect(new Set(all.map(row=>row.approval_id)).size).toBe(3);
    expect(all.map(row=>row.owner_id).sort()).toEqual(applicants.slice(0,3).sort());
    expect(Object.hasOwn(first[0],'introduction')).toBe(false);expect(Object.hasOwn(first[0],'reviewer_id')).toBe(false);
    await db.exec('reset role');expect((await db.query("select count(*)::int as value from public.provider_review_access_events where reviewer_id=$1 and action='approval_history_list'",[alice])).rows[0].value).toBe(2);
  });
  test('forged actor, removed approval capability, Moderator membership and anonymous calls cannot read history',async()=>{
    await decisions();await expect(history(bob)).rejects.toThrow(/account changed/i);
    await db.exec('reset role');await db.query("delete from public.staff_capabilities where user_id=$1 and capability='provider_application_approval'",[alice]);await asUser(alice);
    await expect(history()).rejects.toThrow(/administrator approval access/i);
    await db.exec('reset role');await db.query("insert into public.staff_capabilities(user_id,capability) values($1,'provider_application_approval')",[alice]);await db.query("update public.account_roles set role='moderator' where user_id=$1 and role='admin'",[alice]);await asUser(alice);
    await expect(history()).rejects.toThrow(/administrator approval access/i);
    await asUser('','anon');await expect(history()).rejects.toThrow(/permission denied/i);
  });
  test('history bounds requests and rejects incomplete cursors without rewriting decisions or grants',async()=>{
    await decisions();await expect(history(alice,51)).rejects.toThrow(/page size/i);await expect(history(alice,2,'2030-01-01T00:00:00Z')).rejects.toThrow(/page cursor/i);
    await db.exec('reset role');const before=(await db.query('select count(*)::int as value from public.provider_application_approvals')).rows[0].value;
    await asUser(alice);await history();await db.exec('reset role');expect((await db.query('select count(*)::int as value from public.provider_application_approvals')).rows[0].value).toBe(before);
    expect((await db.query("select count(*)::int as value from public.account_roles where user_id=$1 and role in ('user','provider')",[applicants[0]])).rows[0].value).toBe(2);
    await db.query("delete from public.account_roles where user_id=$1 and role='provider'",[applicants[0]]);
    await asUser(alice);expect((await history(alice,50)).rows.some(row=>row.owner_id===applicants[0])).toBe(true);await db.exec('reset role');
    expect((await db.query("select count(*)::int as value from public.account_roles where user_id=$1 and role='provider'",[applicants[0]])).rows[0].value).toBe(0);
  });
});


test.describe('scoped pending application search',()=>{
  const applicants=Array.from({length:4},(_,index)=>`99999999-9999-4999-8999-${String(index+1).padStart(12,'0')}`);
  test.afterEach(async()=>{await db.exec('reset role');for(const id of applicants)await db.query('delete from auth.users where id=$1',[id]);await db.query("delete from public.account_roles where user_id=$1 and role='moderator'",[alice]);});
  async function queue() {
    for(const [index,id] of applicants.entries()) {
      await db.exec('reset role');await db.query('insert into auth.users(id) values($1)',[id]);await asUser(id);
      await db.query('select * from public.save_provider_application($1,$2,$3,$4)',[id,['Coastal Gallery','Literal %_ Applicant','Remote Applicant','Unsubmitted Draft'][index],index===1?'Toronto':'Vancouver','HIDDEN_INTRO_ONLY should not be searchable here.']);
      if(index<3)await db.query('select * from public.submit_provider_application($1)',[id]);
    }
    await db.exec('reset role');await db.query("insert into public.account_roles(user_id,role) values($1,'moderator') on conflict do nothing",[alice]);await db.query("insert into public.staff_capabilities(user_id,capability) values($1,'provider_application_review')",[alice]);await asUser(alice);
  }
  const search=(text,reviewer=alice,limit=21,time=null,id=null)=>db.query('select * from public.search_provider_applications_for_review($1,$2,$3,$4,$5)',[reviewer,text,limit,time,id]);
  test('name/city search is case-insensitive, literal, submitted-only and cursor-stable without exposing introductions',async()=>{
    await queue();const first=(await search('vAnC',alice,1)).rows;expect(first).toHaveLength(1);
    const second=(await search('vanc',alice,1,first[0].submitted_at,first[0].owner_id)).rows;expect(second).toHaveLength(1);expect(second[0].owner_id).not.toBe(first[0].owner_id);
    expect([first[0].owner_id,second[0].owner_id].sort()).toEqual([applicants[0],applicants[2]].sort());
    expect((await search('%_')).rows.map(row=>row.owner_id)).toEqual([applicants[1]]);
    expect((await search('HIDDEN_INTRO_ONLY')).rows).toEqual([]);expect(Object.hasOwn(first[0],'introduction')).toBe(false);
    await db.exec('reset role');const events=(await db.query("select * from public.provider_review_access_events where action='queue_search'")).rows;expect(events).toHaveLength(4);expect(JSON.stringify(events)).not.toContain('HIDDEN_INTRO_ONLY');
  });
  test('search binds the actual reviewer and denies lost roles/scopes, metadata-only authority and anonymous access',async()=>{
    await queue();await expect(search('Vancouver',bob)).rejects.toThrow(/account changed/i);
    await db.exec('reset role');await db.query("delete from public.staff_capabilities where user_id=$1",[alice]);await asUser(alice);await expect(search('Vancouver')).rejects.toThrow(/review access/i);
    await db.exec('reset role');await db.query("insert into public.staff_capabilities(user_id,capability) values($1,'provider_application_review')",[alice]);await db.query("delete from public.account_roles where user_id=$1 and role='moderator'",[alice]);await db.query('update auth.users set raw_user_meta_data=$1 where id=$2',[{role:'admin'},alice]);await asUser(alice);await expect(search('Vancouver')).rejects.toThrow(/review access/i);
    await asUser('','anon');await expect(search('Vancouver')).rejects.toThrow(/permission denied/i);
  });
  test('search bounds text/pages and rejects incomplete cursors without mutating intake or roles',async()=>{
    await queue();await expect(search('x'.repeat(101))).rejects.toThrow(/search text/i);await expect(search(' ')).rejects.toThrow(/search text/i);await expect(search('Van',alice,51)).rejects.toThrow(/page size/i);await expect(search('Van',alice,21,'2030-01-01T00:00:00Z')).rejects.toThrow(/page cursor/i);
    await search('Coastal');await db.exec('reset role');expect((await db.query("select count(*)::int as value from public.provider_applications where state='submitted'")).rows[0].value).toBe(3);expect((await db.query("select count(*)::int as value from public.account_roles where role='provider'")).rows[0].value).toBe(0);
  });
});


test.describe('private public-profile submission copies',()=>{
  async function prepare() {
    await db.exec('reset role');
    await db.query("insert into public.account_roles(user_id,role) values($1,'user'),($1,'provider') on conflict do nothing",[alice]);
    await asUser(alice);await db.exec("insert into public.profile_drafts(display_name,username,adult_age,city,biography,interests) values('Saved Alice','alice-saved',28,'Vancouver','PRIVATE BIOGRAPHY','PRIVATE INTERESTS')");
    return (await db.query('select updated_at from public.profile_drafts')).rows[0].updated_at;
  }
  const submit=(version,owner=alice)=>db.query('select * from public.submit_private_profile_copy($1,$2)',[owner,version]);
  test.afterEach(async()=>{await db.exec('reset role');await db.query("delete from public.account_roles where user_id=$1 and role='provider'",[alice]);await db.query("insert into public.account_roles(user_id,role) values($1,'user') on conflict do nothing",[alice]);});
  test('captures only saved public fields and keeps the recorded version immutable after draft edits',async()=>{
    const version=await prepare();const row=(await submit(version)).rows[0];
    expect(row.public_fields.username).toBe('alice-saved');expect(Object.keys(row.public_fields).sort()).toEqual(['display_name','username','adult_age','tagline','city','area','photo_index'].sort());
    await db.exec("update public.profile_drafts set display_name='Later private edit',biography='Later private biography'");
    expect((await db.query('select public_fields from public.profile_publication_submissions')).rows[0].public_fields.display_name).toBe('Saved Alice');
    await expect(db.exec("update public.profile_publication_submissions set public_fields='{}'")).rejects.toThrow(/permission denied/i);
    await expect(db.exec('delete from public.profile_publication_submissions')).rejects.toThrow(/permission denied/i);
    await expect(db.exec("insert into public.profile_publication_submissions(owner_id,source_updated_at,public_fields) values(auth.uid(),now(),'{}')")).rejects.toThrow(/permission denied/i);
    await expect(submit(version)).rejects.toThrow(/changed|unique/i);
    await db.exec('reset role');expect((await db.query('select count(*)::int as n from public.profile_publication_submissions')).rows[0].n).toBe(1);
  });
  test('rejects forged actors, anonymous reads and cross-owner reads/withdrawal',async()=>{
    const version=await prepare();const row=(await submit(version)).rows[0];
    await expect(submit(version,bob)).rejects.toThrow(/account changed/i);
    await asUser(bob);expect((await db.query('select * from public.profile_publication_submissions')).rows).toEqual([]);
    await expect(db.query('select * from public.withdraw_private_profile_copy($1,$2)',[bob,row.id])).rejects.toThrow(/unavailable/i);
    await asUser('','anon');await expect(db.exec('select * from public.profile_publication_submissions')).rejects.toThrow(/permission denied/i);await expect(submit(version)).rejects.toThrow(/permission denied/i);
  });
  test('requires current actual User and Provider membership, a current source version and saved core identity',async()=>{
    const version=await prepare();await expect(submit(null)).rejects.toThrow(/changed/i);await expect(submit('2000-01-01T00:00:00Z')).rejects.toThrow(/changed/i);
    await db.exec('reset role');await db.query("delete from public.account_roles where user_id=$1 and role='provider'",[alice]);await db.query('update auth.users set raw_user_meta_data=$1 where id=$2',[{role:'provider'},alice]);await asUser(alice);await expect(submit(version)).rejects.toThrow(/membership/i);
    await db.exec('reset role');await db.query("insert into public.account_roles(user_id,role) values($1,'provider')",[alice]);await db.query("delete from public.account_roles where user_id=$1 and role='user'",[alice]);await asUser(alice);await expect(submit(version)).rejects.toThrow(/membership/i);
    await db.exec('reset role');await db.query("insert into public.account_roles(user_id,role) values($1,'user')",[alice]);await asUser(alice);await db.exec("update public.profile_drafts set username='',adult_age=null");const latest=(await db.query('select updated_at from public.profile_drafts')).rows[0].updated_at;await expect(submit(latest)).rejects.toThrow(/username and adult age/i);
    expect((await db.query('select * from public.profile_publication_submissions')).rows).toEqual([]);
  });
  test('bounds pending copies and allows owner withdrawal after Provider revocation without changing the saved draft',async()=>{
    const version=await prepare();const row=(await submit(version)).rows[0];await expect(submit(version)).rejects.toThrow(/unique/i);
    await db.exec('reset role');await db.query("delete from public.account_roles where user_id=$1 and role='provider'",[alice]);await asUser(alice);
    const withdrawn=(await db.query('select * from public.withdraw_private_profile_copy($1,$2)',[alice,row.id])).rows[0];expect(withdrawn.withdrawn_at).toBeTruthy();expect(withdrawn.public_fields.username).toBe('alice-saved');
    await expect(db.query('select * from public.withdraw_private_profile_copy($1,$2)',[alice,row.id])).rejects.toThrow(/unavailable/i);
    expect((await db.query('select username from public.profile_drafts')).rows[0].username).toBe('alice-saved');await expect(submit(version)).rejects.toThrow(/membership/i);
    await db.exec('reset role');await db.query("insert into public.account_roles(user_id,role) values($1,'provider')",[alice]);await asUser(alice);await submit(version);expect((await db.query('select * from public.profile_publication_submissions where withdrawn_at is null')).rows).toHaveLength(1);
  });
});


test.describe('separately scoped profile copy inspection',()=>{
  const owner=index=>`99999999-aaaa-4bbb-8ccc-${String(index).padStart(12,'0')}`;
  const copy=index=>`aaaaaaaa-bbbb-4ccc-8ddd-${String(index).padStart(12,'0')}`;
  async function prepare(){
    await db.exec('reset role');await db.query("delete from public.account_roles where user_id=$1 and role in ('moderator','admin')",[alice]);
    await db.query("insert into public.account_roles(user_id,role) values($1,'moderator')",[alice]);await db.query("insert into public.staff_capabilities(user_id,capability) values($1,'profile_publication_review')",[alice]);
    for(let index=1;index<=23;index++){
      await db.query('insert into auth.users(id) values($1)',[owner(index)]);
      await db.query("insert into public.profile_publication_submissions(id,owner_id,source_updated_at,public_fields,submitted_at,withdrawn_at) values($1,$2,'2026-11-10T19:00:00Z',$3,'2026-11-10T20:00:00Z',$4)",[copy(index),owner(index),{display_name:`Recorded owner ${index}`,username:'recorded-user',adult_age:28,city:'Vancouver',biography:'PRIVATE EXTRA MEMBER KEY'},index===23?'2026-11-10T21:00:00Z':null]);
    }
    await asUser(alice);
  }
  const list=(expected=alice,limit=21,time=null,id=null)=>db.query('select * from public.list_profile_publications_for_review($1,$2,$3,$4)',[expected,limit,time,id]);
  test.afterEach(async()=>{await db.exec('reset role');await db.exec("delete from auth.users where id::text like '99999999-aaaa-4bbb-8ccc-%'");await db.query("delete from public.account_roles where user_id=$1 and role in ('moderator','admin')",[alice]);});
  test('lists only pending metadata with stable keysets and projects detail fields without private extras',async()=>{
    await prepare();expect((await db.query('select public.can_review_profile_publications() as allowed')).rows[0].allowed).toBe(true);
    const rows=(await list()).rows;expect(rows).toHaveLength(21);expect(rows[0].id).toBe(copy(1));expect(Object.keys(rows[0]).sort()).toEqual(['id','owner_id','display_name','city','submitted_at','source_updated_at'].sort());
    const next=(await list(alice,21,rows.at(-1).submitted_at,rows.at(-1).id)).rows;expect(next.map(row=>row.id)).toEqual([copy(22)]);
    const detail=(await db.query('select * from public.get_profile_publication_for_review($1,$2)',[alice,copy(1)])).rows[0];expect(detail.public_fields.username).toBe('recorded-user');expect(detail.public_fields).not.toHaveProperty('biography');
    expect((await db.query('select * from public.get_profile_publication_for_review($1,$2)',[alice,copy(23)])).rows).toEqual([]);
    await db.exec('reset role');const events=(await db.query('select * from public.profile_publication_review_access_events')).rows;expect(events).toHaveLength(3);expect(JSON.stringify(events)).not.toContain('Recorded owner');expect(JSON.stringify(events)).not.toContain('PRIVATE EXTRA');
  });
  test('denies forged actors, missing staff role, metadata-only authority and anonymous inspection',async()=>{
    await prepare();await expect(list(bob)).rejects.toThrow(/account changed/i);
    await db.exec('reset role');await db.query("delete from public.account_roles where user_id=$1 and role='moderator'",[alice]);await db.query('update auth.users set raw_user_meta_data=$1 where id=$2',[{role:'admin',capability:'profile_publication_review'},alice]);await asUser(alice);await expect(list()).rejects.toThrow(/profile review access/i);
    await asUser('','anon');await expect(list()).rejects.toThrow(/permission denied/i);await expect(db.exec('select * from public.profile_publication_submissions')).rejects.toThrow(/permission denied/i);
  });
  test('bounds queue inputs and protects read-audit metadata without granting direct applicant reads or writes',async()=>{
    await prepare();await expect(list(alice,51)).rejects.toThrow(/page size/i);await expect(list(alice,0)).rejects.toThrow(/page size/i);await expect(list(alice,21,'2026-11-10T20:00:00Z')).rejects.toThrow(/page cursor/i);
    expect((await db.query('select * from public.profile_publication_submissions')).rows).toEqual([]);await list();
    for(const sql of ['select * from public.profile_publication_review_access_events',"insert into public.profile_publication_review_access_events(reviewer_id,action) values(auth.uid(),'queue_list')",'delete from public.profile_publication_review_access_events',"update public.profile_publication_review_access_events set action='copy_opened'"]){await expect(db.exec(sql)).rejects.toThrow(/permission denied/i);}
    await db.exec('reset role');expect((await db.query('select count(*)::int as n from public.profile_publication_submissions where withdrawn_at is null')).rows[0].n).toBe(22);expect((await db.query("select * from public.account_roles where role='provider'")).rows).toEqual([]);
  });
  test('existing intake approval scopes never substitute for profile inspection and scope revocation takes effect on the next read',async()=>{
    await prepare();await db.exec('reset role');await db.query("delete from public.staff_capabilities where user_id=$1",[alice]);await db.query("delete from public.account_roles where user_id=$1 and role='moderator'",[alice]);await db.query("insert into public.account_roles(user_id,role) values($1,'admin')",[alice]);
    for(const capability of ['provider_application_review','provider_application_feedback','provider_application_approval'])await db.query('insert into public.staff_capabilities(user_id,capability) values($1,$2)',[alice,capability]);
    await asUser(alice);expect((await db.query('select public.can_approve_provider_applications() as allowed')).rows[0].allowed).toBe(true);await expect(list()).rejects.toThrow(/profile review access/i);
    await db.exec('reset role');await db.query("insert into public.staff_capabilities(user_id,capability) values($1,'profile_publication_review')",[alice]);await asUser(alice);await list();
    await db.exec('reset role');await db.query("delete from public.staff_capabilities where user_id=$1 and capability='profile_publication_review'",[alice]);await asUser(alice);await expect(list()).rejects.toThrow(/profile review access/i);expect((await db.query('select public.can_approve_provider_applications() as allowed')).rows[0].allowed).toBe(true);
  });
});

test.describe('scoped pending profile-copy search',()=>{
  async function prepare(){
    await db.exec('reset role');await db.query("delete from public.account_roles where user_id=$1 and role in ('moderator','admin')",[alice]);await db.query("insert into public.account_roles(user_id,role) values($1,'moderator')",[alice]);await db.query("insert into public.staff_capabilities(user_id,capability) values($1,'profile_publication_review')",[alice]);
    for(const [id,owner,fields,withdrawn] of [
      ['11111111-aaaa-4aaa-8aaa-111111111111',alice,{display_name:'Coastal %_ copy',city:'Vancouver',username:'HIDDEN_ONLY',tagline:'HIDDEN_ONLY'},null],
      ['22222222-aaaa-4aaa-8aaa-222222222222',bob,{display_name:'Remote copy',city:'Vancouver'},null],
      ['33333333-aaaa-4aaa-8aaa-333333333333',alice,{display_name:'Withdrawn needle',city:'Toronto'},'2026-11-13T13:00:00Z'],
    ])await db.query("insert into public.profile_publication_submissions(id,owner_id,source_updated_at,submitted_at,public_fields,withdrawn_at) values($1,$2,'2026-11-13T11:00:00Z','2026-11-13T12:00:00Z',$3,$4)",[id,owner,fields,withdrawn]);
    await asUser(alice);
  }
  const search=(query,expected=alice,limit=21,time=null,id=null)=>db.query('select * from public.search_profile_publications_for_review($1,$2,$3,$4,$5)',[expected,query,limit,time,id]);
  test.afterEach(async()=>{await db.exec('reset role');await db.query("delete from public.account_roles where user_id=$1 and role in ('moderator','admin')",[alice]);});
  test('matches only pending name/city literals with stable cursor pages and metadata-only read events',async()=>{
    await prepare();const first=(await search('vAnCoUvEr',alice,1)).rows;expect(first).toHaveLength(1);const next=(await search('vAnCoUvEr',alice,1,first[0].submitted_at,first[0].id)).rows;expect(next).toHaveLength(1);expect(next[0].id).not.toBe(first[0].id);
    expect((await search('%_')).rows.map(row=>row.display_name)).toEqual(['Coastal %_ copy']);expect((await search('HIDDEN_ONLY')).rows).toEqual([]);expect((await search('Withdrawn needle')).rows).toEqual([]);expect(first[0]).not.toHaveProperty('public_fields');
    await db.exec('reset role');const events=(await db.query("select * from public.profile_publication_review_access_events where action='queue_search'")).rows;expect(events).toHaveLength(5);expect(JSON.stringify(events)).not.toContain('vAnCoUvEr');expect(JSON.stringify(events)).not.toContain('Coastal');
  });
  test('rechecks actual actor and review authority and denies metadata claims, revoked scope and anonymous calls',async()=>{
    await prepare();await expect(search('Vancouver',bob)).rejects.toThrow(/account changed/i);
    await db.exec('reset role');await db.query("delete from public.staff_capabilities where user_id=$1",[alice]);await asUser(alice);await expect(search('Vancouver')).rejects.toThrow(/profile review access/i);
    await db.exec('reset role');await db.query("insert into public.staff_capabilities(user_id,capability) values($1,'profile_publication_review')",[alice]);await db.query("delete from public.account_roles where user_id=$1 and role='moderator'",[alice]);await db.query('update auth.users set raw_user_meta_data=$1 where id=$2',[{role:'admin'},alice]);await asUser(alice);await expect(search('Vancouver')).rejects.toThrow(/profile review access/i);
    await asUser('','anon');await expect(search('Vancouver')).rejects.toThrow(/permission denied/i);
  });
  test('bounds text/pages/cursors and changes no profile, withdrawal or membership state',async()=>{
    await prepare();await expect(search(null)).rejects.toThrow(/search text/i);await expect(search(' ')).rejects.toThrow(/search text/i);await expect(search('x'.repeat(101))).rejects.toThrow(/search text/i);await expect(search('Van',alice,51)).rejects.toThrow(/page size/i);await expect(search('Van',alice,21,'2026-11-13T12:00:00Z')).rejects.toThrow(/page cursor/i);
    await search('Van');await db.exec('reset role');expect((await db.query('select count(*)::int as n from public.profile_publication_submissions where withdrawn_at is null')).rows[0].n).toBe(2);expect((await db.query("select * from public.account_roles where role='provider'")).rows).toEqual([]);
  });
});
