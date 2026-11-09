import { backendEnabled } from './backend/client.js';
import { loadProviderReviewAccess, listProviderReviewQueue, loadProviderReviewDetail } from './backend/provider-review.js';
function node(tag, text, className) {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
}
export function renderProviderReview(container, navigate) {
  container.replaceChildren();
  const root = node('section', null, 'provider-review');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account';
  back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('account'); });
  root.append(back, node('p', 'STAFF WORKSPACE', 'eyebrow'), node('h1', 'Provider application queue.'), node('p', 'Inspect submitted introductions with explicitly assigned review access.', 'offering-lead'), node('p', 'Read-only review workspace. Approval, rejection, role changes and publishing actions are not available here.', 'editor-notice'));
  const status = node('p', '', 'review-status'); status.setAttribute('role', 'status');
  const refresh = node('button', 'Refresh review queue', 'button outline'); refresh.type = 'button';
  const list = node('div', null, 'review-queue'); list.setAttribute('aria-label', 'Submitted provider applications');
  const detail = node('section', null, 'review-detail'); detail.hidden = true;
  const pages = node('div', null, 'editor-actions');
  const previous = node('button', 'Previous applications', 'button quiet'); previous.type = 'button';
  const next = node('button', 'Next applications', 'button outline'); next.type = 'button';
  pages.append(previous, next); pages.hidden = true;
  root.append(status, refresh, list, pages, detail); container.append(root);
  if (!backendEnabled) { status.textContent = 'Staff review requires the connected backend and explicitly assigned staff permissions. No application data is available in this preview.'; refresh.hidden = true; return; }
  let reviewerId = null;
  let cursors = [null];
  let page = 0;
  let rows = [];
  let hasNext = false;
  let version = 0;
  const current = request => root.parentNode === container && request === version;
  function clearData() { list.replaceChildren(); detail.replaceChildren(); detail.hidden = true; pages.hidden = true; rows = []; }
  async function showDetail(ownerId) {
    const request = ++version;
    detail.replaceChildren(); detail.hidden = true; status.textContent = 'Loading submitted application…';
    try {
      const value = await loadProviderReviewDetail(reviewerId, ownerId);
      if (!current(request)) return;
      if (!value) { await load(true); return; }
      const heading = node('h2', value.display_name); heading.tabIndex = -1;
      const close = node('button', 'Close application details', 'button quiet'); close.type = 'button';
      close.addEventListener('click', () => { version++; detail.replaceChildren(); detail.hidden = true; status.textContent = `${rows.length} submitted applications on this page.`; refresh.focus(); });
      detail.append(heading, node('p', value.city, 'profile-small'), node('p', 'SUBMITTED INTRODUCTION', 'eyebrow'), node('p', value.introduction, 'review-introduction'), node('p', 'This view records access but does not make an approval decision.', 'profile-small'), close);
      detail.hidden = false; status.textContent = 'Submitted application loaded.'; heading.focus();
    } catch {
      if (current(request)) { clearData(); reviewerId = null; status.textContent = 'Review access or application data is unavailable. Refresh to verify access again.'; }
    } finally { if (current(request)) refresh.disabled = false; }
  }
  async function load(reset = false) {
    const request = ++version; clearData(); refresh.disabled = true; status.textContent = 'Verifying review access…';
    try {
      const access = await loadProviderReviewAccess();
      if (!current(request)) return;
      if (!access.allowed) { reviewerId = null; status.textContent = 'This account does not have assigned provider-application review access.'; return; }
      reviewerId = access.reviewerId;
      if (reset) { cursors = [null]; page = 0; }
      const result = await listProviderReviewQueue(reviewerId, cursors[page]);
      if (!current(request)) return;
      hasNext = result.length > 20; rows = result.slice(0, 20);
      status.textContent = rows.length ? `${rows.length} submitted applications on this page. Oldest submissions first.` : 'No submitted applications on this page.';
      for (const value of rows) {
        const card = node('article', null, 'review-card');
        const open = node('button', `Inspect ${value.display_name}`, 'button outline'); open.type = 'button'; open.addEventListener('click', () => showDetail(value.owner_id));
        card.append(node('h2', value.display_name), node('p', value.city, 'profile-small'), open); list.append(card);
      }
      previous.disabled = page === 0; next.disabled = !hasNext; pages.hidden = !rows.length && page === 0;
    } catch { if (current(request)) { clearData(); status.textContent = 'Unable to verify review access or load the queue. Check sign-in, connection and setup, then retry.'; } }
    finally { if (current(request)) refresh.disabled = false; }
  }
  refresh.addEventListener('click', () => load(true));
  next.addEventListener('click', () => { if (!hasNext || !rows.length) return; cursors[page + 1] = rows.at(-1); page++; load(); });
  previous.addEventListener('click', () => { if (page === 0) return; page--; load(); });
  load(true);
}
