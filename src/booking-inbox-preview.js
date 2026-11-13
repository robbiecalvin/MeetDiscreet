import {bookingRevisionPreview} from './booking-revision-preview.js';
import {bookingCalendarMonth,shiftCalendarMonth} from './booking-calendar.js';
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
  const revisionDrafts=new Map();
  container.replaceChildren();const root=node('section',null,'booking-inbox-preview');let perspective='user',active=null,view='list',month=examples[0].date.slice(0,7),selectedDay=null;
  const link=(page,label,className='button outline')=>{const item=node('a',label,className);item.href=`?page=${page}`;item.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(page);});return item;};
  root.append(link('account','← Back to account','profile-back'),node('p','BOOKING INBOX PREVIEW','eyebrow'),node('h1','Plans worth looking forward to.'),node('p','Fictional requests for exploring the inbox. No booking, payment or reservation is created. Switching examples does not change your account roles.','editor-notice'),link('booking-draft','Open the unsent booking-plan editor'));
  const perspectiveControls=node('div',null,'editor-actions');perspectiveControls.setAttribute('role','group');perspectiveControls.setAttribute('aria-label','Booking inbox example');
  const buttons=new Map();for(const [key,label] of [['user','User example'],['provider','Provider example']]){const button=node('button',label,'button outline');button.type='button';button.addEventListener('click',()=>{perspective=key;active=null;selectedDay=null;month=examples[0].date.slice(0,7);search.value='';filter.value='all';paint();});buttons.set(key,button);perspectiveControls.append(button);}
  const context=node('p','','profile-small');const layout=node('div',null,'booking-inbox-layout');const browse=node('section',null,'booking-inbox-list-panel');browse.setAttribute('aria-label','Example booking requests');
  const searchLabel=node('label','Find an example request');searchLabel.htmlFor='booking-example-search';const search=node('input');search.type='search';search.id=searchLabel.htmlFor;search.autocomplete='off';
  const filterLabel=node('label','Example request status');filterLabel.htmlFor='booking-example-status';const filter=node('select');filter.id=filterLabel.htmlFor;
  for(const [key,label] of [['all','All example statuses'],...Object.entries(states).map(([key,value])=>[key,value[0]])]){const option=node('option',label);option.value=key;filter.append(option);}
  const clear=node('button','Clear request filters','button quiet');clear.type='button';const status=node('p','','profile-small');status.setAttribute('role','status');const list=node('div',null,'booking-example-list');browse.append(searchLabel,search,filterLabel,filter,clear,status,list);
  const viewControls=node('div',null,'editor-actions');viewControls.setAttribute('role','group');viewControls.setAttribute('aria-label','Example request view');
  const viewButtons=new Map();for(const [key,label] of [['list','List view'],['calendar','Calendar view']]){const button=node('button',label,'button outline');button.type='button';button.addEventListener('click',()=>{view=key;selectedDay=null;active=null;paint();});viewButtons.set(key,button);viewControls.append(button);}
  const calendar=node('section',null,'booking-calendar');calendar.hidden=true;browse.insertBefore(viewControls,status);browse.insertBefore(calendar,list);
  function focusCalendar(){const target=calendar.querySelector('[aria-pressed=true]')||calendar.querySelector('caption');target?.focus();}
  const detail=node('section',null,'booking-example-detail');detail.setAttribute('aria-label','Example request details');layout.append(browse,detail);root.append(perspectiveControls,context,layout);container.append(root);
  function paint(focus=false){
    for(const [key,button] of buttons)button.setAttribute('aria-pressed',String(key===perspective));
    for(const [key,button] of viewButtons)button.setAttribute('aria-pressed',String(key===view));
    context.textContent=perspective==='user'?'Viewing Taylor’s fictional User inbox.':'Viewing Maya’s fictional Provider inbox.';
    const inbox=examples.filter(value=>perspective==='user'?value.user==='taylor':value.provider==='maya');const query=search.value.trim().toLocaleLowerCase();
    const filtered=inbox.filter(value=>(filter.value==='all'||value.status===filter.value)&&[value.title,people[value.user],people[value.provider],value.venue].join(' ').toLocaleLowerCase().includes(query));
    calendar.hidden=view!=='calendar';calendar.replaceChildren();
    if(selectedDay&&!filtered.some(value=>value.date===selectedDay))selectedDay=null;
    const monthMatches=filtered.filter(value=>value.date.startsWith(`${month}-`));
    const matches=view==='calendar'?monthMatches.filter(value=>!selectedDay||value.date===selectedDay):filtered;
    if(view==='calendar')paintCalendar(filtered,monthMatches);
    if(!matches.some(value=>value.id===active))active=null;
    list.replaceChildren();status.textContent=matches.length?`${matches.length} of ${inbox.length} example requests. No real bookings.`:'No example requests match these filters.';
    if(view==='calendar')status.textContent=`${monthMatches.length} example requests in ${bookingCalendarMonth(month).label}.${selectedDay?` Showing ${date(selectedDay)}.`:''} Blank days are not availability.`;
    for(const value of matches){const card=node('article',null,'booking-example-card');const counterpart=people[perspective==='user'?value.provider:value.user];const open=node('button',`View example: ${value.title}`,'button outline');open.type='button';open.addEventListener('click',()=>{active=value.id;paint(true);});card.append(node('p','FICTIONAL REQUEST','eyebrow'),node('h2',value.title),node('p',`${counterpart} · ${states[value.status][0]}`,'profile-small'),node('p',`${date(value.date)} · ${value.time} · America/Vancouver`,'profile-small'),open);if(active===value.id)card.setAttribute('aria-current','true');list.append(card);}
    paintDetail(focus);
  }
  function paintCalendar(filtered,monthMatches){
    const navigation=node('div',null,'editor-actions');
    for(const [offset,label] of [[-1,'Previous month'],[1,'Next month']]){const button=node('button',label,'button quiet');button.type='button';button.disabled=!shiftCalendarMonth(month,offset);button.addEventListener('click',()=>{const next=shiftCalendarMonth(month,offset);if(!next)return;month=next;selectedDay=null;active=null;paint();focusCalendar();});navigation.append(button);}
    const home=node('button','Example month','button outline');home.type='button';home.addEventListener('click',()=>{month=(filtered[0]?.date||examples[0].date).slice(0,7);selectedDay=null;active=null;paint();focusCalendar();});navigation.append(home);calendar.append(navigation);
    const model=bookingCalendarMonth(month),table=node('table'),caption=node('caption',model.label);caption.tabIndex=-1;table.append(caption);table.setAttribute('aria-label','Example request dates');
    const head=node('thead'),headRow=node('tr');for(const [short,long] of [['Mon','Monday'],['Tue','Tuesday'],['Wed','Wednesday'],['Thu','Thursday'],['Fri','Friday'],['Sat','Saturday'],['Sun','Sunday']]){const cell=node('th');cell.scope='col';const abbreviation=node('abbr',short);abbreviation.title=long;cell.append(abbreviation);headRow.append(cell);}head.append(headRow);table.append(head);
    const body=node('tbody');for(let start=0;start<model.cells.length;start+=7){const row=node('tr');for(const cell of model.cells.slice(start,start+7)){const item=node('td');if(cell){const count=monthMatches.filter(value=>value.date===cell.date).length;if(count){const button=node('button',null,'booking-calendar-day');button.type='button';button.dataset.calendarDate=cell.date;button.setAttribute('aria-label',`${date(cell.date)}: ${count} example ${count===1?'request':'requests'}`);button.setAttribute('aria-pressed',String(selectedDay===cell.date));button.append(node('span',String(cell.day)),node('small',String(count)));button.addEventListener('click',()=>{selectedDay=cell.date;active=null;paint();focusCalendar();});item.append(button);}else{const stamp=node('time',String(cell.day));stamp.dateTime=cell.date;item.append(stamp);}}row.append(item);}body.append(row);}table.append(body);calendar.append(table,node('p','Example request dates · America/Vancouver. This calendar does not show bookable time.','profile-small'));
    const all=node('button','Show all dates in this month','button quiet');all.type='button';all.disabled=!selectedDay;all.addEventListener('click',()=>{selectedDay=null;active=null;paint();focusCalendar();});calendar.append(all);
  }
  function paintDetail(focus){
    detail.replaceChildren();root.dataset.request=active?'open':'closed';
    const value=examples.find(item=>item.id===active);if(!value){detail.append(node('h2','Choose an example request'),node('p','Inspect a fictional plan to see its schedule and status.','profile-small'));return;}
    const back=node('button','← Back to example requests','button quiet');back.type='button';back.addEventListener('click',()=>{active=null;paint();if(view==='calendar')focusCalendar();else search.focus();});const heading=node('h2',value.title);heading.tabIndex=-1;
    const fields=node('dl');for(const [label,text] of [['Participants',`${people[value.user]} and ${people[value.provider]} · fictional`],['Status',states[value.status][0]],['Example schedule',`${date(value.date)} · ${value.time} · America/Vancouver`],['Duration',durationLabel(value.minutes)],['Meeting area',value.venue],['Notes',value.notes]])fields.append(node('dt',label),node('dd',text));
    detail.append(back,heading,node('p',states[value.status][1],'editor-notice'),fields,node('p','Quote and deposit are not calculated in this preview. There are no live accept, pay, cancel or messaging actions.','profile-small'));
    if(value.revision){const revision=node('details',null,'booking-example-revision');revision.append(node('summary','Compare the example revision'));const table=node('table');const caption=node('caption','Original and proposed example terms · America/Vancouver');const head=node('thead'),headRow=node('tr');for(const label of ['Term','Original example','Proposed example']){const cell=node('th',label);cell.scope='col';headRow.append(cell);}head.append(headRow);const body=node('tbody');for(const [label,original,proposed] of [['Date',date(value.date),date(value.revision.date)],['Start',value.time,value.revision.time],['Duration',durationLabel(value.minutes),durationLabel(value.revision.minutes)]]){const row=node('tr');const term=node('th',label);term.scope='row';row.append(term,node('td',original),node('td',proposed));body.append(row);}table.append(caption,head,body);revision.append(table,node('p',value.revision.reason,'profile-small'),node('p','Comparison only. Original terms are preserved; no agreement is recorded.','profile-small'));detail.append(revision);}
    if(['requested','revision_requested'].includes(value.status)){const key=`${perspective}:${value.id}`;if(!revisionDrafts.has(key))revisionDrafts.set(key,{});detail.append(bookingRevisionPreview(value,revisionDrafts.get(key)));}
    if(focus)heading.focus();
  }
  search.addEventListener('input',()=>paint());filter.addEventListener('change',()=>paint());clear.addEventListener('click',()=>{search.value='';filter.value='all';active=null;selectedDay=null;month=examples[0].date.slice(0,7);paint();search.focus();});paint();
}
