import { backendClient, requireUser } from './client.js';

function failure(error) {
  if (error) throw new Error('Private draft operation failed. Check the connection and database migration, then retry.');
}
export async function loadProfileDraft() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('profile_drafts').select('*').eq('owner_id', user.id).maybeSingle();
  failure(error);
  if (!data) return null;
  return { name: data.display_name, username: data.username, age: data.adult_age === null ? '' : String(data.adult_age), tagline: data.tagline, city: data.city, area: data.area, photo: String(data.photo_index), bio: data.biography, interests: data.interests };
}
export async function saveProfileDraft(draft) {
  const user = await requireUser();
  const { error } = await backendClient().from('profile_drafts').upsert({
    owner_id: user.id, display_name: draft.name.trim(), username: draft.username.trim(),
    adult_age: draft.age === '' ? null : Number(draft.age), tagline: draft.tagline.trim(), city: draft.city,
    area: draft.area.trim(), photo_index: Number(draft.photo), biography: draft.bio.trim(), interests: draft.interests.trim(),
  }, { onConflict: 'owner_id' });
  failure(error);
}
export async function listListingDrafts() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('listing_drafts').select('*').eq('owner_id', user.id).order('updated_at', { ascending: false });
  failure(error);
  return data;
}
export async function saveListingDraft(draft, id) {
  const user = await requireUser();
  const payload = { owner_id: user.id, kind: draft.category, title: draft.title.trim(), description: draft.description.trim(), city: draft.city, area: draft.area.trim(), activity: draft.activity };
  const query = id ? backendClient().from('listing_drafts').update(payload).eq('id', id).eq('owner_id', user.id) : backendClient().from('listing_drafts').insert(payload);
  const { data, error } = await query.select('id').single();
  failure(error);
  return data.id;
}

export async function deleteListingDraft(id) {
  const user = await requireUser();
  const { data, error } = await backendClient().from('listing_drafts').delete().eq('id', id).eq('owner_id', user.id).select('id').single();
  failure(error);
  return data.id;
}

export async function deleteProfileDraft() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('profile_drafts').delete().eq('owner_id', user.id).select('owner_id').maybeSingle();
  failure(error);
  return Boolean(data);
}

export async function saveExperienceDraft(items) {
  const user = await requireUser();
  const payload = items.map(({ title, description, offered, included, minor, feeType }) => ({ title, description, offered, included, minor, feeType }));
  const { error } = await backendClient().from('experience_catalogue_drafts').upsert({ owner_id: user.id, items: payload }, { onConflict: 'owner_id' });
  failure(error);
}
export async function loadExperienceDraft() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('experience_catalogue_drafts').select('items').eq('owner_id', user.id).maybeSingle();
  failure(error);
  return data?.items ?? null;
}
