import { authRedirect, backendClient } from './backend/client.js';
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
export function emailChangeControls(container, user, current, { isBusy, setBusy }) {
  const section = node('section', null, 'account-email');
  section.append(node('h2', 'Change your email'), node('p', 'Confirm your current password and enter the new address twice. Check your current and new inboxes for any confirmation required by the account service.', 'profile-small'));
  const address = node('p', '', 'email-current'); const pending = node('p', '', 'profile-small');
  const showAddress = () => {
    address.textContent = `Current sign-in email: ${user.email}`;
    pending.hidden = !user.new_email || user.new_email.toLowerCase() === user.email.toLowerCase();
    pending.textContent = pending.hidden ? '' : `Pending email: ${user.new_email}. Confirmation is still required.`;
  };
  showAddress(); section.append(address, pending);
  const form = node('form', null, 'account-form'); form.noValidate = true;
  const fields = {};
  for (const [key, title, type] of [['email','New email address','email'],['confirm','Confirm new email address','email'],['password','Current password for email change','password']]) {
    const group = node('div', null, 'account-field'); const input = node('input'); input.type = type; input.required = true; input.id = `change-email-${key}`;
    input.autocomplete = type === 'password' ? 'current-password' : 'email'; if (type === 'email') input.maxLength = 254;
    const label = node('label', title); label.htmlFor = input.id; group.append(label,input); form.append(group); fields[key] = input;
  }
  const submit = node('button', 'Request email change', 'button outline'); submit.type = 'submit';
  const status = node('p', '', 'profile-small'); status.id = 'email-change-status'; status.setAttribute('role','status'); status.tabIndex = -1;
  for (const field of Object.values(fields)) field.setAttribute('aria-describedby',status.id);
  form.append(submit); section.append(form,status); container.append(section);
  let busy = false;
  const setDisabled = value => { submit.disabled = value; for (const input of Object.values(fields)) input.disabled = value; if (value) fields.password.value = ''; };
  form.addEventListener('submit',async event => {
    event.preventDefault(); if (busy || isBusy()) return;
    for (const field of Object.values(fields)) field.removeAttribute('aria-invalid');
    const email = fields.email.value.trim(); fields.email.value = email;
    let invalid = null;
    if (!fields.email.checkValidity()) { status.textContent = 'Enter a valid new email address.'; invalid = fields.email; }
    else if (email.toLowerCase() !== fields.confirm.value.trim().toLowerCase()) { status.textContent = 'New email addresses must match.'; invalid = fields.confirm; }
    else if (email.toLowerCase() === user.email.toLowerCase()) { status.textContent = 'Choose a different email address.'; invalid = fields.email; }
    else if (!fields.password.value) { status.textContent = 'Enter your current password.'; invalid = fields.password; }
    if (invalid) { invalid.setAttribute('aria-invalid','true'); invalid.focus(); return; }
    const secret = fields.password.value; fields.password.value = '';
    if (!window.confirm(`Request an email change to ${email}? Your account service may require confirmation from your current and new inboxes.`)) { status.textContent = 'No email change was requested.'; return; }
    busy = true; setBusy(true); setDisabled(true); status.textContent = 'Verifying your password…';
    try {
      const client = backendClient(); const owner = user.id;
      const { data: before, error: beforeError } = await client.auth.getUser();
      if (!current()) return;
      if (beforeError || before.user?.id !== owner || before.user.email?.toLowerCase() !== user.email.toLowerCase()) throw new Error('Account changed.');
      const { data: verified, error: verifyError } = await client.auth.signInWithPassword({email:user.email,password:secret});
      if (!current()) return;
      if (verifyError || verified.user?.id !== owner) { status.textContent = 'Unable to verify your current password. Try again or use account recovery.'; return; }
      const { data, error } = await client.auth.updateUser({email}, {emailRedirectTo:authRedirect()});
      if (!current()) return;
      if (error || data.user?.id !== owner || typeof data.user.email !== 'string' || !data.user.email) throw new Error('Email change unavailable.');
      // Keep sibling security forms using the provider's current sign-in address.
      user.email = data.user.email; user.new_email = typeof data.user.new_email === 'string' ? data.user.new_email : ''; showAddress();
      if (user.new_email?.toLowerCase() === email.toLowerCase() && user.email?.toLowerCase() !== email.toLowerCase()) status.textContent = 'Email change awaiting confirmation. Check your inboxes for any confirmation steps. Your sign-in email has not changed yet.';
      else if (user.email?.toLowerCase() === email.toLowerCase()) status.textContent = 'Your account email was updated. Use the current sign-in address shown above.';
      else status.textContent = 'The account service did not confirm this email change. Reopen Account security to check your details before retrying.';
    } catch { if (current()) status.textContent = 'Unable to request the email change. Check your account, address and connection, then retry.'; }
    finally { busy = false; setBusy(false); setDisabled(false); if (current()) status.focus(); }
  });
  return {setDisabled};
}
