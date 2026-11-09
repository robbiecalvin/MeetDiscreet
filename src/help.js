import { backendEnabled } from './backend/client.js';
const questions = [
  { topic: 'getting-started', question: 'How do I find company?', answer: 'Browse the people grid or switch to ads. Use the city selector, search, online filter, and interest filter to narrow the fictional demo results. A selected city is not your device location.' },
  { topic: 'getting-started', question: 'Why do I see an age confirmation?', answer: 'Normal browsing requires you to confirm that you are 18 or older. This browser remembers confirmation for 30 days when storage is available. Help and guidelines can be read without confirming. This is self-attestation, not identity verification.' },
  { topic: 'profiles', question: 'Are the profiles and online indicators real?', answer: 'No. Names, photos, profiles, ads, and online statuses are fictional demo content. The current preview is not connected to a live marketplace or presence service.' },
  { topic: 'profiles', question: 'What do the locked profile previews mean?', answer: 'They label sections intended for registered members or subscribers to the particular companion. The preview contains no private content. Viewing a label or clicking the subscription explanation does not unlock an entitlement.' },
  { topic: 'profiles', question: 'Can I message a companion or make a booking?', answer: 'Not in this demo. Messages, calls, and booking requests require the relevant companion subscription and real backend integrations in the planned service. Those features are not connected here.' },
  { topic: 'drafts', question: 'How do I preview a listing draft?', answer: 'Open Post a listing, choose Offering or Looking For, and enter fictional public-style details. Use a fictional example if you want a starting point, then choose Preview draft. Back to editing lets you revise it.' },
  { topic: 'drafts', question: 'Why did my draft disappear after refreshing?', answer: backendEnabled ? 'Unsaved edits stay only in memory and clear on refresh. Signed-in development accounts can explicitly save and load their own private profile, listing, and experience catalogue drafts (catalogue storage requires its migration). Saving does not publish them or change discovery.' : 'The editor keeps a draft only in memory. It survives navigation within the running app, but a full page refresh clears it. No listing is saved, published, or added to discovery.' },
  { topic: 'plans-support', question: 'How are subscriptions, Premium, and publishing different?', answer: 'A companion subscription applies to one companion. Premium provides user posting and boost benefits. A companion publishing plan is a separate product for profile/ad eligibility. A booked experience is priced separately. See How it works for the established reference amounts.' },
  { topic: 'plans-support', question: 'Can I pay or manage a refund here?', answer: 'No. There is no checkout, charge, billing account, or refund action in this frontend demo. Currency, renewals, cancellations, taxes, and booking-payment rules remain pending. No payment or refund request can be submitted here.' },
  { topic: 'plans-support', question: 'How do I contact support or report a concern?', answer: 'A support inbox, report submission, and blocking tools have not been connected to this preview. This page answers demo questions only and does not send messages or reports. The planned service must provide reporting and blocking without requiring paid access; its operational contact route remains to be selected.' },
];
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function renderHelp(container, onReturn, onNavigate, onExit) {
  container.replaceChildren();
  const header = element('header', null, 'policy-header');
  const brand = element('a', 'meetdiscreet.', 'wordmark');
  brand.href = './';
  const exit = element('button', 'Exit', 'button quiet');
  exit.addEventListener('click', onExit);
  header.append(brand, exit);
  const main = element('main', null, 'help-main');
  main.id = 'help-main';
  main.tabIndex = -1;
  const back = element('button', '← Return to where I was', 'policy-return');
  back.addEventListener('click', onReturn);
  const intro = element('div', null, 'policy-intro');
  intro.append(element('p', 'A LITTLE HELP ALONG THE WAY', 'eyebrow'), element('h1', 'What would you like to know?'), element('p', 'Find your way around the preview, profiles, and plans.', 'offering-lead'));
  main.append(back, intro);

  const controls = element('div', null, 'help-controls');
  const searchGroup = element('div');
  const topicGroup = element('div');
  const searchLabel = element('label', 'Search help');
  const search = element('input');
  search.type = 'search';
  search.id = 'help-search';
  search.placeholder = 'Try profiles, drafts, or subscriptions';
  searchLabel.htmlFor = search.id;
  searchGroup.append(searchLabel, search);
  const topicLabel = element('label', 'Topic');
  const topic = element('select');
  topic.id = 'help-topic';
  topicLabel.htmlFor = topic.id;
  for (const [value, text] of [['all', 'All topics'], ['getting-started', 'Getting started'], ['profiles', 'Profiles & access'], ['drafts', 'Listing drafts'], ['plans-support', 'Plans & support']]) {
    const option = element('option', text);
    option.value = value;
    topic.append(option);
  }
  topicGroup.append(topicLabel, topic);
  controls.append(searchGroup, topicGroup);
  const status = element('p', null, 'help-result-count');
  status.setAttribute('role', 'status');
  const results = element('section', null, 'help-results');
  results.setAttribute('aria-label', 'Help answers');
  const empty = element('div', null, 'help-empty');
  empty.hidden = true;
  empty.append(element('h2', 'No matching answers yet.'), element('p', 'Try another word or choose a different topic.', 'profile-copy'));
  const reset = element('button', 'Clear help filters', 'button outline');
  reset.addEventListener('click', () => { search.value = ''; topic.value = 'all'; filter(); search.focus(); });
  empty.append(reset);
  function filter() {
    const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const matches = questions.filter((item) => (topic.value === 'all' || item.topic === topic.value) && words.every((word) => `${item.question} ${item.answer}`.toLocaleLowerCase().includes(word)));
    results.replaceChildren();
    for (const item of matches) {
      const details = element('details');
      details.open = words.length > 0;
      details.append(element('summary', item.question), element('p', item.answer, 'profile-copy'));
      results.append(details);
    }
    status.textContent = `${matches.length} ${matches.length === 1 ? 'answer' : 'answers'}`;
    empty.hidden = matches.length > 0;
  }
  search.addEventListener('input', filter);
  topic.addEventListener('change', filter);
  filter();
  main.append(controls, status, results, empty);

  const links = element('section', null, 'help-quick-links');
  links.setAttribute('aria-labelledby', 'help-links-title');
  const title = element('h2', 'Find your next step');
  title.id = 'help-links-title';
  const grid = element('div', null, 'help-link-grid');
  for (const [label, page, copy] of [['Explore discovery', null, 'Browse fictional profiles and ads.'], ['Understand the plans', 'how-it-works', 'Compare the separate reference products.'], ['Try a listing draft', 'create-listing', 'Write, preview, and revise a fictional plan.'], ['Read the guidelines', 'guidelines', 'Understand the current scope and boundaries.']]) {
    const card = element('a', null, 'help-link-card');
    card.href = page ? `?page=${page}` : './';
    card.append(element('h3', label), element('p', copy));
    card.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); onNavigate(page);
    });
    grid.append(card);
  }
  links.append(title, grid);
  const note = element('aside', null, 'help-support-note');
  note.append(element('h2', 'About support in this preview'), element('p', 'No support inbox or report submission is connected. This page does not collect or send personal messages, account information, or payment details. The operational support route still needs to be selected before live use.', 'profile-copy'));
  main.append(links, note);
  container.append(header, main);
}
