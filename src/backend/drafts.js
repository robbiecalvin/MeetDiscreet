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
// The library needs card metadata, not descriptions or a partial search corpus.
export async function listListingDraftSummaries() {
  const user = await requireUser();
  const { data, count, error } = await backendClient().from('listing_drafts')
    .select('id,owner_id,kind,title,city,area,activity,updated_at', { count: 'exact' })
    .eq('owner_id', user.id).order('updated_at', { ascending: false }).order('id', { ascending: false }).limit(1000);
  failure(error);
  if (!Array.isArray(data) || !Number.isSafeInteger(count) || count < 0 || count > 1000 || data.length !== count || data.some(row => row.owner_id !== user.id)) {
    throw new Error('Complete listing summary unavailable.');
  }
  const verified = await requireUser();
  if (verified.id !== user.id) throw new Error('Account changed.');
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

export async function deleteExperienceDraft() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('experience_catalogue_drafts').delete().eq('owner_id', user.id).select('owner_id').maybeSingle();
  failure(error);
  return Boolean(data);
}

export async function loadPrivateDraftSummary(kind) {
  const user = await requireUser();
  if (kind === 'user-profile') {
    const { data, error } = await backendClient().from('user_profile_drafts').select('owner_id').eq('owner_id', user.id).maybeSingle();
    failure(error);
    return data ? 'Private User profile draft saved' : 'No saved User profile draft';
  }
  if (kind === 'booking-plan') {
    const { data, error } = await backendClient().from('booking_plan_drafts').select('owner_id').eq('owner_id', user.id).maybeSingle();
    failure(error);
    return data ? 'Private booking plan saved' : 'No saved booking plan';
  }
  if (kind === 'profile') {
    const { data, error } = await backendClient().from('profile_drafts').select('owner_id').eq('owner_id', user.id).maybeSingle();
    failure(error);
    return data ? 'Private profile draft saved' : 'No saved profile draft';
  }
  if (kind === 'looking-listings') {
    const { count, error } = await backendClient().from('listing_drafts').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).eq('kind', 'looking');
    failure(error);
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Draft count unavailable.');
    return `${count} saved private Looking For ${count === 1 ? 'draft' : 'drafts'}`;
  }
  if (kind === 'listings') {
    const { count, error } = await backendClient().from('listing_drafts').select('id', { count: 'exact', head: true }).eq('owner_id', user.id);
    failure(error);
    if (count === null) throw new Error('Draft count unavailable.');
    return `${count} saved private listing ${count === 1 ? 'draft' : 'drafts'}`;
  }
  if (kind === 'experiences') {
    const { data, error } = await backendClient().from('experience_catalogue_drafts').select('items').eq('owner_id', user.id).maybeSingle();
    failure(error);
    return data ? `${data.items.length} saved catalogue ${data.items.length === 1 ? 'item' : 'items'}` : 'No saved experience catalogue';
  }
  if (kind === 'availability') {
    const data = await loadAvailabilityDraft();
    return data ? `${data.windows.length} saved weekly ${data.windows.length === 1 ? 'window' : 'windows'} · ${data.time_zone}` : 'No saved availability draft';
  }
  throw new Error('Unknown draft type.');
}

export async function loadListingDraft(id) {
  const user = await requireUser();
  const { data, error } = await backendClient().from('listing_drafts').select('*').eq('owner_id', user.id).eq('id', id).maybeSingle();
  failure(error);
  return data;
}

export async function saveAvailabilityDraft(schedule) {
  const user = await requireUser();
  const windows = schedule.windows.map(({ day, start, end }) => ({ day, start, end }));
  const { error } = await backendClient().from('availability_drafts').upsert({ owner_id: user.id, time_zone: schedule.timeZone, windows }, { onConflict: 'owner_id' });
  failure(error);
}
export async function loadAvailabilityDraft() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('availability_drafts').select('time_zone,windows').eq('owner_id', user.id).maybeSingle();
  failure(error);
  return data;
}
export async function deleteAvailabilityDraft() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('availability_drafts').delete().eq('owner_id', user.id).select('owner_id').maybeSingle();
  failure(error);
  return Boolean(data);
}

export async function saveUserProfileDraft(draft) {
  const user = await requireUser();
  const { error } = await backendClient().from('user_profile_drafts').upsert({
    owner_id: user.id, username: draft.username.trim(), adult_age: draft.age === '' ? null : Number(draft.age),
    display_name: draft.name.trim(), city: draft.city.trim(), prefer_not_to_say: draft.preferNot,
    gender_description: draft.preferNot ? '' : draft.gender.trim(), interests: draft.interests.trim(),
    languages: draft.languages.trim(), looking_for: draft.lookingFor.trim(), enjoys: draft.enjoys.trim(),
  }, { onConflict: 'owner_id' });
  failure(error);
}
export async function loadUserProfileDraft() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('user_profile_drafts').select('*').eq('owner_id', user.id).maybeSingle();
  failure(error);
  return data ? { username: data.username, age: data.adult_age === null ? '' : String(data.adult_age), name: data.display_name, city: data.city, preferNot: data.prefer_not_to_say, gender: data.gender_description, interests: data.interests, languages: data.languages, lookingFor: data.looking_for, enjoys: data.enjoys } : null;
}
export async function deleteUserProfileDraft() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('user_profile_drafts').delete().eq('owner_id', user.id).select('owner_id').maybeSingle();
  failure(error);
  return Boolean(data);
}
