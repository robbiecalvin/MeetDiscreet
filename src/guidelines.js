// Working public policy summary of docs/product/content_and_boundaries.md.
const sections = [
  { id: 'shared-experiences', title: 'Company for shared experiences', intro: 'MeetDiscreet’s current scope is paid platonic dates and social experiences: coffee, dinner, galleries, concerts, celebrations, and other agreed social activities.', points: ['Profiles, listings, media, messages, and bookings must stay within that scope.', 'No sexual-service advertising, erotic add-ons, prices tied to intimate contact, or negotiation of sexual services.', 'An outing does not promise romance, affection, attraction, or guaranteed chemistry.'] },
  { id: 'eligibility', title: 'Adults and honest identities', intro: 'The current product direction is for adults aged 18 or older. Entrance confirmation is self-attestation, not identity verification.', points: ['Do not misrepresent your age or another person’s identity, use stolen photographs, or claim checks that have not happened.', 'Requests involving minors and sexualized content involving minors are not permitted.', 'The account-level eligibility and verification process must be finalized before launch. A profile or verification label is not a guarantee of safety or trustworthiness.'] },
  { id: 'personal-boundaries', title: 'Your participation is always your choice', intro: 'A subscription, payment, booking, or previous meeting does not entitle anyone to physical contact, affection, romance, private contact details, continuous replies, or continued participation.', points: ['Either participant may decline a request or end an interaction.', 'Agree changes to activities, venue, schedule, duration, presentation, and expenses through the relevant booking process.', 'Harassment, threats, coercion, repeated unwanted contact, and attempts to bypass a block are not permitted.', 'Ending an interaction does not automatically determine charges or refunds. Financial outcomes need to follow confirmed booking policies; those policies remain pending.'] },
  { id: 'content-and-media', title: 'Share content with permission', intro: 'Profile and subscriber media must match the same platonic service scope. Paying for subscriber access does not create a different content standard.', points: ['Portraits, introductions, hobbies, outfit previews, activity highlights, and non-sexual videos may fit the service.', 'Explicit nudity, sexual acts, erotic performances, and sexual-service advertising are not permitted.', 'Do not share material without necessary permission, impersonate someone, or expose private messages, media, or identifying information.', 'Nonconsensual recording is not permitted. Call recording is not enabled by default.'] },
  { id: 'privacy-and-authenticity', title: 'Respect privacy and keep information accurate', intro: 'Use general locations in public profiles and ads. Private addresses, meeting details, login emails, phone numbers, identity documents, and payment credentials do not belong in public listings.', points: ['Do not publish someone else’s private information, impersonate them, or make fraudulent payment requests.', 'Reviews must follow the confirmed eligibility rules. No fabricated booking claims, threats, doxxing, impersonation, or demands for payment to remove a review.', 'Criticism is not automatically abuse. Reports are allegations, not established findings.', 'The MeetDiscreet name does not promise complete anonymity or confidentiality. Privacy statements must reflect what the service actually implements.'] },
  { id: 'reporting-and-review', title: 'Reporting, blocking, and fair review', intro: 'The planned service must offer reporting and blocking without requiring paid access, with an appropriate support route when normal account access is unavailable.', points: ['Reporting and blocking are not connected in this frontend preview. This page does not collect or submit reports.', 'The operational process for review, restrictions, participant notification, and appeals must be finalized before affected features launch.', 'Reporter identities must not be automatically disclosed to the reported account. Blocking must not silently erase bookings, payments, or disputes.', 'A keyword alone does not establish a violation. Consequential moderation decisions need appropriate evidence and recorded reasons; no automated or comprehensive enforcement is claimed here.'] },
];
function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

export function renderGuidelines(container, onReturn, onExit) {
  container.replaceChildren();
  const header = element('header', null, 'policy-header');
  const brand = element('a', 'meetdiscreet.', 'wordmark');
  brand.href = './';
  const exit = element('button', 'Exit', 'button quiet');
  exit.addEventListener('click', onExit);
  header.append(brand, exit);
  const main = element('main', null, 'policy-main');
  main.id = 'guidelines-main';
  main.tabIndex = -1;
  const back = element('button', '← Return to where I was', 'policy-return');
  back.addEventListener('click', onReturn);
  const intro = element('div', null, 'policy-intro');
  intro.append(element('p', 'A LITTLE CLARITY FOR EVERYONE', 'eyebrow'), element('h1', 'Community Guidelines & Boundaries'), element('p', 'Shared experiences work best when expectations, personal choices, and privacy are respected.', 'offering-lead'));
  const status = element('p', 'Working preview based on the current product requirements. Account verification, reporting, blocking, and moderation operations are not connected. Final policies and procedures remain subject to review before launch.', 'policy-preview-note');
  const nav = element('nav', null, 'policy-contents');
  nav.setAttribute('aria-label', 'On this page');
  nav.append(element('h2', 'On this page'));
  const list = element('ol');
  for (const section of sections) {
    const item = element('li');
    const link = element('a', section.title);
    link.href = `#${section.id}`;
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const url = new URL(location.href);
      url.hash = section.id;
      history.pushState(history.state, '', url);
      const target = document.getElementById(section.id);
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      target.focus({ preventScroll: true });
    });
    item.append(link);
    list.append(item);
  }
  nav.append(list);
  main.append(back, intro, status);
  const layout = element('div', null, 'policy-layout');
  const content = element('article', null, 'policy-article');
  for (const [index, data] of sections.entries()) {
    const section = element('section');
    section.id = data.id;
    section.tabIndex = -1;
    section.setAttribute('aria-labelledby', `${data.id}-heading`);
    const title = element('h2', data.title);
    title.id = `${data.id}-heading`;
    const points = element('ul');
    for (const point of data.points) points.append(element('li', point));
    section.append(element('p', `0${index + 1}`, 'eyebrow'), title, element('p', data.intro), points);
    content.append(section);
  }
  layout.append(nav, content);
  main.append(layout);
  const bottom = element('div', null, 'policy-bottom');
  bottom.append(element('p', 'Reading these guidelines does not confirm your age, create an account, record policy acceptance, or grant access. Terms, Privacy, and payment/cancellation documents have separate purposes.', 'profile-copy'));
  const returnButton = element('button', 'Return to where I was', 'button outline');
  returnButton.addEventListener('click', onReturn);
  bottom.append(returnButton);
  main.append(bottom);
  container.append(header, main);
}
