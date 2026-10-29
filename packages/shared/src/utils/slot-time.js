// Convert a mentor's calendar date and wall-clock time to an absolute instant.
// Calendar dates are stored at UTC midnight; never reinterpret them as local days.
export function slotDateTime(date, time, timezone = 'UTC') {
  const day = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Invalid slot date or time');
  const target = Date.parse(`${day}T${time}:00Z`);
  if (!Number.isFinite(target) || new Date(target).toISOString().slice(0,10) !== day) throw new Error('Invalid slot date');
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' });
  const wall = (instant) => {
    const p=Object.fromEntries(formatter.formatToParts(new Date(instant)).map(({type,value})=>[type,value]));
    return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
  };
  // Sample offsets on either side of a DST transition, and require one unique match.
  const offsets=new Set([-2,-1,0,1,2].map(days=>{const instant=target+days*86400000;return wall(instant)-instant;}));
  const matches=[...offsets].map(offset=>target-offset).filter(instant=>wall(instant)===target);
  if(matches.length!==1)throw new Error('Slot time is missing or ambiguous at a daylight-saving transition');
  return new Date(matches[0]);
}
