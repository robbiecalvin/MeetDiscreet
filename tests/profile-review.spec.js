import {test,expect} from '@playwright/test';
test('profile inspection is age-gated and backend-disabled mode supplies no private fixtures or decisions',async({page})=>{
  await page.goto('/?page=profile-review');await expect(page.locator('#app')).toBeHidden();await page.getByRole('button',{name:'I am 18 or older',exact:true}).click();
  await expect(page).toHaveTitle('Profile submission review · MeetDiscreet');await expect(page.locator('.profile-review > [role=status]')).toContainText('requires the connected backend');await expect(page.locator('.profile-review-card')).toHaveCount(0);await expect(page.getByRole('button',{name:'Refresh profile review queue',exact:true})).toBeHidden();await expect(page.getByRole('button',{name:/Approve|Publish/})).toHaveCount(0);
});
