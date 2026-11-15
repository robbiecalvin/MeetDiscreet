import { backendClient, requireUser } from './client.js';
async function call(actor, name, fields = {}, single = false) {
  if ((await requireUser()).id !== actor) throw new Error('Account changed.');
  let request = backendClient().rpc(name, { p_expected_actor: actor, ...fields });
  if (single) request = request.single();
  const { data, error } = await request;
  if (error) throw new Error('Messaging request unavailable.');
  if ((await requireUser()).id !== actor) throw new Error('Account changed.'); return data;
}
export async function loadMyConversations(actor, after = null) {
  const data = await call(actor, 'list_my_marketplace_conversations', { p_after_id: after });
  if (!Array.isArray(data)) throw new Error('Conversation list unavailable.'); return data;
}
export async function loadConversationMessages(actor, conversation, before = null) {
  const data = await call(actor, 'read_marketplace_messages', { p_conversation: conversation, p_before: before });
  if (!Array.isArray(data) || data.some(row => !Number.isSafeInteger(row.sequence) || row.sequence < 1 || typeof row.body !== 'string' || typeof row.sent_by_me !== 'boolean')) throw new Error('Message history unavailable.'); return data;
}
export async function sendConversationText(actor, conversation, clientId, body) {
  const data = await call(actor, 'send_marketplace_text', { p_conversation: conversation, p_client_id: clientId, p_body: body }, true);
  if (!data?.id) throw new Error('Send could not be confirmed.'); return data;
}
export function changeConversationBlock(actor, conversation, blocked) {
  return call(actor, 'set_marketplace_conversation_block', { p_conversation: conversation, p_block: blocked });
}
export async function messagingPilotAccess() {
  const actor = await requireUser(); const { data, error } = await backendClient().rpc('can_manage_messaging_pilot');
  if (error || typeof data !== 'boolean') throw new Error('Access unavailable.');
  if ((await requireUser()).id !== actor.id) throw new Error('Account changed.'); return { actorId: actor.id, allowed: data };
}
export function inspectMessagingPair(actor, member, provider) {
  return call(actor, 'inspect_messaging_pilot_pair', { p_member: member, p_provider: provider }, true);
}
export function setMessagingPair(actor, member, provider, revision, until, revoke) {
  return call(actor, 'set_messaging_pilot_pair', { p_member: member, p_provider: provider, p_expected_revision: revision, p_until: until, p_revoke: revoke }, true);
}
