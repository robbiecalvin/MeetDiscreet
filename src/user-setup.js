import { backendEnabled, backendClient } from './backend/client.js';
function node(tag, text, className) {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
}
export function renderUserSetup(container, navigate, onDiscover) {
  container.replaceChildren();
  const root = node('section', null, 'user-setup');
  const link = (page, label, className = 'button outline') => {
    const value = node('a', label, className); value.href = page ? `?page=${page}` : './';
    value.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); if (page) navigate(page); else onDiscover();
    });
    return value;
  };
  root.append(link('account', '← Back to account', 'profile-back'), node('p', 'START EXPLORING', 'eyebrow'), node('h1', 'Find your next shared moment.'), node('p', 'Discover providers or put an outing into words.', 'offering-lead'));
  const status = node('p', backendEnabled ? 'Checking your account…' : 'User setup preview. Discovery uses fictional providers; drafts do not publish an ad or reserve an experience.', 'editor-notice');
  status.setAttribute('role', 'status'); root.append(status); container.append(root);
  const current = () => root.parentNode === container;
  function tools() {
    const grid = node('div', null, 'account-tool-grid');
    for (const [page, title, copy, action] of [
      ['edit-user-profile', 'Introduce yourself', 'Prepare a private User profile with your interests and the company you’re looking for.', 'Edit User profile draft'],
      [null, 'Discover providers', 'Browse the provider grid or compact ads view. Current profiles and online statuses are fictional.', 'Explore discovery'],
      ['my-listings', 'Plan an outing', 'Manage private listing drafts. Choose Looking For in the editor to describe a plan you want company for.', 'Open my listing drafts'],
      ['provider-setup', 'Interested in providing?', 'Explore the separate provider setup using the same login. This does not grant publishing access.', 'Explore provider setup'],
    ]) {
      const card = node('section', null, 'account-tool-card'); card.append(node('h2', title), node('p', copy), link(page, action)); grid.append(card);
    }
    root.append(grid);
  }
  if (!backendEnabled) { tools(); return; }
  backendClient().auth.getUser().then(({ data, error }) => {
    if (!current()) return;
    if (error || !data.user) {
      status.textContent = 'Sign in to continue your User setup.'; root.append(link('sign-in', 'Sign in'), link('register', 'Create account')); return;
    }
    status.textContent = 'Your User starting point. Saved drafts stay private; public posting, subscriptions and bookings are not connected.';
    tools();
  }).catch(() => { if (current()) { status.textContent = 'Unable to verify your account. Check your connection or sign in again.'; root.append(link('sign-in', 'Sign in')); } });
}
