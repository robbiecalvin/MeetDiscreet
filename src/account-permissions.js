import { bookingPilotAccess } from './backend/booking-requests.js';
import { messagingPilotAccess } from './backend/marketplace-messages.js';
import { reportReviewAccess } from './backend/marketplace-reports.js';
import { loadPilotManagementAccess } from './backend/pilot-eligibility.js';
import { loadListingReviewAccess } from './backend/listing-review.js';
import { loadProfileReviewAccess } from './backend/profile-review.js';
import { loadProviderReviewAccess } from './backend/provider-review.js';
import { loadOwnAccountRoles } from './backend/permissions.js';
const labels = { user: 'User', provider: 'Provider', moderator: 'Moderator', admin: 'Administrator' };
export function accountPermissions(current, navigate = null) {
  const section = document.createElement('section'); section.className = 'account-permissions';
  const title = document.createElement('h2'); title.textContent = 'Account permissions';
  const status = document.createElement('p'); status.setAttribute('role', 'status'); status.className = 'profile-small';
  status.dataset.accountPermissions = '';
  const copy = document.createElement('p'); copy.className = 'profile-small'; copy.textContent = 'Roles are assigned separately from your starting preference. Publishing and paid access still require their own checks.';
  const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'button quiet'; retry.textContent = 'Refresh account permissions';
  const review = document.createElement('a'); review.href = '?page=provider-review'; review.className = 'button outline'; review.textContent = 'Open provider review queue'; review.hidden = true;
  review.addEventListener('click', event => { if (!navigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('provider-review'); });
  const profileReview = document.createElement('a'); profileReview.href = '?page=profile-review'; profileReview.className = 'button outline'; profileReview.textContent = 'Open profile submission review'; profileReview.hidden = true;
  profileReview.addEventListener('click',event=>{if(!navigate||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate('profile-review');});
  const listingReview = document.createElement('a'); listingReview.href = '?page=listing-review'; listingReview.className = 'button outline'; listingReview.textContent = 'Open listing submission review'; listingReview.hidden = true;
  listingReview.addEventListener('click', event => { if (!navigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('listing-review'); });
  const pilot = document.createElement('a'); pilot.href = '?page=pilot-eligibility'; pilot.className = 'button outline'; pilot.textContent = 'Manage invited publishing pilot'; pilot.hidden = true;
  pilot.addEventListener('click', event => { if (!navigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('pilot-eligibility'); });
  const messagingPilot = document.createElement('a'); messagingPilot.href = '?page=messaging-pilot'; messagingPilot.className = 'button outline'; messagingPilot.textContent = 'Manage invited text pairs'; messagingPilot.hidden = true;
  messagingPilot.addEventListener('click', event => { if (!navigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('messaging-pilot'); });
  const reports = document.createElement('a'); reports.href = '?page=report-review'; reports.className = 'button outline'; reports.textContent = 'Review pilot reports'; reports.hidden = true;
  reports.addEventListener('click', event => { if (!navigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('report-review'); });
  const bookings = document.createElement('a'); bookings.href = '?page=booking-request-pilot'; bookings.className = 'button outline'; bookings.textContent = 'Manage request-only booking pairs'; bookings.hidden = true;
  bookings.addEventListener('click', event => { if (!navigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate('booking-request-pilot'); });
  section.append(title, copy, status, retry, review, profileReview, listingReview, pilot, messagingPilot, reports, bookings);
  let busy = false;
  async function check() {
    if (busy) return;
    busy = true; retry.disabled = true; review.hidden = true; profileReview.hidden = true; listingReview.hidden = true; pilot.hidden = true; messagingPilot.hidden = true; reports.hidden = true; bookings.hidden = true; status.textContent = 'Checking assigned roles…';
    try {
      const roles = await loadOwnAccountRoles();
      if (!current()) return;
      if (roles.some(role => ['moderator', 'admin'].includes(role))) {
        const [intake, profiles, listings, pilotAccess, textAccess, reportAccess, bookingAccess] = await Promise.allSettled([loadProviderReviewAccess(),loadProfileReviewAccess(),loadListingReviewAccess(),loadPilotManagementAccess(),messagingPilotAccess(),reportReviewAccess(),bookingPilotAccess()]);
        if (current()) { review.hidden = intake.status !== 'fulfilled' || !intake.value.allowed; profileReview.hidden = profiles.status !== 'fulfilled' || !profiles.value.allowed; listingReview.hidden = listings.status !== 'fulfilled' || !listings.value.allowed; pilot.hidden = pilotAccess.status !== 'fulfilled' || !pilotAccess.value.allowed; messagingPilot.hidden = textAccess.status !== 'fulfilled' || !textAccess.value.allowed; reports.hidden = reportAccess.status !== 'fulfilled' || !reportAccess.value.allowed; bookings.hidden = bookingAccess.status !== 'fulfilled' || !bookingAccess.value.allowed; }
        if (!current()) return;
      }
      status.textContent = `${roles.length ? `Assigned roles: ${roles.map(role => labels[role]).join(', ')}.` : 'No account roles assigned.'} Provider role: ${roles.includes('provider') ? 'Assigned' : 'Not assigned'}.`;
    } catch {
      if (current()) status.textContent = 'Unable to verify account permissions. Check your connection and setup, then retry. Publishing remains unavailable.';
    } finally { busy = false; retry.disabled = false; }
  }
  retry.addEventListener('click', check);
  check();
  return section;
}
