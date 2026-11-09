// Track snapshots only in memory. Never persist draft text or credentials here.
const drafts = new Map();
export function trackDraft(key, read, enabled = true) {
  let baseline = JSON.stringify(read());
  const tracker = {
    isDirty: () => enabled && JSON.stringify(read()) !== baseline,
    saved: (snapshot = read()) => { baseline = JSON.stringify(snapshot); },
  };
  drafts.set(key, tracker);
  return tracker;
}
export function hasUnsavedDrafts() {
  return [...drafts.values()].some(draft => draft.isDirty());
}
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', event => {
    if (!hasUnsavedDrafts()) return;
    event.preventDefault();
    event.returnValue = '';
  });
}
