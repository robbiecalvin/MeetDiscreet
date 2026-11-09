import { backendClient, requireUser } from './client.js';
async function actor(expectedOwner) {
  const user = await requireUser();
  if (user.id !== expectedOwner) throw new Error('Account changed.');
}
export async function saveBookingPlan(ownerId, plan) {
  await actor(ownerId);
  const { error } = await backendClient().from('booking_plan_drafts').upsert({ owner_id: ownerId, plan }, { onConflict: 'owner_id' });
  if (error) throw new Error('Plan save unavailable.');
}
export async function loadBookingPlan(ownerId) {
  await actor(ownerId);
  const { data, error } = await backendClient().from('booking_plan_drafts').select('owner_id,plan').eq('owner_id', ownerId).maybeSingle();
  if (error || (data && data.owner_id !== ownerId)) throw new Error('Plan load unavailable.');
  return data?.plan || null;
}
export async function deleteBookingPlan(ownerId) {
  await actor(ownerId);
  const { data, error } = await backendClient().from('booking_plan_drafts').delete().eq('owner_id', ownerId).select('owner_id').maybeSingle();
  if (error || (data && data.owner_id !== ownerId)) throw new Error('Plan delete unavailable.');
  return Boolean(data);
}

export async function hasSavedBookingPlan() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('booking_plan_drafts').select('owner_id').eq('owner_id', user.id).maybeSingle();
  if (error || (data && data.owner_id !== user.id)) throw new Error('Plan status unavailable.');
  return Boolean(data);
}
