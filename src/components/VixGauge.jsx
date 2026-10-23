import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { pct } from '../lib/funds.js';

const point = (r, a) => [200 + r * Math.cos(a), 205 + r * Math.sin(a)];
function arc(start, end) { return `M ${point(174, start)} A 174 174 0 0 1 ${point(174, end)} L ${point(121, end)} A 121 121 0 0 0 ${point(121, start)} Z`; }
export default function VixGauge({ vix }) {
  const actual = vix?.latest?.close ?? 0;
  const maximum = Math.max(60, Math.ceil(actual / 12) * 12);
  const value = useMotionValue(actual);
  const needle = useRef();
  const angle = current => -90 + Math.max(0, Math.min(maximum, current)) / maximum * 180;
  // Keep the SVG pivot in its own coordinate system; Motion drives only this attribute.
  useMotionValueEvent(value, 'change', current => needle.current?.setAttribute('transform', `rotate(${angle(current)} 200 205)`));
  const [preview, setPreview] = useState(null);
  const animation = useRef(); const timer = useRef(); const pointer = useRef(null); const svg = useRef();
  const reduced = useReducedMotion();
  useEffect(() => { animation.current?.stop(); value.set(actual); setPreview(null); }, [actual, value]);
  useEffect(() => () => { animation.current?.stop(); clearTimeout(timer.current); }, []);
  function restore() { clearTimeout(timer.current); pointer.current = null; animation.current?.stop(); setPreview(null); if (reduced) value.set(actual); else animation.current = animate(value, actual, { type: 'spring', stiffness: 175, damping: 16 }); }
  function move(event) {
    const matrix = svg.current.getScreenCTM(); if (!matrix) return;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const next = (Math.atan2(Math.min(-0.00001, p.y - 205), p.x - 200) + Math.PI) / Math.PI * maximum;
    value.set(next); setPreview(next);
  }
  const rows = vix?.history?.slice(-30) || [];
  const min = Math.min(...rows.map(row => row.close)), max = Math.max(...rows.map(row => row.close));
  const summary = vix ? `VIX ${actual.toFixed(2)} · 美东 ${vix.latest.date} 收盘 · ${pct(vix.latest.changePercent)} · Cboe 日收盘，非实时行情` : '正在读取 VIX 日收盘数据';
  return <div className="vix-mini" title={summary}>
    <svg id="vix-gauge" ref={svg} viewBox="0 12 400 238" role="slider" tabIndex={0} aria-label="VIX 指针交互预览" aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={Number((preview ?? actual).toFixed(2))} aria-valuetext={preview === null ? `最新收盘 ${actual.toFixed(2)}` : `交互预览 ${preview.toFixed(2)}，最新收盘 ${actual.toFixed(2)}`} onPointerDown={event => { if (pointer.current !== null || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return; event.preventDefault(); animation.current?.stop(); pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus({ preventScroll: true }); move(event); }} onPointerMove={event => { if (event.pointerId === pointer.current) move(event); }} onPointerUp={restore} onPointerCancel={restore} onLostPointerCapture={restore} onBlur={restore} onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End', 'Escape'].includes(event.key)) return;
      event.preventDefault(); animation.current?.stop(); clearTimeout(timer.current);
      if (event.key === 'Escape') return restore();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? maximum : Math.max(0, Math.min(maximum, value.get() + (['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 1)));
      value.set(next); setPreview(next); timer.current = setTimeout(restore, 650);
    }} onKeyUp={event => { if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End'].includes(event.key)) restore(); }}>
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={arc(Math.PI + i * Math.PI / 5 + .009, Math.PI + (i + 1) * Math.PI / 5 - .009)} className={`vix-band band-${i} ${Math.min(4, Math.floor(actual / maximum * 5)) === i ? 'is-current' : ''}`} />)}
      {[0, maximum].map((n, i) => <text className="vix-tick" key={i} x={point(103, i ? 0 : Math.PI)[0]} y={209} textAnchor="middle">{n}</text>)}
      <g className="vix-pointer" ref={needle} transform={`rotate(${angle(actual)} 200 205)`}><path className="vix-needle" d="M194 204 L200 55 L206 204 L200 215 Z" /></g><circle className="vix-hub" cx="200" cy="205" r="38" /><text className="vix-value" x="200" y="212" textAnchor="middle">{vix ? (preview ?? actual).toFixed(2) : '—'}</text><text className="vix-unit" x="200" y="236" textAnchor="middle">VIX</text>
    </svg>
    <a className="vix-trend" href="https://www.cboe.com/tradable-products/vix/vix-historical-data/" target="_blank" rel="noopener noreferrer" aria-label={`${summary}，查看官方数据`}><span>30 个交易日</span><svg id="vix-chart" viewBox="0 0 300 76" role="img" aria-label="VIX 最近30个交易日收盘走势"><polyline points={rows.map((row, i) => `${5 + i / (rows.length - 1 || 1) * 290},${66 - (row.close - min) / (max - min || 1) * 56}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" /></svg><small>日收盘 · 非实时</small></a>
  </div>;
}
