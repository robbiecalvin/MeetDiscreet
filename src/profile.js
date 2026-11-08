import { referencePrices, formatReferencePrice } from './pricing.js';
// Public-only profile rendering. Locked sections never receive private content.
const svgNamespace = 'http://www.w3.org/2000/svg';

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function section(id, heading, description, access) {
  const node = element('section', null, 'profile-section');
  node.id = id;
  const top = element('div', null, 'profile-section-heading');
  top.append(element('h2', heading));
  if (access) top.append(element('span', access, 'access-label'));
  node.append(top, element('p', description, 'profile-copy'));
  return node;
}

function heroPortrait(provider) {
  const svg = document.createElementNS(svgNamespace, 'svg');
  const width = 1774 / 6;
  const height = 887 / 2;
  svg.setAttribute('viewBox', `${(provider.photo % 6) * width} ${Math.floor(provider.photo / 6) * height} ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.classList.add('profile-photo');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Fictional profile photograph of ${provider.name}`);
  const image = document.createElementNS(svgNamespace, 'image');
  image.setAttribute('href', '/images/demo-portraits.png');
  image.setAttribute('width', '1774');
  image.setAttribute('height', '887');
  svg.append(image);
  return svg;
}

export function renderProfile(container, provider, onBack, onSubscribe, backLabel = '← Back to discovery') {
  container.replaceChildren();
  const back = element('a', backLabel, 'profile-back');
  back.href = './';
  back.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onBack();
  });
  container.append(back);
  if (!provider) {
    const empty = element('div', null, 'profile-not-found');
    empty.append(element('p', 'PROFILE UNAVAILABLE', 'eyebrow'), element('h1', 'This profile isn’t here.'), element('p', 'Return to discovery to explore the demo profiles.', 'profile-copy'));
    container.append(empty);
    return;
  }

  const hero = element('div', null, 'profile-hero');
  const photo = heroPortrait(provider);
  const backdrop = photo.cloneNode(true);
  backdrop.classList.replace('profile-photo', 'profile-photo-backdrop');
  backdrop.removeAttribute('role');
  backdrop.removeAttribute('aria-label');
  backdrop.setAttribute('aria-hidden', 'true');
  hero.append(backdrop, photo);
  hero.append(element('span', 'FICTIONAL PROFILE', 'profile-photo-label'));
  const identity = element('div', null, 'profile-identity');
  const name = element('div');
  name.append(element('p', `@${provider.id} · ${provider.area}, ${provider.city}`, 'profile-location'), element('h1', `${provider.name}, ${provider.age}`), element('p', 'Good company, at your pace.', 'profile-tagline'));
  const presence = element('span', provider.online ? 'Online · demo status' : 'Offline · demo status', `profile-presence ${provider.online ? 'is-online' : ''}`);
  identity.append(name, presence);
  container.append(hero, identity);

  const layout = element('div', null, 'profile-layout');
  const content = element('div', null, 'profile-content');
  content.append(section('introduction', `A little introduction`, `Meet ${provider.name}, a fictional companion based in ${provider.city}. This public preview introduces the profile; the personal biography is available to registered members.`, 'PUBLIC INTRO'));
  const interests = section('interests', 'The things we connect over', 'Personal interests, conversation topics, and the full biography are available to registered members.', 'MEMBER PREVIEW');
  const tags = element('div', null, 'locked-tags');
  for (const label of ['Interests', 'Conversation topics', 'What I enjoy']) tags.append(element('span', label));
  interests.append(tags);
  const experiences = section('experiences', 'A little more to look forward to', `Subscribe to ${provider.name} to explore detailed experiences and add-ons. Companionship time is priced separately from the subscription.`, 'SUBSCRIBER PREVIEW');
  const previews = element('div', null, 'locked-previews');
  for (const [title, copy] of [['Experiences & add-ons', 'Detailed offerings and options'], ['Photos & videos', 'Additional subscriber media'], ['Connect & make plans', 'Messages, calls, and booking requests']]) {
    const card = element('div', null, 'locked-preview');
    card.append(element('span', 'LOCKED', 'locked-indicator'), element('h3', title), element('p', copy));
    previews.append(card);
  }
  experiences.append(previews);
  const rates = section('rates', 'Time, well spent', 'General rates haven’t been published for this demo profile.', 'GENERAL RATES');
  rates.append(element('p', 'The subscription unlocks access; it does not include a booked experience. No booking price or charge is calculated here.', 'profile-small'));
  const availability = section('availability', 'Find a moment that works', 'Availability hasn’t been published for this demo profile.', 'AVAILABILITY');
  availability.append(element('div', 'No dates available to request in this preview.', 'availability-empty'));
  content.append(interests, experiences, rates, availability);

  const aside = element('aside', null, 'subscription-card');
  aside.setAttribute('aria-label', `Connect with ${provider.name}`);
  aside.append(element('p', 'A CONNECTION OF YOUR OWN', 'eyebrow'), element('h2', `Get to know ${provider.name}.`), element('p', 'Subscriber media, detailed experiences, messages, calls, and booking requests.', 'profile-copy'));
  aside.append(element('p', `${formatReferencePrice(referencePrices.companionSubscriptionMonthly)} / month`, 'subscription-price'), element('p', 'Per companion · reference price', 'profile-small'));
  const button = element('button', 'Subscribe to connect', 'button primary profile-subscribe');
  button.addEventListener('click', () => onSubscribe(provider));
  aside.append(button, element('p', 'Currency and renewal terms remain pending. Subscriptions and payments are not connected in this demo.', 'profile-small'));
  layout.append(content, aside);
  container.append(layout, element('p', 'Fictional profile and online status. Labelled previews contain no private content. No accounts, subscriptions, messaging, or bookings are connected.', 'profile-demo-note'));
}
