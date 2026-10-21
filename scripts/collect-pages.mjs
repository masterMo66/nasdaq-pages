import {readFile,writeFile} from 'node:fs/promises';
import {collectVix} from './collect-vix.mjs';
const snapshot=JSON.parse(await readFile('data/snapshot.json','utf8'));
const api=await readFile('worker/api.js','utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from('const SNAPSHOT='+JSON.stringify(snapshot)+';const PAGE="";'+api).toString('base64'));
const funds=[],errors=[];
for(const fund of snapshot.funds){
 let body,response;
 for(let attempt=0;attempt<3;attempt++){
  if(attempt)await new Promise(resolve=>setTimeout(resolve,3000*attempt));
  response=await worker.fetch(new Request('https://example.com/api/fund?code='+fund.code));
  body=await response.json();if(response.ok)break;
  console.warn(fund.code,'attempt',attempt+1,body.error);
 }
 if(response.ok){funds.push(body);console.log(fund.code,body.latest.date,body.latest.navDate)}
 else{funds.push(fund);errors.push(fund.code+': '+body.error);console.error(errors.at(-1))}
}
const updated=funds.filter((f,i)=>f!==snapshot.funds[i]).length;
if(updated)await writeFile('data/snapshot.json',JSON.stringify({...snapshot,fetchedAt:new Date().toISOString(),funds,collection:{updated,total:funds.length,errors}}));
await writeFile('data/collection-status.json',JSON.stringify({attemptedAt:new Date().toISOString(),updated,total:funds.length,errors},null,2));
try{await collectVix()}catch(e){console.error('VIX collection failed; previous data retained:',e.message);process.exitCode=1}
if(errors.length)process.exitCode=1;
