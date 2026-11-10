function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function link(label, href, onClick, className) {
  const element = node('a', label, className); element.href = href;
  element.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onClick();
  });
  return element;
}
// Only fields already present on the fictional public card. Poster data is not
// a Provider role, a public User-profile permission or a full-post entitlement.
export function renderLookingFor(container, ad, poster, onBack, onDrafts) {
  container.replaceChildren();
  container.append(link('← Back to Looking For ads','./',onBack,'profile-back'));
  const root = node('div', null, 'looking-for-detail');
  const identity = node('div', null, 'offering-provider');
  const photo = node('div', null, `portrait portrait-${poster.photo} offering-avatar`);
  photo.setAttribute('role','img'); photo.setAttribute('aria-label',`Fictional portrait of ${poster.name}`);
  const byline = node('div', null, 'offering-provider-identity');
  byline.append(node('p','POSTED BY','eyebrow'),node('p',`${poster.name}, ${poster.age}`,'looking-poster'),node('p',`${poster.area}, ${poster.city}`,'profile-location'));
  identity.append(photo,byline,node('span','FICTIONAL LOOKING FOR','access-label')); root.append(identity);
  const layout = node('div',null,'offering-layout'); const article = node('article',null,'offering-content');
  article.append(node('p','LOOKING FOR · PUBLIC SUMMARY','eyebrow'),node('h1',ad.title));
  const summary = node('section',null,'offering-section'); summary.append(node('h2','The idea'),node('p',ad.description,'offering-lead'));
  const location = node('section',null,'offering-section'); location.append(node('h2','Around the neighbourhood'),node('p',`${poster.area}, ${poster.city}`,'offering-place'));
  const full = node('section',null,'offering-section'); full.append(node('h2','More about this post'),node('p','Full post and contact tools are not available in this preview.','profile-copy'));
  article.append(summary,location,full);
  const aside = node('aside',null,'offering-sidebar'); aside.append(node('p','A PLAN OF YOUR OWN','eyebrow'),node('h2','What would you like to do?'),node('p','Prepare your own Looking For draft. Publishing is not connected in this preview.','profile-copy'),link('Manage my Looking For drafts','?page=my-listings&kind=looking',onDrafts,'button primary looking-draft-action'));
  layout.append(article,aside); root.append(layout,node('p','Fictional post and poster. Only the information from the public ad card is shown.','profile-demo-note')); container.append(root);
}
