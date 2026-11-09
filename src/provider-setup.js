import { backendEnabled, backendClient } from './backend/client.js';
import { loadPrivateDraftSummary } from './backend/drafts.js';
function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  if (className) item.className = className;
  return item;
}
export function renderProviderSetup(container, navigate) {
  container.replaceChildren();
  const root = node('section', null, 'provider-setup');
  const link = (page, text, className = 'button outline') => {
    const item = node('a', text, className); item.href = `?page=${page}${page === 'my-listings' ? '&kind=offering' : ''}`;
    item.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(page, page === 'my-listings' ? { kind: 'offering' } : {});
    });
    return item;
  };
  root.append(link('account', '← Back to account', 'profile-back'), node('p', 'START PROVIDING', 'eyebrow'), node('h1', 'Build your provider introduction.'), node('p', 'Start with who you are, then shape the experiences and times you’d like to offer.', 'offering-lead'));
  const status = node('p', backendEnabled ? 'Checking your account…' : 'Provider setup preview. Use fictional details; sign-in and saved drafts require the development backend.', 'editor-notice');
  status.setAttribute('role', 'status'); root.append(status);
  const grid = node('div', null, 'account-tool-grid'); root.append(grid); container.append(root);
  const current = () => root.parentNode === container;
  function tools(connected) {
    for (const [page, title, copy, kind] of [
      ['edit-profile', '1. Introduce yourself', 'Prepare your profile draft and audience previews.', 'profile'],
      ['experiences', '2. Shape your experiences', 'Describe included experiences and optional draft extras.', 'experiences'],
      ['availability', '3. Sketch your availability', 'Choose a time zone and add weekly draft windows.', 'availability'],
      ['my-listings', '4. Draft an Offering', 'Open your listing library and create a private Offering draft when ready.', 'listings'],
    ]) {
      const card = node('section', null, 'account-tool-card');
      card.append(node('h2', title), node('p', copy));
      if (connected) {
        const summary = node('p', 'Checking saved drafts…', 'account-draft-summary'); summary.setAttribute('role', 'status');
        card.append(summary);
        loadPrivateDraftSummary(kind).then(value => { if (current()) summary.textContent = value; }).catch(() => { if (current()) summary.textContent = 'Saved status unavailable. Check database setup and your connection.'; });
      }
      card.append(link(page, title.slice(3))); grid.append(card);
    }
    root.append(node('p', 'These steps prepare private drafts. Provider eligibility, publishing approval and any required plan remain separate; no profile becomes public here.', 'account-preview-note'));
  }
  if (!backendEnabled) { tools(false); return; }
  backendClient().auth.getUser().then(({ data, error }) => {
    if (!current()) return;
    if (error || !data.user) {
      status.textContent = 'Sign in to start your provider setup with private drafts.';
      root.append(link('sign-in', 'Sign in'), link('register', 'Create account'));
      return;
    }
    status.textContent = 'Your provider workspace. Choosing Provider is a starting preference, not verification or permission to publish.';
    tools(true);
  }).catch(() => {
    if (current()) { status.textContent = 'Unable to verify your account. Check your connection or sign in again.'; root.append(link('sign-in', 'Sign in')); }
  });
}
