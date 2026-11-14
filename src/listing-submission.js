import { requireUser } from './backend/client.js';
import { loadListingSubmissionReview, submitListingCopy, withdrawListingCopy } from './backend/listing-submissions.js';
function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  if (className) item.className = className;
  return item;
}
const fields = [['title', 'Title'], ['description', 'Description'], ['city', 'City'], ['area', 'Area'], ['activity', 'Activity']];
export function listingSubmission(listing, isCurrent) {
  const section = node('details', null, 'listing-submission');
  section.append(node('summary', 'Prepare a private listing submission'));
  section.append(node('p', 'Review the saved version before recording a private copy. Editing the draft later does not change the recorded copy. Submission does not publish a listing or grant posting access.', 'profile-small'));
  const actions = node('div', null, 'editor-actions');
  const review = node('button', 'Review saved listing and submission', 'button outline'); review.type = 'button';
  const submit = node('button', 'Submit this saved listing copy', 'button primary'); submit.type = 'button'; submit.disabled = true;
  const withdraw = node('button', 'Withdraw listing copy', 'button quiet'); withdraw.type = 'button'; withdraw.hidden = true;
  const status = node('p', '', 'profile-small'); status.setAttribute('role', 'status'); status.tabIndex = -1;
  const content = node('div'); actions.append(review, submit, withdraw); section.append(actions, status, content);
  let owner = null, candidate = null, pending = null, busy = false;
  const current = () => section.isConnected && isCurrent();
  function sync() {
    review.disabled = busy;
    submit.disabled = busy || !candidate || Boolean(pending);
    withdraw.hidden = !pending; withdraw.disabled = busy;
  }
  function paint(saved, recorded) {
    candidate = saved; pending = recorded; content.replaceChildren();
    const value = recorded?.recorded_fields || saved;
    if (value) {
      content.append(node('h3', recorded ? 'Active recorded listing copy' : 'Saved listing version for submission'));
      const dl = node('dl');
      for (const [key, label] of fields) dl.append(node('dt', label), node('dd', value[key] || 'Not supplied'));
      content.append(node('p', (recorded?.kind || saved.kind) === 'offering' ? 'Offering' : 'Looking For', 'eyebrow'), dl);
      const stamp = recorded?.submitted_at || saved.updated_at;
      const parsed = typeof stamp === 'string' ? new Date(stamp) : null;
      if (parsed && !Number.isNaN(parsed.getTime())) {
        const line = node('p', recorded ? 'Recorded ' : 'Saved ', 'profile-small');
        const time = node('time', parsed.toLocaleString(undefined, { timeZoneName: 'short' })); time.dateTime = stamp;
        line.append(time); content.append(line);
      }
    }
    sync();
  }
  async function run(action) {
    if (busy || !current()) return;
    busy = true; sync(); content.replaceChildren(); status.textContent = 'Checking private listing submission…';
    try {
      const user = await requireUser(); if (!current()) return;
      if (owner && owner !== user.id) throw new Error('Account changed.');
      owner = user.id;
      const result = await action(); if (!current()) return;
      paint(result.saved, result.pending);
      status.textContent = result.pending
        ? 'Private listing copy recorded. Withdraw it before submitting a replacement. Public approval and visibility are separate.'
        : result.saved ? 'Saved fields loaded. Review them before submitting. Looking For requires User membership; Offering also requires Provider membership.'
          : 'This saved listing is no longer available. No new copy can be submitted here.';
    } catch {
      if (current()) {
        candidate = null; pending = null; content.replaceChildren();
        status.textContent = 'Listing submission status unavailable. Check sign-in, membership and database setup, then review again before retrying. A previous request may have completed.';
      }
    } finally { busy = false; if (current()) { sync(); status.focus(); } }
  }
  review.addEventListener('click', () => run(() => loadListingSubmissionReview(owner, listing)));
  submit.addEventListener('click', () => {
    if (busy || !candidate || pending || !window.confirm('Record this exact saved listing privately? This does not publish it or grant paid posting access.')) return;
    const version = candidate.updated_at;
    run(async () => {
      const recorded = await submitListingCopy(owner, listing, version);
      return { saved: null, pending: recorded };
    });
  });
  withdraw.addEventListener('click', () => {
    if (busy || !pending || !window.confirm('Withdraw this listing copy? Your saved draft and the recorded submission history are kept.')) return;
    const id = pending.id;
    run(async () => {
      await withdrawListingCopy(owner, id);
      return loadListingSubmissionReview(owner, listing);
    });
  });
  return section;
}
