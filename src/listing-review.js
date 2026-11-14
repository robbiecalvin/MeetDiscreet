import './staff-review.css';
import './listing-workspace.css';
import { backendEnabled } from './backend/client.js';
import { registerRouteLeave } from './route-leave.js';
import { listingCopyFields, listingCopyTime } from './listing-copy-fields.js';
import { loadListingReviewAccess, listListingReviewQueue, loadListingReviewCopy, approveListingCopy } from './backend/listing-review.js';
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function renderListingReview(container, navigate) {
  container.replaceChildren(); const root = node('section', null, 'provider-review listing-review');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account';
  back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('account'); });
  root.append(back, node('p', 'STAFF WORKSPACE', 'eyebrow'), node('h1', 'Listing submission review.'), node('p', 'Inspect recorded listing copies with assigned review access.', 'offering-lead'), node('p', 'Administrator editorial approval records an exact private version. It does not publish a listing, grant paid access or replace posting eligibility checks.', 'editor-notice'));
  const refresh = node('button', 'Refresh listing review queue', 'button outline'); refresh.type = 'button';
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const list = node('div', null, 'profile-review-queue'); const detail = node('section', null, 'review-detail listing-copy-card'); detail.hidden = true;
  const pages = node('div', null, 'editor-actions'); pages.hidden = true;
  const previous = node('button', 'Previous listing copies', 'button quiet'); previous.type = 'button';
  const next = node('button', 'Next listing copies', 'button outline'); next.type = 'button'; pages.append(previous, next);
  root.append(refresh, status, list, pages, detail); container.append(root);
  let busy = false, generation = 0, reviewer = null, page = 0, cursors = [null], rows = [], hasNext = false;
  const current = request => request === generation && root.parentNode === container;
  registerRouteLeave(root, () => { if (!busy) return true; status.textContent = 'Wait for the listing review operation to finish.'; return false; });
  if (!backendEnabled) { refresh.hidden = true; status.textContent = 'Listing review requires the connected backend and assigned review scope. No private copies are loaded in this preview.'; return; }
  function controls() { refresh.disabled = busy; previous.disabled = busy || page === 0; next.disabled = busy || !hasNext; list.inert = busy; }
  async function inspect(id) {
    if (busy) return; busy = true; const request = ++generation; controls(); detail.replaceChildren(); detail.hidden = true; status.textContent = 'Loading recorded listing…';
    try {
      const value = await loadListingReviewCopy(reviewer, id); if (!current(request)) return;
      if (!value.copy) { status.textContent = 'This active copy is no longer available. Refresh the queue.'; return; }
      const copy = value.copy; const heading = node('h2', copy.recorded_fields?.title || 'Recorded listing'); heading.tabIndex = -1;
      detail.append(heading, node('p', copy.kind === 'offering' ? 'Offering' : 'Looking For', 'eyebrow'), listingCopyTime('Recorded', copy.submitted_at), listingCopyFields(copy.recorded_fields));
      const result = node('div', '', 'profile-small'); result.setAttribute('role', 'status');
      const approve = node('button', 'Approve this listing copy', 'button primary'); approve.type = 'button';
      approve.hidden = !value.canApprove || copy.owner_id === reviewer || Boolean(copy.approved_at);
      result.textContent = copy.approved_at ? 'Editorial approval recorded. This copy remains private.' : copy.owner_id === reviewer ? 'Self approval is not permitted.' : value.canApprove ? 'This exact copy can be approved editorially. Public activation remains separate.' : 'Approval requires an Administrator with explicit publishing permission.';
      if (copy.approved_at) result.append(listingCopyTime('Approved', copy.approved_at));
      approve.addEventListener('click', async () => {
        if (busy || !current(request) || !window.confirm('Record editorial approval for this exact listing copy? This does not publish it or grant paid posting access.')) return;
        busy = true; controls(); approve.disabled = true; result.textContent = 'Recording editorial approval…';
        try { const receipt = await approveListingCopy(reviewer, copy.id); if (current(request)) { approve.hidden = true; result.textContent = 'Editorial approval recorded. No public listing or posting entitlement was created.'; result.append(listingCopyTime('Approved', receipt.approved_at)); } }
        catch { if (current(request)) { approve.hidden = true; result.textContent = 'Approval could not be confirmed. Close and inspect the copy again before retrying.'; } }
        finally { busy = false; if (current(request)) { controls(); approve.disabled = false; } }
      });
      const close = node('button', 'Close listing copy', 'button quiet'); close.type = 'button';
      close.addEventListener('click', () => { if (busy) return; generation++; detail.replaceChildren(); detail.hidden = true; status.textContent = 'Recorded listing closed. Refresh to update the queue.'; refresh.focus(); });
      detail.append(result, approve, close); detail.hidden = false; status.textContent = 'Recorded listing loaded.'; heading.focus();
    } catch { if (current(request)) { detail.replaceChildren(); status.textContent = 'Copy or current review access unavailable. Refresh to check access and setup.'; } }
    finally { busy = false; if (current(request)) controls(); }
  }
  async function load(reset = false) {
    if (busy) return; busy = true; const request = ++generation; if (reset) { page = 0; cursors = [null]; }
    controls(); list.replaceChildren(); detail.replaceChildren(); detail.hidden = true; pages.hidden = true; status.textContent = 'Checking listing review access…';
    try {
      const access = await loadListingReviewAccess(); if (!current(request)) return;
      if (!access.allowed) { reviewer = null; status.textContent = 'This account does not have assigned listing review access.'; return; }
      reviewer = access.reviewerId;
      const values = await listListingReviewQueue(reviewer, cursors[page]); if (!current(request)) return;
      hasNext = values.length > 20; rows = values.slice(0, 20);
      for (const row of rows) {
        const card = node('article', null, 'review-card'); const open = node('button', `Inspect listing copy: ${row.title || 'Untitled'}`, 'button outline'); open.type = 'button'; open.addEventListener('click', () => inspect(row.id));
        card.append(node('h2', row.title || 'Recorded listing'), node('p', row.kind === 'offering' ? 'Offering' : 'Looking For', 'profile-small'), listingCopyTime('Recorded', row.submitted_at), open); list.append(card);
      }
      pages.hidden = !rows.length && page === 0; status.textContent = rows.length ? `${rows.length} unapproved active listing copies on this page. Oldest first.` : 'No unapproved active listing copies on this page.';
    } catch { if (current(request)) status.textContent = 'Listing review unavailable. Check sign-in, capability and database setup, then retry.'; }
    finally { busy = false; if (current(request)) controls(); }
  }
  refresh.addEventListener('click', () => load(true));
  previous.addEventListener('click', () => { if (!busy && page > 0) { page--; load(); } });
  next.addEventListener('click', () => { if (!busy && hasNext && rows.length) { cursors[page + 1] = rows.at(-1); page++; load(); } });
  load(true);
}
