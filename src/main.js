import './styles.css';
import { providers, ads } from './data.js';
import { renderProfile } from './profile.js';
import { renderOffering } from './offering.js';
import { renderHowItWorks } from './how-it-works.js';
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

function enter() {
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
else gate.showModal();
gate.addEventListener('cancel', (event) => event.preventDefault());
$('#confirm-age').addEventListener('click', () => {
  try { localStorage.setItem(confirmationKey, String(Date.now())); }
  catch { $('#storage-note').textContent = 'Browser storage is unavailable. Confirmation will apply to this visit only.'; }
  enter();
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
function renderRoute() {
  const params = new URL(location.href).searchParams;
  const id = params.get('profile');
  const adId = params.get('ad');
  const isProfile = id !== null;
  const isOffering = !isProfile && adId !== null;
  const isHow = !isProfile && !isOffering && params.get('page') === 'how-it-works';
  $('#discovery-view').hidden = isProfile || isOffering || isHow;
  $('#how-view').hidden = !isHow;
  $('#profile-view').hidden = !isProfile;
  $('#offering-view').hidden = !isOffering;
  $('.view-dock').hidden = isProfile || isOffering || isHow;
  const discoverLink = $('.desktop-nav a');
  discoverLink.href = './';
  if (isProfile || isOffering || isHow) discoverLink.removeAttribute('aria-current');
  else discoverLink.setAttribute('aria-current', 'page');
  document.querySelectorAll('[data-how-link]').forEach((link) => {
    if (isHow) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (isProfile) {
    const provider = providers.find((item) => item.id === id);
    const sourceAd = ads.find((item) => item.id === params.get('fromAd') && item.category === 'offering' && item.provider === id);
    renderProfile($('#profile-view'), provider, sourceAd ? () => showOffering(sourceAd) : backToDiscovery, (person) => {
      openDetail(`Connect with ${person.name}`, `The reference subscription is ${formatReferencePrice(referencePrices.companionSubscriptionMonthly)}/month for this companion. It unlocks subscriber media, detailed experiences, messages, calls, and booking requests. Booked companionship time is priced separately. Currency, renewal, and cancellation terms still need confirmation. This is a preview: no payment is taken and no access is granted.`);
    }, sourceAd ? '← Back to ad' : '← Back to discovery');
    document.title = `${provider ? provider.name : 'Profile unavailable'} · MeetDiscreet`;
  } else if (isOffering) {
    const ad = ads.find((item) => item.id === adId && item.category === 'offering');
    const provider = ad && providers.find((item) => item.id === ad.provider);
    const related = provider ? ads.filter((item) => item.category === 'offering' && item.id !== ad.id)
      .map((item) => ({ ad: item, provider: providers.find((person) => person.id === item.provider) }))
      .filter((item) => item.provider?.city === provider.city).slice(0, 3) : [];
    renderOffering($('#offering-view'), ad, provider, related, backToAds, showProfile, showOffering);
    document.title = `${ad ? ad.title : 'Ad unavailable'} · MeetDiscreet`;
  } else if (isHow) {
    renderHowItWorks($('#how-view'), backToDiscovery);
    document.title = 'How it works · MeetDiscreet';
  } else document.title = 'Discover · MeetDiscreet';
}
function backToDiscovery() {
  const url = new URL(location.href);
  url.searchParams.delete('profile');
  url.searchParams.delete('ad');
  url.searchParams.delete('fromAd');
  url.searchParams.delete('page');
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
  url.searchParams.delete('page');
  url.searchParams.delete('ad');
  if (sourceAd) url.searchParams.set('fromAd', sourceAd.id);
  else url.searchParams.delete('fromAd');
  history.pushState(null, '', url);
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('#main').focus({ preventScroll: true });
}
function backToAds() {
  state.view = 'ads';
  state.category = 'offering';
  render();
  backToDiscovery();
}
function showOffering(ad) {
  const params = new URL(location.href).searchParams;
  if (!params.has('profile') && !params.has('ad')) discoveryScroll = window.scrollY;
  selectedAdId = ad.id;
  const url = new URL(location.href);
  url.searchParams.delete('profile');
  url.searchParams.delete('fromAd');
  url.searchParams.delete('page');
  url.searchParams.set('ad', ad.id);
  history.pushState(null, '', url);
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('#main').focus({ preventScroll: true });
}
window.addEventListener('popstate', () => {
  renderRoute();
  if (!new URL(location.href).searchParams.has('profile') && !new URL(location.href).searchParams.has('ad') && new URL(location.href).searchParams.get('page') !== 'how-it-works') {
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
      button.addEventListener('click', () => ad.category === 'offering' ? showOffering(ad) : openDetail(ad.title, `${ad.description} Fictional Looking For preview. Contact, pricing, and booking are not connected.`, provider));
      if (ad.category === 'offering') {
        const title = body.querySelector('h3');
        const link = text('a', ad.title);
        link.href = `?ad=${encodeURIComponent(ad.id)}`;
        link.addEventListener('click', (event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); showOffering(ad);
        });
        title.replaceChildren(link);
      }
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
  signin: ['Account access is coming later.', 'Sign-in is not connected in this frontend prototype. No account information is collected here.'],
  post: ['Your next plan, shared.', 'Listing creation is not connected yet. The ads in this preview are fictional examples.'],
  guidelines: ['Community Guidelines & Boundaries', 'The planned service is for paid platonic dates and social experiences. Respect personal boundaries and other people’s privacy. This is a prototype summary; the complete community guidelines and moderation tools are not implemented.'],
  privacy: ['Privacy · prototype notice', 'This preview does not request your device location or create accounts. Age confirmation is stored on this browser for 30 days when storage is available. Fictional demo filters stay in memory. This notice is not the final Privacy Policy.'],
  terms: ['Terms · prototype notice', 'This is a frontend demonstration using fictional profiles and ads. No purchases, subscriptions, bookings, or real service arrangements can be made. Final service terms will be provided before a live launch.'],
};
document.querySelectorAll('[data-info]').forEach((button) => button.addEventListener('click', () => openDetail(...info[button.dataset.info])));
$('#year').textContent = new Date().getFullYear();
render();

renderRoute();

$('.desktop-nav a').addEventListener('click', (event) => {
  if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (new URL(location.href).searchParams.has('profile') || new URL(location.href).searchParams.has('ad') || new URL(location.href).searchParams.get('page') === 'how-it-works')) {
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
    for (const key of ['profile', 'ad', 'fromAd']) url.searchParams.delete(key);
    url.searchParams.set('page', 'how-it-works');
    history.pushState(null, '', url);
    renderRoute();
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#main').focus({ preventScroll: true });
  });
}
