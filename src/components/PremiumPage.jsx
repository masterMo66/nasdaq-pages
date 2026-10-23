import { useCallback, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpDown, RefreshCw, Search, Star } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import Segmented from './Segmented.jsx';
import PremiumChart from './PremiumChart.jsx';
import StatCard from './StatCard.jsx';
import CompareButton from './CompareButton.jsx';
import FundChip from './FundChip.jsx';
import { CHART_COLORS, chartSeries, csvText, dateBounds, download, num, pct, readSaved, snapshotStamp } from '../lib/funds.js';

const RANGES = [['1m', '1个月'], ['3m', '3个月'], ['6m', '6个月'], ['1y', '1年'], ['all', '全部']];
const FILTERS = [['all', '全部基金'], ['favorites', '我的关注'], ['上交所', '沪市'], ['深交所', '深市']];
export default function PremiumPage({ data, notice, refreshing, refresh, notify, save }) {
  const [selected, setSelected] = useState(['513100', '159941', '513300']);
  const [range, setRange] = useState('3m'); const [customDates, setCustomDates] = useState(null);
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all'); const [ascending, setAscending] = useState(true);
  const [favorites, setFavorites] = useState(() => { const saved = readSaved('nasdaq-favorites', []); return Array.isArray(saved) ? saved.filter(value => typeof value === 'string') : []; });
  const [dateError, setDateError] = useState('');
  const funds = data.funds;
  const bounds = useMemo(() => dateBounds(funds, range), [funds, range]);
  const { start, end } = customDates || bounds;
  const { series, dates } = useMemo(() => chartSeries(funds, selected, start, end), [funds, selected, start, end]);
  const ranked = useMemo(() => [...funds].sort((a, b) => a.latest.premium - b.latest.premium), [funds]);
  const filtered = useMemo(() => funds.filter(fund => (filter === 'all' || (filter === 'favorites' ? favorites.includes(fund.code) : fund.exchange === filter)) && `${fund.code}${fund.name}${fund.manager}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => (ascending ? 1 : -1) * (a.latest.premium - b.latest.premium)), [funds, filter, favorites, query, ascending]);
  const toggleFund = useCallback(code => {
    if (selected.includes(code) && selected.length === 1) return notify('至少保留一只基金。');
    if (!selected.includes(code) && selected.length >= 4) return notify('最多对比 4 只，请先移除一只。');
    setSelected(old => old.includes(code) ? old.filter(value => value !== code) : [...old, code]);
  }, [selected, notify]);
  function toggleFavorite(code) { const next = favorites.includes(code) ? favorites.filter(value => value !== code) : [...favorites, code]; setFavorites(next); save('nasdaq-favorites', next); }
  function changeDate(key, value) {
    const next = { start, end, [key]: value };
    if (!value || next.start > next.end || next.start < bounds.min || next.end > bounds.end) { setDateError('请选择有效日期，起始日期不能晚于结束日期。'); return; }
    setDateError(''); setCustomDates(next);
  }
  function exportCsv() { const count = series.reduce((sum, item) => sum + item.rows.length, 0); if (!count) return notify('所选区间暂无可导出记录。'); download(csvText(series), 'text/csv;charset=utf-8', `纳指ETF同日溢价_${start}_${end}.csv`); notify(`已导出 ${count} 条真实历史记录。`); }
  const latestDates = [...new Set(funds.map(fund => fund.latest.date))].sort();
  return <div id="premium-page">
    <h1 className="sr-only">ETF 溢价观察</h1>
    <div className="page-actions"><div className="introaction"><span className="status"><i className="dot" />快照 {snapshotStamp(funds)} 北京时间</span><m.button className="primary" whileTap={{ scale: .96 }} disabled={refreshing} onClick={refresh}><RefreshCw size={15} className={refreshing ? 'spinning' : ''} aria-hidden="true" />{refreshing ? '读取中…' : '读取最新快照'}</m.button></div></div>
    <div className="notice" role="status">{notice || `行情快照：${snapshotStamp(funds)}（北京时间），非实时。刷新仅重新读取已发布快照。${data.collection?.errors?.length ? '部分基金保留上次有效数据。' : ''}`}</div>
    <section className="overviewmetrics" aria-label="市场统计">
      <Metric label="已覆盖纳指 ETF" value={<>{funds.length}<small>只</small></>} note="沪深两市 · 纳斯达克 100" />
      <Metric label="平均参考溢价" value={pct(funds.reduce((sum, fund) => sum + fund.latest.premium, 0) / funds.length)} note={`行情 ${latestDates[0]}${latestDates.length > 1 ? ` 至 ${latestDates.at(-1)}` : ''} · 非 IOPV 口径`} />
      <Metric label="最低参考溢价" value={pct(ranked[0].latest.premium)} note={`${ranked[0].name} · ${ranked[0].code}`} />
      <Metric label="最高参考溢价" value={pct(ranked.at(-1).latest.premium)} note={`${ranked.at(-1).name} · ${ranked.at(-1).code}`} />
    </section>
    <section className="chartsection" aria-labelledby="chart-title"><div className="sectionhead"><h2 id="chart-title">历史溢价率 <span className="tag">同日净值口径</span></h2><m.button className="outline" whileTap={{ scale: .96 }} onClick={exportCsv}><ArrowDownToLine size={15} aria-hidden="true" />导出曲线 CSV</m.button></div>
      <div className="charttools"><div className="chips"><AnimatePresence initial={false} mode="popLayout">{selected.map((code, index) => <FundChip key={code} fund={funds.find(fund => fund.code === code)} color={CHART_COLORS[index]} onRemove={toggleFund} />)}</AnimatePresence></div><Segmented label="时间区间" value={customDates ? '' : range} options={RANGES} onChange={next => { setRange(next); setCustomDates(null); setDateError(''); }} /></div>
      <div className="datebar"><span>同日收盘价 ÷ 单位净值 − 1</span><div><label>起始 <input name="start" aria-label="起始日期" type="date" value={start} min={bounds.min} max={bounds.end} onChange={event => changeDate('start', event.target.value)} aria-describedby={dateError ? 'date-error' : undefined} /></label><span>至</span><label><span className="sr-only">结束日期</span><input name="end" aria-label="结束日期" type="date" value={end} min={bounds.min} max={bounds.end} onChange={event => changeDate('end', event.target.value)} /></label><button className="quiet" onClick={() => { setCustomDates(null); setDateError(''); }}>重置</button></div></div>
      {dateError && <p id="date-error" role="alert" className="field-error">{dateError}</p>}
      <PremiumChart series={series} dates={dates} />
    </section>
    <section id="funds" className="fundsection"><div className="sectionhead"><h2>基金对比</h2></div><div className="tabletools"><Segmented label="基金筛选" options={FILTERS} value={filter} onChange={setFilter} /><label className="search"><Search size={17} aria-hidden="true" /><input name="fund-search" type="search" autoComplete="off" spellCheck={false} placeholder="搜索代码 / 基金公司…" aria-label="搜索基金" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
      <div className="tablewrap" tabIndex={0} role="region" aria-label="基金对比表，可横向滚动"><table><thead><tr><th scope="col"><span className="sr-only">关注</span></th><th scope="col">基金 / 代码</th><th scope="col">快照价 <small>元</small></th><th scope="col">最新净值 <small>元</small></th><th scope="col" aria-sort={ascending ? 'ascending' : 'descending'}><button className="sort" onClick={() => setAscending(old => !old)}>参考溢价<ArrowUpDown size={13} aria-hidden="true" /></button></th><th scope="col">成交额</th><th scope="col">行情 / 净值日期</th><th scope="col">曲线对比</th></tr></thead><tbody>{filtered.map(fund => <m.tr layout="position" transition={{ layout: { type: 'spring', stiffness: 320, damping: 32 } }} key={fund.code}>
        <td><button className={`favorite ${favorites.includes(fund.code) ? 'on' : ''}`} aria-label={`${favorites.includes(fund.code) ? '取消关注' : '关注'}${fund.name}`} aria-pressed={favorites.includes(fund.code)} onClick={() => toggleFavorite(fund.code)}><Star size={17} fill={favorites.includes(fund.code) ? 'currentColor' : 'none'} aria-hidden="true" /></button></td>
        <td className="fundname">{fund.name}<small>{fund.code} · {fund.exchange}</small></td><td title={`快照采集于 ${snapshotStamp([fund])} 北京时间`}>{num(fund.latest.close, 3)}</td><td>{num(fund.latest.nav)}</td><td className={`premium ${fund.latest.premium < 0 ? 'negative' : ''}`}>{pct(fund.latest.premium)}</td><td>{Number.isFinite(fund.latest.amount) ? `${(fund.latest.amount / 1e8).toFixed(2)} 亿` : '—'}</td><td className="dates">{fund.latest.date}<small>净值 {fund.latest.navDate}</small><small>行情源 {fund.quoteSource || '东方财富'}</small></td><td><CompareButton fund={fund} selected={selected.includes(fund.code)} onToggle={toggleFund} /></td>
      </m.tr>)}</tbody></table></div>
      {!filtered.length && <div className="empty">没有匹配的基金。试试其他代码，或调整筛选条件。</div>}
      <div className="tablefooter"><span>显示 {filtered.length} / {funds.length} 只基金</span><span>参考溢价 ≠ 实时 IOPV 溢价 · 不同基金净值日期可能不同</span></div>
    </section>
    <Methodology />
  </div>;
}
function Metric({ label, value, note }) { return <StatCard label={label} value={value} note={note} variant="overview" />; }
function Methodology() { return <section id="method" className="method"><div><h2>数据口径</h2><a href="https://fund.eastmoney.com/159941.html" target="_blank" rel="noopener noreferrer">查看净值数据来源 ↗</a></div><div className="methodtext">{[
  ['历史溢价率', '溢价率 =（未复权收盘价 / 同一日期单位净值 − 1）× 100%。仅保留日期严格匹配的记录。QDII 净值披露有延迟，缺少同日净值时不填零、不沿用旧净值。历史数据可能随净值更正而变化。'],
  ['最新参考溢价', '基金表使用最近交易日行情价与最新已披露单位净值计算参考溢价；交易中行情可能尚未收盘。它不等于基于实时估值或 IOPV 的溢价，也不代表历史时点实际可获知的净值。'],
  ['分位与数据更新', '末日分位 = 所选区间内溢价率不高于末日的记录数 / 有效记录数。行情优先使用东方财富，不可用时使用腾讯财经未复权日线；单位净值来自天天基金。缺失历史成交额时留空。GitHub Actions 每天北京时间 09:17、18:17 定时采集并发布快照，调度可能延迟。按钮读取最近发布的快照；浏览器保存成功读取的数据。净值披露有延迟，源站无新增记录时数值保持不变。'],
].map(([title, text], index) => <article key={title}><span className="mono">0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>; }
