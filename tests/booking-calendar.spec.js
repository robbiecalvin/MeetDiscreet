import {test,expect} from '@playwright/test';
import {bookingCalendarMonth,shiftCalendarMonth} from '../src/booking-calendar.js';
test('calendar uses Monday-first whole weeks and Gregorian leap years without local-zone date shifts',()=>{
  const june=bookingCalendarMonth('2030-06');expect(june.cells).toHaveLength(35);expect(june.cells.slice(0,5)).toEqual([null,null,null,null,null]);expect(june.cells[5]).toEqual({day:1,date:'2030-06-01'});expect(june.cells.at(-1)).toEqual({day:30,date:'2030-06-30'});
  expect(bookingCalendarMonth('2028-02').cells.filter(Boolean)).toHaveLength(29);expect(bookingCalendarMonth('1900-02').cells.filter(Boolean)).toHaveLength(28);expect(bookingCalendarMonth('2000-02').cells.filter(Boolean)).toHaveLength(29);
});
test('month navigation crosses years safely and rejects malformed month inputs',()=>{
  expect(shiftCalendarMonth('2030-12',1)).toBe('2031-01');expect(shiftCalendarMonth('2030-01',-1)).toBe('2029-12');expect(shiftCalendarMonth('0100-01',-1)).toBeNull();expect(shiftCalendarMonth('9999-12',1)).toBeNull();
  for(const key of ['2030-00','2030-13','2030-1','0099-12','not a month'])expect(()=>bookingCalendarMonth(key)).toThrow();expect(()=>shiftCalendarMonth('2030-06',1.5)).toThrow();
});
async function open(page){await page.goto('/?page=booking-inbox-preview');await page.getByRole('button',{name:'I am 18 or older',exact:true}).click();await page.getByRole('button',{name:'Calendar view',exact:true}).click();}
test('calendar dates filter example cards, return focus from detail and reset dates across example perspectives',async({page})=>{
  await page.setViewportSize({width:390,height:900});await open(page);const calendar=page.locator('.booking-calendar');await expect(calendar.locator('caption')).toContainText('June 2030');await expect(calendar.locator('table button')).toHaveCount(2);
  const day=calendar.locator('[data-calendar-date="2030-06-15"]');await day.click();await expect(day).toHaveAttribute('aria-pressed','true');await expect(page.locator('.booking-example-card')).toHaveCount(1);
  await page.getByRole('button',{name:'View example: A gallery afternoon',exact:true}).click();await expect(page.locator('.booking-example-detail')).toContainText('America/Vancouver');await page.getByRole('button',{name:'Back to example requests',exact:false}).click();await expect(day).toBeFocused();
  await page.getByRole('button',{name:'Show all dates in this month',exact:true}).click();await expect(page.locator('.booking-example-card')).toHaveCount(2);
  await page.getByRole('button',{name:'Provider example',exact:true}).click();await expect(calendar.locator('table button')).toHaveCount(3);await expect(calendar.locator('[aria-pressed=true]')).toHaveCount(0);
  await page.getByLabel('Find an example request',{exact:true}).fill('Jordan');await expect(calendar.locator('table button')).toHaveCount(1);await expect(calendar.locator('[data-calendar-date="2030-06-17"]')).toBeVisible();
  await page.getByRole('button',{name:'List view',exact:true}).click();await expect(calendar).toBeHidden();await expect(page.getByLabel('Find an example request',{exact:true})).toHaveValue('Jordan');await expect(page.locator('.booking-example-card')).toHaveCount(1);
});
test('empty calendar months imply no availability, preserve filters and return to example dates without writes',async({page})=>{
  const writes=[];page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method()))writes.push(request.url());});await open(page);const calendar=page.locator('.booking-calendar');
  await expect(calendar.locator('time[datetime="2030-06-14"]').locator('..').getByRole('button')).toHaveCount(0);await expect(calendar).toContainText('does not show bookable time');
  await page.getByLabel('Example request status',{exact:true}).selectOption('revision_requested');await expect(calendar.locator('table button')).toHaveCount(1);
  await page.getByRole('button',{name:'Next month',exact:true}).click();await expect(calendar.locator('caption')).toContainText('July 2030');await expect(calendar.locator('caption')).toBeFocused();await expect(calendar.locator('table button')).toHaveCount(0);await expect(page.locator('.booking-inbox-list-panel [role=status]')).toContainText('0 example requests');await expect(page.locator('.booking-inbox-list-panel [role=status]')).toContainText('Blank days are not availability');
  await page.getByRole('button',{name:'Example month',exact:true}).click();await expect(calendar.locator('caption')).toContainText('June 2030');await expect(page.getByLabel('Example request status',{exact:true})).toHaveValue('revision_requested');await expect(page.locator('.booking-example-card')).toHaveCount(1);expect(writes).toEqual([]);
});
for(const width of [320,390,1440])test(`booking example calendar fits ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await open(page);await expect(page.locator('.booking-calendar table')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if([390,1440].includes(width)){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`/tmp/booking-calendar-${width}.png`,fullPage:true});}
});
