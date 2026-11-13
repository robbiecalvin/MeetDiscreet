// Keep only the active view's guard in memory; never retain feedback outside its DOM.
let active = null;
export function clearRouteLeave() { active = null; }
export function registerRouteLeave(root, check) { active = {root, check}; }
export function allowRouteLeave() {
  if (!active) return true;
  if (!active.root.isConnected || active.root.closest('[hidden]')) { active = null; return true; }
  return active.check();
}
export function pushRouteState(state, title, url) {
  if (!allowRouteLeave()) return false;
  history.pushState(state, title, url);
  active = null;
  return true;
}
