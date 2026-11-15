import { bookingPilotAccess, inspectBookingPair, setBookingPair } from './backend/booking-requests.js';
import './marketplace-services.css';
import { backendEnabled } from './backend/client.js';
import { registerRouteLeave } from './route-leave.js';
import { listingCopyTime } from './listing-copy-fields.js';
import { messagingPilotAccess, inspectMessagingPair, setMessagingPair } from './backend/marketplace-messages.js';
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function renderMessagingPilot(container, navigate) { return renderPairPilot(container, navigate, false); }
export function renderBookingRequestPilot(container, navigate) { return renderPairPilot(container, navigate, true); }
function renderPairPilot(container, navigate, booking) {
  container.replaceChildren(); const root = node('section', null, 'marketplace-service messaging-pilot');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account'; back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('account'); });
  root.append(back, node('p', booking ? 'INVITED REQUEST-ONLY PILOT' : 'INVITED TEXT PILOT', 'eyebrow'), node('h1', booking ? 'Booking request access.' : 'Messaging access.'), node('p', booking ? 'Grant temporary access to exchange booking requests and revisions. This does not confirm or reserve a booking, charge a deposit or change prices.' : 'Grant temporary no-charge text access to an explicit invited User/Provider pair. Publishing eligibility alone grants no communication access; normal subscription prices remain unchanged.', 'offering-lead'));
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const refresh = node('button', booking ? 'Check request-pilot permission' : 'Check messaging pilot permission', 'button outline'); refresh.type = 'button';
  const form = node('form', null, 'service-form'); form.hidden = true;
  const ids = {};
  for (const [key, labelText] of [['member', 'Invited User account ID'], ['provider', 'Invited Provider account ID']]) { const label = node('label', labelText); const input = node('input'); input.id = `message-pilot-${key}`; input.required = true; input.maxLength = 36; input.autocomplete = 'off'; label.htmlFor = input.id; form.append(label, input); ids[key] = input; }
  const inspect = node('button', 'Inspect this invited pair', 'button outline'); inspect.type = 'submit'; form.append(inspect);
  const detail = node('section', null, 'service-panel'); detail.hidden = true; root.append(refresh, status, form, detail); container.append(root);
  let actor = null, busy = false, generation = 0;
  const current = request => request === generation && root.parentNode === container;
  const controls = () => { refresh.disabled = busy; form.inert = busy; detail.inert = busy; };
  registerRouteLeave(root, () => { if (!busy) return true; status.textContent = 'Wait for the pair-access operation to finish.'; return false; });
  for (const input of Object.values(ids)) input.addEventListener('input', () => { generation++; detail.replaceChildren(); detail.hidden = true; });
  async function access() {
    if (busy) return; busy = true; const request = ++generation; controls(); form.hidden = true; detail.replaceChildren(); detail.hidden = true; status.textContent = booking ? 'Checking separate request-pilot permission…' : 'Checking separate messaging pilot permission…';
    try { const value = await (booking ? bookingPilotAccess() : messagingPilotAccess()); if (current(request)) { actor = value.allowed ? value.actorId : null; form.hidden = !actor; status.textContent = actor ? 'Inspect an explicit invited pair before choosing an expiry.' : booking ? 'Administrator and explicit booking-pilot permission are required.' : 'Administrator and explicit messaging-pilot permission are required.'; } }
    catch { if (current(request)) { actor = null; status.textContent = booking ? 'Request-pilot permission unavailable. Check sign-in and setup.' : 'Messaging pilot permission unavailable. Check sign-in and setup.'; } }
    finally { busy = false; if (current(request)) controls(); }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy || !actor) return;
    const member = ids.member.value.trim().toLowerCase(), provider = ids.provider.value.trim().toLowerCase();
    const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
    if (!uuid.test(member) || !uuid.test(provider) || member === provider || [member, provider].includes(actor)) { status.textContent = 'Enter two distinct invited account UUIDs, separate from your Administrator account.'; return; }
    busy = true; const request = ++generation; controls(); detail.replaceChildren(); detail.hidden = true; status.textContent = 'Inspecting pair access…';
    try {
      const value = await (booking ? inspectBookingPair(actor, member, provider) : inspectMessagingPair(actor, member, provider)); if (!current(request)) return;
      if (!value || value.member_id !== member || value.provider_id !== provider) throw new Error('Pair changed.');
      detail.append(node('h2', 'Inspected pair'), node('p', `User ${member}`, 'service-identifier'), node('p', `Provider ${provider}`, 'service-identifier'), node('p', value.members_valid ? 'Current pair membership is eligible.' : 'Current pair membership is incomplete; granting access is unavailable.', 'profile-small'));
      if (value.valid_until) detail.append(listingCopyTime('Access expiry', value.valid_until));
      if (value.revoked_at) detail.append(listingCopyTime('Revoked', value.revoked_at));
      const label = node('label', booking ? 'Request access expiry (UTC)' : 'Text access expiry (UTC)'); const until = node('input'); until.type = 'datetime-local'; until.id = 'message-pilot-until'; label.htmlFor = until.id;
      const accepted = node('input'); accepted.type = 'checkbox'; const consent = node('label', null, 'service-check'); consent.append(accepted, document.createTextNode(booking ? 'Both participants were selected and invited to the no-charge request-only pilot.' : 'Both participants were selected and invited to this no-charge text pilot.'));
      const grant = node('button', booking ? 'Grant or renew request-only access' : 'Grant or renew this pair’s text access', 'button primary'); grant.type = 'button'; grant.disabled = !value.members_valid;
      const revoke = node('button', booking ? 'Revoke new requests/revisions' : 'Revoke this pair’s text access', 'button outline'); revoke.type = 'button'; revoke.hidden = !value.revision || Boolean(value.revoked_at);
      detail.append(label, until, consent, grant, revoke); detail.hidden = false; status.textContent = 'Pair inspected. No duration is prefilled and no access has changed.';
      async function change(revoking) {
        if (busy || !current(request)) return;
        let end = null;
        if (!revoking) { const date = until.value ? new Date(`${until.value}Z`) : null; if (!accepted.checked || !date || !Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) { status.textContent = 'Confirm both invitations and choose an explicit future UTC expiry.'; return; } end = date.toISOString(); }
        if (!window.confirm(`${revoking ? (booking ? 'Revoke new booking requests/revisions' : 'Revoke new text sending') : `Grant no-charge ${booking ? 'request-only' : 'text'} pair access until ${end}`} for User ${member} and Provider ${provider}? Existing history is retained. No subscription is purchased.`)) return;
        busy = true; controls(); status.textContent = 'Recording pair access…';
        try { await (booking ? setBookingPair(actor, member, provider, value.revision, end, revoking) : setMessagingPair(actor, member, provider, value.revision, end, revoking)); if (current(request)) { detail.replaceChildren(); detail.hidden = true; status.textContent = 'Pair access recorded. Inspect again to confirm current status. No invitation or message was sent.'; } }
        catch { if (current(request)) { detail.replaceChildren(); detail.hidden = true; status.textContent = 'Pair access could not be confirmed. Inspect again before retrying.'; } }
        finally { busy = false; if (current(request)) controls(); }
      }
      grant.addEventListener('click', () => change(false)); revoke.addEventListener('click', () => change(true));
    } catch { if (current(request)) status.textContent = 'Pair access unavailable. Recheck current permission and database setup.'; }
    finally { busy = false; if (current(request)) controls(); }
  });
  refresh.addEventListener('click', access);
  if (!backendEnabled) { refresh.hidden = true; status.textContent = 'Pilot pair controls require the connected backend and separately assigned Administrator capability.'; } else access();
}
