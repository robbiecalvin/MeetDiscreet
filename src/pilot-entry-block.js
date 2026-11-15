import './marketplace-services.css';
import { requireUser } from './backend/client.js';
import { blockPilotEntry } from './backend/marketplace-blocks.js';
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function pilotEntryBlock(kind, id, isCurrent) {
  const section = node('section', null, 'marketplace-entry-block'); const button = node('button', 'Block new contact from this Provider', 'button quiet'); button.type = 'button';
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); section.append(button, status); let busy = false;
  button.addEventListener('click', async () => {
    if (busy || !section.isConnected || !isCurrent() || !window.confirm('Block new contact in both directions? History and existing booking records are retained. This does not erase public content or cancel payments.')) return;
    busy = true; section.dataset.busy = 'true'; button.disabled = true; status.textContent = 'Recording contact block…';
    try { const actor = await requireUser(); if (!section.isConnected || !isCurrent()) return; const result = await blockPilotEntry(actor.id, kind, id); if (result !== true) throw new Error('Block unavailable.'); if (section.isConnected && isCurrent()) status.textContent = 'Contact block recorded. Manage it from Blocked participants in your account.'; }
    catch { if (section.isConnected && isCurrent()) status.textContent = 'Block could not be confirmed. Sign in and check Blocked participants before retrying.'; }
    finally { busy = false; section.dataset.busy = 'false'; if (section.isConnected && isCurrent()) button.disabled = false; }
  }); return section;
}
