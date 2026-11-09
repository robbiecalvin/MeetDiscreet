import { loadOwnAccountRoles } from './backend/permissions.js';
const labels = { user: 'User', provider: 'Provider', moderator: 'Moderator', admin: 'Administrator' };
export function accountPermissions(current) {
  const section = document.createElement('section'); section.className = 'account-permissions';
  const title = document.createElement('h2'); title.textContent = 'Account permissions';
  const status = document.createElement('p'); status.setAttribute('role', 'status'); status.className = 'profile-small';
  status.dataset.accountPermissions = '';
  const copy = document.createElement('p'); copy.className = 'profile-small'; copy.textContent = 'Roles are assigned separately from your starting preference. Publishing and paid access still require their own checks.';
  const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'button quiet'; retry.textContent = 'Refresh account permissions';
  section.append(title, copy, status, retry);
  let busy = false;
  async function check() {
    if (busy) return;
    busy = true; retry.disabled = true; status.textContent = 'Checking assigned roles…';
    try {
      const roles = await loadOwnAccountRoles();
      if (!current()) return;
      status.textContent = `${roles.length ? `Assigned roles: ${roles.map(role => labels[role]).join(', ')}.` : 'No account roles assigned.'} Provider role: ${roles.includes('provider') ? 'Assigned' : 'Not assigned'}.`;
    } catch {
      if (current()) status.textContent = 'Unable to verify account permissions. Check your connection and setup, then retry. Publishing remains unavailable.';
    } finally { busy = false; retry.disabled = false; }
  }
  retry.addEventListener('click', check);
  check();
  return section;
}
