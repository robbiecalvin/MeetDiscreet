import { loadPrivateDraftSummary } from './backend/drafts.js';
import { hasSavedBookingPlan } from './backend/booking-plans.js';
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
    const value = node('a', label, className); value.href = page ? `?page=${page}${page === 'my-listings' ? '&kind=looking' : ''}` : './';
    value.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); if (page) navigate(page, page === 'my-listings' ? { kind: 'looking' } : {}); else onDiscover();
    });
    return value;
  };
  root.append(link('account', '← Back to account', 'profile-back'), node('p', 'START EXPLORING', 'eyebrow'), node('h1', 'Find your next shared moment.'), node('p', 'Discover providers or put an outing into words.', 'offering-lead'));
  const status = node('p', backendEnabled ? 'Checking your account…' : 'User setup preview. Discovery uses fictional providers; drafts do not publish an ad or reserve an experience.', 'editor-notice');
  status.setAttribute('role', 'status'); root.append(status); container.append(root);
  const current = () => root.parentNode === container;
  function tools(connected = false) {
    const grid = node('div', null, 'account-tool-grid');
    for (const [page, title, copy, action] of [
      ['edit-user-profile', 'Introduce yourself', 'Prepare a private User profile with your interests and the company you’re looking for.', 'Edit User profile draft'],
      [null, 'Discover providers', 'Browse the provider grid or compact ads view. Current profiles and online statuses are fictional.', 'Explore discovery'],
      ['my-listings', 'Plan an outing', 'Manage your private Looking For drafts and describe a plan you want company for.', 'Open my listing drafts'],
      ['booking-draft', 'Shape a booking plan', 'Try the request layout with a fictional provider. No request is sent or time reserved.', 'Preview a booking request'],
      ['provider-setup', 'Interested in providing?', 'Explore the separate provider setup using the same login. This does not grant publishing access.', 'Explore provider setup'],
    ]) {
      const card = node('section', null, 'account-tool-card'); card.append(node('h2', title), node('p', copy), link(page, action));
      if (connected && ['edit-user-profile', 'my-listings'].includes(page)) {
        const kind = page === 'edit-user-profile' ? 'user-profile' : 'looking-listings';
        const saved = node('p', 'Checking saved drafts…', 'account-draft-summary');
        saved.setAttribute('role', 'status'); saved.dataset.draftSummary = kind;
        const refresh = node('button', page === 'edit-user-profile' ? 'Refresh User profile saved status' : 'Refresh Looking For saved status', 'button quiet');
        refresh.type = 'button';
        let busy = false;
        async function check() {
          if (busy) return;
          busy = true; refresh.disabled = true; saved.textContent = 'Checking saved drafts…';
          try { const message = await loadPrivateDraftSummary(kind); if (current()) saved.textContent = message; }
          catch { if (current()) saved.textContent = 'Saved status unavailable. Check sign-in, connection and backend setup, then retry.'; }
          finally { busy = false; if (current()) refresh.disabled = false; }
        }
        refresh.addEventListener('click', check); card.append(saved, refresh); check();
      }
      if (connected && page === 'booking-draft') {
        const saved = node('p', 'Checking saved plan…', 'account-draft-summary'); saved.setAttribute('role', 'status'); saved.dataset.bookingPlanSummary = '';
        const refresh = node('button', 'Refresh saved booking plan status', 'button quiet'); refresh.type = 'button';
        const resume = node('a', 'Resume saved booking plan', 'button outline'); resume.href = '?page=booking-draft&resume=1'; resume.hidden = true;
        resume.addEventListener('click', event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); navigate('booking-draft', { resume: true });
        });
        const check = async () => {
          refresh.disabled = true; resume.hidden = true; saved.textContent = 'Checking saved plan…';
          try {
            const found = await hasSavedBookingPlan();
            if (current()) { saved.textContent = found ? 'Private booking plan saved' : 'No saved booking plan'; resume.hidden = !found; }
          } catch { if (current()) saved.textContent = 'Saved plan status unavailable. Check sign-in, connection and backend setup, then retry.'; }
          finally { if (current()) refresh.disabled = false; }
        };
        refresh.addEventListener('click', check); card.append(saved, refresh, resume); check();
      }
      grid.append(card);
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
    tools(true);
  }).catch(() => { if (current()) { status.textContent = 'Unable to verify your account. Check your connection or sign in again.'; root.append(link('sign-in', 'Sign in')); } });
}
