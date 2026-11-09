import { backendEnabled } from './backend/client.js';
import { listListingDrafts, saveListingDraft, deleteListingDraft } from './backend/drafts.js';
import { privateDraftControls } from './backend/draft-controls.js';
// Unsaved editor state is separate from owner-only storage and public listings.
const defaults = () => ({ category: 'offering', title: '', description: '', city: 'Vancouver', area: '', activity: 'Coffee' });
let draft = defaults();
let savedId = null;
let identityEpoch = 0;
export function clearListingDraftState() { draft = defaults(); savedId = null; identityEpoch++; }
const examples = {
  offering: { title: 'A coffee, a city walk, and good conversation', description: 'Enjoy an unhurried coffee and a walk around the neighbourhood. A simple plan with time to chat and discover somewhere new.', area: 'Kitsilano' },
  looking: { title: 'Company for a gallery afternoon?', description: 'Looking for someone to explore a local gallery and share a coffee afterwards. A relaxed afternoon with no rush and plenty to talk about.', area: 'Mount Pleasant' },
};
function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

export function renderListingEditor(container, onBack) {
  container.replaceChildren();
  const back = element('a', '← Back to discovery', 'profile-back');
  back.href = './';
  back.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onBack();
  });
  const intro = element('div', null, 'editor-intro');
  intro.append(element('p', 'A LITTLE PLAN STARTS HERE', 'eyebrow'), element('h1', 'Put a plan into words.'), element('p', 'Offer your company or describe an experience you’d like to share.', 'offering-lead'));
  const notice = element('p', backendEnabled ? 'Development listing drafts. Use test data. Unsaved edits clear on refresh; sign in to save/load private drafts. Saving does not publish or grant posting access.' : 'Demo editor. Use fictional details. Nothing is saved or published; a full refresh clears this draft.', 'editor-notice');
  container.append(back, intro, notice);
  const selection = element('p', '', 'editor-notice');
  selection.setAttribute('role', 'status');
  function updateSelection() {
    selection.textContent = savedId ? 'Editing a saved private draft. Saving updates this draft.' : 'New private draft. Saving creates a separate draft.';
  }
  updateSelection();
  if (backendEnabled) container.append(selection);
  const form = element('form', null, 'listing-form');
  form.noValidate = true;
  const fields = new Map();
  const summary = element('p', '', 'editor-errors');
  summary.setAttribute('role', 'alert');
  form.append(summary);

  function addField(key, label, type, options, help) {
    const wrapper = element('div', null, `editor-field editor-field-${key}`);
    const control = element(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input');
    control.id = `listing-${key}`;
    control.name = key;
    if (type === 'text') control.type = 'text';
    if (type === 'textarea') { control.rows = 7; control.maxLength = 1600; }
    if (key === 'title') control.maxLength = 120;
    if (key === 'area') control.maxLength = 80;
    if (options) for (const [value, text] of options) {
      const option = element('option', text);
      option.value = value;
      control.append(option);
    }
    const labelNode = element('label', label);
    labelNode.htmlFor = control.id;
    const hint = element('p', help, 'editor-hint');
    hint.id = `listing-${key}-hint`;
    const error = element('p', '', 'editor-field-error');
    error.id = `listing-${key}-error`;
    control.setAttribute('aria-describedby', `${hint.id} ${error.id}`);
    if (['title', 'description', 'city', 'category', 'activity'].includes(key)) control.required = true;
    control.value = draft[key];
    control.addEventListener('input', () => {
      draft[key] = control.value;
      control.removeAttribute('aria-invalid');
      error.textContent = '';
      summary.textContent = '';
      if (key === 'category') updateAuthor();
    });
    wrapper.append(labelNode, control, hint, error);
    form.append(wrapper);
    fields.set(key, { control, error });
  }
  addField('category', 'Listing type', 'select', [['offering', 'Offering'], ['looking', 'Looking For']], 'Offering advertises companion experiences. Looking For describes a plan you want company for.');
  const author = element('p', '', 'editor-author');
  function updateAuthor() {
    author.textContent = draft.category === 'offering' ? 'Preview author: demo companion. Real publishing requires an eligible companion account.' : 'Preview author: demo member. Real posting requires account access and a confirmed allowance.';
  }
  updateAuthor();
  form.append(author);
  addField('title', 'Ad title', 'text', null, '5–120 characters. Keep it specific and easy to scan.');
  addField('description', 'Describe your plan', 'textarea', null, '20–1,600 characters. Use public-style details; leave private contact information out.');
  addField('city', 'City', 'select', [['Vancouver', 'Vancouver'], ['Toronto', 'Toronto'], ['Montréal', 'Montréal']], 'Demo cities only; this does not use device location.');
  addField('area', 'General area (optional)', 'text', null, 'A neighbourhood, not an exact address. Up to 80 characters.');
  addField('activity', 'Activity', 'select', [['Coffee', 'Coffee'], ['Dining', 'Dining'], ['Culture', 'Culture'], ['Outdoors', 'Outdoors']], 'Choose the closest fit for this draft.');

  const actions = element('div', null, 'editor-actions');
  const sample = element('button', 'Use a fictional example', 'button outline');
  sample.type = 'button';
  const submit = element('button', 'Preview draft', 'button primary');
  submit.type = 'submit';
  const clear = element('button', backendEnabled ? 'Start a new draft' : 'Clear draft', 'button quiet');
  clear.type = 'button';
  sample.addEventListener('click', () => {
    Object.assign(draft, examples[draft.category]);
    syncFields();
    fields.get('title').control.focus();
  });
  clear.addEventListener('click', () => {
    draft = defaults();
    savedId = null;
    syncFields();
    fields.get('title').control.focus();
  });
  function syncFields() {
    for (const [key, { control, error }] of fields) {
      control.value = draft[key];
      control.removeAttribute('aria-invalid');
      error.textContent = '';
    }
    summary.textContent = '';
    updateAuthor();
    updateSelection();
  }
  actions.append(sample, submit, clear);
  form.append(actions);

  const preview = element('section', null, 'editor-preview');
  preview.hidden = true;
  preview.setAttribute('aria-labelledby', 'draft-preview-heading');
  const heading = element('h2', 'Your draft preview');
  heading.id = 'draft-preview-heading';
  heading.tabIndex = -1;
  const card = element('article', null, 'draft-preview-card');
  const edit = element('button', 'Back to editing', 'button outline');
  edit.type = 'button';
  edit.addEventListener('click', () => {
    preview.hidden = true;
    form.hidden = false;
    fields.get('title').control.focus();
  });
  preview.append(heading, card, element('p', backendEnabled ? 'Preview only. Save controls store a private draft; nothing is published or added to discovery. No publishing or posting access is granted.' : 'Preview only. This draft is not saved, published, or added to discovery. No publishing or posting access has been granted.', 'profile-small'), edit);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    for (const [key, { control }] of fields) draft[key] = control.value;
    const errors = [];
    for (const [key, minimum, maximum] of [['title', 5, 120], ['description', 20, 1600], ['area', 0, 80]]) {
      const value = draft[key].trim();
      const { control, error } = fields.get(key);
      error.textContent = '';
      control.removeAttribute('aria-invalid');
      if (value.length < minimum || value.length > maximum) {
        error.textContent = `${key === 'title' ? 'Title' : key === 'description' ? 'Description' : 'Area'} must be ${minimum ? `${minimum}–${maximum}` : `at most ${maximum}`} characters.`;
        control.setAttribute('aria-invalid', 'true');
        errors.push(control);
      }
    }
    for (const [key, allowed] of [['category', ['offering', 'looking']], ['city', ['Vancouver', 'Toronto', 'Montréal']], ['activity', ['Coffee', 'Dining', 'Culture', 'Outdoors']]]) {
      if (!allowed.includes(draft[key])) {
        const { control, error } = fields.get(key);
        error.textContent = 'Choose a valid option.';
        control.setAttribute('aria-invalid', 'true');
        errors.push(control);
      }
    }
    if (errors.length) {
      summary.textContent = 'Please check the highlighted fields before previewing.';
      errors[0].focus();
      return;
    }
    card.replaceChildren();
    card.append(element('p', `${draft.category === 'offering' ? 'OFFERING' : 'LOOKING FOR'} · DRAFT ONLY`, 'eyebrow'), element('h3', draft.title.trim()), element('p', draft.description.trim(), 'draft-description'), element('p', [draft.area.trim(), draft.city].filter(Boolean).join(', '), 'profile-location'), element('span', draft.activity, 'draft-activity'));
    form.hidden = true;
    preview.hidden = false;
    heading.focus();
    preview.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  let choicesContainer;
  const storage = privateDraftControls({
    multiple: true,
    onSave: async () => {
      for (const [key, { control }] of fields) draft[key] = control.value;
      const epoch = identityEpoch;
      const nextId = await saveListingDraft({ ...draft }, savedId);
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      savedId = nextId;
      updateSelection();
      choicesContainer?.replaceChildren();
      return 'Private listing draft saved. It has not been published.';
    },
    onLoad: async (choices) => {
      choicesContainer = choices;
      const epoch = identityEpoch;
      const rows = await listListingDrafts();
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      choices.replaceChildren();
      for (const row of rows) {
        const item = element('article', null, 'saved-draft-item');
        const button = element('button', row.title, 'button outline');
        const metadata = element('p', `${row.kind === 'offering' ? 'Offering' : 'Looking For'} · ${row.city} · Private draft`, 'profile-small');
        const remove = element('button', 'Delete draft', 'button quiet');
        remove.type = 'button';
        remove.setAttribute('aria-label', `Delete draft: ${row.title}`);
        const result = element('p', '', 'profile-small');
        result.setAttribute('role', 'status');
        remove.addEventListener('click', async () => {
          if (epoch !== identityEpoch || !window.confirm(`Delete the saved private draft “${row.title}”? This cannot be undone.`)) return;
          button.disabled = true; remove.disabled = true;
          result.textContent = 'Deleting…';
          try {
            await deleteListingDraft(row.id);
            if (epoch !== identityEpoch) return;
            const wasSelected = savedId === row.id;
            if (wasSelected) {
              savedId = null;
              updateSelection();
            }
            item.replaceChildren(element('p', wasSelected ? 'Private draft deleted. Any text in the editor is now unsaved.' : 'Private draft deleted.', 'profile-small'));
          } catch {
            if (epoch !== identityEpoch) return;
            result.textContent = 'Unable to delete this draft. Check your connection and sign-in, then retry.';
            button.disabled = false; remove.disabled = false;
          }
        });
        button.type = 'button';
        button.addEventListener('click', () => {
          if (epoch !== identityEpoch) return;
          savedId = row.id;
          draft = { category: row.kind, title: row.title, description: row.description, city: row.city, area: row.area, activity: row.activity };
          syncFields(); preview.hidden = true; form.hidden = false;
          fields.get('title').control.focus();
        });
        item.append(button, metadata, remove, result);
        choices.append(item);
      }
      return rows.length ? 'Choose one of your private drafts to load.' : 'No private listing drafts found for this account.';
    },
  });
  container.append(form, preview);
  if (storage) container.append(storage);
}
