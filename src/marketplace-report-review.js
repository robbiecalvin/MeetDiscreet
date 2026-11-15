import './marketplace-services.css';
import { backendEnabled } from './backend/client.js';
import { registerRouteLeave } from './route-leave.js';
import { trackDraft } from './draft-changes.js';
import { listingCopyTime } from './listing-copy-fields.js';
import { reportReviewAccess, listReportReviewQueue, readStaffReport, updateStaffReport } from './backend/marketplace-reports.js';
trackDraft('report-review-note', () => document.querySelector('.marketplace-report-review textarea')?.value.trim() || '', backendEnabled);
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function renderMarketplaceReportReview(container, navigate) {
  container.replaceChildren(); const root = node('section', null, 'marketplace-service marketplace-report-review');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account'; back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('account'); });
  root.append(back, node('p', 'SCOPED REPORT REVIEW', 'eyebrow'), node('h1', 'Pilot concern reports.'), node('p', 'Review explicitly submitted evidence. This does not provide conversation browsing, financial controls or blanket account access.', 'offering-lead'));
  const refresh = node('button', 'Refresh report review access', 'button outline'); refresh.type = 'button'; const filter = node('select'); filter.setAttribute('aria-label', 'Report state');
  for (const value of ['open', 'reviewing', 'closed']) { const option = node('option', value); option.value = value; filter.append(option); }
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const list = node('div', null, 'pilot-directory-grid'); const detail = node('section', null, 'service-panel'); detail.hidden = true;
  const pages = node('div', null, 'editor-actions'); pages.hidden = true;
  const previous = node('button', 'Previous report page', 'button quiet'); previous.type = 'button'; const next = node('button', 'Next report page', 'button quiet'); next.type = 'button'; pages.append(previous, next); root.append(refresh, filter, status, list, pages, detail); container.append(root);
  let busy = false, generation = 0, actor = null, canPause = false, state = 'open', page = 0, cursors = [null], rows = [], hasNext = false, note = null;
  const current = request => request === generation && root.parentNode === container;
  function canLeave() { if (busy) { status.textContent = 'Wait for the report operation to finish.'; return false; } return !note?.value.trim() || window.confirm('Discard this unsaved staff note?'); }
  registerRouteLeave(root, canLeave);
  const controls = () => { refresh.disabled = busy; filter.disabled = busy; list.inert = busy; previous.disabled = busy || page === 0; next.disabled = busy || !hasNext; };
  async function inspect(id) {
    if (!canLeave()) return; busy = true; const request = ++generation; controls(); detail.replaceChildren(); detail.hidden = true; note = null; status.textContent = 'Loading submitted report evidence…';
    try {
      const value = await readStaffReport(actor, id); if (!current(request)) return; if (value?.id !== id) throw new Error('Report unavailable.');
      detail.append(node('h2', 'Submitted evidence'), node('p', `${value.target_kind} · ${value.category} · ${value.state}`, 'eyebrow'), listingCopyTime('Submitted', value.created_at), node('p', value.details, 'service-message-body'));
      const snapshot = node('dl');
      for (const key of ['display_name', 'username', 'adult_age', 'tagline', 'title', 'description', 'city', 'area', 'activity', 'reported_message', 'sent_at']) {
        const field = value.public_snapshot?.[key]; if (field !== undefined && field !== null) snapshot.append(node('dt', key.replaceAll('_', ' ')), node('dd', String(field)));
      } detail.append(snapshot);
      if (value.target_kind === 'message') detail.append(node('p', 'This is one voluntarily reported message, not access to the rest of its conversation.', 'profile-small'));
      for (const entry of Array.isArray(value.notes) ? value.notes : []) { const card = node('article', null, 'service-message'); card.append(node('p', entry.note, 'service-message-body'), listingCopyTime('Staff note', entry.created_at)); detail.append(card); }
      const form = node('form', null, 'service-form'); const stateLabel = node('label', 'Report processing state'); stateLabel.htmlFor = 'report-next-state'; const newState = node('select'); newState.id = stateLabel.htmlFor;
      for (const optionValue of ['open', 'reviewing', 'closed']) { const option = node('option', optionValue); option.value = optionValue; newState.append(option); } newState.value = value.state;
      const noteLabel = node('label', 'Private staff note (required)'); noteLabel.htmlFor = 'report-review-note'; note = node('textarea'); note.id = noteLabel.htmlFor; note.rows = 4; note.maxLength = 1000; note.required = true;
      const holdLabel = node('label', 'Publication action'); holdLabel.htmlFor = 'report-publication-action'; const hold = node('select'); hold.id = holdLabel.htmlFor;
      for (const [action, text] of [['', 'Keep current publication state'], ['pause', 'Pause this pilot publication'], ['resume', 'Remove this publication pause']]) { const option = node('option', text); option.value = action; hold.append(option); }
      hold.disabled = !canPause || value.target_kind === 'message';
      const save = node('button', 'Record report review', 'button primary'); save.type = 'submit'; const result = node('p', value.publication_paused ? 'This resource is paused. Only scoped Administrators can change publication pauses.' : 'No publication pause recorded for this resource.', 'profile-small'); result.setAttribute('role', 'status');
      form.append(stateLabel, newState, noteLabel, note, holdLabel, hold, save, result); detail.append(form); detail.hidden = false; status.textContent = 'Evidence loaded. Independent review is required; no automatic action is taken on submission.';
      form.addEventListener('submit', async event => {
        event.preventDefault(); if (busy || !current(request) || !note.value.trim()) return;
        const pause = hold.value === '' ? null : hold.value === 'pause';
        if (!window.confirm('Record this staff note and processing state for this exact report revision? A publication pause affects only pilot public visibility; it does not erase records or change payments.')) return;
        busy = true; controls(); detail.inert = true; result.textContent = 'Recording report review…';
        try { await updateStaffReport(actor, value.id, value.revision, newState.value, note.value.trim(), pause, value.hold_revision); if (current(request)) { note.value = ''; detail.replaceChildren(); detail.hidden = true; note = null; status.textContent = 'Review recorded. Refresh the queue before another action.'; } }
        catch { if (current(request)) { save.disabled = true; newState.disabled = true; hold.disabled = true; note.readOnly = true; result.textContent = 'Review could not be confirmed. Copy any unsaved note if needed, then refresh and inspect the report before retrying.'; } }
        finally { busy = false; if (current(request)) { controls(); detail.inert = false; } }
      });
    } catch { if (current(request)) { detail.replaceChildren(); status.textContent = 'Report evidence or current scope is unavailable. Refresh access and setup.'; } }
    finally { busy = false; if (current(request)) controls(); }
  }
  async function load(reset = false, confirmed = false) {
    if (busy || (!confirmed && !canLeave())) return; busy = true; const request = ++generation; if (reset) { page = 0; cursors = [null]; } controls(); detail.replaceChildren(); detail.hidden = true; note = null; list.replaceChildren(); pages.hidden = true; status.textContent = 'Checking report review scope…';
    try {
      const access = await reportReviewAccess(); if (!current(request)) return; actor = access.allowed ? access.actorId : null; canPause = access.canPause;
      if (!actor) { status.textContent = 'Assigned report review capability and Moderator/Administrator role are required.'; return; }
      const values = await listReportReviewQueue(actor, state, cursors[page]); if (!current(request)) return; if (!Array.isArray(values)) throw new Error('Queue unavailable.'); hasNext = values.length > 20; rows = values.slice(0, 20);
      for (const row of rows) { const card = node('article', null, 'service-panel'); const open = node('button', `Inspect ${row.target_kind} report ${row.id.slice(0, 8)}`, 'button outline'); open.type = 'button'; open.addEventListener('click', () => inspect(row.id)); card.append(node('h2', `${row.category} concern`), node('p', row.state, 'eyebrow'), listingCopyTime('Submitted', row.created_at), open); list.append(card); }
      status.textContent = rows.length ? `${rows.length} ${state} reports on this page. Oldest first.` : `No ${state} reports on this page.`; pages.hidden = page === 0 && !hasNext;
    } catch { if (current(request)) status.textContent = 'Report review queue unavailable. Check sign-in, assigned scope and database setup.'; }
    finally { busy = false; if (current(request)) controls(); }
  }
  refresh.addEventListener('click', () => load(true)); filter.addEventListener('change', () => { if (!canLeave()) { filter.value = state; return; } state = filter.value; load(true, true); }); previous.addEventListener('click', () => { if (!busy && page > 0 && canLeave()) { page--; load(false, true); } }); next.addEventListener('click', () => { if (!busy && hasNext && rows.length && canLeave()) { cursors[page + 1] = rows.at(-1); page++; load(false, true); } });
  if (!backendEnabled) { refresh.hidden = true; filter.hidden = true; status.textContent = 'Report review requires the connected backend and assigned scope.'; } else load(true);
}
