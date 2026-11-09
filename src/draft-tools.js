export function draftToolNavigation(activePage, onNavigate) {
  const nav = document.createElement('nav');
  nav.className = 'draft-tool-nav';
  nav.setAttribute('aria-label', 'Companion draft tools');
  for (const [page, label] of [['edit-profile', 'Profile draft'], ['experiences', 'Experience catalogue']]) {
    const link = document.createElement('a');
    link.textContent = label;
    link.href = `?page=${page}`;
    if (activePage === page) link.setAttribute('aria-current', 'page');
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); onNavigate(page);
    });
    nav.append(link);
  }
  return nav;
}
