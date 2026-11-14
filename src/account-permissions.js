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
  section.append(title, copy, status, retry, review, profileReview, listingReview);
  let busy = false;
  async function check() {
    if (busy) return;
    busy = true; retry.disabled = true; review.hidden = true; profileReview.hidden = true; listingReview.hidden = true; status.textContent = 'Checking assigned roles…';
    try {
      const roles = await loadOwnAccountRoles();
      if (!current()) return;
      if (roles.some(role => ['moderator', 'admin'].includes(role))) {
        const [intake, profiles, listings] = await Promise.allSettled([loadProviderReviewAccess(),loadProfileReviewAccess(),loadListingReviewAccess()]);
        if (current()) { review.hidden = intake.status !== 'fulfilled' || !intake.value.allowed; profileReview.hidden = profiles.status !== 'fulfilled' || !profiles.value.allowed; listingReview.hidden = listings.status !== 'fulfilled' || !listings.value.allowed; }
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
