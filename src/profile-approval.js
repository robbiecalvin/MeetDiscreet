import { loadProfileApproval, approveProfileCopy } from './backend/profile-approval.js';
function node(tag, text, className) {
  const item = document.createElement(tag); item.textContent = text;
  if (className) item.className = className;
  return item;
}
export function profileApproval(reviewer, id, ownCopy, isCurrent, onBusy) {
  const section = node('section', '', 'profile-editorial-approval');
  section.append(node('h3', 'Editorial approval'), node('p', 'Approval records this exact copy privately. Public visibility still requires publishing eligibility and real media. Existing approved versions are retained while replacements are reviewed.', 'profile-small'));
  const refresh = node('button', 'Refresh editorial approval', 'button quiet'); refresh.type = 'button';
  const status = node('p', 'Checking editorial approval…', 'profile-small'); status.setAttribute('role', 'status');
  const approve = node('button', 'Approve this profile copy', 'button primary'); approve.type = 'button'; approve.hidden = true;
  section.append(refresh, status, approve);
  let busy = false;
  const current = () => section.isConnected && isCurrent();
  function show(value) {
    approve.hidden = ownCopy || !value.allowed || Boolean(value.approval);
    status.textContent = value.approval
      ? 'Editorial approval recorded for this copy. This does not make it public.'
      : ownCopy ? 'Self approval is not permitted.' : value.allowed
        ? 'No editorial approval recorded. Current Administrator and publishing permission will be checked again when approving.'
        : 'Approval requires an Administrator with the explicit publishing capability.';
  }
  async function load() {
    if (busy) return;
    busy = true; refresh.disabled = true; approve.hidden = true;
    status.textContent = 'Checking editorial approval…';
    try { const value = await loadProfileApproval(reviewer, id); if (current()) show(value); }
    catch { if (current()) status.textContent = 'Approval status unavailable. Check current access and database setup, then refresh.'; }
    finally { busy = false; if (current()) refresh.disabled = false; }
  }
  approve.addEventListener('click', async () => {
    if (busy || !current() || !window.confirm('Record editorial approval for this exact profile copy? This does not publish it, grant paid access or approve a later replacement.')) return;
    busy = true; onBusy(true); approve.disabled = true; refresh.disabled = true;
    status.textContent = 'Recording editorial approval…';
    try {
      await approveProfileCopy(reviewer, id);
      if (current()) { approve.hidden = true; status.textContent = 'Editorial approval recorded. This copy remains private; no publishing entitlement was granted.'; }
    } catch {
      if (current()) { approve.hidden = true; status.textContent = 'Approval could not be confirmed. Refresh status before retrying; the copy may have changed or access may be unavailable.'; }
    } finally { busy = false; onBusy(false); if (current()) { approve.disabled = false; refresh.disabled = false; } }
  });
  refresh.addEventListener('click', load); load(); return section;
}
