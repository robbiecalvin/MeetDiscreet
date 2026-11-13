export const profileCopyFieldDefinitions=[['display_name','Display name'],['username','Username'],['adult_age','Age'],['city','City'],['area','General area'],['tagline','Tagline'],['photo_index','Demo photo selection']];
const value=text=>text===null||text===undefined||text===''?'Not supplied':String(text);
export function profileComparisonRows(recorded={},saved={}) {
  return profileCopyFieldDefinitions.map(([key,label])=>({label,recorded:value(recorded[key]),saved:value(saved[key]),changed:(recorded[key]??'')!==(saved[key]??'')}));
}
