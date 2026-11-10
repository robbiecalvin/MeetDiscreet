import { backendClient, requireUser } from './client.js';
async function verify(owner) { if ((await requireUser()).id !== owner) throw new Error('Account changed.'); }
export async function loadPendingProfileSubmission(owner) {
  await verify(owner);
  const { data, error } = await backendClient().from('profile_publication_submissions').select('id,owner_id,public_fields,submitted_at,source_updated_at,withdrawn_at').eq('owner_id', owner).is('withdrawn_at', null).maybeSingle();
  if (error || (data && (data.owner_id !== owner || data.withdrawn_at !== null))) throw new Error('Private submission unavailable.');
  await verify(owner); return data;
}
async function change(owner, name, fields) {
  await verify(owner);
  const { data, error } = await backendClient().rpc(name, {p_expected_owner:owner, ...fields}).single();
  if (error || !data || data.owner_id !== owner) throw new Error('Private submission operation could not be confirmed.');
  await verify(owner); return data;
}
export function submitPrivateProfileCopy(owner, version) { return change(owner, 'submit_private_profile_copy', {p_source_updated_at:version}); }
export function withdrawPrivateProfileCopy(owner, id) { return change(owner, 'withdraw_private_profile_copy', {p_submission:id}); }
