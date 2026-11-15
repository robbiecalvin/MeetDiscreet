function node(tag, text) { const item = document.createElement(tag); if (text) item.textContent = text; return item; }
export function bookingRequestForm(initial, pairs, onSubmit, actionLabel) {
  const form = node('form'); form.className = 'service-form request-form'; form.dataset.dirty = 'false';
  const inputs = {};
  function add(key, labelText, type = 'text', max = null) {
    const label = node('label', labelText); const input = node(type === 'textarea' ? 'textarea' : 'input');
    input.id = `request-${key}`; label.htmlFor = input.id; if (type !== 'textarea') input.type = type; else input.rows = 4;
    if (max) input.maxLength = max; input.required = key !== 'notes'; input.autocomplete = 'off'; inputs[key] = input; form.append(label, input); return input;
  }
  if (pairs) {
    const label = node('label', 'Invited Provider pair'); const select = node('select'); select.id = 'request-pair'; label.htmlFor = select.id; select.required = true;
    const placeholder = node('option', 'Choose the invited Provider pair'); placeholder.value = ''; select.append(placeholder);
    for (const pair of pairs) { const option = node('option', `Invited Provider · pair ${pair.id.slice(0, 8)}`); option.value = pair.id; select.append(option); } inputs.pair = select; form.append(label, select);
  }
  add('activity', 'Activity or plan', 'text', 120).value = initial?.activity || '';
  add('start', 'Starts (UTC)', 'datetime-local'); add('end', 'Ends (UTC)', 'datetime-local');
  for (const key of ['start', 'end']) { const stamp = initial?.[`${key}_at`]; const date = stamp ? new Date(stamp) : null; if (date && Number.isFinite(date.getTime())) inputs[key].value = date.toISOString().slice(0, 16); }
  add('zone', 'Schedule display time zone (IANA name)', 'text', 100).value = initial?.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const hint = node('p', 'Enter the start and end in UTC. The explicit time zone controls how the schedule is displayed; it does not change the UTC instants. No time is reserved.'); hint.className = 'profile-small'; form.append(hint);
  add('area', 'Proposed meeting area', 'text', 160).value = initial?.meeting_area || '';
  add('notes', 'Notes (optional)', 'textarea', 1000).value = initial?.notes || '';
  const submit = node('button', actionLabel); submit.type = 'submit'; submit.className = 'button primary';
  const status = node('p'); status.className = 'profile-small'; status.setAttribute('role', 'status'); form.append(submit, status);
  const snapshot = () => JSON.stringify(Object.values(inputs).map(input => input.value)); let baseline = snapshot();
  form.addEventListener('input', () => { form.dataset.dirty = String(snapshot() !== baseline); }); form.addEventListener('change', () => { form.dataset.dirty = String(snapshot() !== baseline); });
  form.addEventListener('submit', event => {
    event.preventDefault(); const start = new Date(`${inputs.start.value}Z`), end = new Date(`${inputs.end.value}Z`);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start.getTime() <= Date.now() || end <= start) { status.textContent = 'Choose valid future UTC instants, with the end after the start.'; return; }
    try { new Intl.DateTimeFormat(undefined, { timeZone: inputs.zone.value.trim() }); } catch { status.textContent = 'Enter a supported IANA time-zone name, such as America/Vancouver or UTC.'; return; }
    onSubmit({ activity: inputs.activity.value.trim(), start: start.toISOString(), end: end.toISOString(), zone: inputs.zone.value.trim(), area: inputs.area.value.trim(), notes: inputs.notes.value.trim() }, inputs.pair?.value, { form, status, submit, clean() { baseline = snapshot(); form.dataset.dirty = 'false'; } });
  });
  return form;
}
