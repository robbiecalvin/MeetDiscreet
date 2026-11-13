import './profile-copy-comparison.css';
import {loadSavedPublicProfilePreview} from './backend/public-profile-preview.js';
import {profileComparisonRows} from './profile-copy-differences.js';
function node(tag,text,className){const element=document.createElement(tag);if(text)element.textContent=text;if(className)element.className=className;return element;}
function stamp(label,value){const parsed=typeof value==='string'?new Date(value):null;const line=node('p',null,'profile-small');if(!parsed||Number.isNaN(parsed.getTime())){line.textContent=`${label}: date unavailable`;return line;}const time=node('time',parsed.toLocaleString(undefined,{timeZoneName:'short'}));time.dateTime=parsed.toISOString();line.append(`${label} `,time);return line;}
export function profileCopyComparison(owner,copy,isCurrent){
  const section=node('details',null,'profile-copy-comparison');section.append(node('summary','Compare with saved profile draft'),node('p','Compare this recorded copy with saved public fields loaded explicitly below. Unsaved editor changes are excluded. This does not withdraw, submit, approve or publish anything.','profile-small'));
  const load=node('button','Load saved fields for comparison','button outline');load.type='button';
  const status=node('p','','profile-small');status.setAttribute('aria-live','polite');status.tabIndex=-1;
  const content=node('div');section.append(load,status,content);let busy=false;
  load.addEventListener('click',async()=>{
    if(busy||!isCurrent())return;busy=true;load.disabled=true;content.replaceChildren();status.textContent='Loading saved public fields for comparison…';
    const current=()=>section.isConnected&&isCurrent();
    try{
      const saved=await loadSavedPublicProfilePreview(owner);if(!current())return;
      if(!saved){status.textContent='No saved profile draft to compare. The recorded copy is unchanged.';return;}
      const rows=profileComparisonRows(copy.public_fields||{},saved);const changed=rows.filter(row=>row.changed).length;
      const table=node('table');table.append(node('caption','Recorded copy and saved profile draft'));
      const head=node('thead'),labels=node('tr');for(const title of ['Field','Recorded copy','Saved draft']){const cell=node('th',title);cell.scope='col';labels.append(cell);}head.append(labels);table.append(head);
      const body=node('tbody');for(const row of rows){const line=node('tr');const label=node('th');label.scope='row';label.append(node('span',row.label),node('small',row.changed?'Changed':'Same'));line.dataset.changed=String(row.changed);line.append(label,node('td',row.recorded),node('td',row.saved));body.append(line);}table.append(body);
      content.append(stamp('Copy recorded',copy.submitted_at),stamp('Saved draft version',saved.updated_at),table,node('p','These are loaded snapshots. Refresh the comparison after saving other edits. A demo photo selection is an index, not an uploaded image.','profile-small'));
      status.textContent=changed?`${changed} of ${rows.length} public fields differ. The recorded copy is unchanged.`:'All seven public fields match. This does not confirm approval or publishing eligibility.';load.textContent='Refresh saved-field comparison';
    }catch{if(current())status.textContent='Comparison unavailable. Check sign-in, connection and setup, then retry. The recorded copy is unchanged.';}
    finally{busy=false;if(current()){load.disabled=false;status.focus();}}
  });return section;
}
