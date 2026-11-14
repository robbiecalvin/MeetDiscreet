import { backendClient, requireUser } from './client.js';
export async function loadVisibilityDiagnostics(owner, kind, id) {
  if ((await requireUser()).id !== owner) throw new Error('Owner changed.');
  const { data, error } = await backendClient().rpc('get_own_pilot_visibility_diagnostics', { p_expected_owner: owner, p_kind: kind, p_approved_submission: id }).single();
  const flags = ['directory_enabled', 'user_member', 'provider_member', 'pilot_eligible', 'copy_selected', 'selection_visible', 'profile_visible', 'visible_now'];
  if (error || !data || flags.some(key => typeof data[key] !== 'boolean') || !Number.isSafeInteger(data.offering_selection_count) || data.offering_selection_count < 0) throw new Error('Diagnostics unavailable.');
  if ((await requireUser()).id !== owner) throw new Error('Owner changed.'); return data;
}
