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

export async function loadProfileSubmissionHistory(owner, cursor = null) {
  await verify(owner);
  let query = backendClient().from('profile_publication_submissions')
    .select('id,owner_id,public_fields,submitted_at,source_updated_at,withdrawn_at')
    .eq('owner_id', owner).order('submitted_at', {ascending:false}).order('id', {ascending:false}).limit(21);
  if (cursor) {
    // Preserve database microseconds in the keyset, without admitting filter syntax.
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(cursor.submitted_at) || !Number.isFinite(Date.parse(cursor.submitted_at)) || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(cursor.id)) throw new Error('Invalid history cursor.');
    query = query.or(`submitted_at.lt.${cursor.submitted_at},and(submitted_at.eq.${cursor.submitted_at},id.lt.${cursor.id})`);
  }
  const {data,error} = await query;
  if(error || !Array.isArray(data) || data.some(row=>row.owner_id!==owner)) throw new Error('Private submission history unavailable.');
  await verify(owner); return data;
}
