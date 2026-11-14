import './staff-review.css';
import './pilot-eligibility.css';
import { backendEnabled } from './backend/client.js';
import { registerRouteLeave } from './route-leave.js';
import { listingCopyTime } from './listing-copy-fields.js';
import { loadPilotManagementAccess, loadPilotEligibility, changePilotEligibility } from './backend/pilot-eligibility.js';
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function renderPilotEligibility(container, navigate) {
  container.replaceChildren(); const root = node('section', null, 'provider-review pilot-eligibility');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account';
  back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('account'); });
  root.append(back, node('p', 'INVITED DEVELOPMENT PILOT', 'eyebrow'), node('h1', 'Pilot publishing eligibility.'), node('p', 'Manage temporary eligibility for selected invited Providers. Normal published prices remain unchanged.', 'offering-lead'), node('p', 'This does not send an invitation, publish a profile or listing, verify identity, start payments or grant subscriptions. Editorial approval and public visibility remain separate.', 'editor-notice'));
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const refresh = node('button', 'Check pilot management access', 'button outline'); refresh.type = 'button';
  const form = node('form', null, 'pilot-form'); form.hidden = true;
  const label = node('label', 'Invited Provider account ID'); label.htmlFor = 'pilot-target';
  const target = node('input'); target.id = label.htmlFor; target.type = 'text'; target.autocomplete = 'off'; target.maxLength = 36; target.required = true;
  const inspect = node('button', 'Inspect this account’s eligibility', 'button outline'); inspect.type = 'submit'; form.append(label, target, inspect);
  const detail = node('section', null, 'review-detail'); detail.hidden = true;
  root.append(refresh, status, form, detail); container.append(root);
  let busy = false, actor = null, generation = 0, inspected = null;
  const current = request => request === generation && root.parentNode === container;
  const reset = () => { inspected = null; detail.replaceChildren(); detail.hidden = true; };
  const controls = () => { refresh.disabled = busy; target.disabled = busy; inspect.disabled = busy; detail.inert = busy; };
  registerRouteLeave(root, () => { if (!busy) return true; status.textContent = 'Wait for the pilot eligibility operation to finish.'; return false; });
  if (!backendEnabled) { refresh.hidden = true; status.textContent = 'Pilot management requires the connected backend, Administrator role and explicit pilot-management capability.'; return; }
  async function access() {
    if (busy) return; busy = true; const request = ++generation; reset(); controls(); form.hidden = true; status.textContent = 'Checking pilot management access…';
    try { const value = await loadPilotManagementAccess(); if (!current(request)) return; actor = value.allowed ? value.actorId : null; form.hidden = !actor; status.textContent = actor ? 'Enter the exact account ID of a selected invited Provider. No account directory is loaded.' : 'This account does not have assigned pilot management access.'; }
    catch { if (current(request)) { actor = null; status.textContent = 'Pilot management access unavailable. Check sign-in and setup, then retry.'; } }
    finally { busy = false; if (current(request)) controls(); }
  }
  target.addEventListener('input', () => { generation++; reset(); });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy || !actor) return;
    const id = target.value.trim().toLowerCase();
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id)) { status.textContent = 'Enter a complete Provider account UUID.'; target.focus(); return; }
    busy = true; const request = ++generation; reset(); controls(); status.textContent = 'Checking this account’s eligibility…';
    try { const value = await loadPilotEligibility(actor, id); if (!current(request)) return; inspected = value; paint(value, request); status.textContent = 'Eligibility record loaded. Review the exact account ID and expiry before changing it.'; }
    catch { if (current(request)) status.textContent = 'Account eligibility unavailable. Check current access and setup, then inspect again.'; }
    finally { busy = false; if (current(request)) controls(); }
  });
  function paint(value, request) {
    detail.replaceChildren(); detail.hidden = false;
    detail.append(node('h2', 'Selected account'), node('p', value.owner_id, 'pilot-account-id'), node('p', value.provider_member ? 'Current User and Provider membership recorded.' : 'Current User and Provider membership not recorded. New pilot eligibility is unavailable.', 'profile-small'));
    const other = Boolean(value.revision && !value.pilot_record);
    detail.append(node('p', other ? 'Non-pilot eligibility exists. It cannot be modified here.' : value.revision ? value.revoked_at ? 'Pilot eligibility was revoked.' : 'Pilot eligibility record exists; check its expiry below.' : 'No publishing eligibility record exists.', 'profile-small'));
    if (value.valid_until) detail.append(listingCopyTime('Recorded expiry', value.valid_until));
    if (value.revoked_at) detail.append(listingCopyTime('Revoked', value.revoked_at));
    if (other || value.owner_id === actor) { if (value.owner_id === actor) detail.append(node('p', 'Self assignment and self revocation are unavailable.', 'profile-small')); return; }
    const endLabel = node('label', 'Pilot expiry (UTC)'); endLabel.htmlFor = 'pilot-until';
    const until = node('input'); until.id = endLabel.htmlFor; until.type = 'datetime-local'; until.step = '60';
    const invitedLabel = node('label', null, 'pilot-invited'); const invited = node('input'); invited.type = 'checkbox'; invitedLabel.append(invited, document.createTextNode('I confirm this Provider was selected and invited to the no-charge development pilot.'));
    const grant = node('button', value.revision ? 'Set new pilot expiry' : 'Grant temporary pilot eligibility', 'button primary'); grant.type = 'button'; grant.disabled = !value.provider_member;
    const revoke = node('button', 'Revoke pilot eligibility', 'button outline'); revoke.type = 'button'; revoke.hidden = !value.pilot_record || Boolean(value.revoked_at);
    detail.append(endLabel, until, invitedLabel, grant, revoke);
    async function change(revoking) {
      if (busy || !current(request) || inspected !== value) return;
      let expiry = null;
      if (!revoking) {
        if (!invited.checked) { status.textContent = 'Confirm this Provider was selected and invited.'; invited.focus(); return; }
        const parsed = until.value ? new Date(`${until.value}Z`) : null;
        if (!parsed || !Number.isFinite(parsed.getTime()) || parsed.getTime() <= Date.now()) { status.textContent = 'Choose an explicit future expiry in UTC.'; until.focus(); return; }
        expiry = parsed.toISOString();
      }
      if (!window.confirm(`${revoking ? 'Revoke pilot eligibility' : `Set no-charge pilot eligibility until ${expiry}`} for account ${value.owner_id}? This does not publish anything or change normal prices.`)) return;
      busy = true; controls(); status.textContent = revoking ? 'Revoking pilot eligibility…' : 'Recording pilot eligibility…';
      try { await changePilotEligibility(actor, value.owner_id, value.revision, expiry, revoking); if (current(request)) { reset(); status.textContent = 'Pilot eligibility change recorded. Inspect again to confirm the current state. Nothing was published.'; } }
      catch { if (current(request)) { reset(); status.textContent = 'Eligibility change could not be confirmed. Inspect the account again before retrying.'; } }
      finally { busy = false; if (current(request)) controls(); }
    }
    grant.addEventListener('click', () => change(false)); revoke.addEventListener('click', () => change(true));
  }
  refresh.addEventListener('click', access); access();
}
