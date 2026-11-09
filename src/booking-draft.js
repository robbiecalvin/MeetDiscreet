import { providers } from './data.js';
import { backendEnabled } from './backend/client.js';
import { trackDraft } from './draft-changes.js';
import { bookingActivities, bookingDraftErrors, durationLabel } from './booking-draft-rules.js';
const defaults = () => ({ provider: '', activity: '', date: '', time: '', timeZone: '', duration: '', venue: '', expenses: '', notes: '' });
let draft = defaults();
const changes = trackDraft('booking', () => draft, backendEnabled);
export function clearBookingDraftState() { draft = defaults(); changes.saved(); }
function node(tag, text, className) {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
}
export function renderBookingDraft(container, navigate) {
  container.replaceChildren();
  const root = node('div', null, 'booking-draft');
  const back = node('a', '← Back to User setup', 'profile-back'); back.href = '?page=user-setup';
  back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('user-setup'); });
  root.append(back, node('p', 'A PLAN WORTH SHARING', 'eyebrow'), node('h1', 'Shape a booking request.'), node('p', 'Start with a person, a plan, and a little time together.', 'offering-lead'), node('p', 'Booking request preview. Use fictional plans. Nothing is saved or sent, no time is reserved, and no price or deposit is calculated.', 'editor-notice'));
  const layout = node('div', null, 'booking-layout');
  const form = node('form', null, 'booking-form'); form.noValidate = true;
  const error = node('p', '', 'editor-errors'); error.setAttribute('role', 'alert'); form.append(error);
  const fields = new Map();
  function field(key, label, type, options, maxLength) {
    const wrapper = node('div', null, 'editor-field');
    const input = node(type === 'select' ? 'select' : type === 'textarea' ? 'textarea' : 'input');
    if (!['select', 'textarea'].includes(type)) input.type = type;
    if (type === 'textarea') input.rows = 5;
    input.id = `booking-${key}`;
    if (maxLength) input.maxLength = maxLength;
    if (key === 'duration') { input.min = '1'; input.step = '1'; input.placeholder = 'e.g. 120'; }
    if (options) for (const [value, text] of options) { const option = node('option', text); option.value = value; input.append(option); }
    input.required = ['provider', 'activity', 'date', 'time', 'timeZone', 'duration'].includes(key);
    const title = node('label', label); title.htmlFor = input.id;
    const message = node('p', '', 'editor-field-error'); message.id = `booking-${key}-error`; input.setAttribute('aria-describedby', message.id);
    input.addEventListener('input', () => { draft[key] = input.value; input.removeAttribute('aria-invalid'); message.textContent = ''; error.textContent = ''; if (key === 'provider') paintProvider(); });
    wrapper.append(title, input, message); form.append(wrapper); fields.set(key, { input, message });
  }
  field('provider', 'Fictional provider', 'select', [['', 'Choose a provider'], ...providers.map(value => [value.id, `${value.name} · ${value.city}`])]);
  field('activity', 'Activity idea', 'select', [['', 'Choose an activity'], ...bookingActivities.map(value => [value, value])]);
  field('date', 'Proposed date', 'date');
  field('time', 'Local start time', 'time');
  const zones = [...new Set(['UTC', ...(Intl.supportedValuesOf?.('timeZone') || ['America/Vancouver', 'America/Toronto', 'Europe/London', 'Australia/Sydney'])])].sort();
  field('timeZone', 'Plan time zone', 'select', [['', 'Choose a time zone'], ...zones.map(value => [value, value])]);
  field('duration', 'Requested duration (minutes)', 'number');
  field('venue', 'Proposed venue or general area (optional)', 'text', null, 200);
  field('expenses', 'Proposed expenses (optional)', 'text', null, 240);
  field('notes', 'Requests or notes (optional)', 'textarea', null, 1000);
  const actions = node('div', null, 'editor-actions');
  const sample = node('button', 'Use a fictional booking plan', 'button outline'); sample.type = 'button';
  const submit = node('button', 'Review booking draft', 'button primary'); submit.type = 'submit';
  const clear = node('button', 'Clear booking draft', 'button quiet'); clear.type = 'button'; actions.append(sample, submit, clear); form.append(actions);
  const person = node('aside', null, 'booking-provider'); person.setAttribute('aria-label', 'Selected fictional provider');
  function paintProvider() {
    const provider = providers.find(value => value.id === draft.provider);
    person.replaceChildren(node('p', 'YOUR DRAFT PLAN', 'eyebrow'));
    if (!provider) { person.append(node('h2', 'Who would you like to meet?'), node('p', 'Choose a fictional provider to start this layout preview.')); return; }
    const photo = node('div', null, `portrait portrait-${provider.photo} booking-provider-photo`); photo.setAttribute('role', 'img'); photo.setAttribute('aria-label', `Fictional portrait of ${provider.name}`);
    person.append(photo, node('h2', `${provider.name}, ${provider.age}`), node('p', `${provider.area}, ${provider.city}`), node('p', 'Live booking requests require a subscription to the selected provider and eligibility checks. This preview does not grant access.', 'profile-small'));
  }
  const preview = node('section', null, 'booking-review'); preview.hidden = true;
  const heading = node('h2', 'Review your unsent draft'); heading.tabIndex = -1;
  const summary = node('dl', null, 'booking-summary');
  const edit = node('button', 'Edit booking draft', 'button outline'); edit.type = 'button';
  edit.addEventListener('click', () => { preview.hidden = true; layout.hidden = false; fields.get('provider').input.focus(); });
  preview.append(heading, node('p', 'This is an unsent draft preview. Dates and times are proposed; live requests need availability checks, provider agreement and a confirmed quote.', 'profile-small'), summary, edit);
  function sync() { for (const [key, { input, message }] of fields) { input.value = draft[key]; input.removeAttribute('aria-invalid'); message.textContent = ''; } error.textContent = ''; paintProvider(); }
  sample.addEventListener('click', () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(value => [value.type, value.value]));
    const nextWeek = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`); nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    draft = { provider: 'maya', activity: 'Culture', date: nextWeek.toISOString().slice(0, 10), time: '14:00', timeZone: 'America/Vancouver', duration: '120', venue: 'A gallery and nearby café in Vancouver', expenses: 'Discuss admission and café expenses with the provider.', notes: 'A fictional gallery afternoon with time for conversation.' };
    sync(); fields.get('provider').input.focus();
  });
  clear.addEventListener('click', () => { clearBookingDraftState(); sync(); fields.get('provider').input.focus(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const [key, { input, message }] of fields) { draft[key] = input.value; input.removeAttribute('aria-invalid'); message.textContent = ''; }
    const problems = bookingDraftErrors(draft, providers.map(value => value.id));
    if (problems.length) {
      for (const [key, text] of problems) { fields.get(key).input.setAttribute('aria-invalid', 'true'); fields.get(key).message.textContent = text; }
      error.textContent = 'Check the highlighted fields before reviewing your draft.'; fields.get(problems[0][0]).input.focus(); return;
    }
    const provider = providers.find(value => value.id === draft.provider);
    summary.replaceChildren();
    for (const [title, value] of [['Fictional provider', `${provider.name} · ${provider.city}`], ['Activity idea', draft.activity], ['Proposed date', draft.date], ['Local start', `${draft.time} · ${draft.timeZone}`], ['Requested duration', durationLabel(Number(draft.duration))], ['Proposed venue', draft.venue.trim() || 'To discuss'], ['Proposed expenses', draft.expenses.trim() || 'To discuss'], ['Requests or notes', draft.notes.trim() || 'None added'], ['Price estimate', 'Not calculated in this preview']]) {
      summary.append(node('dt', title), node('dd', value));
    }
    layout.hidden = true; preview.hidden = false; heading.focus();
  });
  sync(); layout.append(form, person); root.append(layout, preview); container.append(root);
}
