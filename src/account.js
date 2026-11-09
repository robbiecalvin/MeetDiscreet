const modes = {
  'sign-in': { title: 'Good to see you again.', intro: 'A familiar face. A new plan.', action: 'Check sign-in preview' },
  register: { title: 'A new connection starts here.', intro: 'A little introduction, and room for something new.', action: 'Check registration preview' },
  'recover-account': { title: 'Let’s find your way back.', intro: 'A preview of the account-recovery screen.', action: 'Check recovery preview' },
};
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function renderAccount(container, mode, onMode, onBack) {
  container.replaceChildren();
  const config = modes[mode];
  const back = element('a', '← Back to discovery', 'profile-back');
  back.href = './';
  back.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onBack();
  });
  container.append(back);
  const layout = element('div', null, 'account-layout');
  const intro = element('div', null, 'account-intro');
  intro.append(element('p', 'YOUR NEXT SHARED MOMENT', 'eyebrow'), element('h1', config.title), element('p', config.intro, 'offering-lead'), element('p', 'Account screen preview. Use fictional details only. Authentication is not connected; nothing is sent or saved.', 'account-preview-note'));
  const panel = element('div', null, 'account-panel');
  const tabs = element('nav', null, 'account-tabs');
  tabs.setAttribute('aria-label', 'Account screens');
  function modeLink(page, label) {
    const link = element('a', label);
    link.href = `?page=${page}`;
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
  form.autocomplete = 'off';
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
    input.autocomplete = 'off';
    input.maxLength = type === 'email' ? 254 : 128;
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
  addField('email', 'Email', 'email');
  if (mode !== 'recover-account') addField('password', 'Password', 'password');
  if (mode === 'register') {
    addField('confirm-password', 'Confirm password', 'password');
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
  const submit = element('button', config.action, 'button primary');
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
    // Adult confirmation remains unchecked; a sample must not accept it for you.
    summary.textContent = '';
    result.textContent = '';
    fields.get('email').input.focus();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const errors = [];
    for (const [key, field] of fields) {
      if (!field.error) continue;
      const { input, error } = field;
      error.textContent = '';
      input.removeAttribute('aria-invalid');
      if (key === 'adult' && !input.checked) error.textContent = 'Adult confirmation is required for this form preview.';
      else if (key !== 'adult' && !input.value.trim()) error.textContent = 'This field is required.';
      else if (key === 'email' && input.validity.typeMismatch) error.textContent = 'Enter a valid email format, using fictional details.';
      else if (key === 'confirm-password' && input.value !== fields.get('password').input.value) error.textContent = 'Passwords must match in the preview.';
      if (error.textContent) { input.setAttribute('aria-invalid', 'true'); errors.push(input); }
    }
    result.textContent = '';
    if (errors.length) {
      summary.textContent = 'Please check the highlighted fields.';
      errors[0].focus();
      return;
    }
    summary.textContent = '';
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
    result.textContent = mode === 'recover-account'
      ? 'Recovery form preview checked. Authentication is not connected; no email was sent and no reset link was created. Demo fields have been cleared.'
      : mode === 'register'
        ? 'Registration form preview checked. No account, role, session, or policy acceptance was created. Authentication is not connected. Demo fields have been cleared.'
        : 'Sign-in form preview checked. Authentication is not connected; you have not been signed in and no session or access was granted. Demo fields have been cleared.';
    result.focus();
  });
  form.append(submit, example, result);
  panel.append(tabs, form);
  if (mode !== 'recover-account') {
    const recovery = modeLink('recover-account', 'Forgot your password?');
    recovery.className = 'account-recovery-link';
    panel.append(recovery);
  } else panel.append(modeLink('sign-in', 'Back to sign in'));
  if (mode === 'register') panel.append(modeLink('edit-profile', 'Try the companion profile editor'));
  layout.append(intro, panel);
  container.append(layout);
}
