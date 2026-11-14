import './pilot-directory.css';
import { backendEnabled } from './backend/client.js';
import { loadPilotDirectoryStatus, loadPilotDirectoryPage } from './backend/pilot-directory.js';
function node(tag, text, className) { const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item; }
export function renderPilotDirectory(container, onBack) {
  container.replaceChildren(); const root = node('section', null, 'pilot-directory');
  const back = node('a', '← Back to discovery', 'profile-back'); back.href = './';
  back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !onBack) return; event.preventDefault(); onBack(); });
  root.append(back, node('p', 'INVITED DEVELOPMENT PILOT', 'eyebrow'), node('h1', 'Meet the pilot community.'), node('p', 'A text-only directory of approved, owner-selected pilot profiles and Offering listings. Photos, online status, messaging and booking are not connected here.', 'offering-lead'));
  const tabs = node('div', null, 'editor-actions'); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Pilot directory views');
  const profiles = node('button', 'Profiles', 'button outline'); profiles.type = 'button';
  const offerings = node('button', 'Offering listings', 'button outline'); offerings.type = 'button'; tabs.append(profiles, offerings);
  const refresh = node('button', 'Refresh pilot directory', 'button quiet'); refresh.type = 'button';
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const list = node('div', null, 'pilot-directory-grid');
  const pages = node('div', null, 'editor-actions'); pages.hidden = true;
  const previous = node('button', 'Previous pilot page', 'button quiet'); previous.type = 'button';
  const next = node('button', 'Next pilot page', 'button outline'); next.type = 'button'; pages.append(previous, next);
  root.append(tabs, refresh, status, list, pages); container.append(root);
  let busy = false, kind = 'profiles', page = 0, cursors = [null], rows = [], hasNext = false, generation = 0;
  const current = request => generation === request && root.parentNode === container;
  function controls() { profiles.disabled = busy; offerings.disabled = busy; refresh.disabled = busy; previous.disabled = busy || page === 0; next.disabled = busy || !hasNext; profiles.setAttribute('aria-pressed', String(kind === 'profiles')); offerings.setAttribute('aria-pressed', String(kind === 'offerings')); }
  function field(value) { return typeof value === 'string' ? value : ''; }
  async function load(reset = false) {
    if (busy) return; busy = true; const request = ++generation;
    if (reset) { page = 0; cursors = [null]; }
    controls(); list.replaceChildren(); pages.hidden = true; status.textContent = 'Checking pilot directory…';
    try {
      if (!backendEnabled) { status.textContent = 'The connected pilot directory is unavailable in this backend-disabled preview. Fictional discovery remains separate.'; return; }
      const enabled = await loadPilotDirectoryStatus(); if (!current(request)) return;
      if (!enabled) { status.textContent = 'The pilot directory is not activated. No public pilot profiles or listings are loaded.'; return; }
      const values = await loadPilotDirectoryPage(kind, cursors[page]); if (!current(request)) return;
      hasNext = values.length > 20; rows = values.slice(0, 20);
      for (const row of rows) {
        const fields = row.public_fields; const card = node('article', null, 'pilot-directory-card');
        if (kind === 'profiles') {
          card.append(node('p', 'PILOT PROFILE', 'eyebrow'), node('h2', field(fields.display_name) || field(fields.username) || 'Pilot profile'));
          const identity = [field(fields.username), Number.isInteger(fields.adult_age) && fields.adult_age >= 18 ? String(fields.adult_age) : ''].filter(Boolean).join(' · ');
          if (identity) card.append(node('p', identity, 'pilot-directory-identity'));
          card.append(node('p', [field(fields.area), field(fields.city)].filter(Boolean).join(' · '), 'profile-small'), node('p', field(fields.tagline), 'pilot-directory-copy'));
        } else {
          card.append(node('p', 'PILOT OFFERING', 'eyebrow'), node('h2', field(fields.title) || 'Offering listing'), node('p', [field(fields.area), field(fields.city), field(fields.activity)].filter(Boolean).join(' · '), 'profile-small'), node('p', field(fields.description), 'pilot-directory-copy'));
        }
        list.append(card);
      }
      status.textContent = rows.length ? `${rows.length} pilot ${kind === 'profiles' ? 'profiles' : 'Offering listings'} on this page.` : 'No eligible owner-selected entries on this page.';
      pages.hidden = !rows.length && page === 0;
    } catch { if (current(request)) status.textContent = 'Pilot directory unavailable. Check connection and database setup, then refresh. No fictional entries are substituted.'; }
    finally { busy = false; if (current(request)) controls(); }
  }
  profiles.addEventListener('click', () => { if (busy) return; kind = 'profiles'; load(true); });
  offerings.addEventListener('click', () => { if (busy) return; kind = 'offerings'; load(true); });
  refresh.addEventListener('click', () => load(true));
  previous.addEventListener('click', () => { if (!busy && page > 0) { page--; load(); } });
  next.addEventListener('click', () => { if (!busy && hasNext && rows.length) { cursors[page + 1] = rows.at(-1).id; page++; load(); } });
  load(true);
}
