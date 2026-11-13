import {durationLabel} from './booking-draft-rules.js';
const people={taylor:'Taylor',jordan:'Jordan',avery:'Avery',maya:'Maya',james:'James'};
const states={requested:['Requested','An example request awaiting a response. No request has actually been sent.'],revision_requested:['Revision requested','Example revised terms awaiting agreement. No change is applied to a real booking.'],accepted_awaiting_deposit:['Accepted · awaiting deposit','This planned state is distinct from confirmed. No deposit is calculated, collected or verified here.'],confirmed:['Confirmed example','An illustration of the planned confirmed state. This preview has not verified payment or reserved time.']};
const examples=[
  {id:'gallery',title:'A gallery afternoon',user:'taylor',provider:'maya',status:'requested',date:'2030-06-15',time:'14:00',minutes:120,venue:'Example gallery area · Vancouver',notes:'A relaxed gallery visit and time for conversation.'},
  {id:'dinner',title:'An evening over dinner',user:'taylor',provider:'james',status:'revision_requested',date:'2030-06-16',time:'18:00',minutes:90,venue:'Example restaurant area · Vancouver',notes:'Explore a new restaurant together.',revision:{date:'2030-06-16',time:'18:30',minutes:120,reason:'Example proposal: start later and allow a little more time.'}},
  {id:'coffee',title:'Coffee and a catch-up',user:'jordan',provider:'maya',status:'accepted_awaiting_deposit',date:'2030-06-17',time:'11:00',minutes:60,venue:'Example café area · Vancouver',notes:'An easy conversation over coffee.'},
  {id:'walk',title:'A waterfront wander',user:'avery',provider:'maya',status:'confirmed',date:'2030-06-18',time:'16:00',minutes:90,venue:'Example waterfront area · Vancouver',notes:'A relaxed walk with time to stop along the way.'},
];
function node(tag,text,className){const item=document.createElement(tag);if(text)item.textContent=text;if(className)item.className=className;return item;}
function date(value){return new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});}
export function renderBookingInboxPreview(container,navigate){
  container.replaceChildren();const root=node('section',null,'booking-inbox-preview');let perspective='user',active=null;
  const link=(page,label,className='button outline')=>{const item=node('a',label,className);item.href=`?page=${page}`;item.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(page);});return item;};
  root.append(link('account','← Back to account','profile-back'),node('p','BOOKING INBOX PREVIEW','eyebrow'),node('h1','Plans worth looking forward to.'),node('p','Fictional requests for exploring the inbox. No booking, payment or reservation is created. Switching examples does not change your account roles.','editor-notice'),link('booking-draft','Open the unsent booking-plan editor'));
  const perspectiveControls=node('div',null,'editor-actions');perspectiveControls.setAttribute('role','group');perspectiveControls.setAttribute('aria-label','Booking inbox example');
  const buttons=new Map();for(const [key,label] of [['user','User example'],['provider','Provider example']]){const button=node('button',label,'button outline');button.type='button';button.addEventListener('click',()=>{perspective=key;active=null;search.value='';filter.value='all';paint();});buttons.set(key,button);perspectiveControls.append(button);}
  const context=node('p','','profile-small');const layout=node('div',null,'booking-inbox-layout');const browse=node('section',null,'booking-inbox-list-panel');browse.setAttribute('aria-label','Example booking requests');
  const searchLabel=node('label','Find an example request');searchLabel.htmlFor='booking-example-search';const search=node('input');search.type='search';search.id=searchLabel.htmlFor;search.autocomplete='off';
  const filterLabel=node('label','Example request status');filterLabel.htmlFor='booking-example-status';const filter=node('select');filter.id=filterLabel.htmlFor;
  for(const [key,label] of [['all','All example statuses'],...Object.entries(states).map(([key,value])=>[key,value[0]])]){const option=node('option',label);option.value=key;filter.append(option);}
  const clear=node('button','Clear request filters','button quiet');clear.type='button';const status=node('p','','profile-small');status.setAttribute('role','status');const list=node('div',null,'booking-example-list');browse.append(searchLabel,search,filterLabel,filter,clear,status,list);
  const detail=node('section',null,'booking-example-detail');detail.setAttribute('aria-label','Example request details');layout.append(browse,detail);root.append(perspectiveControls,context,layout);container.append(root);
  function paint(focus=false){
    for(const [key,button] of buttons)button.setAttribute('aria-pressed',String(key===perspective));
    context.textContent=perspective==='user'?'Viewing Taylor’s fictional User inbox.':'Viewing Maya’s fictional Provider inbox.';
    const inbox=examples.filter(value=>perspective==='user'?value.user==='taylor':value.provider==='maya');const query=search.value.trim().toLocaleLowerCase();
    const matches=inbox.filter(value=>(filter.value==='all'||value.status===filter.value)&&[value.title,people[value.user],people[value.provider],value.venue].join(' ').toLocaleLowerCase().includes(query));
    if(!matches.some(value=>value.id===active))active=null;
    list.replaceChildren();status.textContent=matches.length?`${matches.length} of ${inbox.length} example requests. No real bookings.`:'No example requests match these filters.';
    for(const value of matches){const card=node('article',null,'booking-example-card');const counterpart=people[perspective==='user'?value.provider:value.user];const open=node('button',`View example: ${value.title}`,'button outline');open.type='button';open.addEventListener('click',()=>{active=value.id;paint(true);});card.append(node('p','FICTIONAL REQUEST','eyebrow'),node('h2',value.title),node('p',`${counterpart} · ${states[value.status][0]}`,'profile-small'),node('p',`${date(value.date)} · ${value.time} · America/Vancouver`,'profile-small'),open);if(active===value.id)card.setAttribute('aria-current','true');list.append(card);}
    paintDetail(focus);
  }
  function paintDetail(focus){
    detail.replaceChildren();root.dataset.request=active?'open':'closed';
    const value=examples.find(item=>item.id===active);if(!value){detail.append(node('h2','Choose an example request'),node('p','Inspect a fictional plan to see its schedule and status.','profile-small'));return;}
    const back=node('button','← Back to example requests','button quiet');back.type='button';back.addEventListener('click',()=>{active=null;paint();search.focus();});const heading=node('h2',value.title);heading.tabIndex=-1;
    const fields=node('dl');for(const [label,text] of [['Participants',`${people[value.user]} and ${people[value.provider]} · fictional`],['Status',states[value.status][0]],['Example schedule',`${date(value.date)} · ${value.time} · America/Vancouver`],['Duration',durationLabel(value.minutes)],['Meeting area',value.venue],['Notes',value.notes]])fields.append(node('dt',label),node('dd',text));
    detail.append(back,heading,node('p',states[value.status][1],'editor-notice'),fields,node('p','Quote and deposit are not calculated in this preview. There are no live accept, pay, cancel or messaging actions.','profile-small'));
    if(value.revision){const revision=node('details',null,'booking-example-revision');revision.append(node('summary','Compare the example revision'));const table=node('table');const caption=node('caption','Original and proposed example terms · America/Vancouver');const head=node('thead'),headRow=node('tr');for(const label of ['Term','Original example','Proposed example']){const cell=node('th',label);cell.scope='col';headRow.append(cell);}head.append(headRow);const body=node('tbody');for(const [label,original,proposed] of [['Date',date(value.date),date(value.revision.date)],['Start',value.time,value.revision.time],['Duration',durationLabel(value.minutes),durationLabel(value.revision.minutes)]]){const row=node('tr');const term=node('th',label);term.scope='row';row.append(term,node('td',original),node('td',proposed));body.append(row);}table.append(caption,head,body);revision.append(table,node('p',value.revision.reason,'profile-small'),node('p','Comparison only. Original terms are preserved; no agreement is recorded.','profile-small'));detail.append(revision);}
    if(focus)heading.focus();
  }
  search.addEventListener('input',()=>paint());filter.addEventListener('change',()=>paint());clear.addEventListener('click',()=>{search.value='';filter.value='all';active=null;paint();search.focus();});paint();
}
