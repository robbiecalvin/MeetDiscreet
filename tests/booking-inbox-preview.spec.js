import {test,expect} from '@playwright/test';
async function open(page){await page.goto('/?page=booking-inbox-preview');await page.getByRole('button',{name:'I am 18 or older',exact:true}).click();}
test('booking inbox preview is gated and keeps example perspectives/status filters separate without booking requests',async({page})=>{
  const writes=[];page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method()))writes.push(request.url());});
  await page.goto('/?page=booking-inbox-preview');await expect(page.locator('#app')).toBeHidden();await page.getByRole('button',{name:'I am 18 or older',exact:true}).click();await expect(page).toHaveTitle('Booking inbox preview · MeetDiscreet');
  await expect(page.getByRole('button',{name:'User example',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('.booking-example-card')).toHaveCount(2);
  await page.getByLabel('Example request status',{exact:true}).selectOption('revision_requested');await expect(page.locator('.booking-example-card')).toHaveCount(1);await expect(page.locator('.booking-example-card')).toContainText('An evening over dinner');
  await page.getByLabel('Find an example request',{exact:true}).fill('no matching place');await expect(page.locator('.booking-inbox-list-panel [role=status]')).toContainText('No example requests match');
  await page.getByRole('button',{name:'Clear request filters',exact:true}).click();await expect(page.locator('.booking-example-card')).toHaveCount(2);await expect(page.getByLabel('Find an example request',{exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Provider example',exact:true}).click();await expect(page.locator('.booking-example-card')).toHaveCount(3);await expect(page.getByLabel('Example request status',{exact:true})).toHaveValue('all');await expect(page.locator('.booking-inbox-preview')).toContainText('Maya’s fictional Provider inbox');
  await page.getByLabel('Example request status',{exact:true}).selectOption('accepted_awaiting_deposit');await expect(page.locator('.booking-example-card')).toHaveCount(1);await page.getByRole('button',{name:'View example: Coffee and a catch-up',exact:true}).click();
  await expect(page.locator('.booking-example-detail')).toContainText('distinct from confirmed');await expect(page.locator('.booking-example-detail')).toContainText('No deposit is calculated');
  await expect(page.getByRole('button',{name:/^Accept$|^Pay$|^Cancel$/})).toHaveCount(0);expect(writes).toEqual([]);
});
test('example revision compares immutable original and proposed terms and leaving/reloading resets the inbox',async({page})=>{
  await open(page);await page.getByRole('button',{name:'View example: An evening over dinner',exact:true}).click();
  const detail=page.locator('.booking-example-detail');await expect(detail.getByRole('heading',{name:'An evening over dinner',exact:true})).toBeFocused();
  await detail.getByText('Compare the example revision',{exact:true}).click();await expect(detail.locator('tbody tr').nth(1).locator('td')).toHaveText(['18:00','18:30']);await expect(detail.locator('tbody tr').nth(2).locator('td')).toHaveText(['1 hour 30 minutes','2 hours']);
  await expect(detail).toContainText('no agreement is recorded');await expect(detail).toContainText('America/Vancouver');
  await page.getByRole('button',{name:'Back to example requests',exact:false}).click();await expect(page.getByLabel('Find an example request',{exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Provider example',exact:true}).click();await page.reload();await expect(page.getByRole('button',{name:'User example',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('heading',{name:'Choose an example request',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Open the unsent booking-plan editor',exact:true}).click();await expect(page).toHaveTitle('Booking request preview · MeetDiscreet');
});
for(const width of [320,390,800,1024,1440])test(`booking inbox example layout at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await open(page);await page.getByRole('button',{name:'View example: An evening over dinner',exact:true}).click();await page.getByText('Compare the example revision',{exact:true}).click();
  await expect(page.locator('.booking-inbox-list-panel'))[width<=800?'toBeHidden':'toBeVisible']();await expect(page.locator('.booking-example-detail')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if([390,1440].includes(width)){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`/tmp/booking-inbox-preview-${width}.png`,fullPage:true});}
  await page.getByRole('button',{name:'Back to example requests',exact:false}).click();await expect(page.locator('.booking-inbox-list-panel')).toBeVisible();await expect(page.getByLabel('Find an example request',{exact:true})).toBeFocused();
});

test('exploring example bookings does not replace an existing unsent booking-plan draft',async({page})=>{
  await open(page);await page.getByRole('link',{name:'Open the unsent booking-plan editor',exact:true}).click();await page.getByLabel('Requests or notes (optional)',{exact:true}).fill('Keep this unsent plan separate from examples.');
  await page.getByRole('link',{name:'Back to User setup',exact:false}).click();await page.getByRole('link',{name:'Explore example requests',exact:true}).click();await page.getByRole('button',{name:'View example: An evening over dinner',exact:true}).click();await page.locator('.booking-local-revision summary').click();await page.getByLabel('Local revision notes (optional)',{exact:true}).fill('Separate local proposal text');await page.getByRole('button',{name:'Review local revision',exact:true}).click();
  await page.getByRole('link',{name:'Open the unsent booking-plan editor',exact:true}).click();await expect(page.getByLabel('Requests or notes (optional)',{exact:true})).toHaveValue('Keep this unsent plan separate from examples.');
});
