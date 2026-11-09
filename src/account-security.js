import { backendEnabled, backendClient } from './backend/client.js';

function node(tag, text, className) {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
}
export function renderAccountSecurity(container, navigate) {
  container.replaceChildren();
  const root = node('div', null, 'account-layout');
  const intro = node('div', null, 'account-intro');
  const back = node('a', '← Back to account', 'profile-back');
  back.href = '?page=account';
  back.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate('account');
  });
  intro.append(back, node('p', 'ACCOUNT SECURITY', 'eyebrow'), node('h1', 'Change your password.'), node('p', 'Confirm your current password, then choose a new one.', 'offering-lead'));
  const panel = node('div', null, 'account-panel');
  const status = node('p', backendEnabled ? 'Checking your account…' : 'Password changes require the development backend. This preview does not change an account.', 'account-preview-result');
  status.setAttribute('role', 'status');
  status.id = 'account-security-status';
  status.tabIndex = -1;
  root.append(intro, panel);
  panel.append(status);
  container.append(root);
  const current = () => root.parentNode === container;
  if (!backendEnabled) return;
  const signIn = node('a', 'Sign in', 'button outline');
  signIn.href = '?page=sign-in';
  signIn.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate('sign-in');
  });
  backendClient().auth.getUser().then(({ data, error }) => {
    if (!current()) return;
    if (error || !data.user?.email) {
      status.textContent = 'Sign in with your email account to change your password.';
      panel.append(signIn);
      return;
    }
    const user = data.user;
    status.textContent = '';
    const form = node('form', null, 'account-form');
    const inputs = [];
    const toggles = [];
    for (const [id, label, autocomplete] of [
      ['current', 'Current password', 'current-password'],
      ['new', 'New password', 'new-password'],
      ['confirm', 'Confirm new password', 'new-password'],
    ]) {
      const group = node('div', null, 'account-field');
      const field = node('input'); field.type = 'password'; field.id = `security-${id}`;
      field.autocomplete = autocomplete; field.required = true;
      field.setAttribute('aria-describedby', status.id);
      const title = node('label', label); title.htmlFor = field.id;
      const toggle = node('button', `Show ${label.toLowerCase()}`, 'password-toggle');
      toggle.type = 'button'; toggle.setAttribute('aria-controls', field.id); toggle.setAttribute('aria-pressed', 'false');
      toggle.addEventListener('click', () => {
        const show = field.type === 'password';
        field.type = show ? 'text' : 'password';
        toggle.textContent = `${show ? 'Hide' : 'Show'} ${label.toLowerCase()}`;
        toggle.setAttribute('aria-pressed', String(show));
      });
      inputs.push(field); toggles.push(toggle);
      group.append(title, field, toggle); form.append(group);
    }
    const submit = node('button', 'Change password', 'button primary'); submit.type = 'submit';
    form.append(submit);
    panel.prepend(form);
    let busy = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      if (inputs[1].value !== inputs[2].value) {
        status.textContent = 'New passwords must match.';
        inputs[2].setAttribute('aria-invalid', 'true'); inputs[2].focus();
        return;
      }
      const oldPassword = inputs[0].value;
      const newPassword = inputs[1].value;
      for (const [index, field] of inputs.entries()) {
        field.value = ''; field.type = 'password'; field.disabled = true; field.removeAttribute('aria-invalid');
        toggles[index].setAttribute('aria-pressed', 'false');
        toggles[index].textContent = `Show ${['current password', 'new password', 'confirm new password'][index]}`;
        toggles[index].disabled = true;
      }
      busy = true; submit.disabled = true; status.textContent = 'Verifying and updating…';
      try {
        const { data: verified, error: verifyError } = await backendClient().auth.signInWithPassword({ email: user.email, password: oldPassword });
        if (!current()) return;
        if (verifyError || verified.user?.id !== user.id) {
          status.textContent = 'Unable to verify your current password. Try again or use account recovery.';
          return;
        }
        const { error: updateError } = await backendClient().auth.updateUser({ password: newPassword });
        if (!current()) return;
        status.textContent = updateError ? 'Unable to change your password. Check the project password requirements or use account recovery, then retry.' : 'Your password was changed.';
      } catch {
        if (current()) status.textContent = 'Unable to change your password. Check your connection and try again.';
      } finally {
        busy = false; submit.disabled = false;
        for (const field of inputs) field.disabled = false;
        for (const toggle of toggles) toggle.disabled = false;
        if (current()) status.focus();
      }
    });
    const recover = node('a', 'Forgot your current password?', 'account-recovery-link');
    recover.href = '?page=recover-account';
    recover.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); navigate('recover-account');
    });
    panel.append(recover);
  }).catch(() => {
    if (!current()) return;
    status.textContent = 'Unable to verify your account. Check your connection or sign in again.';
    panel.append(signIn);
  });
}
