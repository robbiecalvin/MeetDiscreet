import { loadContactServiceStatus } from './backend/contact-service-status.js';
import './marketplace-services.css';
import { backendEnabled, requireUser } from './backend/client.js';
import { registerRouteLeave } from './route-leave.js';
import { trackDraft } from './draft-changes.js';
import { listingCopyTime } from './listing-copy-fields.js';
import { bookingRequestForm } from './booking-request-form.js';
import { loadBookingRequestPairs, loadBookingRequests, readBookingRequest, loadOlderRequestVersions, submitBookingRequest, changeBookingRequest } from './backend/booking-requests.js';
trackDraft('booking-request-pilot', () => [...document.querySelectorAll('.request-form[data-dirty=true]')].map(form => [...form.elements].filter(input => ['INPUT', 'TEXTAREA', 'SELECT'].includes(input.tagName)).map(input => input.value)), backendEnabled);
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function renderBookingRequests(container, navigate) {
  container.replaceChildren(); const root = node('section', null, 'marketplace-service booking-requests');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account'; back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('account'); });
  root.append(back, node('p', 'REQUEST-ONLY PILOT', 'eyebrow'), node('h1', 'Plans in conversation.'), node('p', 'Exchange private booking requests and proposed revisions with explicitly invited pairs. Requests do not confirm or reserve time. Deposits, prices, cancellation fees and paid booking confirmation are disabled.', 'offering-lead'));
  const refresh = node('button', 'Refresh request inbox', 'button outline'); refresh.type = 'button'; const create = node('button', 'Prepare a new request', 'button primary'); create.type = 'button';
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const list = node('div', null, 'pilot-directory-grid'); const detail = node('section', null, 'service-panel'); detail.hidden = true;
  const pages = node('div', null, 'editor-actions'); pages.hidden = true;
  const previous = node('button', 'Newer requests', 'button quiet'); previous.type = 'button'; const next = node('button', 'Older requests', 'button quiet'); next.type = 'button'; pages.append(previous, next); root.append(refresh, create, status, list, pages, detail); container.append(root);
  let actor = null, busy = false, generation = 0, page = 0, cursors = [null], rows = [], hasNext = false;
  const current = request => request === generation && root.parentNode === container;
  function canLeave() { if (busy) { status.textContent = 'Wait for the request operation to finish.'; return false; } return !root.querySelector('.request-form[data-dirty=true]') || window.confirm('Discard unsent request/revision fields in this view?'); }
  registerRouteLeave(root, canLeave);
  const controls = () => { refresh.disabled = busy; create.disabled = busy; list.inert = busy; previous.disabled = busy || page === 0; next.disabled = busy || !hasNext; };
  async function identity() { const user = await requireUser(); if (actor && actor !== user.id) throw new Error('Account changed.'); actor = user.id; }
  async function load(reset = false, confirmed = false) {
    if (busy || (!confirmed && !canLeave())) return; busy = true; const request = ++generation; if (reset) { page = 0; cursors = [null]; }
    controls(); list.replaceChildren(); detail.replaceChildren(); detail.hidden = true; pages.hidden = true; status.textContent = 'Loading private request inbox…';
    try {
      await identity(); if (!current(request)) return; const values = await loadBookingRequests(actor, cursors[page]); if (!current(request)) return; if (!Array.isArray(values)) throw new Error('Inbox unavailable.'); hasNext = values.length > 20; rows = values.slice(0, 20);
      for (const row of rows) { const card = node('article', null, 'service-panel'); const open = node('button', `Open request: ${row.activity}`, 'button outline'); open.type = 'button'; open.addEventListener('click', () => inspect(row.id)); card.append(node('h2', row.activity), node('p', row.state.replaceAll('_', ' '), 'eyebrow'), listingCopyTime('Requested', row.created_at), open); list.append(card); }
      pages.hidden = page === 0 && !hasNext; status.textContent = rows.length ? `${rows.length} requests on this page. Newest first.` : 'No booking requests on this page. A separate invited request-access grant is required to create one.';
    } catch { if (current(request)) status.textContent = 'Request inbox unavailable. Sign in and check database setup and pair access.'; }
    finally { busy = false; if (current(request)) controls(); }
  }
  create.addEventListener('click', async () => {
    if (!canLeave()) return; busy = true; const request = ++generation; controls(); detail.replaceChildren(); detail.hidden = true; status.textContent = 'Checking invited request pairs…';
    try {
      await identity(); if (!current(request)) return; const services = await loadContactServiceStatus(actor); if (!current(request)) return; if (!services.booking_requests) { status.textContent = 'New booking requests/revisions are disabled for the pilot. Existing records and closure actions remain available.'; return; } const pairs = await loadBookingRequestPairs(actor); if (!current(request)) return; if (!Array.isArray(pairs)) throw new Error('Pairs unavailable.');
      if (!pairs.length) { status.textContent = 'No currently available invited Provider pair. Text access and publishing eligibility do not grant request access.'; return; }
      if (pairs.length > 100) { status.textContent = 'This prototype supports up to 100 available pairs in the picker. Contact the pilot operator to narrow the active set.'; return; }
      detail.append(node('h2', 'New private request')); let pending = null;
      detail.append(bookingRequestForm(null, pairs, async (terms, pair, ui) => {
        if (busy || !current(request)) return;
        if (!window.confirm('Send these request terms privately to this invited Provider? This is not a reservation or confirmed booking, and no money is collected.')) return;
        const signature = JSON.stringify({ terms, pair }); if (!pending || pending.signature !== signature) pending = { signature, id: crypto.randomUUID() };
        busy = true; controls(); ui.form.inert = true; ui.status.textContent = 'Sending private request…';
        try { const result = await submitBookingRequest(actor, pair, pending.id, terms); if (!current(request)) return; if (!result?.id) throw new Error('Request unavailable.'); ui.clean(); pending = null; status.textContent = `Request recorded: ${result.id}. Refresh inbox to inspect it. No booking is confirmed.`; ui.submit.disabled = true; }
        catch { if (current(request)) ui.status.textContent = 'Request could not be confirmed. Retry unchanged terms to check the same request, or refresh the inbox before changing them.'; }
        finally { busy = false; if (current(request)) { controls(); ui.form.inert = false; } }
      }, 'Send private request'));
      detail.hidden = false; status.textContent = 'Prepare and review request terms. They are shared only on explicit Send.';
    } catch { if (current(request)) status.textContent = 'Invited request pairs unavailable. Check sign-in and setup.'; }
    finally { busy = false; if (current(request)) controls(); }
  });
  function versionCard(value) {
    const card = node('article', null, 'service-message'); card.append(node('h3', `Version ${value.version} · ${value.authored_by_me ? 'You' : 'Other participant'}`), node('p', value.activity, 'service-message-body'), node('p', `Schedule time zone: ${value.time_zone}`, 'profile-small'));
    for (const [label, key] of [['Starts', 'start_at'], ['Ends', 'end_at']]) { const date = new Date(value[key]); const line = node('p', null, 'profile-small'); if (Number.isFinite(date.getTime())) { const time = node('time'); time.dateTime = value[key]; try { time.textContent = date.toLocaleString(undefined, { timeZone: value.time_zone, timeZoneName: 'short' }); } catch { time.textContent = date.toISOString(); } line.append(`${label} `, time); } else line.textContent = `${label}: date unavailable`; card.append(line); }
    card.append(node('p', `Proposed meeting area: ${value.meeting_area}`, 'service-message-body'), node('p', value.notes || 'No additional notes.', 'service-message-body'), listingCopyTime('Version recorded', value.created_at)); return card;
  }
  async function inspect(id) {
    if (!canLeave()) return; busy = true; const request = ++generation; controls(); detail.replaceChildren(); detail.hidden = true; status.textContent = 'Loading exact request versions…';
    try {
      const value = await readBookingRequest(actor, id); if (!current(request)) return; if (value?.id !== id || !Array.isArray(value.versions) || !value.versions.length) throw new Error('Request unavailable.');
      detail.append(node('h2', `Request ${id.slice(0, 8)}`), node('p', `${value.state.replaceAll('_', ' ')} · ${value.am_requester ? 'You requested' : 'You received'}`, 'eyebrow'));
      const history = node('div'); for (const version of value.versions) history.append(versionCard(version)); detail.append(history);
      let oldest = value.versions.at(-1).version;
      const older = node('button', 'Load earlier request versions', 'button quiet'); older.type = 'button'; older.hidden = oldest <= 1; detail.append(older);
      older.addEventListener('click', async () => {
        if (busy || !current(request)) return; busy = true; controls(); detail.inert = true;
        try { const versions = await loadOlderRequestVersions(actor, id, oldest); if (!current(request)) return; if (!Array.isArray(versions)) throw new Error('History unavailable.'); const visible = versions.slice(0, 20); for (const version of visible) history.append(versionCard(version)); if (visible.length) oldest = visible.at(-1).version; older.hidden = versions.length <= 20; }
        catch { if (current(request)) status.textContent = 'Earlier versions unavailable. Retry without changing unsent fields.'; }
        finally { busy = false; if (current(request)) { controls(); detail.inert = false; } }
      });
      const open = ['requested', 'revision_proposed'].includes(value.state);
      if (open) {
        const close = node('button', value.am_requester ? 'Withdraw this request' : 'Decline this request', 'button outline'); close.type = 'button';
        close.addEventListener('click', async () => {
          if (!canLeave() || !window.confirm(`${value.am_requester ? 'Withdraw' : 'Decline'} this request? Recorded versions are kept and no fees or refunds are calculated.`)) return;
          busy = true; controls(); detail.inert = true;
          try { await changeBookingRequest(actor, id, value.revision, value.am_requester ? 'withdraw' : 'decline'); if (current(request)) { detail.replaceChildren(); detail.hidden = true; status.textContent = 'Request closed. Refresh the inbox to check current state.'; } }
          catch { if (current(request)) status.textContent = 'Closure could not be confirmed. Refresh and inspect before retrying.'; }
          finally { busy = false; if (current(request)) { controls(); detail.inert = false; } }
        }); detail.append(close);
        if (value.can_propose) detail.append(bookingRequestForm(value.versions[0], null, async (terms, _pair, ui) => {
          if (busy || !current(request) || !window.confirm('Send these terms as a new immutable request version? They do not confirm a booking or reserve time.')) return;
          busy = true; controls(); detail.inert = true; ui.status.textContent = 'Recording proposed revision…';
          try { await changeBookingRequest(actor, id, value.revision, 'propose', terms); if (current(request)) { ui.clean(); detail.replaceChildren(); detail.hidden = true; status.textContent = 'Revision proposed. Refresh and inspect the request to compare versions.'; } }
          catch { if (current(request)) { ui.submit.disabled = true; ui.status.textContent = 'Revision could not be confirmed. Preserve any unsent text if needed, then refresh and inspect before retrying.'; } }
          finally { busy = false; if (current(request)) { controls(); detail.inert = false; } }
        }, 'Propose revised request terms'));
        else detail.append(node('p', 'New revisions are unavailable. History and closure remain accessible after expiry or a contact block.', 'profile-small'));
      }
      detail.hidden = false; status.textContent = 'Request versions loaded. No paid confirmation or reservation action is available.';
    } catch { if (current(request)) { detail.replaceChildren(); status.textContent = 'Request history unavailable. Check current sign-in and setup.'; } }
    finally { busy = false; if (current(request)) controls(); }
  }
  refresh.addEventListener('click', () => load(true)); previous.addEventListener('click', () => { if (!busy && page > 0 && canLeave()) { page--; load(false, true); } }); next.addEventListener('click', () => { if (!busy && hasNext && rows.length && canLeave()) { cursors[page + 1] = rows.at(-1); page++; load(false, true); } });
  if (!backendEnabled) { refresh.hidden = true; create.hidden = true; status.textContent = 'The request-only pilot requires sign-in, the connected backend and an explicit invited pair. Your private booking-plan editor remains separate.'; } else load(true);
}
