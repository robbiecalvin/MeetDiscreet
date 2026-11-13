import {test,expect} from '@playwright/test';
import {profileComparisonRows} from '../src/profile-copy-differences.js';
test('profile comparison includes only seven public fields and preserves meaningful values',()=>{
 const recorded={display_name:'Original',photo_index:0,biography:'PRIVATE',owner_id:'private-owner'};
 const saved={display_name:'<img src=x>',photo_index:1,biography:'CHANGED PRIVATE',owner_id:'other-owner'};
 const rows=profileComparisonRows(recorded,saved);
 expect(rows).toHaveLength(7);expect(rows.filter(row=>row.changed).map(row=>row.label)).toEqual(['Display name','Demo photo selection']);
 expect(rows.at(-1).recorded).toBe('0');expect(rows[0].saved).toBe('<img src=x>');expect(JSON.stringify(rows)).not.toContain('PRIVATE');
 expect(profileComparisonRows({tagline:null},{tagline:''}).every(row=>!row.changed)).toBe(true);
 expect(profileComparisonRows({tagline:'a '},{tagline:'a'}).find(row=>row.label==='Tagline').changed).toBe(true);
});
