import { requireUser } from './backend/client.js';
import { loadListingCopyHistory, loadOwnerListingApproval, withdrawListingCopy } from './backend/listing-submissions.js';
import { listingCopyFields, listingCopyTime } from './listing-copy-fields.js';
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function listingCopyHistory(isCurrent) {
  const root = node('section', null, 'listing-copy-history');
  root.append(node('h2', 'Your recorded listing copies'), node('p', 'Includes withdrawn copies and copies retained after deleting editable drafts. These private records do not establish public visibility.', 'profile-small'));
  const loadButton = node('button', 'Load listing copy history', 'button outline'); loadButton.type = 'button';
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const list = node('div'); const pages = node('div', null, 'editor-actions'); pages.hidden = true;
  const newer = node('button', 'Newer listing copies', 'button quiet'); newer.type = 'button';
  const older = node('button', 'Older listing copies', 'button outline'); older.type = 'button'; pages.append(newer, older);
  root.append(loadButton, status, list, pages);
  let busy = false, generation = 0, owner = null, page = 0, cursors = [null], rows = [], hasOlder = false;
  const current = request => request === generation && root.isConnected && isCurrent();
  function controls() { loadButton.disabled = busy; newer.disabled = busy || page === 0; older.disabled = busy || !hasOlder; }
  async function load(reset = false) {
    if (busy) return;
    busy = true; const request = ++generation;
    if (reset) { page = 0; cursors = [null]; }
    controls(); list.replaceChildren(); pages.hidden = true; status.textContent = 'Loading recorded listing copies…';
    try {
      const user = await requireUser(); if (!current(request)) return;
      if (owner && owner !== user.id) throw new Error('Account changed.'); owner = user.id;
      const result = await loadListingCopyHistory(owner, cursors[page]); if (!current(request)) return;
      hasOlder = result.length > 20; rows = result.slice(0, 20);
      for (const row of rows) {
        const card = node('article', null, 'library-card listing-copy-card');
        card.append(node('h3', row.recorded_fields?.title || 'Recorded listing'), node('p', `${row.kind === 'offering' ? 'Offering' : 'Looking For'} · ${row.withdrawn_at ? 'Withdrawn' : 'Active'} private copy`, 'eyebrow'), listingCopyTime('Recorded', row.submitted_at));
        if (row.withdrawn_at) card.append(listingCopyTime('Withdrawn', row.withdrawn_at));
        const details = node('details'); details.append(node('summary', 'View recorded listing fields'), listingCopyFields(row.recorded_fields));
        const resultLine = node('div', '', 'profile-small'); resultLine.setAttribute('role', 'status');
        const check = node('button', 'Check listing editorial approval', 'button quiet'); check.type = 'button';
        check.addEventListener('click', async () => {
          check.disabled = true; resultLine.replaceChildren('Checking editorial approval…');
          try { const approval = await loadOwnerListingApproval(owner, row.id); if (!current(request)) return;
            resultLine.textContent = approval ? 'Editorial approval recorded for this exact copy. This does not publish it or grant paid access.' : 'No editorial approval recorded for this copy. This does not indicate rejection.';
            if (approval) resultLine.append(listingCopyTime('Approved', approval.approved_at));
          } catch { if (current(request)) resultLine.textContent = 'Editorial approval unavailable. Check sign-in and setup, then retry.'; }
          finally { if (current(request)) check.disabled = false; }
        });
        details.append(check, resultLine);
        if (!row.withdrawn_at) {
          const withdraw = node('button', 'Withdraw this recorded listing copy', 'button quiet'); withdraw.type = 'button';
          withdraw.addEventListener('click', async () => {
            if (busy || !window.confirm('Withdraw this exact listing copy? Saved drafts, history and any editorial approval are retained.')) return;
            busy = true; controls(); withdraw.disabled = true; resultLine.textContent = 'Withdrawing recorded copy…';
            try { await withdrawListingCopy(owner, row.id); if (!current(request)) return; busy = false; await load(true); }
            catch { if (current(request)) resultLine.textContent = 'Withdrawal could not be confirmed. Reload history before retrying.'; }
            finally { busy = false; if (current(request)) { controls(); withdraw.disabled = false; } }
          }); details.append(withdraw);
        }
        card.append(details); list.append(card);
      }
      pages.hidden = !rows.length && page === 0;
      status.textContent = rows.length ? `${rows.length} recorded listing copies on this page. Newest first.` : 'No recorded listing copies on this page.';
    } catch { if (current(request)) { list.replaceChildren(); status.textContent = 'Listing copy history unavailable. Check sign-in, connection and database setup, then retry.'; } }
    finally { busy = false; if (current(request)) { controls(); status.focus(); } }
  }
  loadButton.addEventListener('click', () => load(true));
  newer.addEventListener('click', () => { if (!busy && page > 0) { page--; load(); } });
  older.addEventListener('click', () => { if (!busy && hasOlder && rows.length) { cursors[page + 1] = rows.at(-1); page++; load(); } });
  return root;
}
