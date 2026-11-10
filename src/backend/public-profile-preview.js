import { backendClient, requireUser } from './client.js';
// This is an owner-only projection of a private draft, never a public profile read.
export async function loadSavedPublicProfilePreview(ownerId) {
  const user = await requireUser();
  if (user.id !== ownerId) throw new Error('Account changed.');
  const { data, error } = await backendClient().from('profile_drafts')
    .select('owner_id,display_name,username,adult_age,tagline,city,area,photo_index,updated_at')
    .eq('owner_id', user.id).maybeSingle();
  if (error || (data && data.owner_id !== user.id)) throw new Error('Saved preview unavailable.');
  const verified = await requireUser();
  if (verified.id !== user.id) throw new Error('Account changed.');
  if (!data) return null;
  const { display_name, username, adult_age, tagline, city, area, photo_index, updated_at } = data;
  return { display_name, username, adult_age, tagline, city, area, photo_index, updated_at };
}
