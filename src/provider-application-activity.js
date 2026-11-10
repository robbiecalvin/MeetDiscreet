import { loadProviderApplicationActivity } from './backend/provider-applications.js';
const labels = { draft: 'Draft saved', submitted: 'Application submitted', withdrawn: 'Application withdrawn', changes_requested: 'Changes requested', approved: 'Pilot Provider application approved' };
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
export function renderProviderApplicationActivity(container, getOwner, isCurrent) {
  const section = node('section', null, 'application-activity');
  section.append(node('h2', 'Application activity'), node('p', 'Your latest 20 saved status updates, newest first. Current account roles are shown in Account.', 'profile-small'));
  const button = node('button', 'Load application activity', 'button outline'); button.type = 'button';
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status');
  const list = node('ol'); list.setAttribute('aria-label', 'Application activity');
  section.append(button, status, list); container.append(section);
  let generation = 0;
  function clear() {
    generation++; list.replaceChildren(); status.textContent = '';
    button.disabled = false; button.textContent = 'Load application activity';
  }
  button.addEventListener('click', async () => {
    const owner = getOwner(); if (!owner || button.disabled) return;
    const request = ++generation;
    list.replaceChildren(); button.disabled = true; status.textContent = 'Loading application activity…';
    const current = () => request === generation && isCurrent() && getOwner() === owner && section.isConnected;
    try {
      const rows = await loadProviderApplicationActivity(owner);
      if (!current()) return;
      for (const row of rows) {
        const item = node('li');
        const parsed = new Date(row.occurred_at);
        const time = node('time', Number.isNaN(parsed.getTime()) ? 'Date unavailable' : parsed.toLocaleString());
        if (!Number.isNaN(parsed.getTime())) time.dateTime = parsed.toISOString();
        item.append(node('strong', labels[row.state]), time); list.append(item);
      }
      status.textContent = rows.length ? `${rows.length} recent status update${rows.length === 1 ? '' : 's'} loaded.` : 'No application activity recorded yet.';
      button.textContent = 'Refresh application activity';
    } catch {
      if (current()) { list.replaceChildren(); status.textContent = 'Application activity unavailable. Check sign-in, connection and backend setup, then retry.'; }
    } finally { if (current()) button.disabled = false; }
  });
  return { clear };
}
