import { loadProfileSubmissionHistory } from './backend/profile-submissions.js';
function node(tag,text,className) {const item=document.createElement(tag);if(text)item.textContent=text;if(className)item.className=className;return item;}
export function profileCopyFields(fields = {}) {
  const list=node('dl');
  for(const [key,label] of [['display_name','Display name'],['username','Username'],['adult_age','Age'],['city','City'],['area','General area'],['tagline','Tagline'],['photo_index','Demo photo selection']]) {
    list.append(node('dt',label),node('dd',fields[key]===null||fields[key]===undefined||fields[key]===''?'Not supplied':String(fields[key])));
  }
  return list;
}
function timestamp(label,value) {
  const line=node('p',null,'profile-small');const parsed=typeof value==='string'&&value?new Date(value):null;
  if(!parsed||Number.isNaN(parsed.getTime())){line.textContent=`${label}: date unavailable`;return line;}
  const time=node('time',parsed.toLocaleString(undefined,{timeZoneName:'short'}));time.dateTime=value;line.append(`${label} `,time);return line;
}
export function profileSubmissionHistory(owner,isCurrent) {
  const section=node('section',null,'profile-submission-history account-permissions');
  section.append(node('h2','Your private profile copy history'),node('p','Recorded copies, including withdrawals. These records do not confirm public approval or current Provider access.','profile-small'));
  const refresh=node('button','Load my profile copy history','button outline');refresh.type='button';
  const status=node('p','','profile-small');status.setAttribute('role','status');status.tabIndex=-1;
  const list=node('div');const pages=node('div',null,'editor-actions');pages.hidden=true;
  const newer=node('button','Newer profile copies','button quiet');newer.type='button';const older=node('button','Older profile copies','button outline');older.type='button';
  pages.append(newer,older);section.append(refresh,status,list,pages);
  let generation=0,busy=false,page=0,cursors=[null],rows=[],hasOlder=false;
  const current=request=>request===generation&&section.isConnected&&isCurrent();
  function reset() {generation++;busy=false;page=0;cursors=[null];rows=[];hasOlder=false;list.replaceChildren();pages.hidden=true;status.textContent='';refresh.disabled=false;refresh.textContent='Load my profile copy history';}
  async function load(fromStart=false) {
    if(busy)return;busy=true;const request=++generation;
    if(fromStart){page=0;cursors=[null];}
    rows=[];list.replaceChildren();pages.hidden=true;refresh.disabled=true;status.textContent='Loading your profile copy history…';
    try {
      const result=await loadProfileSubmissionHistory(owner,cursors[page]);if(!current(request))return;
      hasOlder=result.length>20;rows=result.slice(0,20);
      for(const value of rows) {
        const fields=value.public_fields||{};const card=node('article',null,'staff-approval-card');
        card.append(node('h3',typeof fields.display_name==='string'&&fields.display_name.trim()?fields.display_name:'Unnamed profile copy'),node('p',value.withdrawn_at?'Withdrawn private copy':'Pending private copy','eyebrow'),timestamp('Recorded',value.submitted_at));
        if(value.withdrawn_at)card.append(timestamp('Withdrawn',value.withdrawn_at));
        const details=node('details');details.append(node('summary','View recorded public fields'),profileCopyFields(fields));card.append(details);list.append(card);
      }
      status.textContent=rows.length?`${rows.length} private profile copies on this page. Newest first.`:'No private profile copies on this page.';
      newer.disabled=page===0;older.disabled=!hasOlder;pages.hidden=!rows.length&&page===0;refresh.textContent='Refresh my profile copy history';
    } catch {if(current(request)){list.replaceChildren();pages.hidden=true;status.textContent='Private profile copy history unavailable. Check sign-in, connection and setup, then retry.';refresh.textContent='Retry my profile copy history';}}
    finally {if(current(request)){busy=false;refresh.disabled=false;status.focus();}}
  }
  refresh.addEventListener('click',()=>load(true));
  older.addEventListener('click',()=>{if(busy||!hasOlder||!rows.length)return;cursors[page+1]=rows.at(-1);page++;load();});
  newer.addEventListener('click',()=>{if(busy||page===0)return;page--;load();});
  return {section,reset};
}
