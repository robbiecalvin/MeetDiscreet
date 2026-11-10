import { backendClient, requireUser } from './client.js';
async function verify(reviewer) { if((await requireUser()).id!==reviewer)throw new Error('Reviewer changed.'); }
export async function loadProfileReviewAccess() {
  const user=await requireUser();const {data,error}=await backendClient().rpc('can_review_profile_publications');
  if(error||typeof data!=='boolean')throw new Error('Profile review access unavailable.');
  return {reviewerId:user.id,allowed:data};
}
export async function listProfileReviewQueue(reviewer,cursor=null) {
  await verify(reviewer);
  const {data,error}=await backendClient().rpc('list_profile_publications_for_review',{p_expected_reviewer:reviewer,p_limit:21,p_after_submitted_at:cursor?.submitted_at??null,p_after_id:cursor?.id??null});
  if(error||!Array.isArray(data))throw new Error('Profile review queue unavailable.');return data;
}
export async function loadProfileReviewCopy(reviewer,id) {
  await verify(reviewer);const {data,error}=await backendClient().rpc('get_profile_publication_for_review',{p_expected_reviewer:reviewer,p_submission:id}).maybeSingle();
  if(error||(data&&data.id!==id))throw new Error('Profile review copy unavailable.');return data;
}
