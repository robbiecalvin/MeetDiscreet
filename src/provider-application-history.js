import { loadProviderApplicationHistory } from './backend/provider-applications.js';
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function date(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Date unavailable' : parsed.toLocaleString();
}
export function renderProviderApplicationHistory(container, getOwner, isCurrent) {
  const section = node('section', null, 'application-history');
  section.append(node('h2', 'Your submission history'), node('p', 'Review your latest 20 submitted introductions and any requested changes. Private drafts are not included.', 'profile-small'));
  const button = node('button', 'Load submission history', 'button outline'); button.type = 'button';
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status');
  const entries = node('div', null, 'application-history-entries');
  section.append(button, status, entries); container.append(section);
  let generation = 0;
  function clear() {
    generation++; entries.replaceChildren(); status.textContent = '';
    button.disabled = false; button.textContent = 'Load submission history';
  }
  button.addEventListener('click', async () => {
    const owner = getOwner(); if (!owner || button.disabled) return;
    const request = ++generation; entries.replaceChildren(); button.disabled = true; status.textContent = 'Loading submission history…';
    const current = () => request === generation && isCurrent() && getOwner() === owner && section.isConnected;
    try {
      const rows = await loadProviderApplicationHistory(owner);
      if (!current()) return;
      for (const row of rows) {
        const detail = node('details');
        detail.append(node('summary', `Submitted ${date(row.submitted_at)}`), node('h3', row.display_name), node('p', row.city), node('p', row.introduction, 'application-history-text'));
        if (row.feedback) detail.append(node('h3', 'Requested changes'), node('p', row.feedback.note, 'application-history-text'), node('p', `Feedback received ${date(row.feedback.created_at)}`, 'profile-small'));
        else detail.append(node('p', 'No requested changes recorded for this submission. This does not indicate approval.', 'profile-small'));
        entries.append(detail);
      }
      status.textContent = rows.length ? `${rows.length} recent submission${rows.length === 1 ? '' : 's'} loaded.` : 'No submitted introductions found.';
      button.textContent = 'Refresh submission history';
    } catch {
      if (current()) { entries.replaceChildren(); status.textContent = 'Submission history unavailable. Check sign-in, connection and backend setup, then retry.'; }
    } finally { if (current()) button.disabled = false; }
  });
  return { clear };
}
