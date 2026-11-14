import { backendClient, requireUser } from './client.js';
async function request(owner, kind, id, operation, extra = {}) {
  if ((await requireUser()).id !== owner) throw new Error('Owner changed.');
  const { data, error } = await backendClient().rpc(operation, { p_expected_owner: owner, p_kind: kind, p_approved_submission: id, ...extra }).single();
  if (error || !data || typeof data.requested_visible !== 'boolean') throw new Error('Visibility selection unavailable.');
  if ((await requireUser()).id !== owner) throw new Error('Owner changed.'); return data;
}
export function loadPilotVisibility(owner, kind, id) { return request(owner, kind, id, 'get_own_pilot_visibility'); }
export function setPilotVisibility(owner, kind, id, revision, visible) {
  return request(owner, kind, id, 'set_own_pilot_visibility', { p_expected_revision: revision, p_visible: visible });
}
