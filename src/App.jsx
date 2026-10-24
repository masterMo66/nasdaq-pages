import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, ChartNoAxesCombined, CircleHelp, ListFilter, Moon, Sun } from 'lucide-react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import PremiumPage from './components/PremiumPage.jsx';
import VixGauge from './components/VixGauge.jsx';
import { MARKETS } from './lib/markets.js';
import { mergeFunds, readSaved, snapshotStamp, validFund, validSnapshot } from './lib/funds.js';

const CalendarPage = lazy(() => import('./components/CalendarPage.jsx'));
let snapshotRequest;
function loadSnapshot() {
  if (!snapshotRequest) snapshotRequest = fetch('./snapshot.json', { signal: AbortSignal.timeout(30000) }).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).catch(error => { snapshotRequest = null; throw error; });
  return snapshotRequest;
}

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    return this.state.error ? <div className="load-state" role="alert"><h1>页面暂时无法显示</h1><p>请重新加载页面。已保存的关注和偏好仍可继续使用。</p><button className="primary" onClick={() => location.reload()}>重新加载</button></div> : this.props.children;
  }
}
export default function App() { return <ErrorBoundary><Dashboard /></ErrorBoundary>; }

function Dashboard() {
  const reduced = useReducedMotion();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [hash, setHash] = useState(() => location.hash || '#overview');
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [market, setMarket] = useState(() => { const saved = readSaved('nasdaq-market', 'nasdaq100'); return MARKETS[saved] ? saved : 'nasdaq100'; });
  const toastTimer = useRef();
  const requestRef = useRef();
  const calendar = ['#calendar', '#calendar-sources'].includes(hash);
  const [calendarVisited, setCalendarVisited] = useState(calendar);
  useEffect(() => { if (calendar) setCalendarVisited(true); }, [calendar]);
  const notify = useCallback(text => { setMessage(text); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setMessage(''), 3500); }, []);
  const save = useCallback((key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { notify('浏览器存储不可用，本次偏好仅在当前页面保留。'); } }, [notify]);
  useEffect(() => {
    let active = true;
    loadSnapshot().then(next => {
      if (!next.funds?.length || !validSnapshot(next, next)) throw new Error('快照格式无效');
      const saved = readSaved('nasdaq-pages-data-v1', null);
      const codes = next.funds.map(fund => fund.code);
      if (Array.isArray(saved?.funds)) next = { ...next, funds: mergeFunds(next.funds, saved.funds.filter(fund => validFund(fund, codes))) };
      if (active) setData(next);
    }).catch(err => { if (active) setError(`无法读取快照：${err.message}。请检查网络后重试。`); });
    return () => { active = false; };
  }, []);
  useEffect(() => { const change = () => setHash(location.hash || '#overview'); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#121d1a' : '#f7f9f8';
  }, [theme]);
  useEffect(() => {
    if (!data) return;
    if (['#overview', '#calendar'].includes(hash)) window.scrollTo({ top: 0, behavior: 'instant' });
    else document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, data]);
  useEffect(() => () => { clearTimeout(toastTimer.current); requestRef.current?.abort(); }, []);
  async function refresh() {
    if (requestRef.current) return;
    const controller = new AbortController(); requestRef.current = controller;
    const timer = setTimeout(() => controller.abort(), 30000); setRefreshing(true);
    try {
      const response = await fetch(`./snapshot.json?t=${Date.now()}`, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = await response.json();
      if (!validSnapshot(next, data)) throw new Error('快照格式无效');
      const funds = mergeFunds(data.funds, next.funds);
      const changed = funds.filter((fund, index) => JSON.stringify(fund.latest) !== JSON.stringify(data.funds[index].latest)).length;
      setData({ ...data, ...next, funds, vix: next.vix?.latest?.date >= data.vix?.latest?.date ? next.vix : data.vix });
      save('nasdaq-pages-data-v1', { funds });
      setNotice(`已读取 ${snapshotStamp(funds)} 快照，${changed} 只参考值更新。非实时行情，读取快照不会触发行情采集。${next.collection?.errors?.length ? '部分基金保留上次有效数据。' : ''}`);
      notify(changed ? '快照价格已更新' : '已读取服务器快照，价格无变化');
    } catch (err) { setNotice(`快照读取失败，保留当前数据：${err.name === 'AbortError' ? '请求超时' : err.message}。可稍后再次读取。`); }
    finally { clearTimeout(timer); requestRef.current = null; setRefreshing(false); }
  }
  const links = [['#overview', ChartNoAxesCombined, '溢价观察'], ['#calendar', CalendarDays, '美国重要日期'], ['#funds', ListFilter, '基金对比'], ['#method', CircleHelp, '数据与口径']];
  return <>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content').focus(); document.getElementById('main-content').scrollIntoView(); }}>跳至主要内容</a>
    <aside className="sidebar">
      <a className="brand" href="#overview" aria-label="纳指观测首页"><span className="brandmark" translate="no">N<span>·</span></span><span>纳指观测<small translate="no">NASDAQ OBSERVATORY</small></span></a>
      <div className="navcaption">工作空间</div>
      <nav aria-label="主要导航">{links.map(([href, Icon, title]) => { const active = href === (calendar ? '#calendar' : ['#funds', '#method'].includes(hash) ? hash : '#overview'); return <a key={href} href={href} aria-label={title} title={title} className={`navlink ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}><Icon size={18} aria-hidden="true" /><span>{title}</span>{href === '#funds' && <small>{data?.funds.length ?? '—'}</small>}</a>; })}</nav>
    </aside>
    <main id="main-content" tabIndex={-1}>
      <header className="topbar"><span className="breadcrumb">市场观察 <span>/</span> {calendar ? '美国重要日期' : MARKETS[market].name}</span><VixGauge vix={data?.vix} /><div className="topbar-actions"><a href={calendar ? '#calendar-sources' : '#method'}>{calendar ? '日程来源' : '数据口径'}<ArrowUpRight size={13} aria-hidden="true" /></a><button className="theme-switch" type="button" role="switch" aria-checked={theme === 'dark'} aria-label="深色模式" title={theme === 'dark' ? '切换为浅色模式' : '切换为深色模式'} onClick={() => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); save('nasdaq-theme', next); }}><Sun size={15} aria-hidden="true" /><Moon size={15} aria-hidden="true" /><m.span className="theme-thumb" animate={{ x: theme === 'dark' ? 27 : 0 }} transition={{ type: 'spring', stiffness: 450, damping: 32 }} /></button></div></header>
      <nav className="page-tabs" aria-label="网站页面">{[['#overview', '溢价观察', false], ['#calendar', '美国重要日期', true]].map(([href, title, isCal]) => <a key={href} href={href} className={calendar === isCal ? 'selected' : ''} aria-current={calendar === isCal ? 'page' : undefined}>{title}{calendar === isCal && <m.span className="page-underline" layoutId="page-underline" />}</a>)}</nav>
      {error ? <div className="load-state" role="alert"><h1>数据暂时无法加载</h1><p>{error}</p><button className="primary" onClick={() => location.reload()}>重试</button></div> : !data ? <Loading /> : <>
        <m.div hidden={calendar} initial={false} animate={{ opacity: calendar && !reduced ? 0 : 1, y: calendar && !reduced ? 10 : 0 }} transition={{ duration: reduced ? 0 : .3, ease: [.22, 1, .36, 1] }}><PremiumPage data={data} market={market} onMarketChange={next => { setMarket(next); save('nasdaq-market', next); }} notice={notice} refreshing={refreshing} refresh={refresh} notify={notify} save={save} /></m.div>
        {(calendar || calendarVisited) && <m.div hidden={!calendar} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 10 }} animate={{ opacity: !calendar && !reduced ? 0 : 1, y: !calendar && !reduced ? 10 : 0 }} transition={{ duration: reduced ? 0 : .3, ease: [.22, 1, .36, 1] }}><Suspense fallback={<Loading />}><CalendarPage notify={notify} hash={hash} /></Suspense></m.div>}
      </>}
      <footer><span>纳指观测</span><span>数据仅供研究参考，不构成投资建议。</span></footer>
    </main>
    <div className="toast-region" role="status" aria-live="polite"><AnimatePresence>{message && <m.div className="toast" key={message} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>{message}</m.div>}</AnimatePresence></div>
  </>;
}
function Loading() { return <div className="load-state" role="status"><span className="loading-line" /><p>正在读取市场数据…</p></div>; }
