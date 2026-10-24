import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chartSeries, csvText, dateBounds, mergeFunds, validSnapshot } from '../src/lib/funds.js';
import { MARKETS, fundsForMarket } from '../src/lib/markets.js';
const snapshot = JSON.parse(await readFile(new URL('../data/snapshot.json', import.meta.url)));

test('refresh rejects duplicated codes, malformed prices and missing funds', () => {
  assert.ok(validSnapshot(snapshot, snapshot));
  const next = structuredClone(snapshot); next.funds[1] = next.funds[0];
  assert.equal(validSnapshot(next, snapshot), false);
  next.funds = structuredClone(snapshot.funds); next.funds[0].latest.close = null;
  assert.equal(validSnapshot(next, snapshot), false);
  assert.equal(validSnapshot({ funds: snapshot.funds.slice(1) }, snapshot), false);
});
test('refresh never rolls back quote date, NAV date or collection time', () => {
  for (const field of ['date', 'navDate', 'fetchedAt']) {
    const next = structuredClone(snapshot.funds);
    if (field === 'fetchedAt') next[0][field] = '2000-01-01T00:00:00Z'; else next[0].latest[field] = '2000-01-01';
    assert.deepEqual(mergeFunds(snapshot.funds, next)[0], snapshot.funds[0]);
  }
});
test('chart and CSV use only actual matching records in the selected range', () => {
  const funds = snapshot.funds;
  const bounds = dateBounds(funds, '3m');
  const { series, dates } = chartSeries(funds, [funds[0].code, funds[1].code], bounds.start, bounds.end);
  assert.ok(dates.length > 0);
  assert.ok(series.every(item => item.rows.every(row => row.date >= bounds.start && row.date <= bounds.end)));
  const csv = csvText(series);
  assert.ok(csv.startsWith('\ufeff'));
  assert.equal(csv.split('\r\n').length - 1, series.reduce((sum, item) => sum + item.rows.length, 0));
  assert.ok(csv.includes('同日单位净值'));
  const empty = chartSeries(funds, [funds[0].code], '1900-01-01', '1900-01-02');
  assert.equal(empty.dates.length, 0);
});

test('both index rosters have valid history and independent default comparisons', () => {
  for (const [index, market] of Object.entries(MARKETS)) {
    const funds = fundsForMarket(snapshot.funds, index);
    assert.equal(funds.length, index === 'sp500' ? 4 : 12);
    const bounds = dateBounds(funds, '3m');
    const { series } = chartSeries(funds, market.defaults, bounds.start, bounds.end);
    assert.equal(series.length, 3);
    assert.ok(series.every(item => item.rows.length > 0 && item.fund.index === index));
  }
});

test('legacy 12-fund browser cache preserves the four newly published funds', () => {
  const legacy = structuredClone(snapshot.funds.slice(0, 12));
  for (const fund of legacy) delete fund.index;
  const merged = mergeFunds(snapshot.funds, legacy);
  assert.equal(merged.length, 16);
  assert.deepEqual(fundsForMarket(merged, 'sp500'), snapshot.funds.slice(12));
  assert.equal(fundsForMarket(merged, 'nasdaq100').length, 12);
});
