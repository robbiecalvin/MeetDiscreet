import { backendClient } from './client.js';
export async function loadPilotDirectoryStatus() {
  const { data, error } = await backendClient().rpc('get_pilot_directory_status');
  if (error || typeof data !== 'boolean') throw new Error('Pilot status unavailable.'); return data;
}
export async function loadPilotDirectoryPage(kind, after = null) {
  if (!['profiles', 'offerings'].includes(kind)) throw new Error('Unsupported directory view.');
  const { data, error } = await backendClient().rpc(kind === 'profiles' ? 'list_pilot_public_profiles' : 'list_pilot_public_offerings', { p_after_id: after });
  if (error || !Array.isArray(data) || data.some(row => typeof row.id !== 'string' || !row.public_fields || typeof row.public_fields !== 'object')) throw new Error('Directory unavailable.'); return data;
}
