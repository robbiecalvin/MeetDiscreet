// Entirely synthetic fixtures. Never treat these as accounts or live presence.
export const providers = [
  { id: 'alex', name: 'Alex', age: 29, city: 'Vancouver', area: 'Kitsilano', online: true, interest: 'Coffee', bio: 'Slow mornings, good coffee, and conversations that go somewhere.', photo: 3 },
  { id: 'maya', name: 'Maya', age: 28, city: 'Vancouver', area: 'Mount Pleasant', online: true, interest: 'Culture', bio: 'An art gallery, an independent cinema, a new perspective. Let’s explore.', photo: 2 },
  { id: 'james', name: 'James', age: 34, city: 'Vancouver', area: 'Yaletown', online: false, interest: 'Dining', bio: 'Always curious about the next neighbourhood restaurant.', photo: 1 },
  { id: 'sophie', name: 'Sophie', age: 27, city: 'Vancouver', area: 'West End', online: true, interest: 'Outdoors', bio: 'A seawall walk and a little fresh air make a good afternoon.', photo: 4 },
  { id: 'daniel', name: 'Daniel', age: 32, city: 'Vancouver', area: 'Gastown', online: false, interest: 'Culture', bio: 'Live music, local history, and finding the unexpected.', photo: 5 },
  { id: 'amelia', name: 'Amelia', age: 30, city: 'Vancouver', area: 'Coal Harbour', online: true, interest: 'Dining', bio: 'A relaxed dinner and a conversation worth lingering over.', photo: 0 },
  { id: 'noah', name: 'Noah', age: 31, city: 'Vancouver', area: 'Olympic Village', online: true, interest: 'Outdoors', bio: 'City walks, waterfront sunsets, and a good sense of humour.', photo: 6 },
  { id: 'isabel', name: 'Isabel', age: 26, city: 'Vancouver', area: 'Kitsilano', online: false, interest: 'Coffee', bio: 'Bookshops and tucked-away cafés are my favourite places to start.', photo: 7 },
  { id: 'leo', name: 'Leo', age: 33, city: 'Vancouver', area: 'Downtown', online: true, interest: 'Dining', bio: 'From a casual lunch to a new tasting menu. Good company comes first.', photo: 8 },
  { id: 'elena', name: 'Elena', age: 29, city: 'Vancouver', area: 'Fairview', online: false, interest: 'Culture', bio: 'A gallery afternoon with no rush to be anywhere else.', photo: 9 },
  { id: 'sam', name: 'Sam', age: 30, city: 'Toronto', area: 'The Annex', online: true, interest: 'Coffee', bio: 'A coffee and a wander through the neighbourhood.', photo: 10 },
  { id: 'camille', name: 'Camille', age: 28, city: 'Montréal', area: 'Plateau', online: false, interest: 'Culture', bio: 'Let’s discover a little more of the city, one afternoon at a time.', photo: 11 },
];
export const ads = [
  { id: 'gallery', provider: 'maya', category: 'offering', title: 'An afternoon for art & a little conversation', description: 'Explore a gallery, find a quiet café, and see where the afternoon takes us.', posted: '2026-11-08T16:00:00Z' },
  { id: 'dinner', provider: 'james', category: 'offering', title: 'Make a dinner reservation worth keeping', description: 'Easy conversation and a new restaurant to discover. A relaxed evening in the city.', posted: '2026-11-08T14:00:00Z' },
  { id: 'walk', provider: 'sophie', category: 'offering', title: 'A seawall stroll, at your own pace', description: 'Fresh air, a waterfront view, and time to catch up with someone new.', posted: '2026-11-07T17:00:00Z' },
  { id: 'coffee', provider: 'alex', category: 'offering', title: 'Your next favourite coffee spot', description: 'Skip the rush. Let’s find a corner table and enjoy a good conversation.', posted: '2026-11-07T12:00:00Z' },
  { id: 'concert', provider: 'daniel', category: 'looking', title: 'A little live music this weekend?', description: 'Looking for company for an evening of live music and a bite to eat.', posted: '2026-11-08T15:00:00Z' },
  { id: 'books', provider: 'isabel', category: 'looking', title: 'Bookshop browsing & a coffee afterwards', description: 'A low-key afternoon exploring the neighbourhood and swapping reading recommendations.', posted: '2026-11-07T11:00:00Z' },
  { id: 'toronto', provider: 'sam', category: 'offering', title: 'A coffee and a fresh perspective', description: 'Discover a neighbourhood café and enjoy unhurried conversation.', posted: '2026-11-06T12:00:00Z' },
  { id: 'montreal', provider: 'camille', category: 'offering', title: 'An afternoon around the Plateau', description: 'Art, architecture, and a little time to explore.', posted: '2026-11-06T11:00:00Z' },
];
