// Synthetic presentation fixtures, never a booking audit or payment record.
const requests={gallery:['Taylor','2030-06-10T17:00:00Z'],dinner:['Taylor','2030-06-10T18:00:00Z'],coffee:['Jordan','2030-06-10T19:00:00Z'],walk:['Avery','2030-06-10T20:00:00Z']};
function node(tag,text,className){const item=document.createElement(tag);if(text)item.textContent=text;if(className)item.className=className;return item;}
function events(id){
  const request=requests[id];if(!request)return [];
  const rows=[{at:request[1],actor:request[0],label:'Request submitted · example',copy:'A fictional request enters review. Nothing was actually sent.'}];
  if(id==='dinner')rows.push({at:'2030-06-11T17:00:00Z',actor:'James',label:'Revision proposed · example',copy:'The original request and proposed terms remain separate. No agreement is recorded.'});
  if(id==='coffee'||id==='walk')rows.push({at:'2030-06-11T18:00:00Z',actor:'Maya',label:'Terms accepted · example',copy:'The planned accepted-awaiting-deposit stage is distinct from confirmed. No deposit is collected or verified here.'});
  if(id==='walk')rows.push({at:'2030-06-12T17:00:00Z',actor:'System example',label:'Confirmed-state illustration',copy:'Shows the planned confirmed state only. This site has not processed a payment or reserved time.'});
  return rows;
}
export function bookingActivityPreview(id,state){
  const section=node('details',null,'booking-example-activity');section.open=!!state.open;section.addEventListener('toggle',()=>{if(section.isConnected)state.open=section.open;});
  section.append(node('summary','View example activity'),node('p','Fictional events, not a saved booking history or audit trail. Event times are shown in America/Vancouver. Local revision reviews do not create events here.','profile-small'));
  const controls=node('div',null,'editor-actions');controls.setAttribute('role','group');controls.setAttribute('aria-label','Example activity order');
  const status=node('p','','profile-small');status.setAttribute('role','status');const list=node('ol',null,'booking-activity-list');list.setAttribute('aria-label','Example booking activity');
  const buttons=new Map();for(const [key,label] of [['asc','Oldest first'],['desc','Newest first']]){const button=node('button',label,'button outline');button.type='button';button.addEventListener('click',()=>{state.order=key;paint();});controls.append(button);buttons.set(key,button);}
  function paint(){
    const rows=events(id);if(state.order==='desc')rows.reverse();list.replaceChildren();for(const [key,button] of buttons)button.setAttribute('aria-pressed',String(key===(state.order||'asc')));
    for(const value of rows){const item=node('li');const time=node('time',new Date(value.at).toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Vancouver',timeZoneName:'short'}));time.dateTime=value.at;item.append(node('h3',value.label),node('p',`${value.actor} · fictional actor`,'profile-small'),time,node('p',value.copy,'profile-small'));list.append(item);}
    status.textContent=`${rows.length} fictional ${rows.length===1?'event':'events'}. ${state.order==='desc'?'Newest':'Oldest'} first.`;
  }
  section.append(controls,status,list);paint();return section;
}
