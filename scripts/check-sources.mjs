import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// This is source availability/change detection. Semantic dates and Chinese results
// remain reviewed separately; a successful HTTP request is not a content review.
const urls=['https://www.bls.gov/schedule/2026/home.htm','https://www.bls.gov/schedule/2027/home.htm','https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm','https://www.bea.gov/news/schedule/full','https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/'];
let previous={};try{previous=JSON.parse(await readFile('data/source-checks.json','utf8'))}catch{}
const checkedAt=new Date().toISOString(),sources=[];
for(const url of urls){
 const old=previous.sources?.find(s=>s.url===url);
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'Mozilla/5.0 (compatible; NasdaqCalendar/1.0)'}});
  if(!r.ok)throw Error('HTTP '+r.status);
  const html=await r.text();if(html.length<2000||/access denied|captcha/i.test(html.slice(0,2000)))throw Error('Source rejected request');
  const hash=createHash('sha256').update(html).digest('hex');
  sources.push({url,checkedAt,status:'ok',hash,changed:!!old?.hash&&old.hash!==hash,requiresReview:!!old?.requiresReview||(!!old?.hash&&old.hash!==hash)});
 }catch(e){sources.push({...old,url,attemptedAt:checkedAt,status:'failed',error:e.message})}
}
await writeFile('data/source-checks.json',JSON.stringify({checkedAt,scope:'Availability and change detection only; not semantic review',sources},null,2));
for(const s of sources)console.log(s.status,s.url,s.changed?'changed: manual content review needed':'');
if(sources.some(s=>s.status==='failed'))process.exitCode=1;
