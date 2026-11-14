import { backendClient, requireUser } from './client.js';
export async function loadOwnPublishingReadiness(owner) {
  if ((await requireUser()).id !== owner) throw new Error('Account changed.');
  const { data, error } = await backendClient().rpc('get_own_marketplace_publishing_readiness', { p_expected_owner: owner }).single();
  if (error || !data || ['user_member', 'provider_member', 'publishing_eligible', 'public_activation_connected', 'public_activation_enabled'].some(key => typeof data[key] !== 'boolean') || ['approved_profile_copies', 'approved_offering_copies', 'approved_looking_copies'].some(key => !Number.isSafeInteger(data[key]) || data[key] < 0)) throw new Error('Publishing readiness unavailable.');
  if ((await requireUser()).id !== owner) throw new Error('Account changed.');
  return data;
}
