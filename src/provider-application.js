import { backendEnabled } from './backend/client.js';
import { loadProviderApplication, saveProviderApplication, submitProviderApplication, withdrawProviderApplication } from './backend/provider-applications.js';
import { loadProfileDraft } from './backend/drafts.js';
import { renderProviderApplicationActivity } from './provider-application-activity.js';
import { renderProviderApplicationHistory } from './provider-application-history.js';
import { trackDraft } from './draft-changes.js';
const empty = () => ({ name: '', city: '', introduction: '' });
let draft = empty();
let saved = null;
let ownerId = null;
let reviewFeedback = null;
let loaded = false;
let identityEpoch = 0;
const changes = trackDraft('provider-application', () => draft, backendEnabled);
export function clearProviderApplicationState() { draft = empty(); saved = null; ownerId = null; reviewFeedback = null; loaded = false; identityEpoch++; changes.saved(); }
function node(tag, text, className) {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
}
const fromRow = row => ({ name: row.display_name, city: row.city, introduction: row.introduction });
export function renderProviderApplication(container, navigate) {
  container.replaceChildren();
  const root = node('section', null, 'provider-application');
  const back = node('a', '← Back to provider setup', 'profile-back'); back.href = '?page=provider-setup';
  back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('provider-setup'); });
  root.append(back, node('p', 'YOUR NEXT STEP', 'eyebrow'), node('h1', 'Your provider application.'), node('p', 'Prepare an introduction and submit it to the private application queue.', 'offering-lead'), node('p', backendEnabled ? 'Development application intake. Separately authorized administrators can approve pilot Provider access. Identity checks, paid access and publishing remain separate.' : 'Application preview. Use fictional details; nothing is saved or submitted without the development backend.', 'editor-notice'));
  const state = node('p', '', 'application-state'); state.setAttribute('role', 'status');
  const feedback = node('p', '', 'profile-small'); feedback.setAttribute('role', 'status'); feedback.id = 'provider-application-feedback';
  const form = node('form', null, 'application-form'); form.noValidate = true;
  const fields = new Map();
  for (const [key, label, limit] of [['name', 'Provider display name', 80], ['city', 'General city', 100], ['introduction', 'Provider application introduction', 1000]]) {
    const group = node('div', null, 'editor-field'); const title = node('label', label);
    const input = node(key === 'introduction' ? 'textarea' : 'input'); if (key !== 'introduction') input.type = 'text'; else input.rows = 6;
    input.id = `application-${key}`; input.maxLength = limit; title.htmlFor = input.id;
    input.addEventListener('input', () => { draft[key] = input.value; feedback.textContent = ''; paintState(); });
    group.append(title, input); form.append(group); fields.set(key, input);
  }
  form.append(node('p', 'Save all three fields before submitting. Submitted text is locked until withdrawal or a staff request for changes.', 'editor-hint'));
  form.append(node('p', 'Use general details. Do not include identity documents, full birth dates, exact addresses or private contact details.', 'editor-hint'));
  const actions = node('div', null, 'editor-actions');
  const save = node('button', backendEnabled ? 'Save application draft' : 'Check application preview', 'button primary'); save.type = 'submit';
  const submit = node('button', 'Submit saved application', 'button outline'); submit.type = 'button';
  const withdraw = node('button', 'Withdraw application', 'button quiet'); withdraw.type = 'button';
  const refresh = node('button', 'Reload application', 'button quiet'); refresh.type = 'button';
  const copy = node('button', 'Copy my saved provider introduction', 'button outline'); copy.type = 'button';
  submit.hidden = !backendEnabled; withdraw.hidden = !backendEnabled; refresh.hidden = !backendEnabled; copy.hidden = !backendEnabled;
  actions.append(save, submit, withdraw, refresh, copy); form.append(actions);
  const signIn = node('a', 'Sign in', 'account-recovery-link'); signIn.href = '?page=sign-in'; signIn.hidden = true;
  signIn.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('sign-in'); });
  const reviewNote = node('section', null, 'application-review-note'); reviewNote.hidden = true;
  const approvalNotice=node('p','This application was approved for pilot Provider access. See your current roles in Account.','editor-notice');approvalNotice.hidden=true;
  root.append(state, approvalNotice, reviewNote, form, feedback, signIn); container.append(root);
  let busy = false;
  const current = epoch => epoch === identityEpoch && root.parentNode === container;
  const renderEpoch = identityEpoch;
  const history = backendEnabled ? renderProviderApplicationHistory(root, () => busy ? null : ownerId, () => current(renderEpoch)) : null;
  const activity = backendEnabled ? renderProviderApplicationActivity(root, () => busy ? null : ownerId, () => current(renderEpoch)) : null;
  function sync() { for (const [key, input] of fields) input.value = draft[key]; }
  function paintState() {
    const locked = ['submitted','approved'].includes(saved?.state);
    approvalNotice.hidden=saved?.state!=='approved';
    reviewNote.replaceChildren(); reviewNote.hidden = !reviewFeedback || locked;
    if (!reviewNote.hidden) reviewNote.append(node('h2', 'Requested changes'), node('p', reviewFeedback.note));
    state.textContent = !backendEnabled ? 'Application preview.' : !loaded ? 'Application status has not been loaded.' : saved ? `Application status: ${saved.state === 'changes_requested' ? 'changes requested' : saved.state}.` : 'No saved application.';
    for (const input of fields.values()) input.disabled = busy || locked || (backendEnabled && !ownerId);
    save.disabled = busy || locked || (backendEnabled && !ownerId);
    copy.disabled = busy || locked || !ownerId;
    refresh.disabled = busy;
    const unchanged = saved && JSON.stringify(draft) === JSON.stringify(fromRow(saved));
    submit.disabled = busy || saved?.state !== 'draft' || !unchanged || !draft.name.trim() || !draft.city.trim() || !draft.introduction.trim();
    withdraw.disabled = busy || saved?.state !== 'submitted';
  }
  async function run(operation) {
    if (busy) return;
    history?.clear(); activity?.clear();
    const epoch = identityEpoch; busy = true; feedback.textContent = 'Working…'; paintState();
    try {
      const message = await operation(epoch);
      if (current(epoch)) feedback.textContent = message;
    } catch {
      if (current(epoch)) feedback.textContent = 'Unable to complete the application request. Check sign-in, connection and setup, then retry.';
    } finally { busy = false; if (current(epoch)) { sync(); paintState(); } }
  }
  async function reload(epoch) {
    const context = await loadProviderApplication();
    if (!current(epoch)) return '';
    ownerId = context.ownerId; saved = context.application; reviewFeedback = context.feedback; loaded = true; draft = saved ? fromRow(saved) : empty(); changes.saved(); signIn.hidden = true;
    return saved ? 'Your saved application was loaded.' : 'No application saved yet. Start with a draft.';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!backendEnabled) { feedback.textContent = 'Application preview checked. Nothing was saved or submitted.'; return; }
    run(async epoch => {
      const snapshot = { ...draft }; const row = await saveProviderApplication(ownerId, snapshot);
      if (!current(epoch)) return '';
      saved = row; draft = fromRow(row); changes.saved();
      return 'Application draft saved privately. Review your saved text before submitting.';
    });
  });
  submit.addEventListener('click', () => {
    if (!window.confirm('Submit this saved application? Editing is locked until withdrawal or a staff request for changes. This does not approve provider access.')) return;
    run(async epoch => { const row = await submitProviderApplication(ownerId); if (current(epoch)) saved = row; return 'Application submitted to the private development queue. No provider role or publishing access was granted.'; });
  });
  withdraw.addEventListener('click', () => {
    if (!window.confirm('Withdraw this application? You can edit and save another draft afterwards.')) return;
    run(async epoch => { const row = await withdrawProviderApplication(ownerId); if (current(epoch)) saved = row; return 'Application withdrawn. Save your edits as a new draft before submitting again.'; });
  });
  refresh.addEventListener('click', () => { if (changes.isDirty() && !window.confirm('Reload the saved application and discard unsaved edits?')) return; run(reload); });
  copy.addEventListener('click', () => run(async epoch => {
    const profile = await loadProfileDraft(); if (!current(epoch)) return '';
    if (!profile) return 'No saved provider profile draft found.';
    draft = { name: profile.name, city: profile.city, introduction: profile.bio };
    return 'Provider introduction copied into the application editor. Save to keep these changes.';
  }));
  sync(); paintState();
  if (backendEnabled && (!loaded || !changes.isDirty())) run(async epoch => {
    try { return await reload(epoch); }
    catch (error) { if (current(epoch)) signIn.hidden = false; throw error; }
  });
}
