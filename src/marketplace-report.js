import './marketplace-services.css';
import { requireUser } from './backend/client.js';
import { submitMarketplaceReport } from './backend/marketplace-reports.js';
export function marketplaceReport(kind, id, isCurrent, conversation = null) {
  const root = document.createElement('details'); root.className = 'marketplace-report';
  const summary = document.createElement('summary'); summary.textContent = kind === 'message' ? 'Report this received message' : 'Report this pilot entry';
  const form = document.createElement('form');
  const reasonLabel = document.createElement('label'); reasonLabel.textContent = 'Reason'; const reason = document.createElement('select'); reason.required = true; const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose a reason'; reason.append(placeholder); reasonLabel.append(reason);
  for (const [value, label] of [['safety', 'Safety concern'], ['harassment', 'Harassment'], ['impersonation', 'Impersonation'], ['content', 'Content concern'], ['other', 'Other']]) { const option = document.createElement('option'); option.value = value; option.textContent = label; reason.append(option); }
  const detailsLabel = document.createElement('label'); detailsLabel.textContent = 'Describe the concern'; const details = document.createElement('textarea'); details.rows = 4; details.maxLength = 2000; details.required = true; detailsLabel.append(details);
  const note = document.createElement('p'); note.className = 'profile-small'; note.textContent = kind === 'message' ? 'Submitting shares this single received message and your explanation with scoped report reviewers. It does not give them access to the rest of your conversation. No response time is promised.' : 'Sign-in is required; no payment is required. This shares the reported public copy and your explanation with scoped reviewers. No response time is promised.';
  const send = document.createElement('button'); send.type = 'submit'; send.className = 'button outline'; send.textContent = 'Submit private report';
  const status = document.createElement('p'); status.className = 'profile-small'; status.setAttribute('role', 'status'); status.tabIndex = -1;
  form.append(reasonLabel, detailsLabel, note, send, status); root.append(summary, form);
  let busy = false; const current = () => root.isConnected && isCurrent();
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy || !current() || !details.value.trim()) return;
    if (!window.confirm('Submit this concern and the indicated copy as private evidence to scoped report reviewers? Check your report status before retrying an uncertain request.')) return;
    busy = true; root.dataset.busy = 'true'; send.disabled = true; reason.disabled = true; details.disabled = true; status.textContent = 'Submitting private report…';
    try { const actor = await requireUser(); if (!current()) return; const value = await submitMarketplaceReport(actor.id, kind, id, reason.value, details.value.trim(), conversation); if (!current()) return; if (!value?.id) throw new Error('Report unavailable.'); details.value = ''; status.textContent = `Report recorded or an existing active report returned. Reference ${value.id}. State: ${value.state}. Check My reports for updates.`; }
    catch { if (current()) status.textContent = 'Report could not be confirmed. Check sign-in, connection and My reports before retrying. Your explanation is kept here until you leave.'; }
    finally { busy = false; root.dataset.busy = 'false'; if (current()) { send.disabled = false; reason.disabled = false; details.disabled = false; status.focus(); } }
  });
  return root;
}
