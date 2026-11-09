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
  let feedback = null;
  if (data && ['draft', 'changes_requested'].includes(data.state)) {
    const result = await backendClient().from('provider_application_feedback').select('note,created_at').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!result.error) feedback = result.data;
  }
  return { ownerId: user.id, application: data, feedback };
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

export async function loadProviderApplicationHistory(ownerId) {
  await actor(ownerId);
  const client = backendClient();
  const { data: rows, error } = await client.from('provider_application_submissions')
    .select('id,owner_id,display_name,city,introduction,submitted_at').eq('owner_id', ownerId)
    .order('submitted_at', { ascending: false }).order('id', { ascending: false }).limit(20);
  if (error || !Array.isArray(rows) || rows.some(row => row.owner_id !== ownerId)) throw new Error('History unavailable.');
  if (!rows.length) return [];
  const { data: feedback, error: feedbackError } = await client.from('provider_application_feedback')
    .select('owner_id,submission_id,note,created_at').eq('owner_id', ownerId).in('submission_id', rows.map(row => row.id));
  if (feedbackError || !Array.isArray(feedback) || feedback.some(row => row.owner_id !== ownerId)) throw new Error('Feedback unavailable.');
  return rows.map(row => ({ ...row, feedback: feedback.find(note => note.submission_id === row.id) || null }));
}

export async function loadProviderApplicationStatus(ownerId) {
  await actor(ownerId);
  const { data, error } = await backendClient().from('provider_applications')
    .select('owner_id,state').eq('owner_id', ownerId).maybeSingle();
  if (error || (data && (data.owner_id !== ownerId || !['draft','submitted','withdrawn','changes_requested'].includes(data.state)))) throw new Error('Application status unavailable.');
  return data?.state || null;
}
