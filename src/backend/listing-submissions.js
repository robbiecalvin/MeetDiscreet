import { backendClient, requireUser } from './client.js';
const columns = 'id,owner_id,source_listing_id,source_updated_at,kind,recorded_fields,submitted_at,withdrawn_at';
async function verify(owner) {
  if ((await requireUser()).id !== owner) throw new Error('Account changed.');
}
export async function loadListingSubmissionReview(owner, listing) {
  await verify(owner);
  const client = backendClient();
  const [saved, pending] = await Promise.all([
    client.from('listing_drafts').select('id,owner_id,kind,title,description,city,area,activity,updated_at').eq('owner_id', owner).eq('id', listing).maybeSingle(),
    client.from('listing_publication_submissions').select(columns).eq('owner_id', owner).eq('source_listing_id', listing).is('withdrawn_at', null).maybeSingle(),
  ]);
  if (saved.error || pending.error || (saved.data && saved.data.owner_id !== owner) || (pending.data && (pending.data.owner_id !== owner || pending.data.source_listing_id !== listing))) throw new Error('Listing review unavailable.');
  await verify(owner);
  return { saved: saved.data, pending: pending.data };
}
async function change(owner, name, fields) {
  await verify(owner);
  const { data, error } = await backendClient().rpc(name, { p_expected_owner: owner, ...fields }).single();
  if (error || !data || data.owner_id !== owner) throw new Error('Submission could not be confirmed.');
  await verify(owner); return data;
}
export function submitListingCopy(owner, listing, version) {
  return change(owner, 'submit_private_listing_copy', { p_listing: listing, p_source_updated_at: version });
}
export function withdrawListingCopy(owner, submission) {
  return change(owner, 'withdraw_private_listing_copy', { p_submission: submission });
}
