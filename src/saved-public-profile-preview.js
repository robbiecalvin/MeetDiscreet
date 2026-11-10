import { loadSavedPublicProfilePreview } from './backend/public-profile-preview.js';
function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  if (className) item.className = className;
  return item;
}
export function savedPublicProfilePreview(ownerId, current, editLink, onLoaded = () => {}) {
  const section = node('section', null, 'saved-public-profile-preview account-permissions');
  section.append(node('h2', 'Review your saved public fields'), node('p', 'Private preview of your saved profile draft. Unsaved editor changes are not included. Nothing becomes public here.', 'profile-small'));
  const load = node('button', 'Review saved public profile', 'button outline'); load.type = 'button';
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const content = node('div', null, 'saved-public-profile-content');
  section.append(load, status, content, editLink);
  let busy = false;
  load.addEventListener('click', async () => {
    if (busy) return;
    onLoaded(null);
    busy = true; load.disabled = true; content.replaceChildren(); status.textContent = 'Loading saved public fields…';
    try {
      const value = await loadSavedPublicProfilePreview(ownerId);
      if (!current()) return;
      if (!value) { status.textContent = 'No saved profile draft. Save a profile draft before reviewing its public fields.'; return; }
      onLoaded(value);
      const text = key => typeof value[key] === 'string' ? value[key].trim() : '';
      const ageValid = Number.isSafeInteger(value.adult_age) && value.adult_age >= 18;
      const photoValid = Number.isInteger(value.photo_index) && value.photo_index >= 0 && value.photo_index <= 11;
      const card = node('article', null, 'profile-draft-card');
      const identity = node('div', null, 'profile-draft-identity');
      if (photoValid) {
        const photo = node('div', null, `portrait portrait-${value.photo_index} profile-draft-photo`);
        photo.setAttribute('role', 'img'); photo.setAttribute('aria-label', 'Selected fictional demo portrait; no uploaded photo');
        identity.append(photo);
      }
      const details = node('div');
      details.append(node('p', 'SAVED PRIVATE PREVIEW', 'eyebrow'), node('h3', text('display_name') || 'Display name missing'), node('p', text('username') ? `@${text('username')}` : 'Username missing'), node('p', ageValid ? `Age ${value.adult_age}` : 'Adult age missing'), node('p', [text('area'), text('city')].filter(Boolean).join(', ') || 'City missing'));
      if (text('tagline')) details.append(node('p', text('tagline'), 'profile-tagline'));
      identity.append(details); card.append(identity); content.append(card);
      const missing = [];
      if (!text('display_name')) missing.push('Display name');
      if (!text('username')) missing.push('Username');
      if (!ageValid) missing.push('Adult age');
      if (!text('city')) missing.push('City');
      if (!photoValid) missing.push('Main photo selection');
      if (missing.length) {
        content.append(node('h3', 'Fields to revisit'));
        const list = node('ul'); for (const label of missing) list.append(node('li', label)); content.append(list);
      }
      content.append(node('p', 'Biography and interests are member fields and are not loaded here. Photos are demo selections; uploads are not connected. Username availability, identity, publishing approval and any required plan remain separate checks.', 'profile-small'));
      status.textContent = 'Saved public fields loaded. This preview does not approve or publish a profile.';
      load.textContent = 'Refresh saved public profile';
    } catch {
      if (current()) status.textContent = 'Saved public preview unavailable. Check sign-in, connection and backend setup, then retry.';
    } finally { busy = false; if (current()) { load.disabled = false; status.focus(); } }
  });
  return section;
}
