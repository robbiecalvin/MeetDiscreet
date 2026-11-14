import { loadVisibilityDiagnostics } from './backend/visibility-diagnostics.js';
function node(tag, text) { const item = document.createElement(tag); if (text) item.textContent = text; return item; }
export function visibilityDiagnostics(owner, kind, id, isCurrent) {
  const section = node('section'); section.className = 'visibility-diagnostics';
  const button = node('button', 'Explain this copy’s public visibility'); button.type = 'button'; button.className = 'button quiet';
  const status = node('p'); status.className = 'profile-small'; status.setAttribute('role', 'status'); status.tabIndex = -1;
  const content = node('div'); section.append(button, status, content);
  let generation = 0, busy = false, blocked = false;
  const current = request => request === generation && section.isConnected && isCurrent();
  function reset() { generation++; busy = false; button.disabled = blocked; status.textContent = ''; content.replaceChildren(); }
  button.addEventListener('click', async () => {
    if (busy || blocked) return; busy = true; button.disabled = true; const request = ++generation;
    content.replaceChildren(); status.textContent = 'Checking current public visibility…';
    try {
      const value = await loadVisibilityDiagnostics(owner, kind, id); if (!current(request)) return;
      status.textContent = value.visible_now ? 'This exact approved version is currently readable through the pilot public endpoints.' : 'This exact approved version is not currently readable through the pilot public endpoints.';
      const list = node('ul');
      const checks = [
        ['Pilot directory', value.directory_enabled ? 'Enabled' : 'Disabled'],
        ['User membership', value.user_member ? 'Assigned' : 'Not assigned'],
        ['Provider membership', value.provider_member ? 'Assigned' : 'Not assigned'],
        ['Invited-pilot eligibility', value.pilot_eligible ? 'Current' : 'No current unrevoked pilot eligibility'],
        ['Exact approved version', value.copy_selected ? 'Selected' : 'Not selected; another copy or no copy may be selected'],
        ['Resource visibility request', value.selection_visible ? 'Visible requested' : 'Hidden or not selected'],
      ];
      if (kind === 'offering') checks.push(
        ['Provider profile', value.profile_visible ? 'Currently readable publicly' : 'Not currently readable publicly'],
        ['Selected Offering count', `${value.offering_selection_count}. Exactly one is required in this pilot.`],
      );
      for (const [label, text] of checks) { const item = node('li'); item.append(node('strong', `${label}: `), document.createTextNode(text)); list.append(item); }
      content.append(list);
      const note = node('p', 'Read-only snapshot at the time of this check. Later expiry, revocation, selection changes or activation changes can change visibility. It does not confirm that anyone viewed the copy.'); note.className = 'profile-small'; content.append(note);
    } catch { if (current(request)) status.textContent = 'Public visibility diagnostics unavailable. Check sign-in, connection and database setup, then retry. No visibility result is inferred.'; }
    finally { if (current(request)) { busy = false; button.disabled = blocked; status.focus(); } }
  });
  return { section, reset, setBlocked(value) { blocked = value; button.disabled = busy || blocked; } };
}
