import {test,expect} from '@playwright/test';
async function open(page) {await page.goto('/?page=messages-preview');await page.getByRole('button',{name:'I am 18 or older',exact:true}).click();}
test('conversation preview is age-gated, searchable and adds only local safely rendered messages',async({page})=>{
  const writes=[];page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method()))writes.push(request.url());});
  await page.goto('/?page=messages-preview');await expect(page.locator('#app')).toBeHidden();await page.getByRole('button',{name:'I am 18 or older',exact:true}).click();
  await expect(page).toHaveTitle('Conversation preview · MeetDiscreet');await expect(page.getByRole('heading',{name:'Choose a conversation',exact:true})).toBeVisible();
  await page.getByLabel('Find an example conversation',{exact:true}).fill('no such person');await expect(page.locator('.messages-sidebar [role=status]')).toContainText('No example conversations match');
  await page.getByLabel('Find an example conversation',{exact:true}).fill('mAyA');await expect(page.locator('.message-conversation')).toHaveCount(1);
  await page.getByRole('button',{name:'Open Maya preview',exact:true}).click();await expect(page.locator('.messages-thread h2')).toBeFocused();
  const input=page.getByLabel('Try a preview message',{exact:true});await expect(page.getByRole('button',{name:'Preview message',exact:true})).toBeDisabled();
  await input.fill('<img src=x onerror=alert(1)>\nAn example message.');await page.getByRole('button',{name:'Preview message',exact:true}).click();
  await expect(page.locator('.message-bubble').last()).toContainText('local preview, not sent');await expect(page.locator('.message-bubble').last()).toContainText('<img src=x onerror=alert(1)>');await expect(page.locator('.message-log img')).toHaveCount(0);
  await expect(input).toHaveValue('');await expect(input).toBeFocused();expect(writes).toEqual([]);
  expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key!=='meetdiscreet.age-confirmed.v1'))).toEqual([]);
});
test('composer drafts stay with their example conversation, reset requires confirmation and a reload clears local changes',async({page})=>{
  await open(page);await page.getByRole('button',{name:'Open Maya preview',exact:true}).click();await page.getByLabel('Try a preview message',{exact:true}).fill('Maya composer draft');
  await page.getByRole('button',{name:'Open James preview',exact:true}).click();await expect(page.getByLabel('Try a preview message',{exact:true})).toHaveValue('');await page.getByLabel('Try a preview message',{exact:true}).fill('James composer draft');
  await page.getByRole('button',{name:'Open Maya preview',exact:true}).click();await expect(page.getByLabel('Try a preview message',{exact:true})).toHaveValue('Maya composer draft');
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Reset conversation preview',exact:true}).click();await expect(page.getByLabel('Try a preview message',{exact:true})).toHaveValue('Maya composer draft');
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Reset conversation preview',exact:true}).click();await expect(page.getByLabel('Try a preview message',{exact:true})).toHaveValue('');
  await page.getByRole('button',{name:'Open James preview',exact:true}).click();await expect(page.getByLabel('Try a preview message',{exact:true})).toHaveValue('James composer draft');
  await page.reload();await page.getByRole('button',{name:'Open James preview',exact:true}).click();await expect(page.getByLabel('Try a preview message',{exact:true})).toHaveValue('');await expect(page.locator('.message-bubble')).toHaveCount(1);
});
for(const width of [320,390,700,1024,1440]) {
  test(`conversation preview layout and navigation at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});await open(page);await page.getByRole('button',{name:'Open Maya preview',exact:true}).click();
    const mobile=width<=700;await expect(page.locator('.messages-sidebar'))[mobile?'toBeHidden':'toBeVisible']();
    await expect(page.locator('.messages-thread')).toBeVisible();await page.getByLabel('Try a preview message',{exact:true}).fill('A long fictional message '.repeat(20));await page.getByRole('button',{name:'Preview message',exact:true}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if([390,1440].includes(width)){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`/tmp/messages-preview-${width}.png`,fullPage:true});}
    if(mobile){await page.getByRole('button',{name:'Back to conversations',exact:false}).click();await expect(page.locator('.messages-sidebar')).toBeVisible();await expect(page.getByLabel('Find an example conversation',{exact:true})).toBeFocused();}
  });
}
