import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { CalendarDays, ChartNoAxesCombined, Gauge, TrendingUpDown } from 'lucide-react';
import { CHART_COLORS, num, pct } from '../lib/funds.js';
import StatCard from './StatCard.jsx';

const STAT_ICONS = [ChartNoAxesCombined, TrendingUpDown, Gauge, CalendarDays];

export default memo(function PremiumChart({ series, dates }) {
  const svg = useRef(); const [width, setWidth] = useState(850); const [cursor, setCursor] = useState(null);
  const reduced = useReducedMotion();
  useEffect(() => { const observer = new ResizeObserver(entries => { const width = entries[0].contentRect.width; if (width > 0) setWidth(width); }); observer.observe(svg.current); return () => observer.disconnect(); }, []);
  const height = width < 500 ? 250 : 320;
  const geometry = useMemo(() => {
    const values = series.flatMap(item => item.rows.map(row => row.premium));
    const low = Math.min(0, ...values), high = Math.max(0, ...values), pad = Math.max((high - low) * .15, 1);
    const min = low - pad, max = high + pad;
    const x = index => 48 + index / Math.max(dates.length - 1, 1) * (width - 64);
    const y = value => height - 32 - (value - min) / (max - min) * (height - 58);
    const positions = new Map(dates.map((date, index) => [date, index]));
    return { min, max, x, y, paths: series.map(item => item.rows.map(row => [x(positions.get(row.date)), y(row.premium)])), byDate: series.map(item => new Map(item.rows.map(row => [row.date, row]))) };
  }, [series, dates, width, height]);
  const index = cursor?.dates === dates ? Math.min(cursor.index, dates.length - 1) : null;
  const rows = series[0]?.rows || [], values = rows.map(row => row.premium);
  const stats = rows.length ? [pct(values.reduce((a, b) => a + b, 0) / values.length), `${pct(Math.max(...values))} / ${pct(Math.min(...values))}`, `${(values.filter(value => value <= values.at(-1)).length / values.length * 100).toFixed(1)}%`, `${rows.length} 天`] : ['—', '—', '—', '—'];
  const rangeKey = `${dates[0]}-${dates.at(-1)}`;
  return <>
    <div className="plotwrap">
      <svg id="chart" ref={svg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="ETF溢价率历史曲线，使用下方滑块查看每日数据" onPointerMove={event => { const box = event.currentTarget.getBoundingClientRect(); setCursor({ dates, index: Math.max(0, Math.min(dates.length - 1, Math.round((event.clientX - box.left - 48) / (width - 64) * (dates.length - 1)))) }); }} onPointerLeave={() => setCursor(null)}>
        <defs><linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--series-1)" stopOpacity=".13" /><stop offset="100%" stopColor="var(--series-1)" stopOpacity="0" /></linearGradient></defs>
        {!!dates.length && <>
          {Array.from({ length: 5 }, (_, i) => { const value = geometry.min + (geometry.max - geometry.min) * i / 4; return <g key={i}><line x1="48" x2={width - 16} y1={geometry.y(value)} y2={geometry.y(value)} className="chart-grid" /><text x="40" y={geometry.y(value) + 4} textAnchor="end" className="axis-label">{value.toFixed(1)}%</text></g>; })}
          <line x1="48" x2={width - 16} y1={geometry.y(0)} y2={geometry.y(0)} className="zero-line" />
          {Array.from({ length: width < 500 ? 4 : 6 }, (_, i) => { const count = width < 500 ? 4 : 6, j = Math.round(i * (dates.length - 1) / (count - 1)); return <text key={i} x={geometry.x(j)} y={height - 8} textAnchor={i === 0 ? 'start' : i === count - 1 ? 'end' : 'middle'} className="axis-label">{dates[j]?.slice(5)}</text>; })}
          {geometry.paths[0]?.length > 0 && <m.path key={`area-${rangeKey}-${series[0].fund.code}`} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .5 }} d={`M${geometry.paths[0][0][0]},${geometry.y(0)} L${geometry.paths[0].map(p => p.join(',')).join(' L')} L${geometry.paths[0].at(-1)[0]},${geometry.y(0)} Z`} fill="url(#chart-area)" />}
          {geometry.paths.map((points, i) => points.length === 1 ? <circle key={series[i].fund.code} cx={points[0][0]} cy={points[0][1]} r="4" fill={CHART_COLORS[i]} /> : points.length ? <m.path className="chart-series" key={`${series[i].fund.code}-${rangeKey}`} initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : .5 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: reduced ? 0 : .65, delay: reduced ? 0 : i * .04, ease: [.22, 1, .36, 1] }} d={`M${points.map(p => p.join(',')).join(' L')}`} fill="none" stroke={CHART_COLORS[i]} strokeWidth={i === 0 ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round" /> : null)}
          {index !== null && <m.g initial={false} animate={{ x: geometry.x(index) }} transition={{ duration: reduced ? 0 : .12, ease: 'easeOut' }}><line x1="0" x2="0" y1="26" y2={height - 32} className="crosshair" /></m.g>}
        </>}
      </svg>
      {!dates.length && <div className="empty chart-empty">这个区间暂无同日净值记录，请扩大日期范围。</div>}
      <AnimatePresence>{index !== null && dates.length > 0 && <m.div key="tooltip" className="tooltip" initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 3 }} transition={{ duration: reduced ? 0 : .16 }}><strong>{dates[index]} · 历史溢价</strong>{series.map((item, i) => { const row = geometry.byDate[i].get(dates[index]); return <div key={item.fund.code}><div className="tiprow"><span style={{ color: CHART_COLORS[i] }}>{item.fund.manager} {item.fund.code}</span><b>{row ? pct(row.premium) : '缺少净值'}</b></div>{row && <small>收盘 {num(row.close, 3)} / 净值 {num(row.nav)}</small>}</div>; })}</m.div>}</AnimatePresence>
    </div>
    <div className="chartbottom"><input name="history-cursor" type="range" min="0" max={Math.max(0, dates.length - 1)} value={index ?? Math.max(0, dates.length - 1)} disabled={!dates.length} aria-label="选择历史交易日" aria-valuetext={dates[index ?? dates.length - 1] || '暂无历史记录'} onChange={event => setCursor({ dates, index: Number(event.target.value) })} /></div>
    <div className="historystats">{['主基金区间均值', '区间最高 / 最低', '末日历史分位', '有效交易日'].map((label, i) => <StatCard key={label} label={label} value={stats[i]} breakdown={i === 1 ? [{ label: '最高', value: rows.length ? pct(Math.max(...values)) : '—' }, { label: '最低', value: rows.length ? pct(Math.min(...values)) : '—' }] : undefined} icon={STAT_ICONS[i]} featured={i === 0} compact={i === 1} />)}</div>
  </>;
});
