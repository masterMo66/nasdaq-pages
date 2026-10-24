import {readFile,writeFile} from 'node:fs/promises';
import {collectVix} from './collect-vix.mjs';
import {liveFund} from '../worker/api.js';
import {FUND_CATALOG} from '../src/lib/markets.js';
const snapshot=JSON.parse(await readFile('data/snapshot.json','utf8'));
const newOnly=process.argv.includes('--new-only');
const funds=[],errors=[];let updated=0;
for(const entry of FUND_CATALOG){
 const previous=snapshot.funds.find(f=>f.code===entry.code);
 const fund={history:[],...previous,...entry};
 if(newOnly&&previous){funds.push(fund);continue}
 let body,lastError;
 for(let attempt=0;attempt<3;attempt++){
  if(attempt)await new Promise(resolve=>setTimeout(resolve,3000*attempt));
  try{body=await liveFund(fund);break}catch(error){lastError=error;console.warn(fund.code,'attempt',attempt+1,error.message)}
 }
 if(body){funds.push(body);updated++;console.log(fund.code,body.latest.date,body.latest.navDate,body.history.length+' rows')}
 else{if(previous)funds.push(fund);errors.push(fund.code+': '+lastError?.message);console.error(errors.at(-1))}
}
if(updated)await writeFile('data/snapshot.json',JSON.stringify({...snapshot,fetchedAt:new Date().toISOString(),funds,collection:{updated,total:FUND_CATALOG.length,errors}}));
await writeFile('data/collection-status.json',JSON.stringify({attemptedAt:new Date().toISOString(),updated,total:FUND_CATALOG.length,errors},null,2));
if(!newOnly)try{await collectVix()}catch(e){console.error('VIX collection failed; previous data retained:',e.message);process.exitCode=1}
if(errors.length)process.exitCode=1;
