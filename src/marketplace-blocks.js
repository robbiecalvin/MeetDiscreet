import './marketplace-services.css';
import { backendEnabled, requireUser } from './backend/client.js';
import { registerRouteLeave } from './route-leave.js';
import { listingCopyTime } from './listing-copy-fields.js';
import { loadMyBlocks, removeMyBlock } from './backend/marketplace-blocks.js';
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function renderMarketplaceBlocks(container, navigate) {
  container.replaceChildren(); const root = node('section', null, 'marketplace-service');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account'; back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('account'); });
  root.append(back, node('p', 'CONTACT PREFERENCES', 'eyebrow'), node('h1', 'Blocked participants.'), node('p', 'Your blocks stop new contact in both directions. Unblocking removes your block only; it cannot remove someone else’s block or restore expired access. Public directory visibility is unchanged.', 'offering-lead'));
  const refresh = node('button', 'Refresh my blocks', 'button outline'); refresh.type = 'button'; const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status');
  const list = node('div', null, 'pilot-directory-grid'); const pages = node('div', null, 'editor-actions'); pages.hidden = true;
  const previous = node('button', 'Previous blocks', 'button quiet'); previous.type = 'button'; const next = node('button', 'Next blocks', 'button quiet'); next.type = 'button'; pages.append(previous, next); root.append(refresh, status, list, pages); container.append(root);
  let busy = false, actor = null, generation = 0, page = 0, cursors = [null], rows = [], hasNext = false; const current = request => request === generation && root.parentNode === container;
  const controls = () => { refresh.disabled = busy; list.inert = busy; previous.disabled = busy || page === 0; next.disabled = busy || !hasNext; };
  registerRouteLeave(root, () => !busy);
  async function load(reset = false) {
    if (busy) return; busy = true; const request = ++generation; if (reset) { page = 0; cursors = [null]; } controls(); list.replaceChildren(); pages.hidden = true; status.textContent = 'Checking your blocks…';
    try {
      const user = await requireUser(); if (!current(request)) return; if (actor && actor !== user.id) throw new Error('Account changed.'); actor = user.id;
      const values = await loadMyBlocks(actor, cursors[page]); if (!current(request)) return; if (!Array.isArray(values)) throw new Error('Blocks unavailable.'); hasNext = values.length > 20; rows = values.slice(0, 20);
      for (const row of rows) {
        const card = node('article', null, 'service-panel'); const remove = node('button', 'Remove this contact block', 'button outline'); remove.type = 'button';
        card.append(node('h2', row.context_label || `Block ${row.id.slice(0, 8)}`), listingCopyTime('Recorded', row.created_at), remove); list.append(card);
        remove.addEventListener('click', async () => {
          if (busy || !window.confirm('Remove this contact block? Expired access and other participants’ blocks remain in force.')) return;
          busy = true; controls();
          try { await removeMyBlock(actor, row.id); if (current(request)) { busy = false; await load(true); } }
          catch { if (current(request)) status.textContent = 'Unblock could not be confirmed. Refresh before retrying.'; }
          finally { busy = false; if (current(request)) controls(); }
        });
      }
      pages.hidden = page === 0 && !hasNext; status.textContent = rows.length ? `${rows.length} private block records on this page. Labels come from the public entry or conversation context where you blocked contact; private contact details are not included.` : 'No blocks on this page.';
    } catch { if (current(request)) status.textContent = 'Your blocks are unavailable. Sign in and check connection/database setup, then retry.'; }
    finally { busy = false; if (current(request)) controls(); }
  }
  refresh.addEventListener('click', () => load(true)); previous.addEventListener('click', () => { if (!busy && page > 0) { page--; load(); } }); next.addEventListener('click', () => { if (!busy && hasNext && rows.length) { cursors[page + 1] = rows.at(-1).id; page++; load(); } });
  if (!backendEnabled) { refresh.hidden = true; status.textContent = 'Block management requires sign-in and the connected backend; no paid access is required.'; } else load(true);
}
