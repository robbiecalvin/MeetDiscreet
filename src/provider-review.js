import './staff-review.css';
import { trackDraft } from './draft-changes.js';
import { providerApprovalHistory } from './provider-approval-history.js';
import { backendEnabled } from './backend/client.js';
import { loadProviderReviewAccess, listProviderReviewQueue, loadProviderReviewDetail, loadProviderFeedbackAccess, requestProviderChanges, loadProviderApprovalAccess, approveProviderApplication } from './backend/provider-review.js';
// Read only the current visible form; the shared tracker must not retain a
// detached staff workspace or its private feedback text after navigation/sign-out.
trackDraft('provider-review-feedback', () => {
  const input = document.querySelector('.provider-review .review-feedback-form textarea');
  return input && !input.closest('[hidden]') ? input.value.trim() : '';
}, backendEnabled);
function node(tag, text, className) {
  const value = document.createElement(tag);
  if (text) value.textContent = text;
  if (className) value.className = className;
  return value;
}
function submissionDate(value) {
  const line = node('p', null, 'review-submitted profile-small');
  const parsed = typeof value === 'string' && value.trim() ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    line.textContent = 'Submission date unavailable.';
    return line;
  }
  const time = node('time', parsed.toLocaleString(undefined, { timeZoneName: 'short' }));
  time.dateTime = parsed.toISOString();
  line.append('Submitted ', time);
  return line;
}
export function renderProviderReview(container, navigate) {
  container.replaceChildren();
  const root = node('section', null, 'provider-review');
  let feedbackInput = null;
  const confirmDiscard = () => !feedbackInput?.value.trim() || window.confirm('Discard this unsent feedback note? It has not been sent to the applicant.');
  const back = node('a', '← Back to account', 'profile-back'); back.href = '?page=account';
  back.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); if (confirmDiscard()) navigate('account'); });
  root.append(back, node('p', 'STAFF WORKSPACE', 'eyebrow'), node('h1', 'Provider application queue.'), node('p', 'Inspect submitted introductions with explicitly assigned review access.', 'offering-lead'), node('p', 'Staff review workspace. Requesting changes and approving pilot Provider access require separate permissions. Identity checks, paid access and publishing remain separate.', 'editor-notice'));
  const status = node('p', '', 'review-status'); status.setAttribute('role', 'status');
  const refresh = node('button', 'Refresh review queue', 'button outline'); refresh.type = 'button';
  const searchForm = node('form',null,'review-search'); searchForm.hidden=true;
  const searchLabel=node('label','Search pending applications');searchLabel.htmlFor='review-search';
  const search=node('input');search.id='review-search';search.type='search';search.maxLength=100;search.placeholder='Applicant name or city';search.autocomplete='off';
  const searchSubmit=node('button','Search queue','button outline');searchSubmit.type='submit';
  const clearSearch=node('button','Clear queue search','button quiet');clearSearch.type='button';clearSearch.disabled=true;
  searchForm.append(searchLabel,search,searchSubmit,clearSearch);
  const list = node('div', null, 'review-queue'); list.setAttribute('aria-label', 'Submitted provider applications');
  const detail = node('section', null, 'review-detail'); detail.hidden = true;
  const pages = node('div', null, 'editor-actions');
  const previous = node('button', 'Previous applications', 'button quiet'); previous.type = 'button';
  const next = node('button', 'Next applications', 'button outline'); next.type = 'button';
  pages.append(previous, next); pages.hidden = true;
  root.append(status, refresh, searchForm, list, pages, detail); container.append(root);
  if (!backendEnabled) { status.textContent = 'Staff review requires the connected backend and explicitly assigned staff permissions. No application data is available in this preview.'; refresh.hidden = true; return; }
  let reviewerId = null;
  let query = '';
  let cursors = [null];
  let page = 0;
  let rows = [];
  let hasNext = false;
  let version = 0;
  const current = request => root.parentNode === container && request === version;
  const ownApprovals = providerApprovalHistory(root, () => root.parentNode === container);
  function clearData() { feedbackInput = null; ownApprovals.setAccess(null,false); list.replaceChildren(); detail.replaceChildren(); detail.hidden = true; pages.hidden = true; rows = []; }
  async function showDetail(ownerId) {
    if (!confirmDiscard()) return;
    feedbackInput = null;
    const request = ++version;
    detail.replaceChildren(); detail.hidden = true; status.textContent = 'Loading submitted application…';
    try {
      const value = await loadProviderReviewDetail(reviewerId, ownerId);
      if (!current(request)) return;
      if (!value) { await load(true); return; }
      const heading = node('h2', value.display_name); heading.tabIndex = -1;
      const close = node('button', 'Close application details', 'button quiet'); close.type = 'button';
      close.addEventListener('click', () => { if (!confirmDiscard()) return; feedbackInput = null; version++; detail.replaceChildren(); detail.hidden = true; status.textContent = `${rows.length} submitted applications on this page.`; refresh.focus(); });
      detail.append(heading, node('p', value.city, 'profile-small'), submissionDate(value.submitted_at), node('p', 'SUBMITTED INTRODUCTION', 'eyebrow'), node('p', value.introduction, 'review-introduction'), node('p', 'Inspect this submitted version before making a separately authorized decision.', 'profile-small'), close);
      if (value.submission_id && value.owner_id !== reviewerId) {
        const [feedbackAccess, approvalAccess] = await Promise.allSettled([loadProviderFeedbackAccess(reviewerId),loadProviderApprovalAccess(reviewerId)]);
        const canGiveFeedback = feedbackAccess.status==='fulfilled' && feedbackAccess.value;
        const canApprove = approvalAccess.status==='fulfilled' && approvalAccess.value;
        let deciding = false;
        const decisionControls = [];
        const setDeciding = active => { deciding=active; for(const control of decisionControls) control.disabled=active; };

        if (!current(request)) return;
        if (canGiveFeedback) {
          const form = node('form', null, 'review-feedback-form');
          const label = node('label', 'Changes the applicant should make'); label.htmlFor = 'provider-change-note';
          const note = node('textarea'); note.id = 'provider-change-note'; note.rows = 4; note.maxLength = 1000; note.required = true; feedbackInput = note;
          const send = node('button', 'Request changes', 'button primary'); send.type = 'submit';
          const result = node('p', '', 'profile-small'); result.setAttribute('role', 'status');
          form.append(label, note, send, result);
          decisionControls.push(send,note);
          form.addEventListener('submit', async event => {
            event.preventDefault();
            if(deciding || !current(request))return;
            if (!note.value.trim()) { result.textContent = 'Describe the requested changes.'; note.focus(); return; }
            if (!window.confirm('Request changes to this submission? The applicant will be able to edit and resubmit. No Provider role is granted.')) return;
            setDeciding(true);
            try {
              await requestProviderChanges(reviewerId, value.owner_id, value.submission_id, note.value);
              if (!current(request)) return;
              await load(true);
            } catch { if (current(request)) result.textContent = 'Unable to request changes. Refresh the submission and check your access before retrying.'; }
            finally { setDeciding(false); }
          });
          detail.append(form);
        }
        if(canApprove) {
          const approval = node('section',null,'review-approval');
          approval.append(node('h3','Pilot Provider access'),node('p','Approval adds Provider access while keeping User features. It does not verify identity, enable paid access or publish a profile.','profile-small'));
          const approve=node('button','Approve Provider access','button primary');approve.type='button';
          const result=node('p','','profile-small');result.setAttribute('role','status');
          decisionControls.push(approve);
          approve.addEventListener('click',async()=>{
            if(deciding || !current(request))return;
            if(!window.confirm(`Approve pilot Provider access for ${value.display_name}? User access is retained. This does not verify identity or grant paid/publishing access.`))return;
            setDeciding(true);result.textContent='Recording approval…';
            try {
              await approveProviderApplication(reviewerId,value.owner_id,value.submission_id);
              if(!current(request))return;
              const pending=load(true);const reloadVersion=version;const reloaded=await pending;
              if(current(reloadVersion))status.textContent=reloaded ? 'Pilot Provider approval recorded. User access was retained. The review queue was refreshed.' : 'Pilot Provider approval recorded. The queue is unavailable; refresh to check current review access.';
            } catch {if(current(request))result.textContent='Unable to confirm approval. Refresh the queue and check current access before retrying.';}
            finally {setDeciding(false);}
          });
          approval.append(approve,result);detail.append(approval);
        }
      }
      detail.hidden = false; status.textContent = 'Submitted application loaded.'; heading.focus();
    } catch {
      if (current(request)) { clearData(); searchForm.hidden=true; reviewerId = null; status.textContent = 'Review access or application data is unavailable. Refresh to verify access again.'; }
    } finally { if (current(request)) refresh.disabled = false; }
  }
  async function load(reset = false) {
    const request = ++version; clearData(); refresh.disabled = true; status.textContent = 'Verifying review access…';
    let verifiedAccess=false;
    try {
      const access = await loadProviderReviewAccess();
      if (!current(request)) return;
      if (!access.allowed) { reviewerId = null; query='';search.value='';clearSearch.disabled=true;searchForm.hidden=true;status.textContent = 'This account does not have assigned provider-application review access.'; return; }
      reviewerId = access.reviewerId; verifiedAccess=true; searchForm.hidden=false;
      if (reset) { cursors = [null]; page = 0; }
      const [result, approvalAccess] = await Promise.all([
        listProviderReviewQueue(reviewerId, cursors[page], query),
        loadProviderApprovalAccess(reviewerId).catch(() => false),
      ]);
      if (!current(request)) return;
      ownApprovals.setAccess(reviewerId, approvalAccess);
      hasNext = result.length > 20; rows = result.slice(0, 20);
      status.textContent = rows.length ? `${rows.length} submitted applications on this page.${query ? ' Search active.' : ''} Oldest submissions first.` : query ? 'No submitted applications match this search.' : 'No submitted applications on this page.';
      for (const value of rows) {
        const card = node('article', null, 'review-card');
        const open = node('button', `Inspect ${value.display_name}`, 'button outline'); open.type = 'button'; open.addEventListener('click', () => showDetail(value.owner_id));
        card.append(node('h2', value.display_name), node('p', value.city, 'profile-small'), submissionDate(value.submitted_at), open); list.append(card);
      }
      previous.disabled = page === 0; next.disabled = !hasNext; pages.hidden = !rows.length && page === 0;
      return true;
    } catch { if (current(request)) { clearData(); searchForm.hidden=!verifiedAccess; status.textContent = verifiedAccess && query ? 'Unable to load matching applications. Clear the search or retry.' : 'Unable to verify review access or load the queue. Check sign-in, connection and setup, then retry.'; } }
    finally { if (current(request)) refresh.disabled = false; }
  }
  searchForm.addEventListener('submit',event=>{event.preventDefault();if(!confirmDiscard())return;query=search.value.trim();search.value=query;clearSearch.disabled=!query;load(true);});
  search.addEventListener('input',()=>{clearSearch.disabled=!search.value && !query;});
  clearSearch.addEventListener('click',()=>{if(!confirmDiscard())return;query='';search.value='';clearSearch.disabled=true;load(true);search.focus();});
  refresh.addEventListener('click', () => { if (confirmDiscard()) load(true); });
  next.addEventListener('click', () => { if (!hasNext || !rows.length || !confirmDiscard()) return; cursors[page + 1] = rows.at(-1); page++; load(); });
  previous.addEventListener('click', () => { if (page === 0 || !confirmDiscard()) return; page--; load(); });
  load(true);
}
