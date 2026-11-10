import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const image=await readFile(new URL('../public/images/demo-portraits.png',import.meta.url));
const photo=(name='test-photo.png')=>({name,mimeType:'image/png',buffer:image});
async function open(page){await page.goto('/?page=photo-preview');await page.getByRole('button',{name:'I am 18 or older',exact:true}).click();}
async function trackUrls(page){await page.addInitScript(()=>{window.__photoUrls={created:[],revoked:[]};const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=value=>{const url=create(value);window.__photoUrls.created.push(url);return url;};URL.revokeObjectURL=url=>{window.__photoUrls.revoked.push(url);revoke(url);};});}
test('photo workspace is gated and supports local main selection, reordering, removal and confirmed reset without uploads',async({page})=>{
  await trackUrls(page);const writes=[];page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method()))writes.push(request.url());});
  await page.goto('/?page=photo-preview');await expect(page.locator('#app')).toBeHidden();await page.getByRole('button',{name:'I am 18 or older',exact:true}).click();await expect(page).toHaveTitle('Photo workspace preview · MeetDiscreet');
  await page.getByLabel('Choose test photos',{exact:true}).setInputFiles([photo(),photo('second.png')]);await expect(page.locator('.photo-preview > [role=status]')).toContainText('2 local photos');
  await page.getByRole('button',{name:'Use photo 2 as main preview',exact:true}).click();await expect(page.locator('.photo-main-preview img')).toHaveAttribute('alt','Photo 2 selected for local main preview');await expect(page.locator('.photo-preview-card h3')).toHaveText(['Photo 2','Photo 1']);
  await page.getByRole('button',{name:'Move photo 1 earlier',exact:true}).click();await expect(page.locator('.photo-preview-card h3')).toHaveText(['Photo 1','Photo 2']);
  await page.getByRole('button',{name:'Remove photo 1',exact:true}).click();await expect(page.locator('.photo-preview-card')).toHaveCount(1);await expect(page.locator('.photo-main-preview img')).toHaveAttribute('alt','Photo 2 selected for local main preview');
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Clear photo workspace',exact:true}).click();await expect(page.locator('.photo-preview-card')).toHaveCount(1);
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Clear photo workspace',exact:true}).click();await expect(page.locator('.photo-preview img')).toHaveCount(0);await expect(page.getByLabel('Choose test photos',{exact:true})).toBeFocused();
  expect(await page.evaluate(()=>window.__photoUrls.created.every(url=>window.__photoUrls.revoked.includes(url)))).toBe(true);expect(writes).toEqual([]);
});
test('photo workspace rejects unsupported, mislabeled, oversized and undecodable files, and keeps the existing workspace when over capacity',async({page})=>{
  await trackUrls(page);await open(page);const input=page.getByLabel('Choose test photos',{exact:true});const error=page.locator('.photo-preview > [role=alert]');
  await input.setInputFiles({name:'unsafe.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')});await expect(error).toContainText('SVG and other files are not supported');
  await input.setInputFiles({name:'mislabelled.png',mimeType:'image/png',buffer:Buffer.from('<svg></svg>')});await expect(error).toContainText('matching image content');
  await input.setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(5*1024*1024+1)});await expect(error).toContainText('no larger than 5 MB');
  await input.setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0])});await expect(error).toContainText('could not be opened');await expect(page.locator('.photo-preview img')).toHaveCount(0);
  await input.setInputFiles([photo(),photo('two.png')]);await expect(page.locator('.photo-preview-card')).toHaveCount(2);
  await input.setInputFiles([photo('three.png'),photo('four.png'),photo('five.png')]);await expect(error).toContainText('up to 4 photos');await expect(page.locator('.photo-preview-card')).toHaveCount(2);
});
test('leaving the photo workspace revokes object URLs and revisiting starts empty',async({page})=>{
  await trackUrls(page);await open(page);await page.getByLabel('Choose test photos',{exact:true}).setInputFiles(photo());await expect(page.locator('.photo-preview-card')).toHaveCount(1);
  await page.getByRole('link',{name:'Back to provider setup',exact:false}).click();expect(await page.evaluate(()=>window.__photoUrls.created.every(url=>window.__photoUrls.revoked.includes(url)))).toBe(true);
  await page.getByRole('link',{name:'Try the local photo workspace',exact:true}).click();await expect(page.locator('.photo-preview img')).toHaveCount(0);await expect(page.getByRole('button',{name:'Clear photo workspace',exact:true})).toBeDisabled();
});
for(const width of [320,390,1024,1440])test(`photo workspace layout at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await open(page);await page.getByLabel('Choose test photos',{exact:true}).setInputFiles([photo(),photo('two.png')]);await expect(page.locator('.photo-preview-card')).toHaveCount(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if([390,1440].includes(width)){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`/tmp/photo-preview-${width}.png`,fullPage:true});}
});
