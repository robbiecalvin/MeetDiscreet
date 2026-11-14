import { loadOwnerProfileApproval } from './backend/profile-approval.js';

export function profileCopyApproval(owner, id, isCurrent) {
  const section = document.createElement('section');
  section.className = 'profile-copy-approval';
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'button quiet';
  button.textContent = 'Check editorial approval for this copy';
  const result = document.createElement('p');
  result.className = 'profile-small'; result.setAttribute('role', 'status'); result.tabIndex = -1;
  const current = () => section.isConnected && isCurrent();
  let busy = false;
  button.addEventListener('click', async () => {
    if (busy || !current()) return;
    busy = true; button.disabled = true;
    result.replaceChildren('Checking editorial approval…');
    try {
      const value = await loadOwnerProfileApproval(owner, id);
      if (!current()) return;
      if (!value) {
        result.textContent = 'No editorial approval recorded for this copy. This does not indicate rejection or public visibility.';
      } else {
        result.textContent = 'Editorial approval recorded for this exact copy. Approval does not publish your profile, verify your identity or grant paid access.';
        const parsed = typeof value.approved_at === 'string' ? new Date(value.approved_at) : null;
        if (parsed && !Number.isNaN(parsed.getTime())) {
          const time = document.createElement('time');
          time.dateTime = value.approved_at;
          time.textContent = parsed.toLocaleString(undefined, { timeZoneName: 'short' });
          result.append(' Approved ', time, '.');
        } else result.append(' Approval date unavailable.');
        result.append(' Withdrawing a submission or reviewing a replacement does not overwrite this approval record.');
      }
    } catch {
      if (current()) result.textContent = 'Editorial approval status unavailable. Check sign-in, connection and database setup, then retry. No approval or rejection is inferred.';
    } finally {
      busy = false;
      if (current()) { button.disabled = false; result.focus(); }
    }
  });
  section.append(button, result);
  return section;
}
