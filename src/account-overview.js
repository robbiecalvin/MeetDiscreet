import { accountPermissions } from './account-permissions.js';
import { loadPrivateDraftSummary } from './backend/drafts.js';
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
    const starting = node('section', null, 'account-starting-point');
    const intentStatus = node('p', '', 'profile-small'); intentStatus.setAttribute('role', 'status');
    const selected = ['user', 'provider'].includes(data.user.user_metadata?.onboarding_intent) ? data.user.user_metadata.onboarding_intent : null;
    intentStatus.textContent = selected ? `Getting started as ${selected === 'provider' ? 'Provider' : 'User'}.` : 'Choose User or Provider as your starting point.';
    starting.append(node('h2', 'Your starting point'), node('p', 'Use one login and revisit your starting point here. Provider tools prepare private drafts; this choice does not grant publishing access.', 'profile-small'), intentStatus);
    const options = node('div', null, 'editor-actions');
    const buttons = [];
    for (const intent of ['user', 'provider']) {
      const button = node('button', `Use ${intent === 'provider' ? 'Provider' : 'User'} starting point`, 'button outline'); button.type = 'button';
      button.setAttribute('aria-pressed', String(intent === selected));
      button.addEventListener('click', async () => {
        for (const option of buttons) option.disabled = true;
        intentStatus.textContent = 'Saving your starting point…';
        try {
          const { data: verified, error: verifyError } = await backendClient().auth.getUser();
          if (!current()) return;
          if (verifyError || verified.user?.id !== data.user.id) throw new Error('Account changed.');
          const { error } = await backendClient().auth.updateUser({ data: { onboarding_intent: intent } });
          if (error) throw error;
          if (!current()) return;
          buttons.forEach((option, index) => option.setAttribute('aria-pressed', String(index === (intent === 'user' ? 0 : 1))));
          intentStatus.textContent = `Getting started as ${intent === 'provider' ? 'Provider' : 'User'}.`;
          navigate(intent === 'provider' ? 'provider-setup' : 'user-setup');
        } catch { if (current()) intentStatus.textContent = 'Unable to save your starting point. Check sign-in and connection, then retry.'; }
        finally { for (const option of buttons) option.disabled = false; }
      });
      buttons.push(button); options.append(button);
    }
    starting.append(options, link('user-setup', 'Explore user setup'), link('provider-setup', 'Explore provider setup'));
    content.append(starting, accountPermissions(current, navigate));

    const grid = node('div', null, 'account-tool-grid');
    for (const [page, title, copy, action] of [
      ['provider-application', 'Provider application', 'Save an introduction and submit it to the private development intake queue.', 'Open provider application'],
      ['booking-draft', 'Booking request preview', 'Prepare and review a fictional plan without sending, reserving or paying.', 'Build a booking draft'],
      ['edit-user-profile', 'User profile draft', 'Prepare your personal introduction separately from provider profile drafts.', 'Edit User profile draft'],
      ['availability', 'Availability draft', 'Sketch weekly time windows in an explicit time zone. Connected mode supports private draft saving.', 'Edit availability draft'],
      ['account-security', 'Account security', 'Verify your current password and choose a new one.', 'Change password'],
      ['edit-profile', 'Provider profile draft', 'Edit your provider introduction and load or save your private provider profile draft.', 'Edit provider profile draft'],
      ['my-listings', 'Listing drafts', 'Create, load, update, or delete private Offering and Looking For drafts.', 'Manage listing drafts'],
      ['experiences', 'Experience catalogue', 'Explore included experiences and optional extras. Save or load a private catalogue. Unadded edits are not saved.', 'Open experience tools'],
    ]) {
      const card = node('section', null, 'account-tool-card');
      card.append(node('h2', title), node('p', copy));
      const kind = { 'edit-user-profile': 'user-profile', availability: 'availability', 'edit-profile': 'profile', 'my-listings': 'listings', experiences: 'experiences' }[page];
      if (kind) {
        const summary = node('p', 'Checking saved drafts…', 'account-draft-summary');
        summary.setAttribute('role', 'status');
        summary.dataset.draftSummary = kind;
        const refresh = node('button', 'Refresh saved status', 'button quiet');
        refresh.type = 'button';
        refresh.setAttribute('aria-label', `Refresh ${title.toLowerCase()} status`);
        const check = async () => {
          refresh.disabled = true;
          summary.textContent = 'Checking saved drafts…';
          try {
            const value = await loadPrivateDraftSummary(kind);
            if (current()) summary.textContent = value;
          } catch {
            if (current()) summary.textContent = 'Saved status unavailable. Check sign-in, connection, and database setup, then retry.';
          } finally { refresh.disabled = false; }
        };
        refresh.addEventListener('click', check);
        card.append(summary, refresh);
        check();
      }
      card.append(link(page, action));
      grid.append(card);
    }
    content.append(grid, node('p', 'Development workspace. Saved drafts are private. Public publishing, subscriptions, bookings, and payments are not connected.', 'account-preview-note'));
  }).catch(() => {
    if (!current()) return;
    status.textContent = 'Unable to check your account. Check your connection and reload, or sign in again.';
    content.append(link('sign-in', 'Sign in'));
  });
}
