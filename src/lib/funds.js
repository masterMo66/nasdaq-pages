export const CHART_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];
export const pct = value => Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : '—';
export const num = (value, digits = 4) => Number.isFinite(value) ? value.toFixed(digits) : '—';
export function readSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function validFund(fund, codes) {
  return !!(fund && codes.includes(fund.code) && fund.history?.length > 0 && fund.history.every(row =>
    /^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.close > 0 && Number.isFinite(row.close) && row.nav > 0 && Number.isFinite(row.nav) && Number.isFinite(row.premium) && (row.amount === null || Number.isFinite(row.amount))) &&
    Number.isFinite(fund.latest?.premium) && Number.isFinite(fund.latest?.close) && fund.latest.close > 0 && Number.isFinite(fund.latest?.nav) && fund.latest.nav > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(fund.latest.date) && /^\d{4}-\d{2}-\d{2}$/.test(fund.latest.navDate) && fund.latest.navDate <= fund.latest.date && Number.isFinite(Date.parse(fund.fetchedAt)));
}
export function validSnapshot(next, bootstrap) {
  const codes = bootstrap.funds.map(fund => fund.code);
  return Array.isArray(next?.funds) && next.funds.length === codes.length && new Set(next.funds.map(fund => fund.code)).size === codes.length && next.funds.every(fund => validFund(fund, codes));
}
export function mergeFunds(current, incoming) {
  return current.map(old => {
    const next = incoming.find(fund => fund.code === old.code);
    return next && next.latest.date >= old.latest.date && next.latest.navDate >= old.latest.navDate && Date.parse(next.fetchedAt) >= Date.parse(old.fetchedAt) ? next : old;
  });
}
export function snapshotStamp(funds) {
  const times = funds.map(fund => fund.fetchedAt).sort();
  const format = value => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
  return format(times[0]) + (format(times[0]) !== format(times.at(-1)) ? ` 至 ${format(times.at(-1))}` : '');
}
export function dateBounds(funds, range = '3m') {
  const all = funds.flatMap(fund => fund.history.map(row => row.date)).sort();
  const end = all.at(-1);
  const date = new Date(`${end}T00:00:00Z`);
  if (range !== 'all') date.setUTCMonth(date.getUTCMonth() - ({ '1m': 1, '3m': 3, '6m': 6, '1y': 12 }[range] || 3));
  return { min: all[0], start: range === 'all' ? all[0] : date.toISOString().slice(0, 10), end };
}
export function chartSeries(funds, selected, start, end) {
  const series = selected.map(code => { const fund = funds.find(item => item.code === code); return { fund, rows: fund.history.filter(row => row.date >= start && row.date <= end) }; });
  return { series, dates: [...new Set(series.flatMap(item => item.rows.map(row => row.date)))].sort() };
}
export function csvText(series) {
  const header = ['基金代码', '基金公司', '交易日期', '未复权收盘价', '同日单位净值', '溢价率(%)', '成交额(元)', '来源'];
  const rows = series.flatMap(item => item.rows.map(row => [item.fund.code, item.fund.manager, row.date, row.close, row.nav, row.premium.toFixed(6), row.amount ?? '', `${row.quoteSource || '东方财富'}/天天基金`]));
  return '\ufeff' + [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
}
export function download(text, type, filename) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
