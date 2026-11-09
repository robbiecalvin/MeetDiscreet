import { backendClient, requireUser } from './client.js';
const allowedRoles = new Set(['user', 'provider', 'moderator', 'admin']);
export async function loadOwnAccountRoles() {
  const user = await requireUser();
  const { data, error } = await backendClient().from('account_roles').select('role').eq('user_id', user.id);
  if (error || !Array.isArray(data) || data.some(value => !allowedRoles.has(value.role))) throw new Error('Account permissions unavailable.');
  return [...new Set(data.map(value => value.role))];
}
