import { trackDraft } from './draft-changes.js';
import { parseDraftAmount } from './draft-amount.js';
import { backendEnabled } from './backend/client.js';
import { saveExperienceDraft, loadExperienceDraft, deleteExperienceDraft } from './backend/drafts.js';
import { privateDraftControls } from './backend/draft-controls.js';
import { draftToolNavigation } from './draft-tools.js';
let items = [];
let nextId = 1;
const blank = () => ({ title: '', description: '', offered: true, included: true, amount: '', feeType: 'once' });
let composer = blank();
let editingId = null;
let identityEpoch = 0;
const changes = trackDraft('experiences', () => ({ items, composer }), backendEnabled);
export function clearExperienceDraftState() { identityEpoch++; items = []; nextId = 1; composer = blank(); editingId = null; changes.saved(); }

function amountLabel(minor) {
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, '0')}`;
}
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function renderExperiences(container, onBack, onTool) {
  container.replaceChildren();
  const back = element('a', '← Back to discovery', 'profile-back');
  back.href = './';
  back.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onBack();
  });
  const intro = element('div', null, 'editor-intro');
  intro.append(element('p', 'A LITTLE SOMETHING TO LOOK FORWARD TO', 'eyebrow'), element('h1', 'Shape your experiences.'), element('p', 'Describe what you offer and try the catalogue layout.', 'offering-lead'));
  container.append(back, draftToolNavigation('experiences', onTool), intro, element('p', backendEnabled ? 'Private development catalogue. Add or update items before saving the catalogue. Unsaved edits clear on refresh. Currency is pending; nothing is published or charged.' : 'Demo catalogue. Use fictional details and amounts. Nothing is saved, published, or charged. Currency and payment policies remain pending; refresh clears all drafts.', 'editor-notice'));
  const editor = element('div', null, 'experience-editor');
  const form = element('form', null, 'experience-form');
  form.noValidate = true;
  const heading = element('h2', 'Add an experience');
  const error = element('p', '', 'editor-errors');
  error.setAttribute('role', 'alert');
  form.append(heading, error);
  const fields = {};
  function field(key, label, type, options) {
    const group = element('div', null, 'editor-field');
    const control = element(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input');
    control.id = `experience-${key}`;
    const labelNode = element('label', label);
    labelNode.htmlFor = control.id;
    if (type === 'text') control.type = 'text';
    if (type === 'textarea') { control.rows = 5; control.maxLength = 1000; }
    if (key === 'title') { control.maxLength = 100; control.required = true; }
    if (key === 'amount') { control.inputMode = 'decimal'; control.maxLength = 20; }
    if (options) for (const [value, text] of options) { const option = element('option', text); option.value = value; control.append(option); }
    control.addEventListener('input', () => { composer[key] = control.value; control.removeAttribute('aria-invalid'); error.textContent = ''; });
    group.append(labelNode, control);
    form.append(group);
    fields[key] = control;
  }
  field('title', 'Experience title', 'text');
  field('description', 'Description and restrictions (optional)', 'textarea');
  for (const [key, label] of [['offered', 'Offer this experience in the draft'], ['included', 'Included in hourly rate']]) {
    const wrapper = element('label', null, 'experience-checkbox');
    const control = element('input');
    control.type = 'checkbox';
    control.id = `experience-${key}`;
    wrapper.append(control, element('span', label));
    form.append(wrapper);
    fields[key] = control;
    control.addEventListener('change', () => { composer[key] = control.checked; if (key === 'included') updateExtras(); });
  }
  field('amount', 'Extra amount (currency pending)', 'text');
  field('feeType', 'Extra applies', 'select', [['once', 'One time'], ['hourly', 'Per hour']]);
  const hint = element('p', 'Draft format only: a non-negative amount with up to two decimal places, such as 15.00. No currency or payable total is calculated.', 'editor-hint');
  hint.id = 'experience-amount-hint';
  fields.amount.setAttribute('aria-describedby', `${hint.id} experience-error`);
  error.id = 'experience-error';
  fields.title.setAttribute('aria-describedby', error.id);
  form.append(hint);
  const add = element('button', 'Add to draft', 'button primary');
  add.type = 'submit';
  const cancel = element('button', 'Cancel item edit', 'button quiet');
  cancel.type = 'button';
  cancel.hidden = true;
  cancel.addEventListener('click', () => { composer = blank(); editingId = null; sync(); fields.title.focus(); });
  form.append(add, cancel);
  function updateExtras() {
    fields.amount.disabled = composer.included;
    fields.feeType.disabled = composer.included;
    if (composer.included) { composer.amount = ''; fields.amount.value = ''; composer.feeType = 'once'; fields.feeType.value = 'once'; }
    fields.amount.removeAttribute('aria-invalid');
    error.textContent = '';
  }
  function sync() {
    for (const key of ['title', 'description', 'amount', 'feeType']) fields[key].value = composer[key];
    for (const key of ['offered', 'included']) fields[key].checked = composer[key];
    heading.textContent = editingId ? 'Edit draft experience' : 'Add an experience';
    add.textContent = editingId ? 'Update draft item' : 'Add to draft';
    cancel.hidden = !editingId;
    fields.title.removeAttribute('aria-invalid');
    updateExtras();
  }
  const owner = element('section', null, 'catalogue-owner');
  owner.setAttribute('aria-labelledby', 'catalogue-heading');
  const ownerTitle = element('h2', 'Your draft catalogue');
  ownerTitle.id = 'catalogue-heading';
  const status = element('p', '', 'profile-small');
  status.setAttribute('role', 'status');
  const list = element('div', null, 'catalogue-draft-list');
  const actions = element('div', null, 'catalogue-actions');
  const samples = element('button', 'Add fictional examples', 'button outline');
  const previewButton = element('button', 'Preview catalogue', 'button primary');
  actions.append(samples, previewButton);
  owner.append(ownerTitle, status, list, actions);
  function itemCard(item, withControls) {
    const card = element('article', null, 'experience-item');
    card.append(element('p', item.offered ? 'OFFERED · DRAFT ONLY' : 'NOT OFFERED · DRAFT ONLY', 'eyebrow'), element('h3', item.title));
    if (item.description) card.append(element('p', item.description, 'draft-description'));
    card.append(element('p', item.included ? 'Included in hourly rate' : `${amountLabel(item.minor)} · currency pending · ${item.feeType === 'hourly' ? 'per hour' : 'one time'} extra`, 'experience-fee'));
    if (withControls) {
      const controls = element('div', null, 'experience-item-actions');
      const edit = element('button', 'Edit', 'button quiet');
      edit.setAttribute('aria-label', `Edit ${item.title}`);
      edit.addEventListener('click', () => {
        composer = { title: item.title, description: item.description, offered: item.offered, included: item.included, amount: item.included ? '' : amountLabel(item.minor), feeType: item.feeType };
        editingId = item.id;
        sync(); fields.title.focus();
      });
      const remove = element('button', 'Remove', 'button quiet');
      remove.setAttribute('aria-label', `Remove ${item.title}`);
      remove.addEventListener('click', () => {
        items = items.filter((value) => value.id !== item.id);
        if (editingId === item.id) { editingId = null; composer = blank(); sync(); }
        paintList(); samples.focus();
      });
      controls.append(edit, remove);
      card.append(controls);
    }
    return card;
  }
  function paintList() {
    list.replaceChildren();
    status.textContent = `${items.length} draft ${items.length === 1 ? 'experience' : 'experiences'}`;
    if (!items.length) list.append(element('p', 'No experiences in this draft yet.', 'catalogue-empty'));
    for (const item of items) list.append(itemCard(item, true));
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const minor = composer.included ? 0 : parseDraftAmount(composer.amount.trim());
    if (!composer.title.trim()) {
      error.textContent = 'Enter a title for this draft experience.';
      fields.title.setAttribute('aria-invalid', 'true'); fields.title.focus(); return;
    }
    if (!['once', 'hourly'].includes(composer.feeType)) {
      error.textContent = 'Choose one-time or hourly for the draft extra.'; fields.feeType.focus(); return;
    }
    if (minor === null) {
      error.textContent = 'Use a non-negative draft amount with no more than two decimal places.';
      fields.amount.setAttribute('aria-invalid', 'true'); fields.amount.focus(); return;
    }
    const item = { id: editingId || nextId++, title: composer.title.trim(), description: composer.description.trim(), offered: composer.offered, included: composer.included, minor, feeType: composer.included ? 'once' : composer.feeType };
    if (editingId) items = items.map((value) => value.id === editingId ? item : value);
    else items.push(item);
    editingId = null; composer = blank(); sync(); paintList(); fields.title.focus();
  });
  samples.addEventListener('click', () => {
    for (const title of ['Coffee and conversation', 'A gallery afternoon']) {
      if (!items.some((item) => item.title === title)) items.push({ id: nextId++, title, description: 'A fictional social experience for catalogue layout review.', offered: true, included: true, minor: 0, feeType: 'once' });
    }
    paintList();
  });
  const preview = element('section', null, 'catalogue-preview');
  preview.hidden = true;
  const previewTitle = element('h2', 'Catalogue layout preview');
  previewTitle.tabIndex = -1;
  const audienceControls = element('div', null, 'audience-controls');
  audienceControls.setAttribute('role', 'group');
  audienceControls.setAttribute('aria-label', 'Catalogue audience preview');
  const previewItems = element('div', null, 'catalogue-preview-items');
  const visitor = element('button', 'Visitor preview');
  const subscriber = element('button', 'Subscriber preview');
  function paintPreview(isSubscriber) {
    visitor.setAttribute('aria-pressed', String(!isSubscriber));
    subscriber.setAttribute('aria-pressed', String(isSubscriber));
    previewItems.replaceChildren();
    if (!isSubscriber) previewItems.append(element('div', 'SUBSCRIBER-ONLY PREVIEW · Detailed experiences and add-ons are not public.', 'catalogue-locked'));
    else {
      const offered = items.filter((item) => item.offered);
      if (!offered.length) previewItems.append(element('p', 'No offered experiences in this draft.', 'catalogue-empty'));
      for (const item of offered) previewItems.append(itemCard(item, false));
    }
  }
  visitor.addEventListener('click', () => paintPreview(false));
  subscriber.addEventListener('click', () => paintPreview(true));
  audienceControls.append(visitor, subscriber);
  const backToEdit = element('button', 'Back to catalogue editing', 'button outline');
  backToEdit.addEventListener('click', () => { preview.hidden = true; editor.hidden = false; fields.title.focus(); });
  preview.append(previewTitle, element('p', 'Catalogue layout preview only. No subscription access, charge, or booking quote is created.', 'profile-copy'), audienceControls, previewItems, backToEdit);
  previewButton.addEventListener('click', () => { editor.hidden = true; preview.hidden = false; paintPreview(false); previewTitle.focus(); preview.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  const storage = privateDraftControls({
    loadLabel: 'Load my experience catalogue',
    deleteLabel: 'Delete saved experience catalogue',
    deleteConfirmation: 'Delete your saved private experience catalogue? This cannot be undone. Your account and current editor items will remain.',
    onDelete: async () => {
      const epoch = identityEpoch;
      const removed = await deleteExperienceDraft();
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      if (removed) changes.saved({ items: [], composer: blank() });
      return removed ? 'Saved private experience catalogue deleted. Editor items are unsaved; your account is unchanged.' : 'No saved private experience catalogue found to delete. Your account is unchanged.';
    },
    onSave: async () => {
      const epoch = identityEpoch;
      const snapshot = items.map(item => ({ ...item }));
      await saveExperienceDraft(snapshot);
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      changes.saved({ items: snapshot, composer: blank() });
      return 'Private experience catalogue saved. Unadded item edits are not included. Nothing is published or charged.';
    },
    onLoad: async () => {
      const epoch = identityEpoch;
      const saved = await loadExperienceDraft();
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      if (saved === null) return 'No private experience catalogue found for this account.';
      items = saved.map((item, index) => ({ ...item, id: index + 1 }));
      nextId = items.length + 1;
      composer = blank(); editingId = null;
      changes.saved();
      sync(); paintList(); preview.hidden = true; editor.hidden = false;
      fields.title.focus();
      return 'Your private experience catalogue was loaded.';
    },
  });
  sync(); paintList();
  editor.append(form, owner);
  container.append(editor, preview);
  if (storage) container.append(storage);
}
