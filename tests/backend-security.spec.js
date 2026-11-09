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
});
test.afterAll(async () => { await db.close(); });
test.beforeEach(async () => {
  await db.exec('reset role; truncate public.booking_plan_drafts, public.listing_drafts, public.profile_drafts, public.experience_catalogue_drafts, public.availability_drafts, public.user_profile_drafts, public.provider_applications, public.provider_application_events, public.provider_application_submissions, public.provider_application_feedback, public.staff_capabilities, public.staff_capability_events, public.provider_review_access_events;');
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
  await expect(save('Changed', 'Toronto', 'Cannot edit a submitted request.')).rejects.toThrow(/withdraw/i);
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
