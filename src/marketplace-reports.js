import './marketplace-services.css';
import { backendEnabled, requireUser } from './backend/client.js';
import { listingCopyTime } from './listing-copy-fields.js';
import { loadMyReportStatuses } from './backend/marketplace-reports.js';
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function renderMyReports(container, navigate) {
  container.replaceChildren(); const root = node('section', null, 'marketplace-service');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account'; back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('account'); });
  root.append(back, node('p', 'YOUR REPORTS', 'eyebrow'), node('h1', 'Private report status.'), node('p', 'Check your own report references and processing states. Staff notes, reviewer identities and other accounts’ reports are not included.', 'offering-lead'));
  const refresh = node('button', 'Refresh my reports', 'button outline'); refresh.type = 'button';
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); const list = node('div', null, 'pilot-directory-grid');
  const pages = node('div', null, 'editor-actions'); pages.hidden = true;
  const previous = node('button', 'Previous reports', 'button quiet'); previous.type = 'button'; const next = node('button', 'Next reports', 'button quiet'); next.type = 'button'; pages.append(previous, next); root.append(refresh, status, list, pages); container.append(root);
  let busy = false, generation = 0, actor = null, page = 0, cursors = [null], rows = [], hasNext = false;
  const current = request => request === generation && root.parentNode === container;
  const controls = () => { refresh.disabled = busy; previous.disabled = busy || page === 0; next.disabled = busy || !hasNext; };
  async function load(reset = false) {
    if (busy) return; busy = true; const request = ++generation; if (reset) { page = 0; cursors = [null]; } controls(); list.replaceChildren(); pages.hidden = true; status.textContent = 'Loading your private report statuses…';
    try {
      const user = await requireUser(); if (!current(request)) return; if (actor && actor !== user.id) throw new Error('Account changed.'); actor = user.id;
      const values = await loadMyReportStatuses(actor, cursors[page]); if (!current(request)) return; hasNext = values.length > 20; rows = values.slice(0, 20);
      for (const row of rows) { const card = node('article', null, 'service-panel'); card.append(node('h2', row.target_kind === 'message' ? 'Message report' : row.target_kind === 'profile' ? 'Profile report' : 'Offering report'), node('p', row.id, 'service-identifier'), node('p', `State: ${row.state} · Category: ${row.category}`, 'profile-small'), listingCopyTime('Submitted', row.created_at), listingCopyTime('Updated', row.updated_at)); list.append(card); }
      pages.hidden = page === 0 && !hasNext; status.textContent = rows.length ? `${rows.length} reports on this page. Ordered by reference ID. Closed means triage was closed; it does not promise a particular action or outcome.` : 'No reports on this page.';
    } catch { if (current(request)) status.textContent = 'Report statuses unavailable. Sign in and check connection/database setup, then retry.'; }
    finally { busy = false; if (current(request)) controls(); }
  }
  refresh.addEventListener('click', () => load(true)); previous.addEventListener('click', () => { if (!busy && page > 0) { page--; load(); } }); next.addEventListener('click', () => { if (!busy && hasNext && rows.length) { cursors[page + 1] = rows.at(-1).id; page++; load(); } });
  if (!backendEnabled) { refresh.hidden = true; status.textContent = 'Private report status requires the connected backend and sign-in.'; } else load(true);
}
