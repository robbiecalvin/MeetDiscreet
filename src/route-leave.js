// History metadata is navigation-only. It never authorizes a user or stores draft text.
const stateKey = 'meetdiscreetNavigation';
const newScope = () => crypto.randomUUID();
function marker(state) {
  const value = state?.[stateKey];
  return value && typeof value.scope === 'string' && value.scope && Number.isSafeInteger(value.position) && value.position >= 0 ? value : null;
}
const initial = marker(history.state);
let scope = initial?.scope || newScope(), position = initial?.position || 0;
let active = null, restoring = null;
const stamped = (state, index = position) => ({...(state || {}), [stateKey]: {scope, position: index}});
if (!initial) history.replaceState(stamped(history.state), '', location.href);
function liveGuard() {
  if (active && (!active.root.isConnected || active.root.closest('[hidden]'))) active = null;
  return active;
}
function rebase(url, state) {
  // An entry from outside this managed history cannot supply a reliable distance.
  scope = newScope(); position = 0;
  history.replaceState(stamped(state), '', url);
}
export function clearRouteLeave() { active = null; }
export function registerRouteLeave(root, check) { active = {root, check, url: location.href, state: history.state}; }
export function allowRouteLeave() { return liveGuard()?.check() ?? true; }
export function pushRouteState(state, title, url) {
  if (restoring || !allowRouteLeave()) return false;
  const next = position + 1;
  history.pushState(stamped(state, next), title, url);
  position = next; active = null;
  return true;
}
export function replaceRouteState(state, title, url) {
  history.replaceState(stamped(state), title, url);
  if (liveGuard()) { active.url = location.href; active.state = history.state; }
}
export function acceptRoutePop(event) {
  const target = marker(event.state);
  if (restoring) {
    if (target?.scope === scope && target.position === position) {
      const root = restoring.root; restoring = null;
      // Identity changes may already have replaced the guarded view; render safely anew.
      return !root.isConnected || !!root.closest('[hidden]');
    }
    return false;
  }
  const guard = liveGuard();
  if (guard) {
    const previous = new URL(guard.url), next = new URL(location.href);
    if (previous.pathname === next.pathname && previous.search === next.search) {
      // Same-view fragment traversal must not destroy a feedback form.
      if (target?.scope === scope) position = target.position;
      else rebase(location.href, event.state);
      guard.url = location.href; guard.state = history.state;
      document.getElementById(location.hash.slice(1))?.focus({preventScroll: true});
      return false;
    }
  }
  if (!allowRouteLeave()) {
    if (target?.scope === scope && target.position !== position) {
      restoring = {root: guard.root};
      history.go(position - target.position);
    } else {
      // Preserve the current DOM and restore its URL in place for an unindexed entry.
      rebase(guard.url, guard.state);
      guard.state = history.state;
    }
    return false;
  }
  if (target?.scope === scope) position = target.position;
  else rebase(location.href, event.state);
  active = null;
  return true;
}
