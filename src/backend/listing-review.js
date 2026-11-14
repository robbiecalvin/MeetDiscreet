import { backendClient, requireUser } from './client.js';
async function verify(reviewer) { if ((await requireUser()).id !== reviewer) throw new Error('Reviewer changed.'); }
export async function loadListingReviewAccess() {
  const user = await requireUser(); const { data, error } = await backendClient().rpc('can_review_listing_publications');
  if (error || typeof data !== 'boolean') throw new Error('Review access unavailable.');
  await verify(user.id); return { reviewerId: user.id, allowed: data };
}
export async function listListingReviewQueue(reviewer, cursor = null) {
  await verify(reviewer);
  const { data, error } = await backendClient().rpc('list_listing_publications_for_review', { p_expected_reviewer: reviewer, p_after_time: cursor?.submitted_at ?? null, p_after_id: cursor?.id ?? null });
  if (error || !Array.isArray(data)) throw new Error('Queue unavailable.'); await verify(reviewer); return data;
}
export async function loadListingReviewCopy(reviewer, id) {
  await verify(reviewer);
  const [copy, access] = await Promise.all([
    backendClient().rpc('get_listing_publication_for_review', { p_expected_reviewer: reviewer, p_submission: id }).maybeSingle(),
    backendClient().rpc('can_approve_marketplace_publications'),
  ]);
  if (copy.error || access.error || typeof access.data !== 'boolean' || (copy.data && copy.data.id !== id)) throw new Error('Copy unavailable.');
  await verify(reviewer); return { copy: copy.data, canApprove: access.data };
}
export async function approveListingCopy(reviewer, id) {
  await verify(reviewer);
  const { data, error } = await backendClient().rpc('approve_listing_editorial_copy', { p_expected_reviewer: reviewer, p_submission: id }).single();
  if (error || !data || data.submission_id !== id) throw new Error('Approval could not be confirmed.');
  await verify(reviewer); return data;
}
