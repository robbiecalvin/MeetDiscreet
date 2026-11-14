import { backendClient, requireUser } from './client.js';
async function verify(actor) { if ((await requireUser()).id !== actor) throw new Error('Administrator changed.'); }
export async function loadPilotManagementAccess() {
  const user = await requireUser(); const { data, error } = await backendClient().rpc('can_manage_marketplace_pilot');
  if (error || typeof data !== 'boolean') throw new Error('Access unavailable.');
  await verify(user.id); return { actorId: user.id, allowed: data };
}
export async function loadPilotEligibility(actor, target) {
  await verify(actor);
  const { data, error } = await backendClient().rpc('get_pilot_publishing_eligibility', { p_expected_actor: actor, p_target: target }).single();
  if (error || !data || data.owner_id !== target || typeof data.provider_member !== 'boolean' || typeof data.pilot_record !== 'boolean') throw new Error('Eligibility unavailable.');
  await verify(actor); return data;
}
export async function changePilotEligibility(actor, target, revision, until, revoke) {
  await verify(actor);
  const { data, error } = await backendClient().rpc('set_pilot_publishing_eligibility', {
    p_expected_actor: actor, p_target: target, p_expected_revision: revision, p_valid_until: until, p_revoke: revoke,
  }).single();
  if (error || !data || data.owner_id !== target) throw new Error('Operation could not be confirmed.');
  await verify(actor); return data;
}
