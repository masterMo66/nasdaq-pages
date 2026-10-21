import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const VIX_SOURCE='https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv';
export function parseVix(csv,now=new Date()){
 const lines=csv.trim().split(/\r?\n/);if(lines.shift()?.replace(/^\uFEFF/,'')!=='DATE,OPEN,HIGH,LOW,CLOSE')throw Error('VIX CSV header changed');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const rows=lines.map(line=>{const [date,,,,close]=line.split(','),m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);if(!m)throw Error('Invalid VIX date');return {date:`${m[3]}-${m[1]}-${m[2]}`,close:Number(close)}}).filter(r=>r.date<=today);
 if(rows.length<2||rows.some((r,i)=>!Number.isFinite(r.close)||r.close<=0||(i&&r.date<=rows[i-1].date)))throw Error('Invalid VIX history');
 const history=rows.slice(-60),latest=history.at(-1),previous=history.at(-2);
 return {symbol:'VIX',name:'Cboe Volatility Index',source:VIX_SOURCE,sourcePage:'https://www.cboe.com/tradable-products/vix/vix-historical-data/',fetchedAt:now.toISOString(),history,latest:{...latest,change:latest.close-previous.close,changePercent:(latest.close/previous.close-1)*100}};
}
export async function collectVix(){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{
   if(attempt)await new Promise(resolve=>setTimeout(resolve,2000*attempt));
   const r=await fetch(VIX_SOURCE,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('VIX HTTP '+r.status);
   const data=parseVix(await r.text());let old;try{old=JSON.parse(await readFile('data/vix.json','utf8'))}catch{}
   if(old?.latest?.date>data.latest.date)throw Error('VIX source returned older data');
   await writeFile('data/vix.json',JSON.stringify(data,null,2));console.log('VIX',data.latest.date,data.latest.close);return data;
  }catch(e){last=e}
 }
 throw last;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await collectVix();
