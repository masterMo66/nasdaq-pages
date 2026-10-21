const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let data=BOOTSTRAP, selected=['513100','159941','513300'], range='3m', filter='all', ascending=true, dates=[], plotted=[], domain={};
const colors=['#0c8065','#b67b3d','#758b9d','#9c6692'];
const safeLoad=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
function validFund(f){return f&&BOOTSTRAP.funds.some(v=>v.code===f.code)&&f.history?.length>0&&f.history.every(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&Number.isFinite(r.close)&&r.close>0&&Number.isFinite(r.nav)&&r.nav>0&&Number.isFinite(r.premium)&&(r.amount===null||Number.isFinite(r.amount)))&&Number.isFinite(f.latest?.premium)&&f.latest.navDate<=f.latest.date&&Number.isFinite(Date.parse(f.fetchedAt))}
const savedData=safeLoad('nasdaq-pages-data-v1',null);
if(savedData?.funds){for(const saved of savedData.funds){const index=data.funds.findIndex(f=>f.code===saved?.code);if(index>=0&&validFund(saved)&&saved.latest.date>=data.funds[index].latest.date&&saved.latest.navDate>=data.funds[index].latest.navDate&&Date.parse(saved.fetchedAt)>Date.parse(BOOTSTRAP.fetchedAt))data.funds[index]=saved}}
let favorites=new Set(safeLoad('nasdaq-favorites',[]));
let theme=safeLoad('nasdaq-theme',null)|| (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
document.documentElement.dataset.theme=theme;
const pct=x=>Number.isFinite(x)?`${x>=0?'+':''}${x.toFixed(2)}%`:'—';
const num=x=>Number.isFinite(x)?x.toFixed(4):'—';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(key,val){try{localStorage.setItem(key,JSON.stringify(val))}catch{toast('浏览器存储不可用，本次偏好将仅在当前页面保留。')}}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').hidden=true,3500)}
function syncThemeSwitch(){const dark=theme==='dark';$('#theme').setAttribute('aria-checked',String(dark));$('#theme').title=dark?'切换为浅色模式':'切换为深色模式'}
syncThemeSwitch();
$('#theme').onclick=()=>{theme=theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;syncThemeSwitch();save('nasdaq-theme',theme);renderChart()};
function renderVix(vix){
 if(!vix?.history?.length||!Number.isFinite(vix.latest?.close))return;
 $('#vix-value').textContent=vix.latest.close.toFixed(2);
 const d=vix.latest.change;$('#vix-change').textContent=(d>=0?'+':'')+d.toFixed(2)+' ('+pct(vix.latest.changePercent)+') 较前一交易日';$('#vix-change').dataset.direction=d>0?'up':d<0?'down':'flat';
 $('#vix-date').textContent='美东 '+vix.latest.date+' 收盘';
 const rows=vix.history.slice(-30),min=Math.min(...rows.map(r=>r.close)),max=Math.max(...rows.map(r=>r.close)),span=max-min||1;
 const points=rows.map((r,i)=>(5+i/(rows.length-1||1)*290).toFixed(2)+','+(66-(r.close-min)/span*56).toFixed(2)).join(' ');
 $('#vix-chart').innerHTML='<polyline points="'+points+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
 $('#vix-chart').setAttribute('aria-label','VIX 最近 '+rows.length+' 个交易日收盘走势，'+rows[0].date+' 至 '+rows.at(-1).date+'，最新 '+vix.latest.close.toFixed(2));
 $('#vix-range').textContent=rows[0].date+' — '+rows.at(-1).date+' · '+rows.length+' 个交易日';
 const age=(Date.now()-Date.parse(vix.latest.date+'T00:00:00Z'))/86400000;
 $('#vix-status').textContent=(age>5?'数据源暂未提供近期收盘，保留最后有效数据。':'')+'日收盘数据随快照更新，非实时行情；VIX 不表示市场涨跌方向。';
}
renderVix(BOOTSTRAP.vix);
function getFund(code){return data.funds.find(f=>f.code===code)}
function renderOverview(){
 const funds=data.funds, sorted=[...funds].sort((a,b)=>a.latest.premium-b.latest.premium);
 $('#count').innerHTML=`${funds.length} <small>只</small>`;
 $('#market-average').textContent=pct(funds.reduce((s,f)=>s+f.latest.premium,0)/funds.length);
 $('#market-min').textContent=pct(sorted[0].latest.premium);$('#market-max').textContent=pct(sorted.at(-1).latest.premium);
 $('#min-name').textContent=`${sorted[0].name} · ${sorted[0].code}`;$('#max-name').textContent=`${sorted.at(-1).name} · ${sorted.at(-1).code}`;
 const latestDates=[...new Set(funds.map(f=>f.latest.date))].sort();$('#market-date').textContent=`行情 ${latestDates[0]}${latestDates.length>1?' 至 '+latestDates.at(-1):''} · 非 IOPV 口径`;
 const times=funds.map(f=>f.fetchedAt||BOOTSTRAP.fetchedAt).sort();
 const formatTime=v=>new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
 $('#snapshot-date').textContent=`采集 ${formatTime(times[0])}${times[0]!==times.at(-1)?' 至 '+formatTime(times.at(-1)):''} 北京时间`;
}
function renderTable(){
 const query=$('#search').value.trim().toLowerCase();let funds=data.funds.filter(f=>(filter==='all'||(filter==='favorites'?favorites.has(f.code):f.exchange===filter))&&`${f.code}${f.name}${f.manager}`.toLowerCase().includes(query));
 funds.sort((a,b)=>(ascending?1:-1)*(a.latest.premium-b.latest.premium));
 $('#rows').innerHTML=funds.map(f=>`<tr><td><button class="favorite ${favorites.has(f.code)?'on':''}" data-favorite="${f.code}" aria-label="${favorites.has(f.code)?'取消关注':'关注'}${esc(f.name)}" aria-pressed="${favorites.has(f.code)}">${favorites.has(f.code)?'★':'☆'}</button></td><td class="fundname">${esc(f.name)}<small>${f.code} <span>· ${f.exchange}</span></small></td><td>${f.latest.close.toFixed(3)}</td><td>${num(f.latest.nav)}</td><td class="premium ${f.latest.premium<0?'negative':''}">${pct(f.latest.premium)}</td><td>${(f.latest.amount/1e8).toFixed(2)} 亿</td><td class="dates">${f.latest.date}<small>净值 ${f.latest.navDate}</small><small>行情源 ${esc(f.quoteSource||'东方财富')}</small></td><td><button class="compare ${selected.includes(f.code)?'on':''}" data-compare="${f.code}" aria-pressed="${selected.includes(f.code)}" aria-label="${selected.includes(f.code)?'移除':'对比'}${esc(f.name)}">${selected.includes(f.code)?'已加入':'＋ 对比'}</button></td></tr>`).join('');
 $('#empty-table').hidden=funds.length>0;$('#table-count').textContent=`显示 ${funds.length} / ${data.funds.length} 只基金`;
 $$('[data-favorite]').forEach(b=>b.onclick=()=>{favorites.has(b.dataset.favorite)?favorites.delete(b.dataset.favorite):favorites.add(b.dataset.favorite);save('nasdaq-favorites',[...favorites]);renderTable()});
 $$('[data-compare]').forEach(b=>b.onclick=()=>toggleFund(b.dataset.compare));
}
function toggleFund(code){if(selected.includes(code)){if(selected.length===1){toast('至少保留一只基金。');return}selected=selected.filter(x=>x!==code)}else{if(selected.length>=4){toast('最多对比 4 只，请先移除一只。');return}selected.push(code)}renderTable();renderChart()}
function setDates(){const all=data.funds.flatMap(f=>f.history.map(r=>r.date));const end=all.sort().at(-1);let start=all[0];if(range!=='all'){const date=new Date(end+'T00:00:00Z');date.setUTCMonth(date.getUTCMonth()-({'1m':1,'3m':3,'6m':6,'1y':12}[range]));start=date.toISOString().slice(0,10)}$('#start').value=start;$('#end').value=end;$('#start').max=end;$('#end').max=end;$('#start').min=all[0];$('#end').min=all[0]}
const svgNS='http://www.w3.org/2000/svg';
function el(tag,attributes={},content){const node=document.createElementNS(svgNS,tag);Object.entries(attributes).forEach(([k,v])=>node.setAttribute(k,v));if(content!==undefined)node.textContent=content;return node}
function renderChart(){
 if($('#premium-page').hidden)return;
 $('#fund-chips').innerHTML=selected.map((code,i)=>`<button class="chip" data-chip="${code}" title="点击移除此基金"><span class="legend" style="background:${colors[i]}"></span>${esc(getFund(code).manager)} ${code}<small>×</small></button>`).join('');$$('[data-chip]').forEach(b=>b.onclick=()=>toggleFund(b.dataset.chip));
 const start=$('#start').value,end=$('#end').value;plotted=selected.map(code=>({fund:getFund(code),rows:getFund(code).history.filter(r=>r.date>=start&&r.date<=end)}));
 dates=[...new Set(plotted.flatMap(s=>s.rows.map(r=>r.date)))].sort();
 const svg=$('#chart');svg.replaceChildren();$('#tooltip').hidden=true;$('#empty-chart').hidden=dates.length>0;$('#cursor').disabled=!dates.length;
 if(!dates.length){['mean','extremes','percentile','days'].forEach(k=>$('#stat-'+k).textContent='—');$('#chart-foot').textContent='无有效记录';return}
 $('#cursor').max=dates.length-1;$('#cursor').value=dates.length-1;
 const values=plotted.flatMap(s=>s.rows.map(r=>r.premium));let min=Math.min(0,...values),max=Math.max(0,...values),pad=Math.max((max-min)*.15,1);min-=pad;max+=pad;
 const width=svg.clientWidth,height=svg.clientHeight,left=45,right=width-12,bottom=height-30;
 svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const x=i=>left+i/Math.max(dates.length-1,1)*(right-left),y=v=>bottom-(v-min)/(max-min)*(bottom-25);
 domain={x,y,min,max,left,right};const axisColor=getComputedStyle(document.documentElement).getPropertyValue('--muted').trim(),gridColor=getComputedStyle(document.documentElement).getPropertyValue('--grid').trim();
 for(let i=0;i<=4;i++){const value=min+(max-min)*i/4;svg.append(el('line',{x1:left,x2:right,y1:y(value),y2:y(value),stroke:gridColor,'stroke-width':1}));svg.append(el('text',{x:37,y:y(value)+4,'text-anchor':'end',fill:axisColor,'font-size':10,'font-family':'Consolas,monospace'},value.toFixed(1)+'%'))}
 svg.append(el('line',{x1:left,x2:right,y1:y(0),y2:y(0),stroke:axisColor,'stroke-width':1,'stroke-dasharray':'4 5'}));
 const tickCount=width<500?4:6;for(let i=0;i<tickCount;i++){const index=Math.round(i*(dates.length-1)/(tickCount-1));svg.append(el('text',{x:x(index),y:height-8,'text-anchor':i===0?'start':i===tickCount-1?'end':'middle',fill:axisColor,'font-size':10,'font-family':'Consolas,monospace'},dates[index].slice(5)))}
 const main=plotted[0];
 if(main.rows.length){const points=main.rows.map(r=>[x(dates.indexOf(r.date)),y(r.premium)]);const defs=el('defs');const gradient=el('linearGradient',{id:'area',x1:0,y1:0,x2:0,y2:1});gradient.append(el('stop',{offset:'0%','stop-color':colors[0],'stop-opacity':.12}),el('stop',{offset:'100%','stop-color':colors[0],'stop-opacity':0}));defs.append(gradient);svg.append(defs);svg.append(el('path',{d:`M${points[0][0]},${y(0)} L${points.map(p=>p.join(',')).join(' L')} L${points.at(-1)[0]},${y(0)} Z`,fill:'url(#area)'}))}
 plotted.forEach((series,i)=>{const points=series.rows.map(r=>[x(dates.indexOf(r.date)),y(r.premium)]);if(points.length)svg.append(el('path',{d:'M'+points.map(p=>p.join(',')).join(' L'),fill:'none',stroke:colors[i],'stroke-width':i===0?2.7:1.9,'stroke-linejoin':'round','stroke-linecap':'round'}));if(points.length===1)svg.append(el('circle',{cx:points[0][0],cy:points[0][1],r:4,fill:colors[i]}))});
 svg.append(el('line',{id:'crosshair',x1:0,x2:0,y1:25,y2:bottom,stroke:axisColor,'stroke-dasharray':'3 4',visibility:'hidden'}));
 $('#chart-foot').textContent=`${dates[0]} 至 ${dates.at(-1)} · ${dates.length} 个交易日`;
 const rows=main.rows;if(rows.length){const vals=rows.map(r=>r.premium),last=vals.at(-1);$('#stat-mean').textContent=pct(vals.reduce((a,b)=>a+b,0)/vals.length);$('#stat-extremes').textContent=`${pct(Math.max(...vals))} / ${pct(Math.min(...vals))}`;$('#stat-percentile').textContent=(vals.filter(v=>v<=last).length/vals.length*100).toFixed(1)+'%';$('#stat-days').textContent=rows.length+' 天'}else{['mean','extremes','percentile','days'].forEach(k=>$('#stat-'+k).textContent='—')}
}
function showDate(index){if(!dates.length)return;index=Math.max(0,Math.min(dates.length-1,index));const date=dates[index];const hair=$('#crosshair');hair.setAttribute('x1',domain.x(index));hair.setAttribute('x2',domain.x(index));hair.setAttribute('visibility','visible');$('#tooltip').innerHTML=`<strong>${date} · 历史溢价</strong>`+plotted.map((s,i)=>{const r=s.rows.find(r=>r.date===date);return `<div class="tiprow"><span style="color:${colors[i]}">${esc(s.fund.manager)} ${s.fund.code}</span><b>${r?pct(r.premium):'缺少净值'}</b></div>${r?`<div class="tiprow"><small>收盘 ${r.close.toFixed(3)} / 净值 ${num(r.nav)}</small></div>`:''}`}).join('');$('#tooltip').hidden=false;$('#cursor').value=index}
$('#chart').onpointermove=e=>{const box=e.currentTarget.getBoundingClientRect();showDate(Math.round((e.clientX-box.left-domain.left)/(domain.right-domain.left)*(dates.length-1)))};
$('#chart').onpointerleave=()=>{$('#tooltip').hidden=true;$('#crosshair')?.setAttribute('visibility','hidden')};$('#cursor').oninput=e=>showDate(Number(e.target.value));
$$('[data-range]').forEach(b=>b.onclick=()=>{range=b.dataset.range;$$('[data-range]').forEach(v=>v.classList.toggle('selected',v===b));setDates();renderChart()});
['start','end'].forEach(id=>$('#'+id).onchange=()=>{if($('#start').value>$('#end').value){toast('起始日期不能晚于结束日期。');setDates();return}$$('[data-range]').forEach(b=>b.classList.remove('selected'));renderChart()});$('#reset-dates').onclick=()=>{setDates();$$('[data-range]').forEach(b=>b.classList.toggle('selected',b.dataset.range===range));renderChart()};
$$('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(v=>v.classList.toggle('selected',v===b));renderTable()});$('#search').oninput=renderTable;$('#sort').onclick=()=>{ascending=!ascending;$('#sort').textContent=`参考溢价 ${ascending?'↑':'↓'}`;renderTable()};
$('#export').onclick=()=>{const header=['基金代码','基金公司','交易日期','未复权收盘价','同日单位净值','溢价率(%)','成交额(元)','来源'];const rows=plotted.flatMap(s=>s.rows.map(r=>[s.fund.code,s.fund.manager,r.date,r.close,r.nav,r.premium.toFixed(6),r.amount??'',(r.quoteSource||'东方财富')+'/天天基金']));if(!rows.length){toast('所选区间暂无可导出记录。');return}const csv='\ufeff'+[header,...rows].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`纳指ETF同日溢价_${$('#start').value}_${$('#end').value}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`已导出 ${rows.length} 条真实历史记录。`)};
$('#refresh').onclick=async()=>{
 const button=$('#refresh');button.disabled=true;button.textContent='读取中…';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
 try{
  const response=await fetch('./snapshot.json?t='+Date.now(),{cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('HTTP '+response.status);
  const next=await response.json();
  if(next.funds?.length!==BOOTSTRAP.funds.length||!next.funds.every(validFund))throw Error('快照格式无效');
  let changed=0;
  for(const fund of next.funds){const old=getFund(fund.code);if(fund.latest.date<old.latest.date||fund.latest.navDate<old.latest.navDate)continue;if(JSON.stringify(fund.latest)!==JSON.stringify(old.latest))changed++;data.funds[data.funds.findIndex(f=>f.code===fund.code)]=fund}
  renderVix(next.vix);save('nasdaq-pages-data-v1',{funds:data.funds});renderOverview();setDates();renderTable();renderChart();
  $('#notice').textContent='已读取已发布快照，'+changed+' 只基金参考值有变化。Actions 每天北京时间 09:17、18:17 采集；按钮读取最近发布的数据，净值披露有延迟。'+(next.collection?.errors?.length?' 部分数据源失败，相关基金保留上次有效数据。':'');
  toast(changed?'已读取更新数据':'已是最近发布的数据');
 }catch(e){$('#notice').textContent='快照读取失败，保留当前数据：'+(e.name==='AbortError'?'请求超时':e.message)}
 finally{clearTimeout(timer);button.disabled=false;button.textContent='↻ 读取最新快照'}
};
$('#notice').textContent='Actions 每天北京时间 09:17、18:17 采集；按钮读取最近发布的快照，调度及净值披露可能延迟。'+(BOOTSTRAP.collection?.errors?.length?' 最近采集 '+BOOTSTRAP.collection.updated+'/'+BOOTSTRAP.collection.total+' 只成功，失败基金保留上次有效数据：'+BOOTSTRAP.collection.errors.join('；'):'');
renderOverview();setDates();renderTable();renderChart();new ResizeObserver(()=>renderChart()).observe($('#chart'));
