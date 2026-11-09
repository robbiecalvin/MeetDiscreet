import { backendClient } from './backend/client.js';
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
export function otherSessionControls(container, user, current, { isBusy, setBusy }) {
  const section = node('section', null, 'account-sessions');
  section.append(node('h2', 'Sign out other sessions'), node('p', 'Keep this session and stop other sessions from renewing their sign-in. Other sessions may stay active until their current sign-in token expires.', 'profile-small'));
  const form = node('form', null, 'account-form');
  const label = node('label', 'Current password to sign out other sessions');
  const password = node('input'); password.type = 'password'; password.required = true; password.autocomplete = 'current-password'; password.id = 'other-sessions-password'; label.htmlFor = password.id;
  const field = node('div', null, 'account-field'); field.append(label, password);
  const submit = node('button', 'Sign out other sessions', 'button outline'); submit.type = 'submit';
  const status = node('p', '', 'profile-small'); status.id = 'other-sessions-status'; status.setAttribute('role', 'status'); status.tabIndex = -1;
  password.setAttribute('aria-describedby', status.id);
  form.append(field, submit); section.append(form, status); container.append(section);
  let busy = false;
  const setDisabled = value => { password.disabled = value; submit.disabled = value; if (value) password.value = ''; };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || isBusy()) return;
    const secret = password.value; password.value = '';
    if (!window.confirm('Sign out other sessions? This session will stay signed in. Other sessions may remain active until their current sign-in token expires.')) { status.textContent = 'No other sessions were changed.'; return; }
    busy = true; setBusy(true); setDisabled(true); status.textContent = 'Verifying your password…';
    try {
      const client = backendClient();
      const { data: before, error: beforeError } = await client.auth.getUser();
      if (!current()) return;
      if (beforeError || before.user?.id !== user.id) throw new Error('Account changed.');
      const { data, error } = await client.auth.signInWithPassword({ email: user.email, password: secret });
      if (!current()) return;
      if (error || data.user?.id !== user.id || !data.session?.access_token) { status.textContent = 'Unable to verify your current password. Try again or use account recovery.'; return; }
      const { data: verified, error: verifyError } = await client.auth.getUser(data.session.access_token);
      if (!current()) return;
      if (verifyError || verified.user?.id !== user.id) throw new Error('Account changed.');
      // This SDK method calls the ordinary user-JWT logout endpoint. No admin key
      // is used; unlike auth.signOut it preserves 401/403/404 errors and binds the
      // request to the freshly verified session instead of a mutable current one.
      const { error: revokeError } = await client.auth.admin.signOut(data.session.access_token, 'others');
      if (!current()) return;
      status.textContent = revokeError ? 'Unable to sign out other sessions. Check your connection and retry.' : 'Other sessions can no longer renew their sign-in. This session stays signed in; existing sign-in tokens elsewhere can remain active until they expire.';
    } catch { if (current()) status.textContent = 'Unable to sign out other sessions. Check your account and connection, then retry.'; }
    finally { busy = false; setBusy(false); setDisabled(false); if (current()) status.focus(); }
  });
  return { setDisabled };
}
