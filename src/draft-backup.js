import { backendEnabled, requireUser } from './backend/client.js';
import { draftBackupKinds, readSavedDraftCopy } from './backend/draft-backup.js';
function node(tag,text,className) {
  const element=document.createElement(tag); if(text)element.textContent=text; if(className)element.className=className; return element;
}
export function renderDraftBackup(container,navigate) {
  container.replaceChildren(); const root=node('section',null,'draft-backup');
  const back=node('a','← Back to account','profile-back'); back.href='?page=account';
  back.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate('account');});
  root.append(back,node('p','YOUR PRIVATE DRAFTS','eyebrow'),node('h1','Keep a copy of your drafts.'),node('p','Download selected saved drafts as a JSON reference file. Keep the file private: it may include personal introductions and plans.','offering-lead'),node('p','Saved drafts only. Unsaved edits and application history are excluded. This is not a full account export, and importing this file is not available. Listing downloads support up to 1,000 saved drafts.','editor-notice'));
  const status=node('p',backendEnabled?'Checking your account…':'Draft downloads require the development backend. No private data is loaded in this preview.','backup-status'); status.setAttribute('role','status'); status.tabIndex=-1;
  root.append(status); container.append(root); const current=()=>root.parentNode===container;
  if(!backendEnabled)return;
  requireUser().then(user=>{
    if(!current())return; status.textContent='Choose which saved drafts to download.';
    const form=node('form'); const group=node('fieldset',null,'backup-options'); group.append(node('legend','Choose saved drafts'));
    const choices=[];
    for(const kind of draftBackupKinds){
      const label=node('label'); const input=node('input'); input.type='checkbox';input.value=kind.id;input.name='draft-type';
      label.append(input,node('span',kind.label));group.append(label);choices.push(input);
    }
    const submit=node('button','Download selected saved drafts','button primary');submit.type='submit';form.append(group,submit);root.append(form);
    let busy=false;
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(busy)return; const selected=choices.filter(input=>input.checked).map(input=>input.value);
      if(!selected.length){status.textContent='Choose at least one draft type.';choices[0].focus();return;}
      busy=true;submit.disabled=true;for(const input of choices)input.disabled=true;status.textContent='Preparing your saved draft copy…';
      try{
        const verified=await requireUser();if(!current())return;if(verified.id!==user.id)throw new Error('Account changed.');
        const copy=await readSavedDraftCopy(selected);if(!current())return;
        const json=JSON.stringify(copy,null,2);const blob=new Blob([json],{type:'application/json'});
        if(blob.size>10*1024*1024)throw new Error('The selected copy is too large. Choose fewer draft types.');
        const url=URL.createObjectURL(blob);const download=node('a');download.href=url;download.download='meetdiscreet-saved-drafts.json';download.hidden=true;root.append(download);
        try{download.click();}finally{download.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
        const records=Object.values(copy.drafts).reduce((sum,rows)=>sum+rows.length,0);
        status.textContent=`Download prepared with ${records} saved ${records===1?'record':'records'}. Check your browser downloads. Unselected and unsaved data are not included.`;
      }catch(error){if(current())status.textContent=error.message==='Sign in before saving or loading private drafts.'?'Sign in to download your saved drafts.':`${error.message} No new file was prepared.`;}
      finally{busy=false;submit.disabled=false;for(const input of choices)input.disabled=false;}
    });
  }).catch(()=>{if(!current())return;status.textContent='Sign in to download your saved drafts.';const signIn=node('a','Sign in','button outline');signIn.href='?page=sign-in';signIn.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate('sign-in');});root.append(signIn);});
}
