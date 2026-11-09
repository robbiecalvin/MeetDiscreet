import { backendEnabled } from './backend/client.js';
import { saveUserProfileDraft, loadUserProfileDraft, deleteUserProfileDraft } from './backend/drafts.js';
import { privateDraftControls } from './backend/draft-controls.js';
import { trackDraft } from './draft-changes.js';
const defaults = () => ({ username: '', age: '', name: '', city: '', preferNot: true, gender: '', interests: '', languages: '', lookingFor: '', enjoys: '' });
let draft = defaults();
let identityEpoch = 0;
const changes = trackDraft('user-profile', () => draft, backendEnabled);
export function clearUserProfileState() { draft = defaults(); identityEpoch++; changes.saved(); }
function node(tag, text, className) {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
}
export function renderUserProfileEditor(container, navigate) {
  container.replaceChildren();
  const root = node('div', null, 'user-profile-editor');
  const back = node('a', '← Back to User setup', 'profile-back'); back.href = '?page=user-setup';
  back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('user-setup'); });
  root.append(back, node('p', 'A LITTLE ABOUT YOU', 'eyebrow'), node('h1', 'Your User introduction.'), node('p', 'Describe yourself and the company you’re looking for.', 'offering-lead'), node('p', backendEnabled ? 'Private User profile draft. Saving does not publish fields or create a provider profile. Age is a draft declaration, not eligibility verification.' : 'User profile preview. Use fictional details; nothing is saved or published. Refresh clears the draft.', 'editor-notice'));
  const form = node('form', null, 'user-profile-form'); form.noValidate = true;
  const error = node('p', '', 'editor-errors'); error.id = 'user-profile-error'; error.setAttribute('role', 'alert'); form.append(error);
  const fields = new Map();
  function field(key, label, type, maxLength) {
    const wrapper = node('div', null, 'editor-field'); const title = node('label', label);
    const input = node(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') input.type = type;
    else input.rows = 4;
    input.id = `user-profile-${key}`; title.htmlFor = input.id;
    if (maxLength) input.maxLength = maxLength;
    if (key === 'age') { input.min = '18'; input.step = '1'; }
    input.setAttribute('aria-describedby', error.id);
    input.addEventListener('input', () => { draft[key] = input.value; input.removeAttribute('aria-invalid'); error.textContent = ''; });
    wrapper.append(title, input); form.append(wrapper); fields.set(key, input);
  }
  field('username', 'User username', 'text', 80);
  field('age', 'Adult age (draft declaration)', 'number');
  form.append(node('p', 'Username availability and account eligibility are not verified by this draft.', 'editor-hint'));
  field('name', 'Display name (optional)', 'text', 80);
  field('city', 'General location (optional)', 'text', 100);
  const gender = node('fieldset', null, 'user-gender'); gender.append(node('legend', 'Gender'));
  const label = node('label', null, 'experience-checkbox'); const prefer = node('input'); prefer.type = 'checkbox';
  label.append(prefer, node('span', 'Prefer not to say')); gender.append(label); form.append(gender);
  field('gender', 'Gender description', 'text', 80);
  prefer.addEventListener('change', () => { draft.preferNot = prefer.checked; if (draft.preferNot) draft.gender = ''; syncGender(); error.textContent = ''; });
  function syncGender() { prefer.checked = draft.preferNot; fields.get('gender').disabled = draft.preferNot; fields.get('gender').value = draft.gender; }
  field('interests', 'Interests (optional)', 'text', 240);
  field('languages', 'Languages (optional)', 'text', 240);
  field('lookingFor', 'What I’m looking for (optional)', 'textarea', 1000);
  field('enjoys', 'What I enjoy (optional)', 'textarea', 1000);
  form.append(node('p', 'Use general details rather than exact addresses or private contact information.', 'editor-hint'));
  const actions = node('div', null, 'editor-actions');
  const sample = node('button', 'Use fictional User profile', 'button outline'); sample.type = 'button';
  const show = node('button', 'Preview User profile', 'button primary'); show.type = 'submit';
  const clear = node('button', 'Clear User profile editor', 'button quiet'); clear.type = 'button'; actions.append(sample, show, clear); form.append(actions);
  const preview = node('section', null, 'user-profile-preview'); preview.hidden = true;
  const heading = node('h2', 'Private User profile preview'); heading.tabIndex = -1;
  const card = node('article');
  const edit = node('button', 'Back to User profile editing', 'button outline'); edit.type = 'button';
  edit.addEventListener('click', () => { preview.hidden = true; form.hidden = false; fields.get('username').focus(); });
  preview.append(heading, node('p', 'Owner preview only. Public and member field visibility are not decided by this screen.', 'profile-small'), card, edit);
  function sync() { for (const [key, input] of fields) { input.value = draft[key]; input.removeAttribute('aria-invalid'); } syncGender(); error.textContent = ''; }
  function read() { for (const [key, input] of fields) draft[key] = input.value; draft.preferNot = prefer.checked; if (draft.preferNot) draft.gender = ''; }
  function validate(full) {
    read(); for (const input of fields.values()) input.removeAttribute('aria-invalid');
    const problems = [];
    if (full && !draft.username.trim()) problems.push(['username', 'Enter a draft username.']);
    if ((full || draft.age !== '') && (!draft.age || !Number.isSafeInteger(Number(draft.age)) || Number(draft.age) < 18)) problems.push(['age', 'Enter a whole-number adult age of 18 or older.']);
    if (!draft.preferNot && !draft.gender.trim()) problems.push(['gender', 'Describe your gender or choose Prefer not to say.']);
    if (problems.length) { error.textContent = problems[0][1]; const input = fields.get(problems[0][0]); input.setAttribute('aria-invalid', 'true'); input.focus(); return false; }
    error.textContent = ''; return true;
  }
  sample.addEventListener('click', () => { draft = { username: 'demo-alex', age: '30', name: 'Alex', city: 'Vancouver', preferNot: true, gender: '', interests: 'Coffee, Art, Walks', languages: 'English', lookingFor: 'A fictional gallery outing and good conversation.', enjoys: 'Finding a new café and exploring the city.' }; sync(); fields.get('username').focus(); });
  clear.addEventListener('click', () => { clearUserProfileState(); sync(); fields.get('username').focus(); });
  form.addEventListener('submit', event => {
    event.preventDefault(); if (!validate(true)) return;
    card.replaceChildren(node('p', 'PRIVATE DRAFT', 'eyebrow'), node('h3', draft.name.trim() || draft.username.trim()), node('p', `@${draft.username.trim()} · ${draft.age}`), node('p', draft.city.trim() || 'No location added.'), node('p', `Gender: ${draft.preferNot ? 'Prefer not to say' : draft.gender.trim()}`));
    for (const [key, title] of [['interests', 'Interests'], ['languages', 'Languages'], ['lookingFor', 'What I’m looking for'], ['enjoys', 'What I enjoy']]) {
      if (draft[key].trim()) card.append(node('h4', title), node('p', draft[key].trim()));
    }
    form.hidden = true; preview.hidden = false; heading.focus();
  });
  const storage = privateDraftControls({
    loadLabel: 'Load my User profile draft', deleteLabel: 'Delete saved User profile draft',
    deleteConfirmation: 'Delete your saved private User profile draft? Your account, provider drafts and current editor text will remain. This cannot be undone.',
    onSave: async () => {
      if (!validate(false)) return 'Check the highlighted User profile fields before saving.';
      const epoch = identityEpoch; const snapshot = { ...draft };
      await saveUserProfileDraft(snapshot);
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      changes.saved(snapshot); return 'Private User profile draft saved. Nothing is published.';
    },
    onLoad: async () => {
      const epoch = identityEpoch; const saved = await loadUserProfileDraft();
      if (epoch !== identityEpoch || !container.contains(root)) throw new Error('Account changed.');
      if (!saved) return 'No private User profile draft found for this account.';
      draft = saved; changes.saved(); sync(); preview.hidden = true; form.hidden = false;
      return 'Your private User profile draft was loaded.';
    },
    onDelete: async () => {
      const epoch = identityEpoch; const removed = await deleteUserProfileDraft();
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      if (removed) changes.saved(defaults());
      return removed ? 'Saved User profile draft deleted. Editor text is unsaved; your account and provider drafts remain.' : 'No saved User profile draft found to delete.';
    },
  });
  sync(); root.append(form, preview); if (storage) root.append(storage); container.append(root);
}
