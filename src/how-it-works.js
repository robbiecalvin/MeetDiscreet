import { backendEnabled } from './backend/client.js';
import { referencePrices, formatReferencePrice } from './pricing.js';

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

const journeys = {
  users: [
    ['Find your kind of company', 'Explore public profiles and Offering ads by general location. Start with someone or a plan that catches your interest.'],
    ['Get to know a little more', backendEnabled ? 'Development accounts can sign in and save their own private drafts. Member/subscriber access to real marketplace profiles is a separate integration and is not granted by the demo.' : 'A registered member account is intended to unlock member-level profile information. Registration and accounts are not connected in this preview.'],
    ['Choose a companion subscription', 'A subscription unlocks the selected companion’s subscriber media, detailed experiences, messages, calls, and booking requests. It does not unlock every companion.'],
    ['Make a plan together', 'The companion can accept, decline, or suggest changes to a booking request. The experience is priced separately; booking and payment policies must be finalized before live use.'],
  ],
  companions: [
    ['Create your profile', 'Companion registration and unpublished profile editing are intended to be free. Present your public introduction and keep member and subscriber information in their own tiers.'],
    ['Choose a publishing plan', 'An eligible publishing plan makes the profile eligible to publish, subject to moderation. Monthly and annual plans are alternatives, not combined charges.'],
    ['Share what you offer', 'Publishing includes one Offering ad and one included boost per 30-day period. Additional ads and advertising upgrades are separate products.'],
    ['Connect and arrange experiences', 'Manage companion-specific subscribers and respond to booking requests. Final pricing, availability, payments, and private communication require the planned backend integrations.'],
  ],
};

export function renderHowItWorks(container, onDiscover) {
  container.replaceChildren();
  const back = element('a', '← Back to discovery', 'profile-back');
  back.href = './';
  back.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onDiscover();
  });
  const intro = element('div', null, 'how-intro');
  intro.append(element('p', 'HOW MEETDISCREET WORKS', 'eyebrow'), element('h1', 'Good company. Clear expectations.'), element('p', 'Find a person, discover a plan, and get to know what comes next.', 'offering-lead'));
  container.append(back, intro);

  const journey = element('section', null, 'how-journey');
  journey.setAttribute('aria-labelledby', 'journey-heading');
  const heading = element('h2', 'From discovery to a shared moment');
  heading.id = 'journey-heading';
  const controls = element('div', null, 'audience-controls');
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Choose a journey');
  const steps = element('ol', null, 'journey-steps');
  steps.id = 'journey-steps';
  const buttons = [];
  for (const [key, label] of [['users', 'For users'], ['companions', 'For companions']]) {
    const button = element('button', label);
    button.setAttribute('aria-controls', 'journey-steps');
    button.setAttribute('aria-pressed', String(key === 'users'));
    button.addEventListener('click', () => updateJourney(key));
    controls.append(button);
    buttons.push({ key, button });
  }
  function updateJourney(audience) {
    for (const { key, button } of buttons) button.setAttribute('aria-pressed', String(key === audience));
    steps.replaceChildren();
    journeys[audience].forEach(([title, copy], index) => {
      const item = element('li');
      item.append(element('span', `0${index + 1}`, 'journey-number'), element('h3', title), element('p', copy, 'profile-copy'));
      steps.append(item);
    });
  }
  updateJourney('users');
  journey.append(heading, controls, steps);
  container.append(journey);

  const plans = element('section', null, 'how-plans');
  plans.setAttribute('aria-labelledby', 'plans-heading');
  const title = element('h2', 'Different plans. Different purposes.');
  title.id = 'plans-heading';
  plans.append(title, element('p', 'Reference prices only. Currency, renewal, cancellation, and tax policies remain pending. No plan can be purchased in this demo.', 'profile-copy'));
  const cards = element('div', null, 'reference-plan-grid');
  for (const plan of [
    { title: 'Companion subscription', amount: referencePrices.companionSubscriptionMonthly, period: '/ month · per companion', copy: 'Access to one companion’s subscriber content, messages, calls, and booking requests.', note: 'A booked experience is paid separately.' },
    { title: 'Premium user membership', amount: referencePrices.premiumUserMonthly, period: '/ month', copy: 'Additional Looking For posting and boost benefits for users.', note: 'Does not unlock companion content or communication.' },
    { title: 'Companion publishing', amount: referencePrices.companionPublishingMonthly, period: '/ month', copy: 'Eligible profile publishing, one Offering ad, and one included boost per 30-day period.', note: `Or ${formatReferencePrice(referencePrices.companionPublishingAnnual)} for twelve months. Choose one publishing plan.` },
  ]) {
    const card = element('article', null, 'reference-plan');
    card.append(element('h3', plan.title), element('p', formatReferencePrice(plan.amount), 'reference-plan-price'), element('p', plan.period, 'profile-small'), element('p', plan.copy, 'profile-copy'), element('p', plan.note, 'reference-plan-note'));
    cards.append(card);
  }
  plans.append(cards);
  container.append(plans);

  const faq = element('section', null, 'how-faq');
  faq.setAttribute('aria-labelledby', 'faq-heading');
  const faqTitle = element('h2', 'A few useful things to know');
  faqTitle.id = 'faq-heading';
  faq.append(faqTitle);
  for (const [question, answer] of [
    ['Does one subscription unlock every companion?', 'No. An individual subscription applies to the selected companion. Subscribing to one companion does not unlock another.'],
    ['Is the booked experience included?', 'No. A subscription unlocks content, communication, and booking-request access. Companionship time and agreed expenses are separately priced.'],
    ['Does Premium include companion messaging?', 'No. Premium is a separate user membership for posting and boost benefits. It does not replace an individual companion subscription.'],
    ['Can I sign up, subscribe, or book now?', backendEnabled ? 'Development registration and private draft storage are available. Public profiles are fictional; subscriptions, private marketplace content, messaging, calls, payments, and bookings remain unconnected.' : 'Not yet. This is a frontend demo with fictional profiles and ads. Accounts, private content, messages, calls, payments, and bookings are not connected.'],
    ['What happens after I request a booking?', 'The planned flow lets the companion accept, decline, or propose revisions. Deposit, cancellation, and remaining-balance rules are still being finalized; no booking payment is collected here.'],
  ]) {
    const details = element('details');
    details.append(element('summary', question), element('p', answer, 'profile-copy'));
    faq.append(details);
  }
  container.append(faq);
  const closing = element('div', null, 'how-closing');
  closing.append(element('h2', 'Start with a little curiosity.'), element('p', 'Explore the fictional profiles and plans in the current preview.', 'profile-copy'));
  const browse = element('a', 'Explore discovery', 'button primary');
  browse.href = './';
  browse.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onDiscover();
  });
  closing.append(browse);
  container.append(closing);
}
