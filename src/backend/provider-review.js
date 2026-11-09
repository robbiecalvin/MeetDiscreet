import { backendClient, requireUser } from './client.js';
export async function loadProviderReviewAccess() {
  const user = await requireUser();
  const { data, error } = await backendClient().rpc('can_review_provider_applications');
  if (error || typeof data !== 'boolean') throw new Error('Review permissions unavailable.');
  return { reviewerId: user.id, allowed: data };
}
async function verifyActor(expected) {
  const user = await requireUser();
  if (user.id !== expected) throw new Error('Reviewer account changed.');
}
export async function listProviderReviewQueue(reviewerId, cursor = null) {
  await verifyActor(reviewerId);
  const { data, error } = await backendClient().rpc('list_provider_applications_for_review', {
    p_expected_reviewer: reviewerId, p_limit: 21,
    p_after_submitted_at: cursor?.submitted_at ?? null, p_after_owner: cursor?.owner_id ?? null,
  });
  if (error || !Array.isArray(data)) throw new Error('Review queue unavailable.');
  return data;
}
export async function loadProviderReviewDetail(reviewerId, ownerId) {
  await verifyActor(reviewerId);
  const { data, error } = await backendClient().rpc('get_provider_application_for_review', { p_expected_reviewer: reviewerId, p_owner: ownerId }).maybeSingle();
  if (error) throw new Error('Review detail unavailable.');
  return data;
}
