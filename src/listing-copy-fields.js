export function listingCopyFields(fields = {}) {
  const list = document.createElement('dl');
  for (const [key, label] of [['title', 'Title'], ['description', 'Description'], ['city', 'City'], ['area', 'Area'], ['activity', 'Activity']]) {
    const term = document.createElement('dt'); term.textContent = label;
    const value = document.createElement('dd'); value.textContent = typeof fields[key] === 'string' && fields[key] ? fields[key] : 'Not supplied';
    list.append(term, value);
  }
  return list;
}
export function listingCopyTime(label, value) {
  const line = document.createElement('p'); line.className = 'profile-small';
  const parsed = typeof value === 'string' ? new Date(value) : null;
  line.textContent = `${label}: `;
  if (!parsed || Number.isNaN(parsed.getTime())) line.append('Date unavailable');
  else { const time = document.createElement('time'); time.dateTime = value; time.textContent = parsed.toLocaleString(undefined, { timeZoneName: 'short' }); line.append(time); }
  return line;
}
