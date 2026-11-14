import { backendClient, requireUser } from './client.js';
async function verify(reviewer) {
  if ((await requireUser()).id !== reviewer) throw new Error('Reviewer changed.');
}
export async function loadProfileApproval(reviewer, id) {
  await verify(reviewer);
  const client = backendClient();
  const [access, approval] = await Promise.all([
    client.rpc('can_approve_marketplace_publications'),
    client.rpc('get_profile_editorial_approval', { p_expected_reviewer: reviewer, p_submission: id }).maybeSingle(),
  ]);
  if (access.error || typeof access.data !== 'boolean' || approval.error || (approval.data && approval.data.submission_id !== id)) throw new Error('Approval status unavailable.');
  await verify(reviewer);
  return { allowed: access.data, approval: approval.data };
}
export async function approveProfileCopy(reviewer, id) {
  await verify(reviewer);
  const { data, error } = await backendClient().rpc('approve_profile_editorial_copy', { p_expected_reviewer: reviewer, p_submission: id }).single();
  if (error || !data || data.submission_id !== id) throw new Error('Approval could not be confirmed.');
  await verify(reviewer);
  return data;
}
