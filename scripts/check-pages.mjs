import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {FUND_CATALOG,MARKETS,fundsForMarket} from '../src/lib/markets.js';
const s=JSON.parse(await readFile('dist/snapshot.json','utf8'));
assert.deepEqual(s.funds.map(f=>f.code).sort(),FUND_CATALOG.map(f=>f.code).sort());
for(const index of Object.keys(MARKETS)){
 const funds=fundsForMarket(s.funds,index);
 assert.ok(funds.length>0);
 assert.ok(MARKETS[index].defaults.every(code=>funds.some(f=>f.code===code)));
 for(const f of funds)assert.equal(f.index,index);
}
assert.equal(s.vix.symbol,'VIX');assert.ok(s.vix.history.length>=30);
const [previous,latest]=s.vix.history.slice(-2);
assert.equal(s.vix.latest.date,latest.date);assert.equal(s.vix.latest.close,latest.close);
assert.ok(Math.abs(s.vix.latest.change-(latest.close-previous.close))<1e-8);
assert.ok(Math.abs(s.vix.latest.changePercent-(latest.close/previous.close-1)*100)<1e-8);
for(const f of s.funds){assert.ok(f.history.length>=200);let last='';for(const r of f.history){assert.ok(r.date>last);last=r.date;assert.ok(r.nav>0&&r.close>0);assert.ok(Math.abs(r.premium-(r.close/r.nav-1)*100)<1e-8)}assert.ok(f.latest.navDate<=f.latest.date);assert.ok(Math.abs(f.latest.premium-(f.latest.close/f.latest.nav-1)*100)<1e-8)}
const html=await readFile('dist/index.html','utf8');
assert.ok(!html.includes('/api/fund?'));
assert.ok(html.includes('id="root"'));
assert.ok(html.includes('type="module"'));
assert.ok(html.includes('./assets/'));
const assets=await readdir('dist/assets');
assert.ok(assets.some(name=>name.startsWith('CalendarPage-')&&name.endsWith('.js')),'Calendar must be lazy-loaded');
const client=(await Promise.all(assets.filter(name=>name.endsWith('.js')).map(name=>readFile('dist/assets/'+name,'utf8')))).join('\n');
assert.ok(client.includes('./snapshot.json'));
assert.ok(client.includes('09:17'));
assert.ok(!client.includes('/api/fund?'));
assert.ok(!client.includes('ios-pointer-layer'));
console.log(`Static snapshot, ${s.funds.length} fund formulas across two indices, relative Pages assets/refresh and lazy calendar passed`);
