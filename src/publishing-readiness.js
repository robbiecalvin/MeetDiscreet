import { loadOwnPublishingReadiness } from './backend/publishing-readiness.js';
import { listingCopyTime } from './listing-copy-fields.js';
function node(tag, text, className) {
  const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item;
}
export function publishingReadiness(owner, isCurrent) {
  const section = node('section', null, 'account-permissions publishing-readiness');
  section.append(node('h2', 'Your publishing readiness'), node('p', 'Account roles, editorial approval and publishing eligibility are separate. This check does not publish anything or start a plan.', 'profile-small'));
  const check = node('button', 'Check publishing readiness', 'button outline'); check.type = 'button';
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const content = node('div'); section.append(check, status, content);
  let busy = false;
  const current = () => section.isConnected && isCurrent();
  check.addEventListener('click', async () => {
    if (busy || !current()) return;
    busy = true; check.disabled = true; content.replaceChildren(); status.textContent = 'Checking current publishing readiness…';
    try {
      const value = await loadOwnPublishingReadiness(owner); if (!current()) return;
      const list = node('dl');
      for (const [label, text] of [
        ['User membership', value.user_member ? 'Assigned' : 'Not assigned'],
        ['Provider membership', value.provider_member ? 'Assigned' : 'Not assigned'],
        ['Publishing eligibility', value.publishing_eligible ? 'Current backend eligibility recorded' : 'No current backend eligibility recorded'],
        ['Editorially approved profile copies', String(value.approved_profile_copies)],
        ['Editorially approved Offering copies', String(value.approved_offering_copies)],
        ['Editorially approved Looking For copies', String(value.approved_looking_copies)],
        ['Public read endpoints', value.public_activation_connected ? 'Connected' : 'Not connected'],
        ['Pilot directory activation', value.public_activation_enabled ? 'Enabled; each selected entry still needs eligibility' : 'Disabled'],
      ]) list.append(node('dt', label), node('dd', text));
      content.append(list);
      if (value.publishing_eligible) content.append(listingCopyTime('Eligibility recorded until', value.eligibility_until));
      content.append(node('p', 'Approval counts include retained historical versions. They are not live listing counts or posting allowances. Publishing eligibility does not unlock subscriptions, messaging or bookings.', 'profile-small'));
      status.textContent = value.public_activation_enabled ? 'Readiness loaded. This does not prove that an individual profile or listing is public.' : 'Readiness loaded. The pilot directory is disabled; no entry is publicly exposed through these endpoints.';
    } catch { if (current()) status.textContent = 'Publishing readiness unavailable. Check sign-in, connection and database setup, then retry. No eligibility or approval is inferred.'; }
    finally { busy = false; if (current()) { check.disabled = false; status.focus(); } }
  });
  return section;
}
