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
  const states=new Map(examples.map(example=>[example.id,{draft:'',query:'',matchIndex:0,messages:example.messages.map(([direction,text])=>({direction,text,local:false}))}]));
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
    const bubbles=[];
    for(const message of state.messages) {
      const bubble=node('article',null,`message-bubble ${message.direction}`);bubble.append(node('p',message.direction==='incoming'?`${person.name} · fictional example`:message.local?'You · local preview, not sent':'You · fictional example','message-author'),node('p',message.text,'message-text'));log.append(bubble);bubbles.push(bubble);
    }
    const find=node('details',null,'message-search');find.open=!!state.query;
    find.append(node('summary','Search this conversation'));
    const findLabel=node('label','Find text in preview messages');findLabel.htmlFor='message-search-text';
    const findInput=node('input');findInput.type='search';findInput.id=findLabel.htmlFor;findInput.maxLength=100;findInput.autocomplete='off';findInput.value=state.query;
    const findActions=node('div',null,'editor-actions');
    const previous=node('button','Previous match','button quiet');previous.type='button';
    const next=node('button','Next match','button outline');next.type='button';
    const clear=node('button','Clear message search','button quiet');clear.type='button';
    const findStatus=node('p','','profile-small');findStatus.setAttribute('role','status');findStatus.dataset.messageSearchStatus='';
    findActions.append(previous,next,clear);find.append(findLabel,findInput,findStatus,findActions);
    let matches=[];
    function paintSearch(jump=false) {
      const query=state.query.trim();matches=[];
      // Literal text only: escape pattern syntax and create highlights as nodes.
      const pattern=query?new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'giu'):null;
      bubbles.forEach((bubble,index)=>{
        const body=bubble.querySelector('.message-text');body.replaceChildren();const value=state.messages[index].text;let start=0,matched=false;
        if(pattern)for(const match of value.matchAll(pattern)) {
          body.append(value.slice(start,match.index),node('mark',match[0]));start=match.index+match[0].length;matched=true;
        }
        body.append(value.slice(start));if(matched)matches.push(bubble);
        bubble.classList.toggle('message-match',matched);bubble.classList.remove('message-match-current');bubble.removeAttribute('aria-current');
      });
      state.matchIndex=Math.min(state.matchIndex,Math.max(0,matches.length-1));
      const current=matches[state.matchIndex];if(current){current.classList.add('message-match-current');current.setAttribute('aria-current','true');}
      previous.disabled=!matches.length||state.matchIndex===0;next.disabled=!matches.length||state.matchIndex===matches.length-1;clear.disabled=!state.query;
      findStatus.textContent=!query?'Search messages in this local conversation.':matches.length?`${state.matchIndex+1} of ${matches.length} matching messages`:'No messages match this search.';
      if(jump&&current)log.scrollTop+=current.getBoundingClientRect().top-log.getBoundingClientRect().top-log.clientTop;
    }
    findInput.addEventListener('input',()=>{state.query=findInput.value;state.matchIndex=0;paintSearch(true);});
    previous.addEventListener('click',()=>{if(state.matchIndex>0){state.matchIndex--;paintSearch(true);}});
    next.addEventListener('click',()=>{if(state.matchIndex<matches.length-1){state.matchIndex++;paintSearch(true);}});
    clear.addEventListener('click',()=>{state.query='';state.matchIndex=0;findInput.value='';paintSearch();findInput.focus();});
    const form=node('form',null,'message-compose');const label=node('label','Try a preview message');label.htmlFor='message-preview-text';const textarea=node('textarea');textarea.id=label.htmlFor;textarea.rows=3;textarea.maxLength=1000;textarea.value=state.draft;textarea.autocomplete='off';
    const hint=node('p','Use fictional text. This local preview allows up to 1,000 characters.','profile-small');hint.id='message-preview-hint';textarea.setAttribute('aria-describedby',hint.id);
    const actions=node('div',null,'editor-actions');const preview=node('button','Preview message','button primary');preview.type='submit';preview.disabled=!state.draft.trim();const reset=node('button','Reset conversation preview','button quiet');reset.type='button';
    const result=node('p','','profile-small');result.setAttribute('role','status');
    textarea.addEventListener('input',()=>{state.draft=textarea.value;preview.disabled=!state.draft.trim();result.textContent='';});
    form.addEventListener('submit',event=>{
      event.preventDefault();const text=textarea.value.trim();if(!text||text.length>1000){result.textContent='Enter 1–1,000 characters for the local preview.';textarea.focus();return;}
      state.messages.push({direction:'outgoing',text,local:true});state.draft='';paintThread();thread.querySelector('.message-compose [role=status]').textContent='Local preview added. Not sent.';const compose=thread.querySelector('textarea');compose.focus();thread.querySelector('.message-log').scrollTop=thread.querySelector('.message-log').scrollHeight;
    });
    reset.addEventListener('click',()=>{if(!window.confirm('Reset this conversation preview? Local messages and composer text will be cleared.'))return;const example=examples.find(value=>value.id===active);state.draft='';state.query='';state.matchIndex=0;state.messages=example.messages.map(([direction,text])=>({direction,text,local:false}));paintThread(true);});
    actions.append(preview,reset);form.append(label,textarea,hint,actions,result);thread.append(find,log,form);paintSearch();if(focus)heading.focus();
  }
  search.addEventListener('input',paintList);paintList();paintThread();
}
