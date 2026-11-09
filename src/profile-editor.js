import { backendEnabled } from './backend/client.js';
import { loadProfileDraft, saveProfileDraft, deleteProfileDraft } from './backend/drafts.js';
import { privateDraftControls } from './backend/draft-controls.js';
import { draftToolNavigation } from './draft-tools.js';
import { providers } from './data.js';
const defaults = () => ({ name: '', username: '', age: '', tagline: '', city: 'Vancouver', area: '', photo: '2', bio: '', interests: '' });
let draft = defaults();
let identityEpoch = 0;
export function clearProfileDraftState() { draft = defaults(); identityEpoch++; }
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function renderProfileEditor(container, onBack, onTool) {
  container.replaceChildren();
  const back = element('a', '← Back to discovery', 'profile-back');
  back.href = './';
  back.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onBack();
  });
  const intro = element('div', null, 'editor-intro');
  intro.append(element('p', 'A LITTLE MORE ABOUT YOU', 'eyebrow'), element('h1', 'Make an introduction.'), element('p', 'Try out a companion profile and see what each audience would see.', 'offering-lead'));
  container.append(back, draftToolNavigation('edit-profile', onTool), intro, element('p', backendEnabled ? 'Development profile drafts. Use test data. Unsaved edits are kept in memory; save/load controls require sign-in and store private drafts only. Audience previews do not grant access.' : 'Demo profile editor. Use fictional details only. Nothing is saved or published; a full refresh clears the draft. Audience previews do not grant account access.', 'editor-notice'));
  const form = element('form', null, 'listing-form profile-draft-form');
  form.noValidate = true;
  form.autocomplete = 'off';
  const summary = element('p', '', 'editor-errors');
  summary.setAttribute('role', 'alert');
  form.append(summary);
  const fields = new Map();
  function field(key, label, type, hint, options) {
    const group = element('div', null, `editor-field profile-draft-${key}`);
    const labelNode = element('label', label);
    const input = element(type === 'select' ? 'select' : type === 'textarea' ? 'textarea' : 'input');
    input.id = `profile-draft-${key}`;
    input.name = key;
    input.autocomplete = 'off';
    if (['text', 'number'].includes(type)) input.type = type;
    if (type === 'textarea') { input.rows = 5; input.maxLength = 1000; }
    if (type === 'text') input.maxLength = key === 'interests' ? 240 : key === 'tagline' ? 120 : 80;
    if (key === 'age') { input.min = '18'; input.step = '1'; }
    if (['name', 'username', 'age', 'city', 'photo'].includes(key)) input.required = true;
    if (options) for (const [value, text] of options) {
      const option = element('option', text); option.value = value; input.append(option);
    }
    input.value = draft[key];
    labelNode.htmlFor = input.id;
    const help = element('p', hint, 'editor-hint');
    help.id = `profile-draft-${key}-hint`;
    const error = element('p', '', 'editor-field-error');
    error.id = `profile-draft-${key}-error`;
    input.setAttribute('aria-describedby', `${help.id} ${error.id}`);
    input.addEventListener('input', () => { draft[key] = input.value; input.removeAttribute('aria-invalid'); error.textContent = ''; summary.textContent = ''; });
    group.append(labelNode, input, help, error);
    form.append(group);
    fields.set(key, { input, error });
  }
  field('name', 'Display name', 'text', 'Public. Use a fictional name for this draft.');
  field('username', 'Username', 'text', 'Public. Availability and uniqueness are not checked.');
  field('age', 'Age', 'number', 'Public. A whole number of 18 or older; this is not identity verification.');
  field('photo', 'Main photo', 'select', 'Public. Fictional demo portraits only; no uploads.', providers.map((p) => [String(p.photo), `Demo portrait · ${p.name}`]));
  field('tagline', 'Public tagline (optional)', 'text', 'Public. A short introduction, up to 120 characters.');
  field('city', 'City', 'select', 'Public general location. No device location is used.', [['Vancouver', 'Vancouver'], ['Toronto', 'Toronto'], ['Montréal', 'Montréal']]);
  field('area', 'General area (optional)', 'text', 'Public. A neighbourhood, not an exact address.');
  field('bio', 'Biography (optional)', 'textarea', 'Member-only in the planned access model. Use fictional text, up to 1,000 characters.');
  field('interests', 'Interests (optional)', 'text', 'Member-only. Separate a few fictional interests with commas.');
  const actions = element('div', null, 'editor-actions');
  const sample = element('button', 'Use fictional profile', 'button outline');
  sample.type = 'button';
  const clear = element('button', 'Clear profile draft', 'button quiet');
  clear.type = 'button';
  function sync() {
    for (const [key, { input, error }] of fields) { input.value = draft[key]; input.removeAttribute('aria-invalid'); error.textContent = ''; }
    summary.textContent = '';
  }
  sample.addEventListener('click', () => {
    draft = { name: 'Maya', username: 'demo-maya', age: '28', tagline: 'Good conversation. A new perspective.', city: 'Vancouver', area: 'Mount Pleasant', photo: '2', bio: 'A fictional introduction: I enjoy gallery afternoons, a good book, and conversations with time to wander.', interests: 'Art, Books, Coffee' };
    sync(); fields.get('name').input.focus();
  });
  clear.addEventListener('click', () => { draft = defaults(); sync(); fields.get('name').input.focus(); });
  const submit = element('button', 'Preview profile draft', 'button primary');
  submit.type = 'submit';
  actions.append(sample, submit, clear);
  form.append(actions);

  const preview = element('section', null, 'profile-draft-preview');
  preview.hidden = true;
  preview.setAttribute('aria-labelledby', 'profile-draft-preview-title');
  const title = element('h2', 'Your profile draft');
  title.id = 'profile-draft-preview-title';
  title.tabIndex = -1;
  const controls = element('div', null, 'audience-controls');
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Draft audience preview');
  const card = element('article', null, 'profile-draft-card');
  let audience = 'visitor';
  const buttons = [];
  for (const [key, label] of [['visitor', 'Visitor preview'], ['member', 'Member preview'], ['subscriber', 'Subscriber preview']]) {
    const button = element('button', label);
    button.type = 'button';
    button.addEventListener('click', () => { audience = key; paintPreview(); });
    buttons.push({ key, button });
    controls.append(button);
  }
  function paintPreview() {
    for (const { key, button } of buttons) button.setAttribute('aria-pressed', String(key === audience));
    card.replaceChildren();
    const identity = element('div', null, 'profile-draft-identity');
    const photo = element('div', null, `portrait portrait-${Number(draft.photo)} profile-draft-photo`);
    photo.setAttribute('role', 'img');
    photo.setAttribute('aria-label', 'Selected fictional main photo');
    const details = element('div');
    details.append(element('p', 'UNPUBLISHED DRAFT', 'eyebrow'), element('h3', `${draft.name.trim()}, ${Number(draft.age)}`), element('p', `@${draft.username.trim()}`, 'profile-location'), element('p', [draft.area.trim(), draft.city].filter(Boolean).join(', '), 'profile-location'));
    if (draft.tagline.trim()) details.append(element('p', draft.tagline.trim(), 'profile-tagline'));
    identity.append(photo, details);
    card.append(identity);
    const biography = element('section', null, 'profile-draft-member-content');
    biography.append(element('h4', 'Biography & interests'));
    if (audience === 'visitor') {
      biography.append(element('span', 'MEMBER-ONLY PREVIEW', 'access-label'), element('p', 'Visitors see a labelled section, not the member biography or interests.', 'profile-copy'));
    } else {
      biography.append(element('p', draft.bio.trim() || 'No biography in this draft.', 'draft-description'));
      const tags = element('div', null, 'locked-tags');
      for (const interest of draft.interests.split(',').map((s) => s.trim()).filter(Boolean)) tags.append(element('span', interest));
      if (!tags.childElementCount) tags.append(element('span', 'No interests in this draft.'));
      biography.append(tags);
    }
    const privateSection = element('section', null, 'profile-draft-private-content');
    privateSection.append(element('h4', 'Subscriber experiences & media'), element('span', audience === 'subscriber' ? 'SUBSCRIBER LAYOUT PREVIEW' : 'SUBSCRIBER-ONLY PREVIEW', 'access-label'), element('p', audience === 'subscriber' ? 'No subscriber media or experiences have been added to this draft. This preview does not grant subscription access.' : 'A labelled preview only. No subscriber media or experiences are supplied.', 'profile-copy'));
    card.append(biography, privateSection);
  }
  const edit = element('button', 'Back to profile editing', 'button outline');
  edit.type = 'button';
  edit.addEventListener('click', () => { preview.hidden = true; form.hidden = false; fields.get('name').input.focus(); });
  preview.append(title, element('p', 'Audience previews show this fictional draft only. They are not account roles or access permissions.', 'profile-copy'), controls, card, edit);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    for (const [key, { input }] of fields) draft[key] = input.value;
    const errors = [];
    for (const [key, { input, error }] of fields) {
      error.textContent = '';
      input.removeAttribute('aria-invalid');
      if (['name', 'username'].includes(key) && !draft[key].trim()) error.textContent = 'This public field is required for the draft.';
      if (key === 'age' && (!draft.age || !Number.isSafeInteger(Number(draft.age)) || Number(draft.age) < 18)) error.textContent = 'Enter a whole-number age of 18 or older.';
      if (key === 'city' && !['Vancouver', 'Toronto', 'Montréal'].includes(draft.city)) error.textContent = 'Choose a demo city.';
      if (key === 'photo' && !providers.some((p) => String(p.photo) === draft.photo)) error.textContent = 'Choose a fictional main photo.';
      if (error.textContent) { input.setAttribute('aria-invalid', 'true'); errors.push(input); }
    }
    if (errors.length) { summary.textContent = 'Check the highlighted fields before previewing.'; errors[0].focus(); return; }
    summary.textContent = '';
    audience = 'visitor';
    paintPreview();
    form.hidden = true;
    preview.hidden = false;
    title.focus();
    preview.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  const storage = privateDraftControls({
    onDelete: async () => {
      const epoch = identityEpoch;
      const removed = await deleteProfileDraft();
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      return removed ? 'Saved private profile draft deleted. Editor text is unsaved; your account is unchanged.' : 'No saved private profile draft found to delete. Your account is unchanged.';
    },
    onSave: async () => {
      for (const [key, { input }] of fields) draft[key] = input.value;
      await saveProfileDraft({ ...draft });
      return 'Private profile draft saved. It is not published.';
    },
    onLoad: async () => {
      const epoch = identityEpoch;
      const saved = await loadProfileDraft();
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      if (!saved) return 'No private profile draft found for this account.';
      draft = saved; sync(); preview.hidden = true; form.hidden = false;
      fields.get('name').input.focus();
      return 'Your private profile draft was loaded.';
    },
  });
  container.append(form, preview);
  if (storage) container.append(storage);
}
