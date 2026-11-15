import { backendClient, requireUser } from './client.js';
async function call(actor, name, fields = {}, single = false) {
  if ((await requireUser()).id !== actor) throw new Error('Account changed.');
  let request = backendClient().rpc(name, { p_expected_actor: actor, ...fields }); if (single) request = request.single();
  const { data, error } = await request; if (error) throw new Error('Booking request unavailable.');
  if ((await requireUser()).id !== actor) throw new Error('Account changed.'); return data;
}
export async function bookingPilotAccess() {
  const actor = await requireUser(); const { data, error } = await backendClient().rpc('can_manage_booking_request_pilot');
  if (error || typeof data !== 'boolean') throw new Error('Access unavailable.');
  if ((await requireUser()).id !== actor.id) throw new Error('Account changed.'); return { actorId: actor.id, allowed: data };
}
export function inspectBookingPair(actor, member, provider) { return call(actor, 'inspect_booking_request_pilot_pair', { p_member: member, p_provider: provider }, true); }
export function setBookingPair(actor, member, provider, revision, until, revoke) { return call(actor, 'set_booking_request_pilot_pair', { p_member: member, p_provider: provider, p_expected_revision: revision, p_until: until, p_revoke: revoke }, true); }
export function loadBookingRequestPairs(actor) { return call(actor, 'list_my_booking_request_pairs'); }
export function loadBookingRequests(actor, cursor = null) { return call(actor, 'list_my_booking_requests', { p_before_time: cursor?.created_at ?? null, p_before_id: cursor?.id ?? null }); }
export function readBookingRequest(actor, id) { return call(actor, 'read_my_booking_request', { p_request: id }, true); }
export function loadOlderRequestVersions(actor, id, before) { return call(actor, 'read_booking_request_versions', { p_request: id, p_before: before }); }
function fields(terms) { return { p_activity: terms.activity, p_start: terms.start, p_end: terms.end, p_zone: terms.zone, p_area: terms.area, p_notes: terms.notes }; }
export function submitBookingRequest(actor, pair, clientId, terms) { return call(actor, 'submit_booking_request', { p_pair: pair, p_client_id: clientId, ...fields(terms) }, true); }
export function changeBookingRequest(actor, id, revision, action, terms = null) { return call(actor, 'change_booking_request', { p_request: id, p_expected_revision: revision, p_action: action, ...(terms ? fields(terms) : {}) }, true); }
