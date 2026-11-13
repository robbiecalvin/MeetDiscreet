import './provider-draft-tools.css';
import { saveAvailabilityDraft, loadAvailabilityDraft, deleteAvailabilityDraft } from './backend/drafts.js';
import { privateDraftControls } from './backend/draft-controls.js';
import { weekdays, validTimeZone, windowError, orderedWindows } from './weekly-schedule.js';
import { draftToolNavigation } from './draft-tools.js';
import { trackDraft } from './draft-changes.js';
import { backendEnabled } from './backend/client.js';
let schedule = { timeZone: '', windows: [] };
let composer = { day: '1', start: '', end: '' };
let editingId = null;
let nextId = 1;
let identityEpoch = 0;
const changes = trackDraft('availability', () => ({ schedule, composer }), backendEnabled);
export function clearAvailabilityState() {
  identityEpoch++;
  schedule = { timeZone: '', windows: [] }; composer = { day: '1', start: '', end: '' }; editingId = null; nextId = 1; changes.saved();
}
function node(tag, text, className) {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
}
export function renderAvailability(container, navigate) {
  container.replaceChildren();
  const root = node('div', null, 'availability-editor');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account';
  back.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate('account');
  });
  root.append(back, draftToolNavigation('availability', navigate), node('p', 'MAKE ROOM FOR GOOD COMPANY', 'eyebrow'), node('h1', 'Shape your availability.'), node('p', 'Build a weekly pattern with time for the experiences you offer.', 'offering-lead'), node('p', backendEnabled ? 'Private availability drafts. Save added windows explicitly; unsaved edits clear on refresh. Nothing is published, reserved, or confirmed for bookings.' : 'Schedule preview. Nothing is saved or published. A full refresh clears this draft; no times are reserved and no booking availability is confirmed.', 'editor-notice'));
  const form = node('form', null, 'availability-form'); form.noValidate = true;
  const error = node('p', '', 'editor-errors'); error.id = 'availability-error'; error.setAttribute('role', 'alert');
  form.append(error);
  function field(id, label, control) {
    const wrapper = node('div', null, 'editor-field');
    const title = node('label', label); title.htmlFor = id; control.id = id;
    control.setAttribute('aria-describedby', error.id); wrapper.append(title, control); return wrapper;
  }
  const zone = node('select'); zone.required = true;
  const placeholder = node('option', 'Choose a time zone'); placeholder.value = ''; zone.append(placeholder);
  const zones = [...new Set(['UTC', ...(Intl.supportedValuesOf?.('timeZone') || ['America/Vancouver', 'America/Toronto', 'Europe/London', 'Australia/Sydney'])])].sort();
  if (schedule.timeZone && !zones.includes(schedule.timeZone)) zones.push(schedule.timeZone);
  for (const value of zones) { const option = node('option', value); option.value = value; zone.append(option); }
  zone.value = schedule.timeZone;
  form.append(field('availability-zone', 'Schedule time zone', zone), node('p', 'Changing the time zone keeps the local clock times below.', 'editor-hint'));
  const row = node('div', null, 'availability-window-fields');
  const day = node('select');
  for (const index of [1, 2, 3, 4, 5, 6, 0]) { const option = node('option', weekdays[index]); option.value = String(index); day.append(option); }
  const start = node('input'); start.type = 'time'; start.required = true;
  const end = node('input'); end.type = 'time'; end.required = true;
  row.append(field('availability-day', 'Weekday', day), field('availability-start', 'Starts at', start), field('availability-end', 'Ends at', end));
  form.append(row);
  const actions = node('div', null, 'editor-actions');
  const add = node('button', 'Add time window', 'button primary'); add.type = 'submit';
  const cancel = node('button', 'Cancel window edit', 'button quiet'); cancel.type = 'button';
  actions.append(add, cancel); form.append(actions);
  const list = node('section', null, 'availability-list'); list.setAttribute('aria-label', 'Weekly draft windows');
  const count = node('p', '', 'profile-small'); count.setAttribute('role', 'status');
  const preview = node('section', null, 'availability-preview'); preview.hidden = true;
  const controls = node('div', null, 'editor-actions');
  const show = node('button', 'Preview weekly draft', 'button outline'); show.type = 'button';
  const clear = node('button', 'Clear schedule draft', 'button quiet'); clear.type = 'button';
  controls.append(show, clear);
  function sync() {
    day.value = composer.day; start.value = composer.start; end.value = composer.end;
    add.textContent = editingId ? 'Update time window' : 'Add time window'; cancel.hidden = !editingId;
    error.textContent = '';
  }
  function resetComposer() { composer = { day: '1', start: '', end: '' }; editingId = null; sync(); }
  function paint() {
    list.replaceChildren(); count.textContent = `${schedule.windows.length} draft time ${schedule.windows.length === 1 ? 'window' : 'windows'}`;
    if (!schedule.windows.length) list.append(node('p', 'No time windows yet. Choose a time zone and add your first window.', 'catalogue-empty'));
    for (const value of orderedWindows(schedule.windows)) {
      const card = node('article', null, 'availability-window');
      const title = `${weekdays[value.day]} · ${value.start}–${value.end}`;
      const edit = node('button', 'Edit', 'button quiet'); edit.type = 'button'; edit.setAttribute('aria-label', `Edit ${title}`);
      edit.addEventListener('click', () => { composer = { day: String(value.day), start: value.start, end: value.end }; editingId = value.id; sync(); day.focus(); });
      const remove = node('button', 'Remove', 'button quiet'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${title}`);
      remove.addEventListener('click', () => {
        schedule.windows = schedule.windows.filter(item => item.id !== value.id);
        if (editingId === value.id) resetComposer();
        preview.hidden = true; paint(); day.focus();
      });
      card.append(node('h2', weekdays[value.day]), node('p', `${value.start}–${value.end}`), edit, remove); list.append(card);
    }
  }
  function clearError() { error.textContent = ''; preview.hidden = true; }
  zone.addEventListener('change', () => { schedule.timeZone = zone.value; clearError(); });
  for (const [control, key] of [[day, 'day'], [start, 'start'], [end, 'end']]) control.addEventListener('input', () => { composer[key] = control.value; clearError(); });
  cancel.addEventListener('click', () => { resetComposer(); day.focus(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validTimeZone(zone.value)) { error.textContent = 'Choose a valid schedule time zone.'; zone.focus(); return; }
    const candidate = { id: editingId || nextId, day: Number(day.value), start: start.value, end: end.value };
    const message = windowError(schedule.windows, candidate, editingId);
    if (message) { error.textContent = message; start.focus(); return; }
    schedule.timeZone = zone.value;
    if (editingId) schedule.windows = schedule.windows.map(value => value.id === editingId ? candidate : value);
    else { schedule.windows.push(candidate); nextId++; }
    resetComposer(); preview.hidden = true; paint(); day.focus();
  });
  show.addEventListener('click', () => {
    if (!validTimeZone(schedule.timeZone) || !schedule.windows.length) { error.textContent = 'Choose a time zone and add at least one time window to preview.'; zone.focus(); return; }
    const heading = node('h2', `Weekly draft · ${schedule.timeZone}`); heading.tabIndex = -1;
    preview.replaceChildren(heading, node('p', 'Added windows only. Unfinished edits are excluded; these are local weekly times, not confirmed appointments.', 'profile-small'));
    for (const value of orderedWindows(schedule.windows)) preview.append(node('p', `${weekdays[value.day]} · ${value.start}–${value.end}`));
    preview.hidden = false; heading.focus();
  });
  clear.addEventListener('click', () => { clearAvailabilityState(); zone.value = ''; sync(); paint(); preview.hidden = true; zone.focus(); });
  const storage = privateDraftControls({
    loadLabel: 'Load my availability draft',
    deleteLabel: 'Delete saved availability draft',
    deleteConfirmation: 'Delete your saved private availability draft? Your account and current editor windows will remain. This cannot be undone.',
    onSave: async () => {
      if (!validTimeZone(schedule.timeZone)) { zone.focus(); return 'Choose a valid schedule time zone before saving.'; }
      const epoch = identityEpoch;
      const snapshot = { timeZone: schedule.timeZone, windows: schedule.windows.map(value => ({ ...value })) };
      await saveAvailabilityDraft(snapshot);
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      changes.saved({ schedule: snapshot, composer: { day: '1', start: '', end: '' } });
      return 'Private availability draft saved. Unadded edits are excluded. No time is reserved or published.';
    },
    onLoad: async () => {
      const epoch = identityEpoch;
      const data = await loadAvailabilityDraft();
      if (epoch !== identityEpoch || !container.contains(root)) throw new Error('Account changed.');
      if (!data) return 'No private availability draft found for this account.';
      schedule = { timeZone: data.time_zone, windows: data.windows.map((value, index) => ({ ...value, id: index + 1 })) };
      nextId = schedule.windows.length + 1;
      if (![...zone.options].some(option => option.value === schedule.timeZone)) { const option = node('option', schedule.timeZone); option.value = schedule.timeZone; zone.append(option); }
      zone.value = schedule.timeZone; resetComposer(); changes.saved(); paint(); preview.hidden = true;
      return 'Your private availability draft was loaded.';
    },
    onDelete: async () => {
      const epoch = identityEpoch;
      const removed = await deleteAvailabilityDraft();
      if (epoch !== identityEpoch) throw new Error('Account changed.');
      if (removed) changes.saved({ schedule: { timeZone: '', windows: [] }, composer: { day: '1', start: '', end: '' } });
      return removed ? 'Saved availability draft deleted. Current editor windows are unsaved; your account is unchanged.' : 'No saved availability draft found to delete.';
    },
  });
  sync(); paint(); root.append(form, count, list, controls, preview);
  if (storage) root.append(storage);
  container.append(root);
}
