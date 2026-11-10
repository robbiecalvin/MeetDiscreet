import { test, expect } from '@playwright/test';
async function enter(page, path) {
  await page.goto(path); await page.getByRole('button',{name:'I am 18 or older'}).click();
}
test('direct Looking For summary is gated, refreshable and limited to public card data',async({page})=>{
  await page.goto('/?ad=concert'); await expect(page.locator('#app')).toBeHidden();
  await page.getByRole('button',{name:'I am 18 or older'}).click();
  const summary = page.getByRole('region',{name:'Looking For public summary',exact:true});
  await expect(summary.getByRole('heading',{level:1})).toHaveText('A little live music this weekend?');
  await expect(summary).toContainText('Daniel, 32');
  await expect(summary).toContainText('Looking for company for an evening of live music and a bite to eat.');
  await expect(summary).toContainText('Full post and contact tools are not available');
  await expect(summary).not.toContainText('Live music, local history, and finding the unexpected.');
  await expect(summary.getByRole('link',{name:'View companion profile'})).toHaveCount(0);
  await expect(summary.getByRole('button',{name:'Subscribe to connect'})).toHaveCount(0);
  await expect(page.locator('.view-dock')).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading',{level:1})).toHaveText('A little live music this weekend?');
  await expect(page.locator('#age-gate')).toBeHidden();
});
test('Looking For title links preserve category, search, focus and browser history',async({page})=>{
  await enter(page,'/');
  await page.getByRole('button',{name:'Explore the ads'}).click();
  await page.getByRole('button',{name:'Looking For',exact:true}).click();
  await page.getByRole('searchbox').fill('music');
  await page.getByRole('link',{name:'A little live music this weekend?',exact:true}).click();
  await expect(page).toHaveURL(/ad=concert/);
  await page.getByRole('link',{name:'Back to Looking For ads',exact:false}).click();
  await expect(page.getByRole('searchbox')).toHaveValue('music');
  await expect(page.getByRole('button',{name:'Looking For',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'View ad',exact:true})).toBeFocused();
  await page.goBack(); await expect(page).toHaveURL(/ad=concert/);
  await page.goForward(); await expect(page.locator('.ad-card')).toHaveCount(1);
});
test('Looking For summary leads to own private draft tools without sending or public publishing',async({page})=>{
  const writes=[]; page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method()))writes.push(request.url());});
  await enter(page,'/?ad=books');
  await page.getByRole('link',{name:'Manage my Looking For drafts',exact:true}).click();
  await expect(page).toHaveURL(/page=my-listings/); await expect(page).toHaveURL(/kind=looking/);
  await page.getByRole('link',{name:'Start a Looking For draft',exact:true}).click();
  await expect(page.getByLabel('Listing type',{exact:true})).toHaveValue('looking');
  expect(writes).toEqual([]);
});
for(const width of [320,390,1440]) {
  test(`Looking For summary layout at ${width}px`,async({page})=>{
    const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize({width,height:844}); await enter(page,'/?ad=books');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.screenshot({path:`/tmp/looking-for-summary-${width}.png`,fullPage:true});
    expect(errors).toEqual([]);
  });
}
