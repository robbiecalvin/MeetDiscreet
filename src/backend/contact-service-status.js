import { backendClient, requireUser } from './client.js';
export async function loadContactServiceStatus(actor) {
  if ((await requireUser()).id !== actor) throw new Error('Account changed.');
  const { data, error } = await backendClient().rpc('get_marketplace_contact_service_status').single();
  if (error || !data || typeof data.text_messaging !== 'boolean' || typeof data.booking_requests !== 'boolean') throw new Error('Service status unavailable.');
  if ((await requireUser()).id !== actor) throw new Error('Account changed.'); return data;
}
