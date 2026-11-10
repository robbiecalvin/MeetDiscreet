import { providers } from './data.js';
const examples = [
  {id:'maya',messages:[['incoming','A gallery afternoon sounds lovely. Is there an exhibition you have in mind?'],['outgoing','I’m putting together a few ideas for a relaxed afternoon.']]},
  {id:'james',messages:[['incoming','What kind of restaurant would you enjoy exploring?']]},
  {id:'elena',messages:[['incoming','A little art and good conversation would be a lovely way to spend an afternoon.']]},
];
function node(tag,text,className) {const item=document.createElement(tag);if(text)item.textContent=text;if(className)item.className=className;return item;}
export function renderMessagesPreview(container,navigate) {
  container.replaceChildren();
  const root=node('section',null,'messages-preview');
  const back=node('a','← Back to account','profile-back');back.href='?page=account';back.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate('account');});
  root.append(back,node('p','CONVERSATION PREVIEW','eyebrow'),node('h1','A little conversation.'),node('p','Fictional conversations for trying the layout. Preview messages stay on this page and are never sent. Leaving or reloading clears them.','editor-notice'));
  const layout=node('div',null,'messages-layout');const sidebar=node('section',null,'messages-sidebar');sidebar.setAttribute('aria-label','Example conversations');
  const searchLabel=node('label','Find an example conversation');searchLabel.htmlFor='message-preview-search';const search=node('input');search.type='search';search.id=searchLabel.htmlFor;search.autocomplete='off';
  const results=node('p','','profile-small');results.setAttribute('role','status');const list=node('div',null,'messages-list');sidebar.append(searchLabel,search,results,list);
  const thread=node('section',null,'messages-thread');thread.setAttribute('aria-label','Conversation preview');layout.append(sidebar,thread);root.append(layout);container.append(root);
  const states=new Map(examples.map(example=>[example.id,{draft:'',messages:example.messages.map(([direction,text])=>({direction,text,local:false}))}]));
  let active=null;
  function paintList() {
    list.replaceChildren();const query=search.value.trim().toLocaleLowerCase();let count=0;
    for(const example of examples) {
      const person=providers.find(value=>value.id===example.id);if(!person.name.toLocaleLowerCase().includes(query))continue;count++;
      const button=node('button',null,'message-conversation');button.type='button';button.setAttribute('aria-label',`Open ${person.name} preview`);button.setAttribute('aria-pressed',String(active===person.id));
      const portrait=node('span',null,`portrait portrait-${person.photo} message-avatar`);portrait.setAttribute('aria-hidden','true');
      const text=node('span');text.append(node('strong',person.name),node('span','Fictional conversation','profile-small'));button.append(portrait,text);
      button.addEventListener('click',()=>{active=person.id;paintList();paintThread(true);});list.append(button);
    }
    results.textContent=count?`${count} example ${count===1?'conversation':'conversations'}`:'No example conversations match. Clear the search to see them all.';
  }
  function paintThread(focus=false) {
    thread.replaceChildren();root.dataset.conversation=active?'open':'closed';
    if(!active){thread.append(node('h2','Choose a conversation'),node('p','Select a fictional conversation to explore the message layout.','profile-small'));return;}
    const person=providers.find(value=>value.id===active),state=states.get(active);
    const backToList=node('button','← Back to conversations','button quiet message-back');backToList.type='button';backToList.addEventListener('click',()=>{active=null;paintList();paintThread();search.focus();});
    const heading=node('h2',person.name);heading.tabIndex=-1;thread.append(backToList,heading,node('p','Fictional example · no live presence or delivery status','profile-small'));
    const log=node('div',null,'message-log');log.setAttribute('role','log');log.tabIndex=0;log.setAttribute('aria-label',`Preview messages with ${person.name}`);
    for(const message of state.messages) {
      const bubble=node('article',null,`message-bubble ${message.direction}`);bubble.append(node('p',message.direction==='incoming'?`${person.name} · fictional example`:message.local?'You · local preview, not sent':'You · fictional example','message-author'),node('p',message.text,'message-text'));log.append(bubble);
    }
    const form=node('form',null,'message-compose');const label=node('label','Try a preview message');label.htmlFor='message-preview-text';const textarea=node('textarea');textarea.id=label.htmlFor;textarea.rows=3;textarea.maxLength=1000;textarea.value=state.draft;textarea.autocomplete='off';
    const hint=node('p','Use fictional text. This local preview allows up to 1,000 characters.','profile-small');hint.id='message-preview-hint';textarea.setAttribute('aria-describedby',hint.id);
    const actions=node('div',null,'editor-actions');const preview=node('button','Preview message','button primary');preview.type='submit';preview.disabled=!state.draft.trim();const reset=node('button','Reset conversation preview','button quiet');reset.type='button';
    const result=node('p','','profile-small');result.setAttribute('role','status');
    textarea.addEventListener('input',()=>{state.draft=textarea.value;preview.disabled=!state.draft.trim();result.textContent='';});
    form.addEventListener('submit',event=>{
      event.preventDefault();const text=textarea.value.trim();if(!text||text.length>1000){result.textContent='Enter 1–1,000 characters for the local preview.';textarea.focus();return;}
      state.messages.push({direction:'outgoing',text,local:true});state.draft='';paintThread();thread.querySelector('.message-compose [role=status]').textContent='Local preview added. Not sent.';const compose=thread.querySelector('textarea');compose.focus();thread.querySelector('.message-log').scrollTop=thread.querySelector('.message-log').scrollHeight;
    });
    reset.addEventListener('click',()=>{if(!window.confirm('Reset this conversation preview? Local messages and composer text will be cleared.'))return;const example=examples.find(value=>value.id===active);state.draft='';state.messages=example.messages.map(([direction,text])=>({direction,text,local:false}));paintThread(true);});
    actions.append(preview,reset);form.append(label,textarea,hint,actions,result);thread.append(log,form);if(focus)heading.focus();
  }
  search.addEventListener('input',paintList);paintList();paintThread();
}
