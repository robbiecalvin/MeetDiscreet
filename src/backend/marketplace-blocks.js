import { backendClient, requireUser } from './client.js';
async function request(actor, name, fields) {
  if ((await requireUser()).id !== actor) throw new Error('Account changed.');
  const { data, error } = await backendClient().rpc(name, { p_expected_actor: actor, ...fields });
  if (error) throw new Error('Block operation unavailable.');
  if ((await requireUser()).id !== actor) throw new Error('Account changed.'); return data;
}
export function blockPilotEntry(actor, kind, id) { return request(actor, 'set_pilot_entry_block', { p_kind: kind, p_submission: id }); }
export function loadMyBlocks(actor, after = null) { return request(actor, 'list_my_marketplace_blocks', { p_after_id: after }); }
export function removeMyBlock(actor, id) { return request(actor, 'remove_my_marketplace_block', { p_block: id }); }
