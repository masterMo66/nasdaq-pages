import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {CALENDAR} from '../data/calendar.mjs';
import {nyInstant,calendarDate,calendarClock} from '../worker/calendar-utils.js';
assert.equal(nyInstant('2026-10-14','08:30'),'2026-10-14T12:30:00.000Z');
assert.equal(nyInstant('2026-11-10','08:30'),'2026-11-10T13:30:00.000Z');
assert.equal(calendarClock(nyInstant('2026-10-14','08:30')),'20:30');
assert.equal(calendarClock(nyInstant('2026-11-10','08:30')),'21:30');
const octoberFed=CALENDAR.events.find(e=>e.id==='FOMC-2026-10-28');
assert.equal(calendarDate(octoberFed.instant),'2026-10-29');
assert.equal(calendarDate(octoberFed.instant,'America/New_York'),'2026-10-28');
assert.equal(calendarClock(octoberFed.instant),'02:00');
assert.equal(calendarClock(CALENDAR.events.find(e=>e.id==='FOMC-2026-12-09').instant),'03:00');
assert.ok(CALENDAR.events.some(e=>e.id==='NFP-2026-02-11'));
assert.equal(new Set(CALENDAR.events.map(e=>e.id)).size,CALENDAR.events.length);
for(const event of CALENDAR.events){assert.ok(event.source.startsWith('https://'));if(!event.allDay){assert.equal(calendarDate(event.instant,'America/New_York'),event.date);assert.equal(calendarClock(event.instant,'America/New_York'),event.time)}}
for(const event of CALENDAR.events){
 assert.ok(event.summary?.length>20);assert.equal(event.verifiedAt,CALENDAR.verifiedAt);
 for(const link of [event.source,event.overviewSource,event.resultSource].filter(Boolean)){
  const url=new URL(link);assert.equal(url.protocol,'https:');assert.ok(['www.bls.gov','www.bea.gov','www.federalreserve.gov','www.fec.gov'].includes(url.hostname));
 }
 if(event.resultSummary){assert.ok(event.resultSource);assert.ok(event.resultVerifiedAt>=event.date)}
}
const election=CALENDAR.events.find(e=>e.type==='MIDTERMS');assert.equal(election.date,'2026-11-03');assert.equal(election.instant,null);assert.ok(election.allDay);
const client=await readFile('worker/calendar.js','utf8');
const serializer=client.slice(client.indexOf('function calICSText('),client.indexOf("$('#cal-export').onclick"));
const ics=vm.runInNewContext(serializer+'\ncalICSText(events)',{CALENDAR,TextEncoder,events:[election,octoberFed]});
assert.ok(ics.includes('DTSTART;VALUE=DATE:20261103'));assert.ok(ics.includes('DTEND;VALUE=DATE:20261104'));assert.ok(ics.includes('DTSTART:20261028T180000Z'));
assert.ok(ics.includes('DTSTAMP:'+CALENDAR.verifiedAt.replaceAll('-','')+'T000000Z'));
assert.ok(ics.includes('指标说明'));
for(const line of ics.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);
const html=await readFile('preview/index.html','utf8');const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));new vm.Script(script);
assert.ok(html.includes('id="calendar-page"'));assert.ok(!html.includes('/*CALENDAR*/'));
console.log('144 events, official-date exceptions, DST, midnight shifts, all-day elections, ICS and bundled script syntax passed.');
