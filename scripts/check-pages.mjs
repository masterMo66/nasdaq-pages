import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const s=JSON.parse(await readFile('dist/snapshot.json','utf8'));
assert.equal(s.funds.length,12);
for(const f of s.funds){assert.ok(f.history.length>=200);let last='';for(const r of f.history){assert.ok(r.date>last);last=r.date;assert.ok(r.nav>0&&r.close>0);assert.ok(Math.abs(r.premium-(r.close/r.nav-1)*100)<1e-8)}assert.ok(f.latest.navDate<=f.latest.date)}
const html=await readFile('dist/index.html','utf8');
assert.ok(!html.includes('/api/fund?'));
assert.ok(html.includes("fetch('./snapshot.json"));
assert.ok(html.includes('09:17'));
new vm.Script(html.slice(html.indexOf('<script>')+8,html.indexOf('</script>')));
console.log('Static snapshot, 12 fund formulas, relative refresh URL and client syntax passed');
