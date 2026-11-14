import { listingSubmission } from './listing-submission.js';
import './listing-workspace.css';
import { backendEnabled } from './backend/client.js';
import { listListingDraftSummaries, deleteListingDraft } from './backend/drafts.js';
import { detachSavedListing } from './listing-editor.js';

function node(tag, text, className) {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
}
export function renderListingLibrary(container, navigate, initialKind = 'all') {
  container.replaceChildren();
  const root = node('section', null, 'listing-library');
  let filterKind = ['looking', 'offering'].includes(initialKind) ? initialKind : 'all';
  function paramsFor(page, draft, copy = false) {
    const params = new URLSearchParams({ page });
    if (page === 'create-listing') {
      params.set('from', 'library'); params.set('kind', filterKind);
      if (draft) params.set('draft', draft); else params.set('new', '1');
      if (copy) params.set('copy', '1');
    }
    return params;
  }
  const link = (page, label, draft, copy = false) => {
    const value = node('a', label, 'button outline');
    value.href = `?${paramsFor(page, draft, copy)}`;
    value.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(page, page === 'create-listing' ? { kind: filterKind, fromLibrary: true, fresh: !draft, ...(draft ? { draft, copy } : {}) } : {});
    });
    return value;
  };
  const back = link('account', '← Back to account'); back.className = 'profile-back';
  root.append(back, node('p', 'YOUR PRIVATE PLANS', 'eyebrow'), node('h1', 'Saved listing drafts.'), node('p', 'Find a plan and continue editing. These drafts are private and unpublished.', 'offering-lead'));
  const actions = node('div', null, 'editor-actions');
  const create = link('create-listing', 'Start a new listing');
  function updateCreate() {
    create.textContent = filterKind === 'looking' ? 'Start a Looking For draft' : filterKind === 'offering' ? 'Start an Offering draft' : 'Start a new listing';
    create.href = `?${paramsFor('create-listing')}`;
  }
  updateCreate();
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
  type.value = filterKind;
  const sortLabel = node('label', 'Sort drafts');
  const sort = node('select'); sort.id = 'library-sort'; sortLabel.htmlFor = sort.id;
  for (const [value, label] of [['recent', 'Recently updated'], ['oldest', 'Oldest updated'], ['title', 'Title A–Z']]) {
    const option = node('option', label); option.value = value; sort.append(option);
  }
  const reset = node('button', 'Clear filters', 'button quiet'); reset.type = 'button';
  for (const [label, input] of [[searchLabel, search], [typeLabel, type], [sortLabel, sort]]) {
    const group = node('div'); group.append(label, input); controls.append(group);
  }
  controls.append(reset);
  const list = node('div', null, 'library-list');
  const pages = node('div', null, 'editor-actions'); pages.hidden = true;
  const previous = node('button', 'Previous draft page', 'button quiet'); previous.type = 'button';
  const next = node('button', 'Next draft page', 'button outline'); next.type = 'button';
  pages.append(previous, next);
  root.append(controls, list, pages);
  const pageSize = 12;
  let page = 0;
  let rows = [];
  let loaded = false;
  let deleting = false;
  const current = () => root.parentNode === container;
  function paint(resetPage = false) {
    if (resetPage) page = 0;
    updateCreate();
    if (!loaded) return;
    const query = search.value.trim().toLocaleLowerCase();
    const matches = rows.filter(row => (type.value === 'all' || row.kind === type.value) && [row.title, row.city, row.area, row.activity].join(' ').toLocaleLowerCase().includes(query));
    if (sort.value === 'title') matches.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort.value === 'oldest') matches.reverse();
    list.replaceChildren();
    page = Math.min(page, Math.max(0, Math.ceil(matches.length / pageSize) - 1));
    const start = page * pageSize;
    const visible = matches.slice(start, start + pageSize);
    status.textContent = `${matches.length} of ${rows.length} saved drafts${matches.length ? ` · Showing ${start + 1}–${start + visible.length}` : ''}`;
    previous.disabled = page === 0; next.disabled = start + pageSize >= matches.length;
    pages.hidden = matches.length <= pageSize;
    if (!matches.length) list.append(node('p', rows.length ? 'No drafts match these filters.' : 'No saved listing drafts yet. Start a new listing to create one.', 'catalogue-empty'));
    for (const row of visible) {
      const card = node('article', null, 'library-card');
      card.append(node('p', `${row.kind === 'offering' ? 'OFFERING' : 'LOOKING FOR'} · PRIVATE DRAFT`, 'eyebrow'), node('h2', row.title), node('p', [row.area, row.city, row.activity].filter(Boolean).join(' · ')));
      const cardActions = node('div', null, 'library-card-actions');
      const remove = node('button', 'Delete draft', 'button quiet'); remove.type = 'button';
      remove.setAttribute('aria-label', `Delete draft: ${row.title}`);
      const result = node('p', '', 'profile-small'); result.setAttribute('role', 'status');
      remove.addEventListener('click', async () => {
        if (deleting || !window.confirm(`Delete the saved private draft “${row.title}”? This cannot be undone. Any recorded submission copies are retained separately.`)) return;
        deleting = true; refresh.disabled = true; controls.inert = true; pages.inert = true; cardActions.inert = true;
        result.textContent = 'Deleting…';
        try {
          await deleteListingDraft(row.id);
          if (!current()) return;
          detachSavedListing(row.id);
          rows = rows.filter(value => value.id !== row.id); paint();
          status.textContent += ' · Private draft deleted.';
          refresh.disabled = false; refresh.focus();
        } catch {
          if (current()) result.textContent = 'Unable to delete this draft. Check sign-in and connection, then retry.';
        } finally {
          deleting = false; refresh.disabled = false; controls.inert = false; pages.inert = false; cardActions.inert = false;
        }
      });
      cardActions.append(link('create-listing', `Edit ${row.title}`, row.id), link('create-listing', `Duplicate ${row.title}`, row.id, true), remove);
      card.append(cardActions, result, listingSubmission(row.id, current));
      list.append(card);
    }
  }
  async function load() {
    if (deleting) return;
    refresh.disabled = true; loaded = false; rows = []; list.replaceChildren(); pages.hidden = true;
    status.textContent = 'Loading your saved drafts…';
    try {
      const result = await listListingDraftSummaries();
      if (!current()) return;
      rows = result; loaded = true; paint(true);
    } catch {
      if (!current()) return;
      status.textContent = 'Unable to load saved drafts completely. Check sign-in and connection, then refresh. This view supports up to 1,000 drafts.';
      list.append(link('sign-in', 'Sign in'));
    } finally { refresh.disabled = false; }
  }
  search.addEventListener('input', () => paint(true)); type.addEventListener('change', () => {
    filterKind = type.value;
    const url = new URL(location.href);
    if (url.searchParams.get('page') === 'my-listings') { url.searchParams.set('kind', filterKind); history.replaceState(history.state, '', url); }
    paint(true);
  }); sort.addEventListener('change', () => paint(true));
  reset.addEventListener('click', () => { search.value = ''; type.value = 'all'; filterKind = 'all'; sort.value = 'recent';
    const url = new URL(location.href); url.searchParams.delete('kind'); history.replaceState(history.state, '', url); paint(true); search.focus(); });
  previous.addEventListener('click', () => { if (page > 0) { page--; paint(); status.focus(); } });
  next.addEventListener('click', () => { page++; paint(); status.focus(); });
  status.tabIndex = -1;
  refresh.addEventListener('click', load);
  load();
}
