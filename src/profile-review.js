import {registerRouteLeave} from './route-leave.js';
import './staff-review.css';
import {trackDraft} from './draft-changes.js';
import {loadProfileFeedbackAccess} from './backend/profile-feedback.js';
import {profileFeedbackForm} from './profile-feedback-form.js';
import {backendEnabled} from './backend/client.js';
import {loadProfileReviewAccess,listProfileReviewQueue,loadProfileReviewCopy} from './backend/profile-review.js';
import {profileCopyFields} from './profile-submission-history.js';
trackDraft('profile-review-feedback',()=>{const input=document.querySelector('.profile-review .profile-feedback-form textarea');return input&&!input.closest('[hidden]')?input.value.trim():'';},backendEnabled);
function node(tag,text,className){const item=document.createElement(tag);if(text)item.textContent=text;if(className)item.className=className;return item;}
function time(label,value){const line=node('p',null,'profile-small');const parsed=typeof value==='string'?new Date(value):null;if(!parsed||Number.isNaN(parsed.getTime())){line.textContent=`${label}: date unavailable`;return line;}const stamp=node('time',parsed.toLocaleString(undefined,{timeZoneName:'short'}));stamp.dateTime=value;line.append(`${label} `,stamp);return line;}
export function renderProfileReview(container,navigate){
  container.replaceChildren();const root=node('section',null,'provider-review profile-review');
  let feedbackBusy=false;
  function confirmDiscard(){if(feedbackBusy){status.textContent='Wait for the feedback operation to finish before changing the review view.';return false;}return !detail.querySelector('.profile-feedback-form textarea')?.value.trim()||window.confirm('Discard the feedback draft in this view?');}
  const back=node('a','← Back to account','profile-back');back.href='?page=account';back.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate('account');});
  root.append(back,node('p','STAFF WORKSPACE','eyebrow'),node('h1','Profile submission review.'),node('p','Inspect recorded private profile copies with separately assigned review access.','offering-lead'),node('p','Profile inspection and separately scoped revision feedback. This workspace cannot approve, verify or publish a profile. Recorded copies do not confirm current Provider membership or paid access.','editor-notice'));
  const refresh=node('button','Refresh profile review queue','button outline');refresh.type='button';const status=node('p','','profile-small');status.setAttribute('role','status');status.tabIndex=-1;
  const searchForm=node('form',null,'review-search');searchForm.hidden=true;
  const label=node('label','Search pending profile copies');label.htmlFor='profile-review-search';
  const search=node('input');search.id=label.htmlFor;search.type='search';search.maxLength=100;search.autocomplete='off';search.placeholder='Recorded name or city';
  const searchButton=node('button','Search profile copies','button outline');searchButton.type='submit';
  const clearSearch=node('button','Clear profile search','button quiet');clearSearch.type='button';clearSearch.disabled=true;searchForm.append(label,search,searchButton,clearSearch);
  const list=node('div',null,'profile-review-queue');const pages=node('div',null,'editor-actions');pages.hidden=true;
  const previous=node('button','Previous profile copies','button quiet');previous.type='button';const next=node('button','Next profile copies','button outline');next.type='button';pages.append(previous,next);
  const detail=node('section',null,'review-detail profile-review-detail');detail.hidden=true;
  root.append(refresh,status,searchForm,list,pages,detail);container.append(root);registerRouteLeave(root,confirmDiscard);
  if(!backendEnabled){refresh.hidden=true;status.textContent='Profile review requires the connected backend and assigned staff scope. No private copies are available in this preview.';return;}
  let query='',reviewer=null,version=0,page=0,cursors=[null],rows=[],hasNext=false;
  const current=request=>request===version&&root.parentNode===container;
  function clear(){list.replaceChildren();detail.replaceChildren();detail.hidden=true;pages.hidden=true;rows=[];}
  async function inspect(id){
    if(!confirmDiscard())return;
    const request=++version;detail.replaceChildren();detail.hidden=true;refresh.disabled=true;status.textContent='Loading recorded profile copy…';
    try{
      const value=await loadProfileReviewCopy(reviewer,id);if(!current(request))return;
      if(!value){await load(true);return;}
      const heading=node('h2','Recorded public fields');heading.tabIndex=-1;
      const close=node('button','Close profile copy','button quiet');close.type='button';close.addEventListener('click',()=>{if(!confirmDiscard())return;version++;detail.replaceChildren();detail.hidden=true;status.textContent='Recorded copy closed.';refresh.focus();});
      detail.append(heading,time('Recorded',value.submitted_at),time('Source saved',value.source_updated_at),profileCopyFields(value.public_fields||{}),node('p','Exact recorded copy. Later private edits are excluded. Demo photo selection is a number, not an approved uploaded image.','profile-small'),close);
      const canFeedback=value.owner_id!==reviewer&&await loadProfileFeedbackAccess(reviewer).catch(()=>false);if(!current(request))return;if(canFeedback)detail.append(profileFeedbackForm(reviewer,value.id,()=>current(request),busy=>{feedbackBusy=busy;if(!busy&&current(request))status.textContent='Recorded profile copy loaded. Check the feedback result below.';}));
      detail.hidden=false;status.textContent='Recorded profile copy loaded. Revision feedback requires a separate permission.';heading.focus();
    }catch{if(current(request)){clear();reviewer=null;searchForm.hidden=true;status.textContent='Profile review access or recorded copy is unavailable. Refresh to check current access.';}}
    finally{if(current(request))refresh.disabled=false;}
  }
  async function load(reset=false){
    const request=++version;clear();refresh.disabled=true;status.textContent='Checking profile review access…';
    let verifiedAccess=false;
    try{
      const access=await loadProfileReviewAccess();if(!current(request))return;
      if(!access.allowed){reviewer=null;query='';search.value='';clearSearch.disabled=true;searchForm.hidden=true;status.textContent='This account does not have assigned profile-publication review access.';return;}
      reviewer=access.reviewerId;verifiedAccess=true;searchForm.hidden=false;if(reset){page=0;cursors=[null];}
      const result=await listProfileReviewQueue(reviewer,cursors[page],query);if(!current(request))return;hasNext=result.length>20;rows=result.slice(0,20);
      for(const value of rows){const card=node('article',null,'review-card profile-review-card');const title=typeof value.display_name==='string'&&value.display_name.trim()?value.display_name:'Unnamed profile copy';const open=node('button',`Inspect profile copy: ${title}`,'button outline');open.type='button';open.addEventListener('click',()=>inspect(value.id));card.append(node('h2',title),node('p',value.city||'No city supplied','profile-small'),time('Recorded',value.submitted_at),open);list.append(card);}
      status.textContent=rows.length?`${rows.length} pending profile copies on this page.${query?' Search active.':''} Oldest first.`:query?'No pending profile copies match this search.':'No pending profile copies on this page.';previous.disabled=page===0;next.disabled=!hasNext;pages.hidden=!rows.length&&page===0;
    }catch{if(current(request)){clear();reviewer=null;searchForm.hidden=!verifiedAccess;status.textContent=verifiedAccess&&query?'Unable to load matching profile copies. Clear the search or retry.':'Unable to verify profile review access or load copies. Check sign-in, connection and setup, then retry.';}}
    finally{if(current(request))refresh.disabled=false;}
  }
  searchForm.addEventListener('submit',event=>{event.preventDefault();if(!confirmDiscard())return;query=search.value.trim();search.value=query;clearSearch.disabled=!query;load(true);});
  search.addEventListener('input',()=>{clearSearch.disabled=!search.value&&!query;});
  clearSearch.addEventListener('click',()=>{if(!confirmDiscard())return;query='';search.value='';clearSearch.disabled=true;load(true);search.focus();});
  refresh.addEventListener('click',()=>{if(confirmDiscard())load(true);});next.addEventListener('click',()=>{if(!hasNext||!rows.length||!confirmDiscard())return;cursors[page+1]=rows.at(-1);page++;load();});previous.addEventListener('click',()=>{if(page===0||!confirmDiscard())return;page--;load();});load(true);
}
