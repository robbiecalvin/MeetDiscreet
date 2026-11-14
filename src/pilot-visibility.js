import { visibilityDiagnostics } from './visibility-diagnostics.js';
import { loadPilotVisibility, setPilotVisibility } from './backend/pilot-visibility.js';
export function pilotVisibility(owner, kind, id, isCurrent) {
  const section = document.createElement('section'); section.className = 'pilot-visibility';
  const title = document.createElement('h4'); title.textContent = 'Pilot visibility selection';
  const note = document.createElement('p'); note.className = 'profile-small'; note.textContent = 'Choose an exact approved version for pilot visibility. Public exposure also requires directory activation and current eligibility. Later drafts and approvals never replace your selection automatically.';
  const status = document.createElement('p'); status.className = 'profile-small'; status.setAttribute('role', 'status'); status.tabIndex = -1;
  const refresh = document.createElement('button'); refresh.type = 'button'; refresh.className = 'button quiet'; refresh.textContent = 'Check selected pilot version';
  const select = document.createElement('button'); select.type = 'button'; select.className = 'button outline'; select.textContent = 'Select this approved version for pilot'; select.hidden = true;
  const hide = document.createElement('button'); hide.type = 'button'; hide.className = 'button quiet'; hide.textContent = 'Hide the selected version'; hide.hidden = true;
  const diagnostics = visibilityDiagnostics(owner, kind, id, isCurrent);
  section.append(title, note, refresh, status, select, hide, diagnostics.section);
  let busy = false, value = null;
  const current = () => section.isConnected && isCurrent();
  function controls() { diagnostics.setBlocked(busy); refresh.disabled = busy; select.disabled = busy; hide.disabled = busy; }
  async function run(action) {
    if (busy || !current()) return; busy = true; diagnostics.reset(); controls(); select.hidden = true; hide.hidden = true; status.textContent = 'Checking pilot visibility selection…';
    try {
      const result = await action(); if (!current()) return; value = result;
      const thisVersion = value.selected_submission_id === id;
      status.textContent = !value.revision ? 'No version selected for this profile or listing.' : !value.requested_visible ? 'The selected version is hidden.' : thisVersion ? 'This exact approved version is selected. Public visibility depends on directory activation and current eligibility.' : 'A different approved version is selected. Selecting this copy will replace that selection.';
      select.hidden = value.requested_visible && thisVersion; hide.hidden = !value.requested_visible;
    } catch { if (current()) { value = null; status.textContent = 'Visibility selection could not be confirmed. Check current eligibility, sign-in and setup, then refresh before retrying.'; } }
    finally { busy = false; if (current()) { controls(); status.focus(); } }
  }
  refresh.addEventListener('click', () => run(() => loadPilotVisibility(owner, kind, id)));
  select.addEventListener('click', () => {
    if (busy || !value || !window.confirm('Select this exact approved version for pilot visibility? It can become public if the directory is active and all eligibility requirements are met. This action does not enable the directory.')) return;
    const revision = value.revision; run(() => setPilotVisibility(owner, kind, id, revision, true));
  });
  hide.addEventListener('click', () => {
    if (busy || !value?.requested_visible || !window.confirm('Hide the currently selected version for this profile or listing? This may be a different approved copy. Saved drafts and approvals are kept.')) return;
    const revision = value.revision; run(() => setPilotVisibility(owner, kind, id, revision, false));
  });
  return section;
}
