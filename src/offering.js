function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function link(label, href, onClick, className) {
  const node = element('a', label, className);
  node.href = href;
  node.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onClick();
  });
  return node;
}

function portrait(provider) {
  const node = element('div', null, `portrait portrait-${provider.photo} offering-avatar`);
  node.setAttribute('role', 'img');
  node.setAttribute('aria-label', `Fictional portrait of ${provider.name}`);
  return node;
}

const descriptions = {
  gallery: 'A gallery visit is a lovely place to start: a little time to look around, share a favourite piece, and enjoy an unhurried conversation over coffee afterwards.',
  dinner: 'Explore a neighbourhood restaurant with easy conversation and a relaxed atmosphere. Whether it’s a familiar favourite or somewhere new, the evening is about enjoying the company.',
  walk: 'Take in the waterfront and enjoy a change of scenery. An easy-going walk with room to stop, take a breath, and have a good conversation.',
  coffee: 'Find a comfortable café, settle into a corner, and take a break from the rush. A simple plan with space for conversation and a new perspective.',
  toronto: 'Discover a neighbourhood café and enjoy a relaxed conversation. A simple way to spend a little time getting to know someone new.',
  montreal: 'Explore the streets, architecture, and local art around the Plateau. An unhurried afternoon with time to notice the details.',
};

export function renderOffering(container, ad, provider, related, onBack, onProfile, onAd, onPreviewPlan) {
  container.replaceChildren();
  container.append(link('← Back to ads', './', onBack, 'profile-back'));
  if (!ad || !provider) {
    const empty = element('div', null, 'profile-not-found');
    empty.append(element('p', 'AD UNAVAILABLE', 'eyebrow'), element('h1', 'This Offering ad isn’t here.'), element('p', 'Return to the ads to explore other plans.', 'profile-copy'));
    container.append(empty);
    return;
  }

  const providerHeader = element('div', null, 'offering-provider');
  const identity = element('div', null, 'offering-provider-identity');
  const profileHref = `?profile=${encodeURIComponent(provider.id)}&fromAd=${encodeURIComponent(ad.id)}`;
  identity.append(link(`${provider.name}, ${provider.age}`, profileHref, () => onProfile(provider, ad), 'offering-name'), element('p', `${provider.area}, ${provider.city}`, 'profile-location'));
  providerHeader.append(portrait(provider), identity, element('span', 'FICTIONAL OFFERING', 'access-label'));
  container.append(providerHeader);

  const layout = element('div', null, 'offering-layout');
  const article = element('article', null, 'offering-content');
  article.append(element('p', 'OFFERING · PUBLIC AD', 'eyebrow'), element('h1', ad.title), element('p', ad.description, 'offering-lead'));
  const description = element('section', null, 'offering-section');
  description.append(element('h2', 'A little more about the plan'), element('p', descriptions[ad.id] || ad.description, 'profile-copy'));
  const location = element('section', null, 'offering-section');
  location.append(element('h2', 'Around the neighbourhood'), element('p', `${provider.area}, ${provider.city}`, 'offering-place'), element('p', 'A general area only. A specific venue would be agreed when making arrangements.', 'profile-copy'));
  const rate = element('section', null, 'offering-section');
  rate.append(element('h2', 'General rate'), element('p', 'No general rate has been published for this demo ad.', 'profile-copy'), element('p', 'A companion subscription provides access; the experience itself is priced separately.', 'profile-small'));
  const availability = element('section', null, 'offering-section');
  availability.append(element('h2', 'Availability'), element('p', 'No dates have been published for this demo ad.', 'profile-copy'));
  article.append(description, location, rate, availability);

  const sidebar = element('aside', null, 'offering-sidebar');
  sidebar.append(element('p', 'MEET YOUR COMPANY', 'eyebrow'), element('h2', `Get to know ${provider.name}.`), element('p', 'Explore the public profile and see what a companion subscription unlocks.', 'profile-copy'));
  sidebar.append(link('View companion profile', profileHref, () => onProfile(provider, ad), 'button primary offering-profile-action'));
  sidebar.append(element('p', 'Subscription information stays on the companion profile.', 'profile-small'));
  const plan = element('a', 'Preview a plan from this ad', 'button outline');
  plan.href = `?page=booking-draft&provider=${encodeURIComponent(provider.id)}&offering=${encodeURIComponent(ad.id)}`;
  plan.addEventListener('click', event => {
    if (!onPreviewPlan || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onPreviewPlan(provider, ad);
  });
  sidebar.append(plan, element('p', 'Try an unsent fictional plan. No dates, prices or booking access are confirmed.', 'profile-small'));

  layout.append(article, sidebar);
  container.append(layout);

  if (related.length) {
    const section = element('section', null, 'related-offerings');
    section.setAttribute('aria-labelledby', 'related-offerings-title');
    const heading = element('h2', 'A few more possibilities');
    heading.id = 'related-offerings-title';
    section.append(heading, element('p', `More fictional Offering ads in ${provider.city}.`, 'profile-copy'));
    const list = element('div', null, 'related-offering-list');
    for (const { ad: item, provider: person } of related) {
      const card = element('article', null, 'related-offering');
      card.append(portrait(person));
      const content = element('div');
      const title = element('h3');
      title.append(link(item.title, `?ad=${encodeURIComponent(item.id)}`, () => onAd(item), 'related-offering-link'));
      content.append(element('p', `${person.name}, ${person.age} · ${person.area}`, 'profile-location'), title);
      card.append(content);
      list.append(card);
    }
    section.append(list);
    container.append(section);
  }
  container.append(element('p', 'Fictional ad and provider. No bookings, payments, or messages are connected in this preview.', 'profile-demo-note'));
}
