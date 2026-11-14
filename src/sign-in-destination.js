// Navigation hints only. Each destination still authenticates and authorizes access.
const destinations = new Set([
  'account', 'account-security', 'provider-setup', 'user-setup', 'edit-profile',
  'edit-user-profile', 'my-listings', 'create-listing', 'experiences', 'availability',
  'booking-draft', 'booking-inbox-preview', 'messages-preview', 'photo-preview',
  'draft-backup', 'provider-application', 'provider-review', 'profile-review', 'listing-review', 'pilot-eligibility',
]);
export function signInDestination(value) {
  if (typeof value !== 'string' || !value.startsWith('?') || value.length > 2048) return null;
  const params = new URLSearchParams(value.slice(1).split('#')[0]);
  const page = params.get('page');
  if (params.getAll('page').length !== 1 || !destinations.has(page)) return null;
  // Do not carry credentials, nested returns, object identifiers or editor-reset flags.
  return `?${new URLSearchParams({ page })}`;
}
export function accountEntryLink(page, destination) {
  const params = new URLSearchParams({ page });
  const next = signInDestination(destination);
  if (['sign-in', 'register', 'confirm-account', 'recover-account'].includes(page) && next) params.set('next', next);
  return `?${params}`;
}
