import { loadContactServiceStatus } from './backend/contact-service-status.js';
import { marketplaceReport } from './marketplace-report.js';
import './marketplace-services.css';
import { backendEnabled, requireUser } from './backend/client.js';
import { registerRouteLeave } from './route-leave.js';
import { trackDraft } from './draft-changes.js';
import { listingCopyTime } from './listing-copy-fields.js';
import { loadMyConversations, loadConversationMessages, sendConversationText, changeConversationBlock } from './backend/marketplace-messages.js';
trackDraft('marketplace-message', () => document.querySelector('#marketplace-message-text')?.value.trim() || '', backendEnabled);
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function renderMarketplaceMessages(container, navigate) {
  container.replaceChildren(); const root = node('section', null, 'marketplace-service marketplace-messages');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account'; back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('account'); });
  root.append(back, node('p', 'PRIVATE TEXT MESSAGES', 'eyebrow'), node('h1', 'Your conversations.'), node('p', 'Text messages for explicitly invited pilot pairs. Current pair access is required to send; existing participants retain read-only history after expiry. No attachments, calls or live presence.', 'offering-lead'));
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const refresh = node('button', 'Refresh conversations', 'button outline'); refresh.type = 'button';
  const layout = node('div', null, 'service-split'); const list = node('section'); list.setAttribute('aria-label', 'Your pilot conversations'); const thread = node('section'); thread.setAttribute('aria-label', 'Private text conversation');
  layout.append(list, thread); const pages = node('div', null, 'editor-actions'); pages.hidden = true;
  const previous = node('button', 'Previous conversations', 'button quiet'); previous.type = 'button'; const next = node('button', 'Next conversations', 'button quiet'); next.type = 'button'; pages.append(previous, next); root.append(refresh, status, layout, pages); container.append(root);
  let actor = null, busy = false, generation = 0, page = 0, cursors = [null], rows = [], hasNext = false, active = null, text = null, pendingSend = null;
  const current = request => request === generation && root.parentNode === container;
  function canLeave() { if (busy || root.querySelector('.marketplace-report[data-busy=true]')) { status.textContent = 'Wait for the current conversation operation to finish.'; return false; } return (!text?.value.trim() && ![...root.querySelectorAll('.marketplace-report textarea')].some(input => input.value.trim())) || window.confirm('Discard unsent message/report text in this view?'); }
  registerRouteLeave(root, canLeave);
  function controls() { refresh.disabled = busy; list.inert = busy; previous.disabled = busy || page === 0; next.disabled = busy || !hasNext; }
  async function load(reset = false, confirmed = false) {
    if (busy || (!confirmed && !canLeave())) return; busy = true; const request = ++generation; if (reset) { page = 0; cursors = [null]; }
    controls(); list.replaceChildren(); thread.replaceChildren(); text = null; active = null; pendingSend = null; pages.hidden = true; status.textContent = 'Checking your conversations…';
    try {
      const user = await requireUser(); if (!current(request)) return; if (actor && actor !== user.id) throw new Error('Account changed.'); actor = user.id;
      const serviceStatus = await loadContactServiceStatus(actor); if (!current(request)) return;
      const values = await loadMyConversations(actor, cursors[page]); if (!current(request)) return;
      hasNext = values.length > 20; rows = values.slice(0, 20);
      for (const row of rows) {
        const button = node('button', `${row.peer_label} · ${row.id.slice(0, 8)}`, 'button outline service-conversation'); button.type = 'button'; button.addEventListener('click', () => open(row)); list.append(button);
      }
      pages.hidden = page === 0 && !hasNext; status.textContent = !serviceStatus.text_messaging ? 'New text sending is disabled for the pilot. Existing participant history remains available below.' : rows.length ? 'Choose a conversation. Refresh explicitly to check new messages.' : 'No invited pilot conversations on this page. Publishing eligibility alone does not create text access.';
    } catch { if (current(request)) { list.replaceChildren(); status.textContent = 'Conversations unavailable. Sign in and check pilot access/database setup, then retry.'; } }
    finally { busy = false; if (current(request)) controls(); }
  }
  async function open(row) {
    if (!canLeave()) return; busy = true; const request = ++generation; controls(); thread.replaceChildren(); text = null; active = row; pendingSend = null; status.textContent = 'Loading private message history…';
    try {
      const values = await loadConversationMessages(actor, row.id); if (!current(request)) return;
      const heading = node('h2', `${row.peer_label} · ${row.id.slice(0, 8)}`); heading.tabIndex = -1;
      const log = node('div', null, 'service-message-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-label', 'Private message history');
      const more = node('button', 'Load older messages', 'button quiet'); more.type = 'button';
      let oldest = null, hasOlder = false;
      function paintMessages(items, prepend = false) {
        hasOlder = items.length > 50; const visible = items.slice(0, 50); if (visible.length) oldest = visible.at(-1).sequence;
        const fragment = document.createDocumentFragment();
        for (const value of [...visible].reverse()) {
          const bubble = node('article', null, `service-message ${value.sent_by_me ? 'outgoing' : 'incoming'}`); bubble.append(node('p', value.sent_by_me ? 'You' : row.peer_label, 'eyebrow'), node('p', value.body, 'service-message-body'), listingCopyTime('Sent', value.sent_at)); if (!value.sent_by_me) bubble.append(marketplaceReport('message', value.id, () => current(request), row.id)); fragment.append(bubble);
        }
        if (prepend) log.prepend(fragment); else log.replaceChildren(fragment); more.hidden = !hasOlder;
      }
      paintMessages(values);
      if (!values.length) log.append(node('p', 'No text messages yet.', 'profile-small'));
      const refreshThread = node('button', 'Refresh this conversation', 'button quiet'); refreshThread.type = 'button'; refreshThread.addEventListener('click', () => open(active));
      const block = node('button', row.blocked_by_me ? 'Unblock this participant' : 'Block new contact', 'button outline'); block.type = 'button';
      block.addEventListener('click', async () => {
        if (!canLeave() || !window.confirm(`${row.blocked_by_me ? 'Remove your block' : 'Block new contact in both directions'}? Existing history and booking records are kept.`)) return;
        busy = true; controls(); thread.inert = true;
        try { const result = await changeConversationBlock(actor, row.id, !row.blocked_by_me); if (typeof result !== 'boolean') throw new Error('Block unavailable.'); if (current(request)) { text.value = ''; status.textContent = 'Contact preference recorded. Refresh conversations to check current send access.'; } }
        catch { if (current(request)) status.textContent = 'Contact preference could not be confirmed. Refresh before retrying.'; }
        finally { busy = false; if (current(request)) { controls(); thread.inert = false; block.disabled = true; send.disabled = true; if (text) text.disabled = true; } }
      });
      const form = node('form', null, 'service-form'); const label = node('label', 'Message'); label.htmlFor = 'marketplace-message-text'; text = node('textarea'); text.id = label.htmlFor; text.rows = 4; text.maxLength = 2000; text.required = true; text.disabled = !row.can_send;
      const send = node('button', 'Send text message', 'button primary'); send.type = 'submit'; send.disabled = !row.can_send;
      const result = node('p', row.can_send ? 'Text only. Sends are checked by the backend.' : 'Sending is unavailable. History remains readable; refresh to recheck current access.', 'profile-small'); result.setAttribute('role', 'status');
      form.append(label, text, send, result);
      form.addEventListener('submit', async event => {
        event.preventDefault(); if (busy || !current(request) || !text.value.trim()) return;
        if (root.querySelector('.marketplace-report[data-busy=true]')) { result.textContent = 'Wait for the report request to finish.'; return; }
        if ([...root.querySelectorAll('.marketplace-report textarea')].some(input => input.value.trim()) && !window.confirm('Discard the unsent report text when refreshing message history after this send?')) return;
        const body = text.value.trim(); if (!pendingSend || pendingSend.body !== body) pendingSend = { body, clientId: crypto.randomUUID() };
        busy = true; controls(); thread.inert = true; result.textContent = 'Sending text…';
        try {
          await sendConversationText(actor, row.id, pendingSend.clientId, body); if (!current(request)) return;
          text.value = ''; pendingSend = null; result.textContent = 'Text saved to this conversation.';
          const latest = await loadConversationMessages(actor, row.id); if (current(request)) paintMessages(latest);
        } catch { if (current(request)) result.textContent = pendingSend ? 'Send could not be confirmed. Retry the same text to safely check the same request, or refresh history before changing it. Access may have expired or contact may be unavailable.' : 'Text was saved, but history refresh failed. Refresh this conversation.'; }
        finally { busy = false; if (current(request)) { controls(); thread.inert = false; } }
      });
      more.addEventListener('click', async () => {
        if (busy || !hasOlder || !oldest || !current(request)) return; busy = true; controls(); thread.inert = true;
        try { const older = await loadConversationMessages(actor, row.id, oldest); if (current(request)) paintMessages(older, true); }
        catch { if (current(request)) result.textContent = 'Older history unavailable. Retry without changing your unsent text.'; }
        finally { busy = false; if (current(request)) { controls(); thread.inert = false; } }
      });
      thread.append(heading, refreshThread, block, more, log, form); status.textContent = 'Private conversation loaded. No background notifications or realtime presence are claimed.'; heading.focus();
    } catch { if (current(request)) { thread.replaceChildren(); status.textContent = 'Private history unavailable. Refresh conversations and check current sign-in.'; } }
    finally { busy = false; if (current(request)) controls(); }
  }
  refresh.addEventListener('click', () => load(true)); previous.addEventListener('click', () => { if (!busy && page > 0 && canLeave()) { page--; load(false, true); } }); next.addEventListener('click', () => { if (!busy && hasNext && rows.length && canLeave()) { cursors[page + 1] = rows.at(-1).id; page++; load(false, true); } });
  if (!backendEnabled) { refresh.hidden = true; status.textContent = 'Private text messaging requires the connected backend and an explicitly invited pilot pair. No fictional messages are substituted.'; } else load(true);
}
