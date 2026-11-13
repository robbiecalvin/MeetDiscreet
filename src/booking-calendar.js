function parts(key){
  if(typeof key!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(key))throw new Error('Invalid calendar month.');
  const [year,month]=key.split('-').map(Number);if(year<100)throw new Error('Invalid calendar year.');return {year,month};
}
export function shiftCalendarMonth(key,offset){
  const {year,month}=parts(key);if(!Number.isInteger(offset))throw new Error('Invalid month offset.');
  const total=year*12+month-1+offset,nextYear=Math.floor(total/12),nextMonth=((total%12)+12)%12+1;
  if(nextYear<100||nextYear>9999)return null;
  return `${String(nextYear).padStart(4,'0')}-${String(nextMonth).padStart(2,'0')}`;
}
export function bookingCalendarMonth(key){
  const {year,month}=parts(key),first=new Date(Date.UTC(year,month-1,1));
  const offset=(first.getUTCDay()+6)%7,days=new Date(Date.UTC(year,month,0)).getUTCDate();
  const cells=Array.from({length:Math.ceil((offset+days)/7)*7},(_,index)=>{const day=index-offset+1;return day>=1&&day<=days?{day,date:`${key}-${String(day).padStart(2,'0')}`}:null;});
  return {label:first.toLocaleDateString(undefined,{year:'numeric',month:'long',timeZone:'UTC'}),cells};
}
