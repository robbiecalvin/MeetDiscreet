import {backendEnabled} from './backend/client.js';
import {loadProfileReviewAccess,listProfileReviewQueue,loadProfileReviewCopy} from './backend/profile-review.js';
import {profileCopyFields} from './profile-submission-history.js';
function node(tag,text,className){const item=document.createElement(tag);if(text)item.textContent=text;if(className)item.className=className;return item;}
function time(label,value){const line=node('p',null,'profile-small');const parsed=typeof value==='string'?new Date(value):null;if(!parsed||Number.isNaN(parsed.getTime())){line.textContent=`${label}: date unavailable`;return line;}const stamp=node('time',parsed.toLocaleString(undefined,{timeZoneName:'short'}));stamp.dateTime=value;line.append(`${label} `,stamp);return line;}
export function renderProfileReview(container,navigate){
  container.replaceChildren();const root=node('section',null,'provider-review profile-review');
  const back=node('a','← Back to account','profile-back');back.href='?page=account';back.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate('account');});
  root.append(back,node('p','STAFF WORKSPACE','eyebrow'),node('h1','Profile submission review.'),node('p','Inspect recorded private profile copies with separately assigned review access.','offering-lead'),node('p','Inspection only. This workspace cannot approve, verify or publish a profile. Recorded copies do not confirm current Provider membership or paid access.','editor-notice'));
  const refresh=node('button','Refresh profile review queue','button outline');refresh.type='button';const status=node('p','','profile-small');status.setAttribute('role','status');status.tabIndex=-1;
  const list=node('div',null,'profile-review-queue');const pages=node('div',null,'editor-actions');pages.hidden=true;
  const previous=node('button','Previous profile copies','button quiet');previous.type='button';const next=node('button','Next profile copies','button outline');next.type='button';pages.append(previous,next);
  const detail=node('section',null,'review-detail profile-review-detail');detail.hidden=true;
  root.append(refresh,status,list,pages,detail);container.append(root);
  if(!backendEnabled){refresh.hidden=true;status.textContent='Profile review requires the connected backend and assigned staff scope. No private copies are available in this preview.';return;}
  let reviewer=null,version=0,page=0,cursors=[null],rows=[],hasNext=false;
  const current=request=>request===version&&root.parentNode===container;
  function clear(){list.replaceChildren();detail.replaceChildren();detail.hidden=true;pages.hidden=true;rows=[];}
  async function inspect(id){
    const request=++version;detail.replaceChildren();detail.hidden=true;refresh.disabled=true;status.textContent='Loading recorded profile copy…';
    try{
      const value=await loadProfileReviewCopy(reviewer,id);if(!current(request))return;
      if(!value){await load(true);return;}
      const heading=node('h2','Recorded public fields');heading.tabIndex=-1;
      const close=node('button','Close profile copy','button quiet');close.type='button';close.addEventListener('click',()=>{version++;detail.replaceChildren();detail.hidden=true;status.textContent='Recorded copy closed.';refresh.focus();});
      detail.append(heading,time('Recorded',value.submitted_at),time('Source saved',value.source_updated_at),profileCopyFields(value.public_fields||{}),node('p','Exact recorded copy. Later private edits are excluded. Demo photo selection is a number, not an approved uploaded image.','profile-small'),close);detail.hidden=false;status.textContent='Recorded profile copy loaded for inspection only.';heading.focus();
    }catch{if(current(request)){clear();reviewer=null;status.textContent='Profile review access or recorded copy is unavailable. Refresh to check current access.';}}
    finally{if(current(request))refresh.disabled=false;}
  }
  async function load(reset=false){
    const request=++version;clear();refresh.disabled=true;status.textContent='Checking profile review access…';
    try{
      const access=await loadProfileReviewAccess();if(!current(request))return;
      if(!access.allowed){reviewer=null;status.textContent='This account does not have assigned profile-publication review access.';return;}
      reviewer=access.reviewerId;if(reset){page=0;cursors=[null];}
      const result=await listProfileReviewQueue(reviewer,cursors[page]);if(!current(request))return;hasNext=result.length>20;rows=result.slice(0,20);
      for(const value of rows){const card=node('article',null,'review-card profile-review-card');const title=typeof value.display_name==='string'&&value.display_name.trim()?value.display_name:'Unnamed profile copy';const open=node('button',`Inspect profile copy: ${title}`,'button outline');open.type='button';open.addEventListener('click',()=>inspect(value.id));card.append(node('h2',title),node('p',value.city||'No city supplied','profile-small'),time('Recorded',value.submitted_at),open);list.append(card);}
      status.textContent=rows.length?`${rows.length} pending profile copies on this page. Oldest first.`:'No pending profile copies on this page.';previous.disabled=page===0;next.disabled=!hasNext;pages.hidden=!rows.length&&page===0;
    }catch{if(current(request)){clear();reviewer=null;status.textContent='Unable to verify profile review access or load copies. Check sign-in, connection and setup, then retry.';}}
    finally{if(current(request))refresh.disabled=false;}
  }
  refresh.addEventListener('click',()=>load(true));next.addEventListener('click',()=>{if(!hasNext||!rows.length)return;cursors[page+1]=rows.at(-1);page++;load();});previous.addEventListener('click',()=>{if(page===0)return;page--;load();});load(true);
}
