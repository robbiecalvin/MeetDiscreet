import { loadPendingProfileSubmission, submitPrivateProfileCopy, withdrawPrivateProfileCopy } from './backend/profile-submissions.js';
function node(tag, text, className) { const item=document.createElement(tag); if(text)item.textContent=text;if(className)item.className=className;return item; }
export function profileSubmission(owner, current) {
  const section=node('section',null,'profile-submission account-permissions');
  section.append(node('h2','Your private profile submission'),node('p','Save an exact copy for the publication workflow. Staff publication decisions are not connected yet; this does not make a profile public.','profile-small'));
  section.append(node('p','Review the saved public fields above to enable submission. Current User and Provider membership is required.','profile-small'));
  const check=node('button','Check my private profile submission','button outline');check.type='button';
  const submit=node('button','Submit private profile copy','button primary');submit.type='button';submit.disabled=true;
  const withdraw=node('button','Withdraw private profile copy','button quiet');withdraw.type='button';withdraw.hidden=true;
  const status=node('p','','profile-small');status.setAttribute('role','status');status.tabIndex=-1;
  const content=node('div');const actions=node('div',null,'editor-actions');actions.append(check,submit,withdraw);section.append(actions,status,content);
  let candidate=null,pending=null,busy=false;
  function sync() { check.disabled=busy;submit.disabled=busy||!candidate?.updated_at||!!pending;withdraw.disabled=busy;withdraw.hidden=!pending; }
  function setCandidate(value) { candidate=value;sync(); }
  function paint(value) {
    pending=value;content.replaceChildren();
    if(value) {
      content.append(node('h3','Recorded public-field copy'));
      const fields=value.public_fields||{};const list=node('dl');
      for(const [key,label] of [['display_name','Display name'],['username','Username'],['adult_age','Age'],['city','City'],['area','General area'],['tagline','Tagline'],['photo_index','Demo photo selection']]) {
        list.append(node('dt',label),node('dd',fields[key]===null||fields[key]===undefined||fields[key]===''?'Not supplied':String(fields[key])));
      }
      content.append(list,node('p','This recorded copy stays unchanged when you edit the draft. Withdraw it before submitting a replacement. No public URL or publishing entitlement is created.','profile-small'));
    }
    sync();
  }
  async function run(action) {
    if(busy)return;busy=true;sync();content.replaceChildren();status.textContent='Checking private submission…';
    try { const value=await action();if(!current())return;paint(value);status.textContent=value?'Private profile copy recorded. Staff publication decisions are not connected yet.':'No pending private profile submission.'; }
    catch { if(current()){pending=null;content.replaceChildren();status.textContent='Unable to confirm private submission status. Check current Provider access, sign-in and setup, then check again before retrying.';} }
    finally {busy=false;if(current()){sync();status.focus();}}
  }
  check.addEventListener('click',()=>run(()=>loadPendingProfileSubmission(owner)));
  submit.addEventListener('click',()=>{
    if(busy||!candidate?.updated_at||pending)return;
    if(!window.confirm('Record this saved public-field copy privately? Current User and Provider membership is required. This does not publish a profile.'))return;
    const version=candidate.updated_at;setCandidate(null);run(()=>submitPrivateProfileCopy(owner,version));
  });
  withdraw.addEventListener('click',()=>{
    if(busy||!pending)return;
    if(!window.confirm('Withdraw this private profile copy? The saved profile draft is kept.'))return;
    const id=pending.id;run(async()=>{await withdrawPrivateProfileCopy(owner,id);return null;});
  });
  return {section,setCandidate};
}
