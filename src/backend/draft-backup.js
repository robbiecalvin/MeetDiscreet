import { backendClient, requireUser } from './client.js';
export const draftBackupKinds = [
  {id:'provider-profile',label:'Provider profile draft',table:'profile_drafts',fields:['username','adult_age','display_name','tagline','city','area','photo_index','biography','interests']},
  {id:'user-profile',label:'User profile draft',table:'user_profile_drafts',fields:['username','adult_age','display_name','city','prefer_not_to_say','gender_description','interests','languages','looking_for','enjoys']},
  {id:'listings',label:'Listing drafts',table:'listing_drafts',fields:['id','kind','title','description','city','area','activity'],multiple:true},
  {id:'experiences',label:'Experience catalogue',table:'experience_catalogue_drafts',fields:['items']},
  {id:'availability',label:'Availability draft',table:'availability_drafts',fields:['time_zone','windows']},
  {id:'booking-plan',label:'Unsent booking plan',table:'booking_plan_drafts',fields:['plan']},
];
export async function readSavedDraftCopy(kinds) {
  if (!Array.isArray(kinds) || !kinds.length || new Set(kinds).size !== kinds.length || kinds.some(id=>!draftBackupKinds.some(kind=>kind.id===id))) throw new Error('Choose valid draft types.');
  const user = await requireUser(); const client = backendClient();
  const entries = await Promise.all(kinds.map(async id=> {
    const kind = draftBackupKinds.find(value=>value.id===id);
    let query = client.from(kind.table).select(['owner_id',...kind.fields].join(','), kind.multiple ? {count:'exact'} : undefined).eq('owner_id',user.id);
    if (kind.multiple) query = query.order('id',{ascending:true}).limit(1000);
    const {data,error,count} = await query;
    if (error || !Array.isArray(data) || data.some(row=>!row || typeof row!=='object' || row.owner_id!==user.id || kind.fields.some(field=>!Object.hasOwn(row,field)))) throw new Error('Selected draft data is unavailable. Check sign-in, connection and the selected database migrations, then retry.');
    if (kind.multiple && (count === null || count !== data.length)) throw new Error('Not all saved listings were returned. Listing downloads support up to 1,000 drafts; select other types or retry after checking your listings.');
    if (!kind.multiple && data.length>1) throw new Error('Unexpected saved draft records.');
    return [id,data.map(row=>Object.fromEntries(kind.fields.map(field=>[field,row[field]])))];
  }));
  const verified = await requireUser();
  if (verified.id!==user.id) throw new Error('Account changed.');
  return {format:'meetdiscreet-saved-drafts',version:1,retrievedAt:new Date().toISOString(),drafts:Object.fromEntries(entries)};
}
