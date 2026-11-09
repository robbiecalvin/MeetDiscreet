import { backendEnabled } from './client.js';
export function privateDraftControls({ onSave, onLoad, multiple = false }) {
  if (!backendEnabled) return null;
  const section = document.createElement('section');
  section.className = 'private-draft-controls';
  const title = document.createElement('h2'); title.textContent = 'Private development drafts';
  const copy = document.createElement('p'); copy.textContent = 'Sign in to save or load your own private drafts. Saving never publishes a profile or listing.';
  const actions = document.createElement('div'); actions.className = 'editor-actions';
  const save = document.createElement('button'); save.type = 'button'; save.className = 'button primary'; save.textContent = 'Save private draft';
  const load = document.createElement('button'); load.type = 'button'; load.className = 'button outline'; load.textContent = multiple ? 'Load my listing drafts' : 'Load my profile draft';
  const status = document.createElement('p'); status.className = 'profile-small'; status.setAttribute('role', 'status');
  const choices = document.createElement('div'); choices.className = 'saved-draft-choices';
  let busy = false;
  async function run(operation) {
    if (busy) return;
    busy = true; save.disabled = true; load.disabled = true; status.textContent = 'Working…';
    try { status.textContent = await operation(choices) || 'Done.'; }
    catch (error) { status.textContent = error.message === 'Sign in before saving or loading private drafts.' ? error.message : 'Unable to complete the private draft operation. Check sign-in, the connection, and database setup, then retry.'; }
    finally { busy = false; save.disabled = false; load.disabled = false; }
  }
  save.addEventListener('click', () => run(onSave));
  load.addEventListener('click', () => run(onLoad));
  actions.append(save, load);
  section.append(title, copy, actions, choices, status);
  return section;
}
