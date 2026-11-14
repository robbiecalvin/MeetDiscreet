import { signInDestination, accountEntryLink } from './sign-in-destination.js';
import './account-entry.css';
import { backendEnabled, backendClient, authRedirect } from './backend/client.js';
const modes = {
  'sign-in': { title: 'Good to see you again.', intro: 'A familiar face. A new plan.', action: 'Check sign-in preview' },
  register: { title: 'A new connection starts here.', intro: 'A little introduction, and room for something new.', action: 'Check registration preview' },
  'reset-password': { title: 'Choose a new password.', intro: 'Complete recovery using your verified link.', action: 'Update password' },
  'confirm-account': { title: 'One last step to your account.', intro: 'Request a fresh registration confirmation link.', action: 'Check confirmation preview' },
  'recover-account': { title: 'Let’s find your way back.', intro: 'A preview of the account-recovery screen.', action: 'Check recovery preview' },
};
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function renderAccount(container, mode, onMode, onBack, onContinue) {
  container.replaceChildren();
  if (mode === 'reset-password' && !backendEnabled) mode = 'recover-account';
  const destination = signInDestination(new URLSearchParams(location.search).get('next'));
  const config = modes[mode];
  const actionLabel = backendEnabled ? ({ 'sign-in': 'Sign in', register: 'Create account', 'recover-account': 'Send recovery email', 'confirm-account': 'Request confirmation email', 'reset-password': 'Update password' })[mode] : config.action;
  const back = element('a', '← Back to discovery', 'profile-back');
  back.href = './';
  back.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onBack();
  });
  container.append(back);
  const layout = element('div', null, 'account-layout account-entry-layout');
  const intro = element('div', null, 'account-intro');
  intro.append(element('p', 'YOUR NEXT SHARED MOMENT', 'eyebrow'), element('h1', config.title), element('p', config.intro, 'offering-lead'), element('p', backendEnabled ? 'Development authentication is connected. Use test accounts while eligibility, final policies, and launch operations are being completed. Saving a private draft does not publish it.' : 'Account screen preview. Use fictional details only. Authentication is not connected; nothing is sent or saved.', 'account-preview-note'));
  const panel = element('div', null, 'account-panel');
  const tabs = element('nav', null, 'account-tabs');
  tabs.setAttribute('aria-label', 'Account screens');
  function modeLink(page, label) {
    const link = element('a', label);
    link.href = accountEntryLink(page, destination);
    if (page === mode) link.setAttribute('aria-current', 'page');
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); onMode(page);
    });
    return link;
  }
  tabs.append(modeLink('sign-in', 'Sign in'), modeLink('register', 'Create account'));
  const form = element('form', null, 'account-form');
  form.noValidate = true;
  form.autocomplete = backendEnabled ? 'on' : 'off';
  const summary = element('p', '', 'account-error-summary');
  summary.setAttribute('role', 'alert');
  const result = element('p', '', 'account-preview-result');
  result.setAttribute('role', 'status');
  result.tabIndex = -1;
  const fields = new Map();
  form.append(summary);
  function addField(key, label, type) {
    const group = element('div', null, 'account-field');
    const labelNode = element('label', label);
    const input = element('input');
    input.id = `account-${key}`;
    input.name = key;
    input.type = type;
    input.required = true;
    input.autocomplete = backendEnabled ? (key === 'email' ? 'email' : key === 'username' ? 'username' : mode === 'sign-in' ? 'current-password' : 'new-password') : 'off';
    if (type !== 'password' || !backendEnabled) input.maxLength = type === 'email' ? 254 : 128;
    labelNode.htmlFor = input.id;
    const error = element('p', '', 'account-field-error');
    error.id = `account-${key}-error`;
    input.setAttribute('aria-describedby', error.id);
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      error.textContent = '';
      summary.textContent = '';
      result.textContent = '';
    });
    group.append(labelNode, input);
    if (type === 'password') {
      const toggle = element('button', `Show ${label.toLocaleLowerCase()}`, 'password-toggle');
      toggle.type = 'button';
      toggle.setAttribute('aria-pressed', 'false');
      toggle.setAttribute('aria-controls', input.id);
      toggle.addEventListener('click', () => {
        const visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        toggle.textContent = `${visible ? 'Hide' : 'Show'} ${label.toLocaleLowerCase()}`;
        toggle.setAttribute('aria-pressed', String(visible));
      });
      group.append(toggle);
      fields.set(`${key}-toggle`, { toggle, input });
    }
    group.append(error);
    form.append(group);
    fields.set(key, { input, error });
  }
  if (mode === 'register') addField('username', 'Username', 'text');
  if (mode !== 'reset-password') addField('email', 'Email', 'email');
  if (!['recover-account', 'confirm-account'].includes(mode)) addField('password', 'Password', 'password');
  if (mode === 'register' || mode === 'reset-password') addField('confirm-password', 'Confirm password', 'password');
  const intentInputs = [];
  const intentError = element('p', '', 'account-field-error');
  intentError.id = 'account-intent-error';
  if (mode === 'register') {
    const group = element('fieldset', null, 'account-intent');
    group.append(element('legend', 'How would you like to get started?'));
    for (const [value, title, description] of [['user', 'User', 'Discover providers and plan shared experiences.'], ['provider', 'Provider', 'Build a provider profile, experiences, and availability.']]) {
      const label = element('label', null, 'account-intent-option');
      const input = element('input'); input.type = 'radio'; input.name = 'onboarding-intent'; input.value = value;
      input.required = true; input.setAttribute('aria-label', title); input.setAttribute('aria-describedby', `${intentError.id} account-intent-${value}-description`);
      const copy = element('span'); const descriptionNode = element('span', description); descriptionNode.id = `account-intent-${value}-description`; copy.append(element('strong', title), descriptionNode);
      label.append(input, copy); group.append(label); intentInputs.push(input);
      input.addEventListener('change', () => { intentError.textContent = ''; summary.textContent = ''; result.textContent = ''; });
    }
    group.append(element('p', 'Choose a starting point. You can revisit it from your account. Provider setup does not publish a profile or grant paid access.', 'profile-small'), intentError);
    form.insertBefore(group, summary.nextSibling);
    const label = element('label', null, 'account-adult');
    const input = element('input');
    input.id = 'account-adult';
    input.type = 'checkbox';
    input.required = true;
    const error = element('p', '', 'account-field-error');
    error.id = 'account-adult-error';
    input.setAttribute('aria-describedby', error.id);
    input.addEventListener('change', () => { error.textContent = ''; input.removeAttribute('aria-invalid'); summary.textContent = ''; result.textContent = ''; });
    label.append(input, element('span', 'I confirm I am 18 or older.'));
    form.append(label, error);
    fields.set('adult', { input, error });
    form.append(element('p', 'This is self-attestation, not identity verification. Final account eligibility and policy acceptance are not implemented.', 'profile-small'));
  }
  const submit = element('button', actionLabel, 'button primary');
  submit.type = 'submit';
  const example = element('button', 'Use fictional example', 'button outline');
  example.type = 'button';
  example.addEventListener('click', () => {
    for (const { input, error } of fields.values()) {
      if (!error) continue;
      error.textContent = '';
      input.removeAttribute('aria-invalid');
    }
    if (fields.has('username')) fields.get('username').input.value = 'DemoGuest';
    fields.get('email').input.value = 'guest@example.invalid';
    if (fields.has('password')) fields.get('password').input.value = 'fictional-demo-only';
    if (fields.has('confirm-password')) fields.get('confirm-password').input.value = 'fictional-demo-only';
    if (intentInputs.length) intentInputs[0].checked = true;
    intentError.textContent = '';
    // Adult confirmation remains unchecked; a sample must not accept it for you.
    summary.textContent = '';
    result.textContent = '';
    fields.get('email').input.focus();
  });
  const continueAccount = modeLink('account', 'Open your account');
  continueAccount.className = 'button outline';
  continueAccount.hidden = true;
  const continueRequested = element('a', 'Continue to your requested page', 'button primary');
  continueRequested.href = destination || '?page=account';
  continueRequested.hidden = true;
  continueRequested.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !onContinue) return;
    event.preventDefault(); onContinue(destination);
  });
  let busy = false;
  form.addEventListener('submit', async (event) => {
    if (busy) { event.preventDefault(); return; }
    event.preventDefault();
    continueAccount.hidden = true;
    continueRequested.hidden = true;
    const errors = [];
    for (const [key, field] of fields) {
      if (!field.error) continue;
      const { input, error } = field;
      error.textContent = '';
      input.removeAttribute('aria-invalid');
      if (key === 'adult' && !input.checked) error.textContent = 'Adult confirmation is required for this form preview.';
      else if (key !== 'adult' && !input.value.trim()) error.textContent = 'This field is required.';
      else if (key === 'email' && input.validity.typeMismatch) error.textContent = backendEnabled ? 'Enter a valid email address.' : 'Enter a valid email format, using fictional details.';
      else if (key === 'confirm-password' && input.value !== fields.get('password').input.value) error.textContent = 'Passwords must match in the preview.';
      if (error.textContent) { input.setAttribute('aria-invalid', 'true'); errors.push(input); }
    }
    const intent = intentInputs.find(input => input.checked)?.value;
    intentError.textContent = '';
    if (mode === 'register' && !['user', 'provider'].includes(intent)) {
      intentError.textContent = 'Choose User or Provider to get started.';
      errors.push(intentInputs[0]);
    }
    result.textContent = '';
    if (errors.length) {
      summary.textContent = 'Please check the highlighted fields.';
      errors[0].focus();
      return;
    }
    summary.textContent = '';
    const credentials = { email: fields.get('email')?.input.value.trim(), password: fields.get('password')?.input.value, username: fields.get('username')?.input.value.trim(), intent };
    for (const field of fields.values()) {
      if (!field.error) continue;
      if (field.input.type === 'checkbox') field.input.checked = false;
      else field.input.value = '';
    }
    for (const field of fields.values()) {
      if (!field.toggle) continue;
      field.input.type = 'password';
      field.toggle.textContent = field.input.id === 'account-password' ? 'Show password' : 'Show confirm password';
      field.toggle.setAttribute('aria-pressed', 'false');
    }
    for (const input of intentInputs) input.checked = false;
    if (backendEnabled) {
      busy = true;
      submit.disabled = true;
      submit.textContent = 'Please wait…';
      try {
        const auth = backendClient().auth;
        let response;
        if (mode === 'sign-in') response = await auth.signInWithPassword({ email: credentials.email, password: credentials.password });
        else if (mode === 'register') response = await auth.signUp({ email: credentials.email, password: credentials.password, options: { emailRedirectTo: authRedirect(), data: { requested_username: credentials.username, onboarding_intent: credentials.intent } } });
        else if (mode === 'confirm-account') response = await auth.resend({ type: 'signup', email: credentials.email, options: { emailRedirectTo: authRedirect() } });
        else if (mode === 'recover-account') response = await auth.resetPasswordForEmail(credentials.email, { redirectTo: authRedirect(true) });
        else response = await auth.updateUser({ password: credentials.password });
        if (response.error) throw response.error;
        if (!result.isConnected) return;
        continueRequested.hidden = !(mode === 'sign-in' && destination && response.data?.session);
        continueAccount.hidden = !(mode === 'sign-in' || (mode === 'register' && response.data.session));
        result.textContent = mode === 'sign-in'
          ? 'Signed in to the development backend. You can save your own private drafts. No publishing, subscription, or administrative access is granted.'
          : mode === 'register'
            ? (response.data.session ? 'Development account created and signed in. You can save private drafts; no paid or publishing access is granted.' : 'If registration is eligible, check your email for confirmation before signing in. No paid or publishing access is granted.')
            : mode === 'confirm-account'
              ? 'If this account is eligible for confirmation, a fresh link will be sent. Check your inbox and spam folder, then open the link in this same browser. Delivery and request limits are managed by the authentication provider.'
            : mode === 'recover-account'
              ? 'If this email is eligible for recovery, a recovery message will be sent. Check the inbox and open the link in this same browser.'
              : 'Your password was updated by the authentication provider.';
      } catch {
        if (result.isConnected) result.textContent = mode === 'sign-in' ? 'Unable to sign in. Check your details, email confirmation, and connection, then retry.' : 'The authentication request could not be completed. Check your details and connection, then retry.';
      } finally {
        busy = false;
        submit.disabled = false;
        submit.textContent = actionLabel;
        if (result.isConnected) result.focus();
      }
      return;
    }
    result.textContent = mode === 'confirm-account'
      ? 'Confirmation form preview checked. Authentication is not connected; no email was sent and no confirmation link was created. Demo fields have been cleared.'
      : mode === 'recover-account'
      ? 'Recovery form preview checked. Authentication is not connected; no email was sent and no reset link was created. Demo fields have been cleared.'
      : mode === 'register'
        ? 'Registration form preview checked. No account, role, session, or policy acceptance was created. Authentication is not connected. Demo fields have been cleared.'
        : 'Sign-in form preview checked. Authentication is not connected; you have not been signed in and no session or access was granted. Demo fields have been cleared.';
    result.focus();
  });
  form.append(submit);
  if (!backendEnabled) form.append(example);
  form.append(result, continueRequested, continueAccount);
  panel.append(tabs, form);
  if (!['recover-account', 'confirm-account', 'reset-password'].includes(mode)) {
    const recovery = modeLink('recover-account', 'Forgot your password?');
    recovery.className = 'account-recovery-link';
    panel.append(recovery);
  } else panel.append(modeLink('sign-in', 'Back to sign in'));
  if (['sign-in', 'register', 'recover-account'].includes(mode)) {
    const confirmation = modeLink('confirm-account', 'Need a new confirmation email?');
    confirmation.className = 'account-recovery-link';
    panel.append(confirmation);
  }
  if (mode === 'register') panel.append(modeLink('provider-setup', 'Explore provider setup'));
  layout.append(intro, panel);
  container.append(layout);
}
