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
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    insert into auth.users values ('${alice}'), ('${bob}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;`);
  await db.exec(await readFile(new URL('../supabase/migrations/202611080001_private_drafts.sql', import.meta.url), 'utf8'));
});
test.afterAll(async () => { await db.close(); });
test.beforeEach(async () => {
  await db.exec('reset role; truncate public.listing_drafts, public.profile_drafts;');
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
