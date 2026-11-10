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
export async function listProviderReviewQueue(reviewerId, cursor = null, query = '') {
  await verifyActor(reviewerId);
  const needle = query.trim();
  const { data, error } = await backendClient().rpc(needle ? 'search_provider_applications_for_review' : 'list_provider_applications_for_review', {
    ...(needle ? {p_query:needle} : {}),
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

export async function loadProviderFeedbackAccess(reviewerId) {
  await verifyActor(reviewerId);
  const { data, error } = await backendClient().rpc('can_request_provider_application_changes');
  if (error || typeof data !== 'boolean') throw new Error('Feedback access unavailable.');
  return data;
}
export async function requestProviderChanges(reviewerId, ownerId, submissionId, note) {
  await verifyActor(reviewerId);
  const { data, error } = await backendClient().rpc('request_provider_application_changes', {
    p_expected_reviewer: reviewerId, p_owner: ownerId, p_submission: submissionId, p_note: note.trim(),
  }).single();
  if (error || !data || data.owner_id !== ownerId || data.state !== 'changes_requested') throw new Error('Change request failed.');
  return data;
}

export async function loadProviderApprovalAccess(reviewerId) {
  await verifyActor(reviewerId);
  const { data, error } = await backendClient().rpc('can_approve_provider_applications');
  if (error || typeof data !== 'boolean') throw new Error('Approval access unavailable.');
  return data;
}
export async function approveProviderApplication(reviewerId, ownerId, submissionId) {
  await verifyActor(reviewerId);
  const { data, error } = await backendClient().rpc('approve_provider_application', {
    p_expected_reviewer: reviewerId, p_owner: ownerId, p_submission: submissionId,
  }).single();
  if (error || !data || data.owner_id !== ownerId || data.state !== 'approved' || data.submission_id !== submissionId) throw new Error('Approval failed.');
  return data;
}

export async function listOwnProviderApprovals(reviewerId, cursor = null) {
  await verifyActor(reviewerId);
  const { data, error } = await backendClient().rpc('list_my_provider_approvals', {
    p_expected_reviewer: reviewerId, p_limit: 21,
    p_before_approved_at: cursor?.approved_at ?? null, p_before_id: cursor?.approval_id ?? null,
  });
  if (error || !Array.isArray(data)) throw new Error('Approval history unavailable.');
  return data;
}
