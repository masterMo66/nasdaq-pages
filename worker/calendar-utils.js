export function calendarDate(instant,zone='Asia/Shanghai'){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(instant)).map(p=>[p.type,p.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
export function calendarClock(instant,zone='Asia/Shanghai'){
 return new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(instant));
}
export function nyInstant(date,time){
 const target=Date.parse(date+'T'+time+':00Z');let candidate=target;
 for(let i=0;i<3;i++){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(candidate)).map(p=>[p.type,p.value]));
  const displayed=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second));
  candidate+=target-displayed;
 }
 return new Date(candidate).toISOString();
}
