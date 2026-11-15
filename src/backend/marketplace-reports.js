import { backendClient, requireUser } from './client.js';
async function verify(actor) { if ((await requireUser()).id !== actor) throw new Error('Account changed.'); }
async function rpc(actor, name, fields = {}, single = false) {
  await verify(actor); let request = backendClient().rpc(name, { p_expected_actor: actor, ...fields }); if (single) request = request.single();
  const { data, error } = await request; if (error) throw new Error('Report operation unavailable.'); await verify(actor); return data;
}
export function submitMarketplaceReport(actor, kind, id, category, details, conversation = null) {
  return rpc(actor, kind === 'message' ? 'submit_marketplace_message_report' : 'submit_marketplace_report', kind === 'message'
    ? { p_conversation: conversation, p_message: id, p_category: category, p_details: details }
    : { p_kind: kind, p_submission: id, p_category: category, p_details: details }, true);
}
export async function loadMyReportStatuses(actor, after = null) {
  await verify(actor); let query = backendClient().from('marketplace_reports').select('id,target_kind,target_submission_id,category,state,created_at,updated_at').order('id', { ascending: true }).limit(21);
  if (after) query = query.gt('id', after);
  const { data, error } = await query; if (error || !Array.isArray(data)) throw new Error('Reports unavailable.'); await verify(actor); return data;
}
export async function reportReviewAccess() {
  const actor = await requireUser(); const [read, moderation] = await Promise.all([backendClient().rpc('can_review_marketplace_reports'), backendClient().rpc('can_pause_pilot_publication')]);
  if (read.error || moderation.error || typeof read.data !== 'boolean' || typeof moderation.data !== 'boolean') throw new Error('Access unavailable.'); await verify(actor.id);
  return { actorId: actor.id, allowed: read.data, canPause: moderation.data };
}
export function listReportReviewQueue(actor, state, cursor = null) { return rpc(actor, 'list_marketplace_reports_for_review', { p_state: state, p_after_time: cursor?.created_at ?? null, p_after_id: cursor?.id ?? null }); }
export function readStaffReport(actor, id) { return rpc(actor, 'get_marketplace_report_for_review', { p_report: id }, true); }
export function updateStaffReport(actor, id, revision, state, note, pause, holdRevision) {
  return rpc(actor, 'update_marketplace_report', { p_report: id, p_expected_revision: revision, p_state: state, p_note: note, p_pause: pause, p_expected_hold_revision: holdRevision }, true);
}
