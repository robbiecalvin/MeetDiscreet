import { backendEnabled, backendClient } from './backend/client.js';

function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  if (className) item.className = className;
  return item;
}
export function renderAccountOverview(container, navigate, onBack) {
  container.replaceChildren();
  const root = node('div', null, 'account-overview');
  const link = (page, label, className = 'button outline') => {
    const item = node('a', label, className);
    item.href = page ? `?page=${page}` : './';
    item.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (page) navigate(page); else onBack();
    });
    return item;
  };
  root.append(link('', '← Back to discovery', 'profile-back'), node('p', 'YOUR SPACE', 'eyebrow'), node('h1', 'Your account.'));
  const status = node('p', backendEnabled ? 'Checking your account…' : 'Account overview preview. Sign-in and saved drafts require the development backend.', 'offering-lead');
  status.setAttribute('role', 'status');
  const content = node('div');
  root.append(status, content);
  container.append(root);
  // Detached roots cannot reveal results after navigation or an identity change.
  const current = () => root.parentNode === container;
  if (!backendEnabled) {
    content.append(link('sign-in', 'View sign-in preview'));
    return;
  }
  backendClient().auth.getUser().then(({ data, error }) => {
    if (!current()) return;
    if (error || !data.user) {
      status.textContent = 'Sign in to manage your private drafts.';
      content.append(link('sign-in', 'Sign in', 'button primary'), link('register', 'Create account'));
      return;
    }
    status.textContent = data.user.email ? `Signed in as ${data.user.email}` : 'Signed in.';
    const grid = node('div', null, 'account-tool-grid');
    for (const [page, title, copy, action] of [
      ['edit-profile', 'Profile draft', 'Edit your introduction and load or save your private profile draft.', 'Edit profile draft'],
      ['create-listing', 'Listing drafts', 'Create, load, update, or delete private Offering and Looking For drafts.', 'Manage listing drafts'],
      ['experiences', 'Experience catalogue', 'Explore included experiences and optional extras. These edits stay in memory and clear on refresh.', 'Open experience tools'],
    ]) {
      const card = node('section', null, 'account-tool-card');
      card.append(node('h2', title), node('p', copy), link(page, action));
      grid.append(card);
    }
    content.append(grid, node('p', 'Development workspace. Saved drafts are private. Public publishing, subscriptions, bookings, and payments are not connected.', 'account-preview-note'));
  }).catch(() => {
    if (!current()) return;
    status.textContent = 'Unable to check your account. Check your connection and reload, or sign in again.';
    content.append(link('sign-in', 'Sign in'));
  });
}
