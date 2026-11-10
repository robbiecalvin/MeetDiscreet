import { listOwnProviderApprovals } from './backend/provider-review.js';
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function date(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Date unavailable' : parsed.toLocaleString(undefined, {timeZoneName:'short'});
}
export function providerApprovalHistory(container, isCurrent) {
  const section = node('section', null, 'staff-approval-history'); section.hidden = true;
  section.append(node('h2', 'Your recorded approvals'), node('p', 'Pilot Provider approvals you recorded. This history does not confirm current role assignments.', 'profile-small'));
  const loadButton = node('button', 'Load my approval decisions', 'button outline'); loadButton.type = 'button';
  const status = node('p', '', 'staff-history-status'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const list = node('div', null, 'staff-history-list');
  const pages = node('div', null, 'editor-actions'); pages.hidden = true;
  const newer = node('button', 'Newer approvals', 'button quiet'); newer.type = 'button';
  const older = node('button', 'Older approvals', 'button outline'); older.type = 'button';
  pages.append(newer, older); section.append(loadButton, status, list, pages); container.append(section);
  let reviewerId = null;
  let generation = 0;
  let cursors = [null]; let page = 0; let rows = []; let hasOlder = false;
  const current = request => request === generation && section.isConnected && isCurrent();
  function clear() {
    generation++; rows = []; cursors = [null]; page = 0; hasOlder = false;
    list.replaceChildren(); pages.hidden = true; status.textContent = ''; loadButton.disabled = false; loadButton.textContent = 'Load my approval decisions';
  }
  function setAccess(id, allowed) {
    clear(); reviewerId = allowed ? id : null; section.hidden = !reviewerId;
  }
  async function load(reset = false) {
    if (!reviewerId) return;
    const request = ++generation;
    if (reset) { cursors = [null]; page = 0; }
    rows = []; list.replaceChildren(); pages.hidden = true; loadButton.disabled = true; status.textContent = 'Loading your recorded approvals…';
    try {
      const result = await listOwnProviderApprovals(reviewerId, cursors[page]);
      if (!current(request)) return;
      hasOlder = result.length > 20; rows = result.slice(0, 20);
      for (const value of rows) {
        const card = node('article', null, 'staff-approval-card');
        card.append(node('h3', value.display_name), node('p', value.city), node('p', `Submitted ${date(value.submitted_at)}`, 'profile-small'), node('p', `Pilot approval recorded ${date(value.approved_at)}`, 'profile-small'));
        list.append(card);
      }
      status.textContent = rows.length ? `${rows.length} recorded approvals on this page. Newest decisions first.` : 'No recorded approvals on this page.';
      newer.disabled = page === 0; older.disabled = !hasOlder; pages.hidden = !rows.length && page === 0;
      loadButton.textContent = 'Refresh my approval decisions';
    } catch {
      if (current(request)) { rows = []; list.replaceChildren(); pages.hidden = true; status.textContent = 'Your recorded approvals are unavailable. Refresh your review access or retry.'; loadButton.textContent = 'Retry my approval decisions'; }
    } finally { if (current(request)) loadButton.disabled = false; }
  }
  loadButton.addEventListener('click', () => load(true));
  older.addEventListener('click', () => { if (!hasOlder || !rows.length) return; cursors[page + 1] = rows.at(-1); page++; load(); });
  newer.addEventListener('click', () => { if (page === 0) return; page--; load(); });
  return { setAccess };
}
