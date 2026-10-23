import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CALENDAR} from '../data/calendar.mjs';
import {CALENDAR_REVIEW} from '../data/calendar-editorial.mjs';
import {EARNINGS} from '../data/earnings.mjs';
import {calICSText} from '../src/lib/calendar-export.js';
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
 assert.ok(event.summary?.length>20);assert.equal(event.verifiedAt,event.type==='EARNINGS'?(EARNINGS.companies.find(c=>c.ticker===event.ticker).verifiedAt||EARNINGS.verifiedAt):(CALENDAR_REVIEW.events[event.id]?.verifiedAt||CALENDAR.verifiedAt));
 for(const link of [event.source,event.overviewSource,event.resultSource].filter(Boolean)){
  const url=new URL(link);assert.equal(url.protocol,'https:');if(event.type==='EARNINGS'){const company=EARNINGS.companies.find(c=>c.ticker===event.ticker);assert.ok([company.source,company.ir].includes(link))}else assert.ok(['www.bls.gov','www.bea.gov','www.federalreserve.gov','www.fec.gov'].includes(url.hostname));
 }
 if(event.resultSummary){assert.ok(event.resultSource);assert.ok(event.resultVerifiedAt>=event.date)}
}
const election=CALENDAR.events.find(e=>e.type==='MIDTERMS');assert.equal(election.date,'2026-11-03');assert.equal(election.instant,null);assert.ok(election.allDay);
assert.equal(EARNINGS.companies.length,20);assert.deepEqual(EARNINGS.companies.map(c=>c.rank),Array.from({length:20},(_,i)=>i+1));
assert.equal(new Set(EARNINGS.companies.map(c=>c.ticker)).size,20);assert.ok(EARNINGS.companies.find(c=>c.ticker==='GOOGL').aliases.includes('GOOG'));
assert.equal(CALENDAR.events.filter(e=>e.type==='EARNINGS').length,17);
for(const c of EARNINGS.companies){assert.ok(c.note);assert.ok(c.source.startsWith('https://'));assert.equal(CALENDAR.events.some(e=>e.ticker===c.ticker),!!c.date)}
assert.deepEqual(EARNINGS.companies.filter(c=>!c.date).map(c=>c.ticker),['AVGO','BRK-B','MU']);
const apple=CALENDAR.events.find(e=>e.ticker==='AAPL'),microsoft=CALENDAR.events.find(e=>e.ticker==='MSFT'),walmart=CALENDAR.events.find(e=>e.ticker==='WMT');
assert.equal(apple.kind,'call');assert.equal(calendarDate(apple.instant),'2026-11-03');assert.equal(calendarClock(apple.instant),'06:00');
assert.equal(microsoft.instant,null);assert.ok(microsoft.dateOnly);assert.equal(microsoft.timeLabel,'美东盘后');assert.equal(calendarClock(microsoft.callInstant),'05:30');
assert.equal(calendarClock(walmart.instant),'20:00');assert.equal(calendarClock(walmart.callInstant),'21:00');
assert.equal(calendarClock(CALENDAR.events.find(e=>e.ticker==='XOM').instant),'18:30');
const ics=calICSText([election,octoberFed,apple,microsoft,walmart],CALENDAR);
assert.ok(ics.includes('DTSTART;VALUE=DATE:20261103'));assert.ok(ics.includes('DTEND;VALUE=DATE:20261104'));assert.ok(ics.includes('DTSTART:20261028T180000Z'));
assert.ok(ics.includes('DTSTAMP:'+CALENDAR.verifiedAt.replaceAll('-','')+'T000000Z'));
assert.ok(ics.includes('指标说明'));
assert.ok(ics.includes('DTSTART:20261102T220000Z'));assert.ok(ics.includes('DTSTART;VALUE=DATE:20261028'));assert.ok(ics.includes('DTSTAMP:20261023T000000Z'));
for(const line of ics.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);
const published=JSON.parse(await readFile('dist/calendar.json','utf8'));
assert.deepEqual(published,CALENDAR);
console.log(`${CALENDAR.events.length} events, 20-company roster, confirmed earnings, DST, date-only markers, ICS and published calendar passed.`);
