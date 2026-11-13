import {validCalendarDate,durationLabel} from './booking-draft-rules.js';
export function bookingRevisionErrors(draft){
  const errors=[];
  if(!validCalendarDate(draft.date))errors.push(['date','Choose a valid date for the local revision.']);
  if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.time))errors.push(['time','Choose a valid 24-hour start time.']);
  if(!/^\d+$/.test(draft.minutes)||!Number.isSafeInteger(Number(draft.minutes))||Number(draft.minutes)<=0)errors.push(['minutes','Enter a positive whole number of minutes.']);
  if(draft.venue.length>200)errors.push(['venue','Keep the local meeting area within 200 characters.']);
  if(draft.notes.length>1000)errors.push(['notes','Keep the local notes within 1,000 characters.']);
  return errors;
}
function node(tag,text,className){const item=document.createElement(tag);if(text)item.textContent=text;if(className)item.className=className;return item;}
const initial=value=>({date:value.date,time:value.time,minutes:String(value.minutes),venue:value.venue,notes:value.notes});
export function bookingRevisionPreview(original,state){
  if(!state.draft)state.draft=initial(original);
  const section=node('details',null,'booking-example-revision booking-local-revision');section.open=!!state.open;section.addEventListener('toggle',()=>{if(section.isConnected)state.open=section.open;});
  section.append(node('summary','Try a local revision'),node('p','Use test details and start from the original example. Edits stay in this view: nothing is sent, accepted or saved to your account. All example times use America/Vancouver.','profile-small'));
  const form=node('form',null,'booking-local-revision-form');form.noValidate=true;
  const errors=node('p','','editor-errors');errors.setAttribute('role','alert');errors.id='local-revision-errors';form.append(errors);
  const inputs=new Map(),review=node('section'),status=node('p','','profile-small');status.setAttribute('role','status');
  for(const [key,label,type,max] of [['date','Local revised date','date'],['time','Local revised start','time'],['minutes','Local revised duration (minutes)','number'],['venue','Local revised meeting area (optional)','text',200],['notes','Local revision notes (optional)','textarea',1000]]){
    const group=node('div',null,'editor-field');const caption=node('label',label);const input=node(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;else input.rows=3;
    input.id=`local-revision-${key}`;caption.htmlFor=input.id;input.value=state.draft[key];input.autocomplete='off';input.setAttribute('aria-describedby',errors.id);if(max)input.maxLength=max;
    if(['date','time','minutes'].includes(key))input.required=true;if(key==='minutes'){input.min='1';input.step='1';}
    input.addEventListener('input',()=>{state.draft[key]=input.value;state.reviewed=null;review.replaceChildren();status.textContent='';errors.textContent='';for(const control of inputs.values())control.removeAttribute('aria-invalid');});
    group.append(caption,input);form.append(group);inputs.set(key,input);
  }
  function paintReview(focus=false){
    review.replaceChildren();if(!state.reviewed)return;
    const proposed=state.reviewed;const heading=node('h3','Local revision comparison');heading.tabIndex=-1;
    const table=node('table'),caption=node('caption','Original example and local revision · America/Vancouver');const head=node('thead'),headRow=node('tr');for(const label of ['Term','Original example','Local revision']){const cell=node('th',label);cell.scope='col';headRow.append(cell);}head.append(headRow);const body=node('tbody');
    for(const [label,before,after] of [['Date',original.date,proposed.date],['Start',original.time,proposed.time],['Duration',durationLabel(original.minutes),durationLabel(Number(proposed.minutes))],['Meeting area',original.venue,proposed.venue],['Notes',original.notes,proposed.notes]]){const row=node('tr'),term=node('th',label);term.scope='row';row.append(term,node('td',before||'Not supplied'),node('td',after||'Not supplied'));body.append(row);}table.append(caption,head,body);review.append(heading,table,node('p','Local comparison only. Original example terms and your unsent booking plan are unchanged. No quote, deposit or agreement is created.','profile-small'));if(focus)heading.focus();
  }
  const actions=node('div',null,'editor-actions'),submit=node('button','Review local revision','button primary');submit.type='submit';const reset=node('button','Reset local revision','button quiet');reset.type='button';actions.append(submit,reset);form.append(actions,status);
  form.addEventListener('submit',event=>{
    event.preventDefault();for(const [key,input] of inputs){state.draft[key]=input.value;input.removeAttribute('aria-invalid');}
    const failures=bookingRevisionErrors(state.draft);if(failures.length){state.reviewed=null;review.replaceChildren();status.textContent='';errors.textContent=failures.map(([,message])=>message).join(' ');for(const [key] of failures)inputs.get(key).setAttribute('aria-invalid','true');inputs.get(failures[0][0]).focus();return;}
    errors.textContent='';state.reviewed={...state.draft,venue:state.draft.venue.trim(),notes:state.draft.notes.trim()};status.textContent='Local revision reviewed. Nothing sent or agreed.';paintReview(true);
  });
  reset.addEventListener('click',()=>{if(!window.confirm('Reset this local revision to the original example? Nothing has been sent.'))return;state.draft=initial(original);state.reviewed=null;for(const [key,input] of inputs){input.value=state.draft[key];input.removeAttribute('aria-invalid');}errors.textContent='';review.replaceChildren();status.textContent='Local revision reset. Original example unchanged.';inputs.get('date').focus();});
  section.append(form,review);paintReview();return section;
}
