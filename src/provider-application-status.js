import { loadProviderApplicationStatus } from './backend/provider-applications.js';
function node(tag, text, className) {
  const item = document.createElement(tag); item.textContent = text;
  if (className) item.className = className;
  return item;
}
export function attachProviderApplicationStatus(card, open, ownerId, current) {
  const defaultLabel = open.textContent;
  const applicationStatus = node('p', 'Checking application status…', 'account-draft-summary');
  applicationStatus.setAttribute('role', 'status'); applicationStatus.dataset.applicationStatus = '';
  const refresh = node('button', 'Refresh application status', 'button quiet'); refresh.type = 'button';
  const check = async () => {
    refresh.disabled = true; applicationStatus.textContent = 'Checking application status…';
    open.textContent = defaultLabel;
    try {
      const value = await loadProviderApplicationStatus(ownerId);
      if (!current()) return;
      const states = {
        draft: ['Private application draft saved.', 'Continue application draft'],
        submitted: ['Application submitted for review. Provider access has not been approved.', 'View submitted application'],
        withdrawn: ['Application withdrawn. Save revisions before submitting again.', 'Revise application'],
        approved: ['Application approved for the development pilot. Current role assignments are shown above.', 'View approved application'],
        changes_requested: ['Changes requested. Read your feedback, revise and resubmit.', 'Review requested changes'],
      };
      const [message, label] = states[value] || ['No provider application saved yet.', 'Start provider application'];
      applicationStatus.textContent = message; open.textContent = label;
    } catch {
      if (current()) applicationStatus.textContent = 'Application status unavailable. Check sign-in, connection and backend setup, then retry.';
    } finally { if (current()) refresh.disabled = false; }
  };
  refresh.addEventListener('click', check); card.append(applicationStatus, refresh); check();
}
