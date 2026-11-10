import {test,expect} from '@playwright/test';
test('draft-copy direct visits stay age-gated and backend-disabled mode exposes no private download',async({page})=>{
  await page.goto('/?page=draft-backup');await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button',{name:'I am 18 or older'}).click();
  await expect(page).toHaveTitle('Saved draft download · MeetDiscreet');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Keep a copy of your drafts.');
  await expect(page.locator('.backup-status')).toContainText('require the development backend');
  await expect(page.getByRole('button',{name:'Download selected saved drafts',exact:true})).toHaveCount(0);
});
