import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { liveFund } from '../worker/api.js';

const snapshot = JSON.parse(await readFile(new URL('../data/snapshot.json', import.meta.url)));
const fixture = snapshot.funds.find(fund => fund.code === '513500');

function sources(t, { short = false, fail = false } = {}) {
  const rows = [...fixture.history].reverse().map(row => ({ FSRQ: row.date, DWJZ: String(row.nav) }));
  const prices = [...fixture.history, fixture.latest].map(row => [row.date, row.close, row.close, row.close, row.close, 0, row.amount ?? 0].join(','));
  t.mock.method(globalThis, 'fetch', async input => {
    if (fail) throw new Error('offline');
    const url = new URL(input);
    if (url.hostname === 'api.fund.eastmoney.com') {
      const start = (Number(url.searchParams.get('pageIndex')) - 1) * 20;
      return Response.json({ Data: { LSJZList: short ? rows.slice(0, 5) : rows.slice(start, start + 20) } });
    }
    return Response.json({ data: { name: fixture.name, klines: prices } });
  });
}

test('new fund bootstrap joins unadjusted quotes only with same-day NAV', async t => {
  sources(t);
  const { history, latest, ...metadata } = fixture;
  const result = await liveFund({ ...metadata, history: [] });
  assert.equal(result.history.length, 260);
  assert.equal(result.latest.date, fixture.latest.date);
  assert.equal(result.latest.navDate, fixture.latest.navDate);
  assert.ok(result.history.every(row => Math.abs(row.premium - (row.close / row.nav - 1) * 100) < 1e-8));
  assert.ok(!result.history.some(row => row.date > fixture.latest.navDate));
});

test('new funds with insufficient genuine history are rejected', async t => {
  sources(t, { short: true });
  await assert.rejects(liveFund({ ...fixture, latest: undefined, history: [] }), /历史不足/);
});

test('failed source collection leaves the previously published fund unchanged', async t => {
  sources(t, { fail: true });
  const before = structuredClone(fixture);
  await assert.rejects(liveFund(fixture), /获取失败/);
  assert.deepEqual(fixture, before);
});
