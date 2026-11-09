import { backendEnabled } from './backend/client.js';
import { listListingDrafts } from './backend/drafts.js';
import { clearListingDraftState } from './listing-editor.js';

function node(tag, text, className) {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
}
export function renderListingLibrary(container, navigate) {
  container.replaceChildren();
  const root = node('section', null, 'listing-library');
  const link = (page, label, draft) => {
    const value = node('a', label, 'button outline');
    value.href = `?page=${page}${draft ? `&draft=${encodeURIComponent(draft)}` : ''}`;
    value.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); navigate(page, draft ? { draft } : {});
    });
    return value;
  };
  const back = link('account', '← Back to account'); back.className = 'profile-back';
  root.append(back, node('p', 'YOUR PRIVATE PLANS', 'eyebrow'), node('h1', 'Saved listing drafts.'), node('p', 'Find a plan and continue editing. These drafts are private and unpublished.', 'offering-lead'));
  const actions = node('div', null, 'editor-actions');
  const create = link('create-listing', 'Start a new listing');
  create.addEventListener('click', event => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) clearListingDraftState();
  }, { capture: true });
  const refresh = node('button', 'Refresh drafts', 'button quiet'); refresh.type = 'button';
  actions.append(create, refresh);
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status');
  root.append(actions, status);
  container.append(root);
  if (!backendEnabled) { status.textContent = 'Saved listings require the development backend. You can still try the listing editor.'; refresh.hidden = true; return; }
  const controls = node('div', null, 'library-filters');
  const searchLabel = node('label', 'Search saved drafts');
  const search = node('input'); search.type = 'search'; search.id = 'library-search'; searchLabel.htmlFor = search.id;
  const typeLabel = node('label', 'Listing type');
  const type = node('select'); type.id = 'library-type'; typeLabel.htmlFor = type.id;
  for (const [value, label] of [['all', 'All types'], ['offering', 'Offering'], ['looking', 'Looking For']]) {
    const option = node('option', label); option.value = value; type.append(option);
  }
  const reset = node('button', 'Clear filters', 'button quiet'); reset.type = 'button';
  controls.append(searchLabel, search, typeLabel, type, reset);
  const list = node('div', null, 'library-list');
  root.append(controls, list);
  let rows = [];
  let loaded = false;
  const current = () => root.parentNode === container;
  function paint() {
    if (!loaded) return;
    const query = search.value.trim().toLocaleLowerCase();
    const matches = rows.filter(row => (type.value === 'all' || row.kind === type.value) && [row.title, row.city, row.area, row.activity].join(' ').toLocaleLowerCase().includes(query));
    list.replaceChildren();
    status.textContent = `${matches.length} of ${rows.length} saved drafts`;
    if (!matches.length) list.append(node('p', rows.length ? 'No drafts match these filters.' : 'No saved listing drafts yet. Start a new listing to create one.', 'catalogue-empty'));
    for (const row of matches) {
      const card = node('article', null, 'library-card');
      card.append(node('p', `${row.kind === 'offering' ? 'OFFERING' : 'LOOKING FOR'} · PRIVATE DRAFT`, 'eyebrow'), node('h2', row.title), node('p', [row.area, row.city, row.activity].filter(Boolean).join(' · ')), link('create-listing', `Edit ${row.title}`, row.id));
      list.append(card);
    }
  }
  async function load() {
    refresh.disabled = true; loaded = false; list.replaceChildren();
    status.textContent = 'Loading your saved drafts…';
    try {
      const result = await listListingDrafts();
      if (!current()) return;
      rows = result; loaded = true; paint();
    } catch {
      if (!current()) return;
      status.textContent = 'Unable to load saved drafts. Check sign-in and connection, then refresh.';
      list.append(link('sign-in', 'Sign in'));
    } finally { refresh.disabled = false; }
  }
  search.addEventListener('input', paint); type.addEventListener('change', paint);
  reset.addEventListener('click', () => { search.value = ''; type.value = 'all'; paint(); search.focus(); });
  refresh.addEventListener('click', load);
  load();
}
