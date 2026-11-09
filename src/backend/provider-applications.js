import { backendClient, requireUser } from './client.js';
async function actor(expectedOwner) {
  const user = await requireUser();
  if (user.id !== expectedOwner) throw new Error('Account changed.');
  return user;
}
export async function loadProviderApplication() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('provider_applications').select('*').eq('owner_id', user.id).maybeSingle();
  if (error) throw new Error('Application unavailable.');
  return { ownerId: user.id, application: data };
}
async function change(expectedOwner, name, fields = {}) {
  await actor(expectedOwner);
  const { data, error } = await backendClient().rpc(name, { p_expected_owner: expectedOwner, ...fields }).single();
  if (error || !data || data.owner_id !== expectedOwner) throw new Error('Application operation failed.');
  return data;
}
export function saveProviderApplication(ownerId, draft) {
  return change(ownerId, 'save_provider_application', { p_display_name: draft.name.trim(), p_city: draft.city.trim(), p_introduction: draft.introduction.trim() });
}
export function submitProviderApplication(ownerId) { return change(ownerId, 'submit_provider_application'); }
export function withdrawProviderApplication(ownerId) { return change(ownerId, 'withdraw_provider_application'); }
