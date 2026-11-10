import { renderProfileReview } from './profile-review.js';
import { renderPhotoPreview, clearPhotoPreviewState } from './photo-preview.js';
import { renderMessagesPreview } from './messages-preview.js';
import { renderDraftBackup } from './draft-backup.js';
import { renderProviderReview } from './provider-review.js';
import { renderProviderApplication, clearProviderApplicationState } from './provider-application.js';
import { backendEnabled, backendClient, processAuthCallback, signOutCurrentSession } from './backend/client.js';
import './styles.css';
import { renderBookingDraft, clearBookingDraftState } from './booking-draft.js';
import { renderUserProfileEditor, clearUserProfileState } from './user-profile-editor.js';
import { renderUserSetup } from './user-setup.js';
import { renderProviderSetup } from './provider-setup.js';
import { renderAvailability, clearAvailabilityState } from './availability.js';
import { renderListingLibrary } from './listing-library.js';
import { renderAccountSecurity } from './account-security.js';
import { renderAccountOverview } from './account-overview.js';
import { providers, ads } from './data.js';
import { renderProfile } from './profile.js';
import { renderLookingFor } from './looking-for.js';
import { renderOffering } from './offering.js';
import { renderHowItWorks } from './how-it-works.js';
import { renderListingEditor, clearListingDraftState } from './listing-editor.js';
import { renderGuidelines } from './guidelines.js';
import { renderHelp } from './help.js';
import { renderAccount } from './account.js';
import { renderProfileEditor, clearProfileDraftState } from './profile-editor.js';
import { renderExperiences, clearExperienceDraftState } from './experiences.js';
import { referencePrices, formatReferencePrice } from './pricing.js';

const $ = (selector) => document.querySelector(selector);
const gate = $('#age-gate');
const app = $('#app');
const detail = $('#detail-dialog');
const filters = $('#filters-dialog');
const confirmationKey = 'meetdiscreet.age-confirmed.v1';
const confirmationDuration = 30 * 24 * 60 * 60 * 1000;
const state = { view: 'grid', category: 'offering', city: 'Vancouver', query: '', online: false, activity: 'all' };
let returnTo = 'https://www.google.com/';
try {
  const referrer = new URL(document.referrer);
  if (['http:', 'https:'].includes(referrer.protocol) && referrer.origin !== location.origin) returnTo = referrer.href;
} catch { /* Direct visits have no referrer; use the agreed fallback. */ }

let hasAgeConfirmation = false;
let policyReturnUrl = null;
let helpReturnUrl = null;
function enter() {
  hasAgeConfirmation = true;
  if (gate.open) gate.close();
  app.hidden = false;
  app.inert = false;
  $('#main').focus({ preventScroll: true });
}

let validConfirmation = false;
try {
  const confirmedAt = Number(localStorage.getItem(confirmationKey));
  validConfirmation = confirmedAt > 0 && confirmedAt <= Date.now() && Date.now() - confirmedAt < confirmationDuration;
} catch { /* Storage can be unavailable; the gate still works for this visit. */ }
if (validConfirmation) enter();
else if (!['guidelines', 'help'].includes(new URL(location.href).searchParams.get('page'))) gate.showModal();
gate.addEventListener('cancel', (event) => event.preventDefault());
$('#confirm-age').addEventListener('click', () => {
  try { localStorage.setItem(confirmationKey, String(Date.now())); }
  catch { $('#storage-note').textContent = 'Browser storage is unavailable. Confirmation will apply to this visit only.'; }
  enter();
  renderRoute();
  if ($('#storage-note').textContent) $('#result-count').textContent = 'Confirmed for this visit; browser storage is unavailable.';
});
$('#exit').addEventListener('click', () => location.replace(returnTo));

function portrait(provider, className = '') {
  const image = document.createElement('div');
  image.className = `portrait portrait-${provider.photo} ${className}`;
  image.setAttribute('role', 'img');
  image.setAttribute('aria-label', `Fictional portrait of ${provider.name}`);
  return image;
}
function text(tag, content, className) {
  const element = document.createElement(tag);
  element.textContent = content;
  if (className) element.className = className;
  return element;
}
function openDetail(title, copy, provider) {
  const content = $('#detail-content');
  content.replaceChildren();
  if (provider) content.append(portrait(provider, 'detail-portrait'));
  const heading = text('h2', title);
  heading.id = 'detail-title';
  content.append(heading, text('p', copy, 'detail-copy'));
  detail.showModal();
}
let discoveryScroll = 0;
let selectedCardId = null;
let selectedAdId = null;
let callbackStarted = false;
function renderRoute() {
  const params = new URL(location.href).searchParams;
  if (params.get('page') !== 'photo-preview' || params.has('profile') || params.has('ad')) clearPhotoPreviewState();
  const accountMode = ['account', 'account-security', 'my-listings', 'availability', 'provider-setup', 'user-setup', 'edit-user-profile', 'booking-draft', 'draft-backup', 'photo-preview', 'messages-preview', 'provider-application', 'profile-review', 'provider-review', 'sign-in', 'register', 'recover-account', 'reset-password'].includes(params.get('page')) ? params.get('page') : null;
  const isAccount = !params.has('profile') && !params.has('ad') && accountMode !== null;
  $('#account-view').hidden = !isAccount;
  if (!isAccount) $('#account-view').replaceChildren();
  const isGuidelines = params.get('page') === 'guidelines';
  const isHelp = params.get('page') === 'help';
  $('#guidelines-shell').hidden = !isGuidelines;
  $('#help-shell').hidden = !isHelp;
  if (isGuidelines || isHelp) {
    if (gate.open) gate.close();
    app.hidden = true;
    app.inert = true;
    if (isGuidelines && !$('#guidelines-shell').childElementCount) renderGuidelines($('#guidelines-shell'), returnFromGuidelines, () => location.replace(returnTo));
    if (isHelp && !$('#help-shell').childElementCount) renderHelp($('#help-shell'), returnFromHelp, navigateFromHelp, () => location.replace(returnTo));
    document.title = isGuidelines ? 'Community Guidelines & Boundaries · MeetDiscreet' : 'Help · MeetDiscreet';
    return;
  }
  app.hidden = !hasAgeConfirmation;
  app.inert = !hasAgeConfirmation;
  if (!hasAgeConfirmation && !gate.open) gate.showModal();
  const id = params.get('profile');
  const adId = params.get('ad');
  const isProfile = id !== null;
  const isOffering = !isProfile && adId !== null;
  const isHow = !isProfile && !isOffering && params.get('page') === 'how-it-works';
  const isEditor = !isProfile && !isOffering && params.get('page') === 'create-listing';
  const isProfileEditor = !isProfile && !isOffering && params.get('page') === 'edit-profile';
  const isExperiences = !isProfile && !isOffering && params.get('page') === 'experiences';
  const isAuthCallback = !isProfile && !isOffering && params.get('page') === 'auth-callback';
  $('#auth-callback-view').hidden = !isAuthCallback;
  $('#experiences-view').hidden = !isExperiences;
  $('#profile-editor-view').hidden = !isProfileEditor;
  $('#editor-view').hidden = !isEditor;
  $('#discovery-view').hidden = isProfile || isOffering || isHow || isEditor || isAccount || isProfileEditor || isExperiences || isAuthCallback;
  $('#how-view').hidden = !isHow;
  $('#profile-view').hidden = !isProfile;
  $('#offering-view').hidden = !isOffering;
  $('.view-dock').hidden = isProfile || isOffering || isHow || isEditor || isAccount || isProfileEditor || isExperiences || isAuthCallback;
  const discoverLink = $('.desktop-nav a');
  discoverLink.href = './';
  if (isProfile || isOffering || isHow || isEditor || isAccount || isProfileEditor || isExperiences || isAuthCallback) discoverLink.removeAttribute('aria-current');
  else discoverLink.setAttribute('aria-current', 'page');
  document.querySelectorAll('[data-how-link]').forEach((link) => {
    if (isHow) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (isProfile) {
    const provider = providers.find((item) => item.id === id);
    const sourceAd = ads.find((item) => item.id === params.get('fromAd') && item.category === 'offering' && item.provider === id);
    renderProfile($('#profile-view'), provider, sourceAd ? () => showAd(sourceAd) : backToDiscovery, (person) => {
      openDetail(`Connect with ${person.name}`, `The reference subscription is ${formatReferencePrice(referencePrices.companionSubscriptionMonthly)}/month for this companion. It unlocks subscriber media, detailed experiences, messages, calls, and booking requests. Booked companionship time is priced separately. Currency, renewal, and cancellation terms still need confirmation. This is a preview: no payment is taken and no access is granted.`);
    }, sourceAd ? '← Back to ad' : '← Back to discovery', person => navigateAccount('booking-draft', { provider: person.id, offering: sourceAd?.id }));
    document.title = `${provider ? provider.name : 'Profile unavailable'} · MeetDiscreet`;
  } else if (isOffering) {
    const ad = ads.find((item) => item.id === adId);
    const provider = ad && providers.find((item) => item.id === ad.provider);
    const related = provider ? ads.filter((item) => item.category === 'offering' && item.id !== ad.id)
      .map((item) => ({ ad: item, provider: providers.find((person) => person.id === item.provider) }))
      .filter((item) => item.provider?.city === provider.city).slice(0, 3) : [];
    $('#offering-view').setAttribute('aria-label',ad?.category === 'looking' ? 'Looking For public summary' : 'Offering ad');
    if (ad?.category === 'looking' && provider) renderLookingFor($('#offering-view'),ad,provider,()=>backToAds('looking'),()=>navigateAccount('my-listings',{kind:'looking'}));
    else renderOffering($('#offering-view'), ad, provider, related, backToAds, showProfile, showAd, (person, source) => navigateAccount('booking-draft', { provider: person.id, offering: source.id }));
    document.title = `${ad ? ad.title : 'Ad unavailable'} · MeetDiscreet`;
  } else if (isHow) {
    renderHowItWorks($('#how-view'), backToDiscovery);
    document.title = 'How it works · MeetDiscreet';
  } else if (isEditor) {
    const context = { kind: params.get('kind'), fromLibrary: params.get('from') === 'library', fresh: params.get('new') === '1' };
    renderListingEditor($('#editor-view'), context.fromLibrary ? () => navigateAccount('my-listings', { kind: context.kind }) : backToDiscovery, params.get('draft'), params.get('copy') === '1', context);
    document.title = 'Create a listing · MeetDiscreet';
  } else if (isAccount) {
    if (accountMode === 'account') renderAccountOverview($('#account-view'), navigateAccount, backToDiscovery);
    else if (accountMode === 'photo-preview') renderPhotoPreview($('#account-view'), navigateAccount);
    else if (accountMode === 'messages-preview') renderMessagesPreview($('#account-view'), navigateAccount);
    else if (accountMode === 'draft-backup') renderDraftBackup($('#account-view'), navigateAccount);
    else if (accountMode === 'profile-review') renderProfileReview($('#account-view'), navigateAccount);
    else if (accountMode === 'provider-review') renderProviderReview($('#account-view'), navigateAccount);
    else if (accountMode === 'provider-application') renderProviderApplication($('#account-view'), navigateAccount);
    else if (accountMode === 'booking-draft') {
      const resumeSaved = hasAgeConfirmation && params.get('resume') === '1';
      renderBookingDraft($('#account-view'), navigateAccount, params.get('provider'), showProfile, { offeringId: params.get('offering'), onViewOffering: showAd, resumeSaved, onResumeConsumed: consumeBookingResume });
    }
    else if (accountMode === 'edit-user-profile') renderUserProfileEditor($('#account-view'), navigateAccount);
    else if (accountMode === 'user-setup') renderUserSetup($('#account-view'), navigateAccount, backToDiscovery);
    else if (accountMode === 'provider-setup') renderProviderSetup($('#account-view'), navigateAccount);
    else if (accountMode === 'availability') renderAvailability($('#account-view'), navigateAccount);
    else if (accountMode === 'my-listings') renderListingLibrary($('#account-view'), navigateAccount, params.get('kind'));
    else if (accountMode === 'account-security') renderAccountSecurity($('#account-view'), navigateAccount);
    else renderAccount($('#account-view'), accountMode, navigateAccount, backToDiscovery);
    document.title = `${accountMode === 'profile-review' ? 'Profile submission review' : accountMode === 'photo-preview' ? 'Photo workspace preview' : accountMode === 'messages-preview' ? 'Conversation preview' : accountMode === 'draft-backup' ? 'Saved draft download' : accountMode === 'provider-review' ? 'Provider review queue' : accountMode === 'provider-application' ? 'Provider application' : accountMode === 'booking-draft' ? 'Booking request preview' : accountMode === 'edit-user-profile' ? 'User profile draft' : accountMode === 'user-setup' ? 'User setup' : accountMode === 'provider-setup' ? 'Provider setup' : accountMode === 'availability' ? 'Availability draft' : accountMode === 'my-listings' ? 'Saved listing drafts' : accountMode === 'account-security' ? 'Account security' : accountMode === 'account' ? 'Your account' : accountMode === 'register' ? 'Create account' : accountMode === 'recover-account' ? 'Account recovery' : 'Sign in'} · MeetDiscreet`;
  } else if (isProfileEditor) {
    renderProfileEditor($('#profile-editor-view'), backToDiscovery, navigateAccount);
    document.title = 'Profile editor · MeetDiscreet';
  } else if (isExperiences) {
    renderExperiences($('#experiences-view'), backToDiscovery, navigateAccount);
    document.title = 'Experience catalogue · MeetDiscreet';
  } else if (isAuthCallback) {
    document.title = 'Verify account link · MeetDiscreet';
    if (!callbackStarted) {
      callbackStarted = true;
      processAuthCallback().then((result) => {
        if (new URL(location.href).searchParams.get('page') !== 'auth-callback') return;
        if (result.error) $('.auth-callback-status').textContent = result.error;
        else {
          $('.auth-callback-status').textContent = 'Account link verified.';
          navigateAccount(result.recovery ? 'reset-password' : 'account');
        }
      }).catch(() => { $('.auth-callback-status').textContent = 'Unable to verify this link. Request a fresh link and try again.'; });
    }
  } else document.title = 'Discover · MeetDiscreet';
}
function backToDiscovery() {
  const url = new URL(location.href);
  url.searchParams.delete('provider');
  url.searchParams.delete('offering');
  url.searchParams.delete('resume');
  url.searchParams.delete('profile');
  url.searchParams.delete('ad');
  url.searchParams.delete('fromAd');
  url.searchParams.delete('page');
  url.searchParams.delete('draft');
  url.searchParams.delete('copy');
  history.pushState(null, '', url);
  renderRoute();
  window.scrollTo({ top: discoveryScroll, behavior: 'instant' });
  const card = state.view === 'ads' ? (selectedAdId && document.querySelector(`[data-ad="${selectedAdId}"]`)) : (selectedCardId && document.querySelector(`[data-provider="${selectedCardId}"]`));
  (card || $('#main')).focus({ preventScroll: true });
}
function showProfile(provider, sourceAd) {
  if (!sourceAd) { discoveryScroll = window.scrollY; selectedCardId = provider.id; }
  const url = new URL(location.href);
  url.searchParams.set('profile', provider.id);
  url.searchParams.delete('provider');
  url.searchParams.delete('offering');
  url.searchParams.delete('resume');
  url.searchParams.delete('page');
  url.searchParams.delete('ad');
  if (sourceAd) url.searchParams.set('fromAd', sourceAd.id);
  else url.searchParams.delete('fromAd');
  history.pushState(null, '', url);
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('#main').focus({ preventScroll: true });
}
function backToAds(category = 'offering') {
  state.view = 'ads';
  state.category = category === 'looking' ? 'looking' : 'offering';
  render();
  backToDiscovery();
}
function showAd(ad) {
  const params = new URL(location.href).searchParams;
  if (!params.has('profile') && !params.has('ad')) discoveryScroll = window.scrollY;
  selectedAdId = ad.id;
  const url = new URL(location.href);
  url.searchParams.delete('profile');
  url.searchParams.delete('fromAd');
  url.searchParams.delete('page');
  url.searchParams.delete('provider');
  url.searchParams.delete('offering');
  url.searchParams.delete('resume');
  url.searchParams.set('ad', ad.id);
  history.pushState(null, '', url);
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('#main').focus({ preventScroll: true });
}
window.addEventListener('popstate', () => {
  renderRoute();
  if (['guidelines', 'help'].includes(new URL(location.href).searchParams.get('page'))) {
    const main = new URL(location.href).searchParams.get('page') === 'help' ? $('#help-main') : $('#guidelines-main');
    (document.getElementById(location.hash.slice(1)) || main).focus({ preventScroll: true });
    return;
  }
  if (!new URL(location.href).searchParams.has('profile') && !new URL(location.href).searchParams.has('ad') && !['how-it-works', 'create-listing', 'sign-in', 'register', 'recover-account', 'edit-profile', 'experiences', 'auth-callback', 'reset-password'].includes(new URL(location.href).searchParams.get('page'))) {
    window.scrollTo({ top: discoveryScroll, behavior: 'instant' });
    const card = state.view === 'ads' ? (selectedAdId && document.querySelector(`[data-ad="${selectedAdId}"]`)) : (selectedCardId && document.querySelector(`[data-provider="${selectedCardId}"]`));
    (card || $('#main')).focus({ preventScroll: true });
  } else $('#main').focus({ preventScroll: true });
});
function matches(provider, additional = '') {
  return (state.city === 'all' || provider.city === state.city)
    && (!state.online || provider.online)
    && (state.activity === 'all' || provider.interest === state.activity)
    && `${provider.name} ${provider.city} ${provider.area} ${provider.interest} ${additional}`.toLocaleLowerCase().includes(state.query);
}
function render() {
  const results = $('#results');
  results.replaceChildren();
  results.className = state.view === 'grid' ? 'provider-grid' : 'ads-list';
  $('#ad-tabs').hidden = state.view !== 'ads';
  $('#results-title').textContent = state.view === 'grid' ? 'In good company' : 'A plan worth making';
  $('#view-label').textContent = state.view === 'grid' ? 'Explore the ads' : 'Back to people';
  $('#view-icon').textContent = state.view === 'grid' ? '☷' : '▦';
  let count = 0;
  if (state.view === 'grid') {
    providers.filter((p) => matches(p)).forEach((provider) => {
      const button = document.createElement('button');
      button.className = 'provider-card';
      button.dataset.provider = provider.id;
      button.setAttribute('aria-label', `${provider.name}, ${provider.age}, ${provider.area}, ${provider.city}, ${provider.online ? 'online' : 'offline'}. Open demo profile`);
      const photo = portrait(provider);
      const status = text('span', provider.online ? 'Online' : 'Offline', `status ${provider.online ? 'is-online' : ''}`);
      const meta = document.createElement('div');
      meta.className = 'card-meta';
      const name = document.createElement('h3');
      name.append(text('span', provider.name), text('span', provider.age, 'age'));
      meta.append(name, text('p', provider.area), text('span', provider.city, 'city-name'));
      button.append(photo, status, meta);
      button.addEventListener('click', () => showProfile(provider));
      results.append(button);
      count++;
    });
  } else {
    ads.filter((ad) => ad.category === state.category).sort((a, b) => b.posted.localeCompare(a.posted)).forEach((ad) => {
      const provider = providers.find((p) => p.id === ad.provider);
      if (!matches(provider, `${ad.title} ${ad.description}`)) return;
      const article = document.createElement('article');
      article.className = 'ad-card';
      const body = document.createElement('div');
      body.className = 'ad-body';
      const meta = text('p', `${provider.name}, ${provider.age} · ${provider.area}, ${provider.city}`, 'ad-meta');
      body.append(text('span', provider.interest, 'ad-interest'), text('h3', ad.title), text('p', ad.description, 'ad-copy'), meta);
      const button = text('button', 'View ad', 'ad-action');
      button.dataset.ad = ad.id;
      button.addEventListener('click', () => showAd(ad));
      const title = body.querySelector('h3');
      const link = text('a', ad.title);
      link.href = `?ad=${encodeURIComponent(ad.id)}`;
      link.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); showAd(ad);
      });
      title.replaceChildren(link);
      article.append(portrait(provider, 'ad-portrait'), body, button);
      results.append(article);
      count++;
    });
  }
  $('#empty').hidden = count !== 0;
  $('#result-count').textContent = `${count} ${state.view === 'grid' ? 'demo profiles' : 'demo ads'}`;
  const activeFilters = Number(state.activity !== 'all');
  $('#filter-count').hidden = !activeFilters;
  $('#filter-count').textContent = activeFilters;
  document.querySelectorAll('[data-category]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.category === state.category)));
}
$('#search').addEventListener('input', (event) => { state.query = event.target.value.trim().toLocaleLowerCase(); render(); });
$('#location').addEventListener('change', (event) => { state.city = event.target.value; render(); });
$('#online').addEventListener('change', (event) => { state.online = event.target.checked; render(); });
$('#switch-view').addEventListener('click', () => {
  state.view = state.view === 'grid' ? 'ads' : 'grid';
  render();
  $('#results-title').scrollIntoView({ block: 'start', behavior: 'instant' });
});
$('#open-filters').addEventListener('click', () => { $('#activity').value = state.activity; filters.showModal(); });
$('#filters-form').addEventListener('submit', (event) => { event.preventDefault(); state.activity = $('#activity').value; filters.close(); render(); });
$('#reset').addEventListener('click', () => {
  Object.assign(state, { city: 'Vancouver', query: '', online: false, activity: 'all' });
  $('#location').value = state.city; $('#search').value = ''; $('#online').checked = false;
  render();
});
document.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => { state.category = button.dataset.category; render(); }));
document.querySelectorAll('.close-dialog').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
const info = {
  privacy: ['Privacy · prototype notice', backendEnabled ? 'Development authentication uses Supabase. Its supported browser SDK stores session tokens in browser storage. Profile and listing drafts are stored privately only when you explicitly save them. Public discovery is fictional. Use test data while the final Privacy Policy, eligibility, and operational controls are pending.' : 'This preview does not request your device location or create accounts. Age confirmation is stored on this browser for 30 days when storage is available. Fictional demo filters stay in memory. This notice is not the final Privacy Policy.'],
  terms: ['Terms · prototype notice', 'This is a frontend demonstration using fictional profiles and ads. No purchases, subscriptions, bookings, or real service arrangements can be made. Final service terms will be provided before a live launch.'],
};
document.querySelectorAll('[data-info]').forEach((button) => button.addEventListener('click', () => openDetail(...info[button.dataset.info])));
$('#year').textContent = new Date().getFullYear();
render();

renderRoute();

$('.desktop-nav a').addEventListener('click', (event) => {
  if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (new URL(location.href).searchParams.has('profile') || new URL(location.href).searchParams.has('ad') || ['how-it-works', 'create-listing', 'sign-in', 'register', 'recover-account', 'edit-profile', 'experiences', 'auth-callback', 'reset-password'].includes(new URL(location.href).searchParams.get('page')))) {
    event.preventDefault();
    backToDiscovery();
  }
});

for (const link of document.querySelectorAll('[data-how-link]')) {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!$('#discovery-view').hidden) discoveryScroll = window.scrollY;
    const url = new URL(location.href);
    for (const key of ['profile', 'ad', 'fromAd', 'draft', 'copy', 'kind', 'from', 'new', 'provider', 'offering', 'resume']) url.searchParams.delete(key);
    url.searchParams.set('page', 'how-it-works');
    history.pushState(null, '', url);
    renderRoute();
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#main').focus({ preventScroll: true });
  });
}

for (const link of document.querySelectorAll('[data-editor-link]')) {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!$('#discovery-view').hidden) discoveryScroll = window.scrollY;
    const url = new URL(location.href);
    for (const key of ['profile', 'ad', 'fromAd', 'draft', 'copy', 'kind', 'from', 'new', 'provider', 'offering', 'resume']) url.searchParams.delete(key);
    url.searchParams.set('page', 'create-listing');
    history.pushState(null, '', url);
    renderRoute();
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#main').focus({ preventScroll: true });
  });
}

function returnFromGuidelines() {
  const source = history.state?.policyReturnUrl || policyReturnUrl;
  const target = new URL(source || location.href);
  if (!source) { target.searchParams.delete('page'); target.hash = ''; }
  history.pushState(history.state?.publicSourceState || null, '', target);
  renderRoute();
  if (target.searchParams.get('page') === 'help') $('#help-main').focus({ preventScroll: true });
  else if (target.searchParams.get('page') === 'guidelines') $('#guidelines-main').focus({ preventScroll: true });
  else if (hasAgeConfirmation) $('#main').focus({ preventScroll: true });
}
for (const link of document.querySelectorAll('[data-guidelines-link]')) {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    policyReturnUrl = location.href;
    const url = new URL(location.href);
    for (const key of ['profile', 'ad', 'fromAd', 'draft', 'copy', 'kind', 'from', 'new', 'provider', 'offering', 'resume']) url.searchParams.delete(key);
    url.searchParams.set('page', 'guidelines');
    url.hash = '';
    history.pushState({ policyReturnUrl }, '', url);
    renderRoute();
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#guidelines-main').focus({ preventScroll: true });
  });
}

function navigateFromHelp(page) {
  const url = new URL(location.href);
  for (const key of ['profile', 'ad', 'fromAd', 'draft', 'copy', 'kind', 'from', 'new', 'provider', 'offering', 'resume']) url.searchParams.delete(key);
  if (page) url.searchParams.set('page', page);
  else url.searchParams.delete('page');
  url.hash = '';
  if (page === 'guidelines') policyReturnUrl = location.href;
  history.pushState(page === 'guidelines' ? { policyReturnUrl, publicSourceState: history.state } : null, '', url);
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (page === 'guidelines') $('#guidelines-main').focus({ preventScroll: true });
  else if (hasAgeConfirmation) $('#main').focus({ preventScroll: true });
}
for (const link of document.querySelectorAll('[data-help-link]')) {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const source = location.href;
    const url = new URL(source);
    for (const key of ['profile', 'ad', 'fromAd', 'draft', 'copy', 'kind', 'from', 'new', 'provider', 'offering', 'resume']) url.searchParams.delete(key);
    url.searchParams.set('page', 'help');
    url.hash = '';
    helpReturnUrl = source;
    history.pushState({ helpReturnUrl: source }, '', url);
    renderRoute();
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#help-main').focus({ preventScroll: true });
  });
}

function returnFromHelp() {
  const source = history.state?.helpReturnUrl || helpReturnUrl;
  const target = new URL(source || location.href);
  if (!source) { target.searchParams.delete('page'); target.hash = ''; }
  history.pushState(null, '', target);
  renderRoute();
  if (target.searchParams.get('page') === 'guidelines') $('#guidelines-main').focus({ preventScroll: true });
  else if (hasAgeConfirmation) $('#main').focus({ preventScroll: true });
}

function consumeBookingResume() {
  const clean = new URL(location.href);
  if (clean.searchParams.get('page') !== 'booking-draft' || clean.searchParams.get('resume') !== '1') return;
  clean.searchParams.delete('resume'); history.replaceState(history.state, '', clean);
}
function navigateAccount(page, extra = {}) {
  if (!$('#discovery-view').hidden) discoveryScroll = window.scrollY;
  const url = new URL(location.href);
  for (const key of ['profile', 'ad', 'fromAd', 'draft', 'copy', 'kind', 'from', 'new', 'provider', 'offering', 'resume']) url.searchParams.delete(key);
  url.searchParams.delete('draft');
  url.searchParams.delete('copy');
  url.searchParams.set('page', page);
  if (page === 'booking-draft' && extra.resume === true) url.searchParams.set('resume', '1');
  if (page === 'booking-draft' && providers.some(person => person.id === extra.provider)) url.searchParams.set('provider', extra.provider);
  if (page === 'booking-draft' && ads.some(ad => ad.id === extra.offering && ad.category === 'offering' && ad.provider === extra.provider)) url.searchParams.set('offering', extra.offering);
  if (extra.draft) url.searchParams.set('draft', extra.draft);
  if (extra.copy) url.searchParams.set('copy', '1');
  if (['looking', 'offering', 'all'].includes(extra.kind)) url.searchParams.set('kind', extra.kind);
  if (extra.fromLibrary) url.searchParams.set('from', 'library');
  if (extra.fresh) url.searchParams.set('new', '1');
  url.hash = '';
  history.pushState(null, '', url);
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (hasAgeConfirmation) $('#main').focus({ preventScroll: true });
}
for (const link of document.querySelectorAll('[data-account-link]')) {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigateAccount(backendEnabled && new URL(link.href).searchParams.get('page') === 'account' ? 'account' : 'sign-in');
  });
}

for (const link of document.querySelectorAll('[data-profile-editor-link]')) {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigateAccount('edit-profile');
  });
}

if (backendEnabled) {
  const actions = document.createElement('div');
  actions.className = 'backend-session-actions';
  const status = document.createElement('span');
  status.className = 'profile-small';
  status.setAttribute('role', 'status');
  const signOut = document.createElement('button');
  signOut.textContent = 'Sign out';
  signOut.title = 'Sign out of this session';
  const notice = document.createElement('p'); notice.className = 'session-notice'; notice.setAttribute('role', 'status'); notice.hidden = true;
  $('.site-header').after(notice);
  signOut.hidden = true;
  signOut.addEventListener('click', async () => {
    signOut.disabled = true; notice.hidden = true;
    const previousUser = currentUserId;
    try {
      const result = await signOutCurrentSession();
      if (currentUserId && currentUserId !== previousUser) return;
      notice.textContent = result.localCleared
        ? result.revocationUnconfirmed ? 'Signed out here. The server could not confirm revocation; existing sign-in tokens may remain valid until expiry.' : 'Signed out of this session.'
        : 'Unable to confirm sign-out. Check your connection and retry.';
      notice.hidden = false;
    } catch {
      if (!currentUserId || currentUserId === previousUser) { notice.textContent = 'Unable to confirm sign-out. Check your connection and retry.'; notice.hidden = false; }
    } finally { signOut.disabled = false; }
  });
  actions.append(status, signOut);
  $('.account-actions').append(actions);
  let currentUserId;
  backendClient().auth.onAuthStateChange((_event, session) => {
    const nextUserId = session?.user?.id || null;
    const changed = currentUserId !== nextUserId;
    if (nextUserId) { notice.hidden = true; notice.textContent = ''; }
    currentUserId = nextUserId;
    if (changed) {
      clearPhotoPreviewState(); clearProfileDraftState(); clearListingDraftState(); clearExperienceDraftState(); clearAvailabilityState(); clearUserProfileState(); clearBookingDraftState(); clearProviderApplicationState();
      for (const selector of ['#profile-editor-view', '#editor-view', '#experiences-view', ...(['account', 'account-security', 'my-listings', 'availability', 'provider-setup', 'user-setup', 'edit-user-profile', 'booking-draft', 'draft-backup', 'photo-preview', 'messages-preview', 'provider-application', 'profile-review', 'provider-review'].includes(new URL(location.href).searchParams.get('page')) ? ['#account-view'] : [])]) $(selector).replaceChildren();
    }
    queueMicrotask(() => {
      $('[data-account-link]').textContent = nextUserId ? 'Account' : 'Sign in';
      $('[data-account-link]').href = nextUserId ? '?page=account' : '?page=sign-in';
      signOut.hidden = !nextUserId;
      status.textContent = nextUserId ? 'Development session' : '';
      if (changed && ['account', 'account-security', 'my-listings', 'availability', 'provider-setup', 'user-setup', 'edit-user-profile', 'booking-draft', 'draft-backup', 'photo-preview', 'messages-preview', 'provider-application', 'profile-review', 'provider-review', 'edit-profile', 'create-listing', 'experiences'].includes(new URL(location.href).searchParams.get('page'))) renderRoute();
    });
  });
}
