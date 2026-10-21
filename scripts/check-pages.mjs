import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const s=JSON.parse(await readFile('dist/snapshot.json','utf8'));
assert.equal(s.funds.length,12);
assert.equal(s.vix.symbol,'VIX');assert.ok(s.vix.history.length>=30);
const [previous,latest]=s.vix.history.slice(-2);
assert.equal(s.vix.latest.date,latest.date);assert.equal(s.vix.latest.close,latest.close);
assert.ok(Math.abs(s.vix.latest.change-(latest.close-previous.close))<1e-8);
assert.ok(Math.abs(s.vix.latest.changePercent-(latest.close/previous.close-1)*100)<1e-8);
for(const f of s.funds){assert.ok(f.history.length>=200);let last='';for(const r of f.history){assert.ok(r.date>last);last=r.date;assert.ok(r.nav>0&&r.close>0);assert.ok(Math.abs(r.premium-(r.close/r.nav-1)*100)<1e-8)}assert.ok(f.latest.navDate<=f.latest.date)}
const html=await readFile('dist/index.html','utf8');
assert.ok(!html.includes('/api/fund?'));
assert.ok(html.includes("fetch('./snapshot.json"));
assert.ok(html.includes('09:17'));
assert.ok(!html.includes('真实历史数据'));assert.ok(!html.includes('把价格与价值的距离'));
assert.ok(html.includes('role="switch"'));assert.ok(html.includes('id="vix-chart"'));
new vm.Script(html.slice(html.indexOf('<script>')+8,html.indexOf('</script>')));
console.log('Static snapshot, 12 fund formulas, relative refresh URL and client syntax passed');
