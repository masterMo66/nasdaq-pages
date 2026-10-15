const calCategories={inflation:'通胀',jobs:'就业',fed:'美联储',politics:'政治',growth:'经济增长'};
let calZone='Asia/Shanghai',calFilter='all',calView='month',calFocus=false;
const calToday=()=>calendarDate(new Date(),calZone);
let calMonth=calToday().slice(0,7);calMonth=calMonth<CALENDAR.minMonth?CALENDAR.minMonth:calMonth>CALENDAR.maxMonth?CALENDAR.maxMonth:calMonth;
let calDay=calToday(),currentPage='premium';
function calDate(event){return event.allDay?event.date:calendarDate(event.instant,calZone)}
function calClock(event){return event.allDay?'美国当地日':(event.approximate?'约 ':'')+calendarClock(event.instant,calZone)}
function calAllowed(event){return (calFilter==='all'||event.category===calFilter)&&(!calFocus||event.focus)}
function calEventsForMonth(){return CALENDAR.events.filter(event=>calAllowed(event)&&calDate(event).startsWith(calMonth)).sort((a,b)=>calDate(a).localeCompare(calDate(b))||(a.instant||'').localeCompare(b.instant||''))}
function calAllOnDay(day){return CALENDAR.events.filter(event=>calAllowed(event)&&calDate(event)===day).sort((a,b)=>(a.instant||'').localeCompare(b.instant||''))}
function calDefaultDay(){const candidates=calEventsForMonth();calDay=candidates.find(e=>calDate(e)>=calToday())?calDate(candidates.find(e=>calDate(e)>=calToday())):candidates[0]?calDate(candidates[0]):calMonth+'-01'}
function calSelect(day){if(day.slice(0,7)<CALENDAR.minMonth||day.slice(0,7)>CALENDAR.maxMonth)return;calMonth=day.slice(0,7);calDay=day;renderCalendar()}
function calSelectEvent(id){const event=CALENDAR.events.find(e=>e.id===id);if(!event)return;calSelect(calDate(event))}
function renderCalendar(){
 $('#cal-month').textContent=`${calMonth.slice(0,4)} 年 ${Number(calMonth.slice(5))} 月`;
 $('#cal-prev').disabled=calMonth<=CALENDAR.minMonth;$('#cal-next').disabled=calMonth>=CALENDAR.maxMonth;
 $('#cal-verified').textContent=CALENDAR.verifiedAt;$('#cal-coverage').textContent=CALENDAR.coverage;
 const now=new Date();const upcoming=CALENDAR.events.filter(e=>e.focus&&calAllowed(e)&&(e.allDay?e.date>=calendarDate(now,'America/New_York'):new Date(e.instant)>now)).sort((a,b)=>calDate(a).localeCompare(calDate(b))||(a.instant||'').localeCompare(b.instant||'')).slice(0,3);
 $('#cal-upcoming').innerHTML=upcoming.length?upcoming.map(e=>`<button class="upcoming-event" data-cal-upcoming="${e.id}"><span class="upcoming-date">${calDate(e)}<br>${calClock(e)}</span><strong>${esc(e.name)}</strong><small>${e.allDay?'美国当地投票日':calCategories[e.category]+(e.tentative?' · 官方暂定':' · 官方日程')}</small></button>`).join(''):'<p class="subtle">当前筛选下没有已录入的未来重点事件。</p>';
 $$('[data-cal-upcoming]').forEach(b=>b.onclick=()=>calSelectEvent(b.dataset.calUpcoming));
 const monthEvents=calEventsForMonth();$('#cal-month-count').textContent=`本月 ${monthEvents.length} 项 · ${calZone==='Asia/Shanghai'?'北京时间':'美东时间'}`;
 $('#cal-grid').hidden=calView!=='month';$('.calendar-weekdays').hidden=calView!=='month';$('#cal-list').hidden=calView!=='list';
 const first=new Date(calMonth+'-01T00:00:00Z'),start=new Date(first);start.setUTCDate(1-(first.getUTCDay()+6)%7);
 $('#cal-grid').innerHTML=Array.from({length:42},(_,i)=>{const date=new Date(start);date.setUTCDate(start.getUTCDate()+i);const day=date.toISOString().slice(0,10),outside=!day.startsWith(calMonth),allowed=day.slice(0,7)>=CALENDAR.minMonth&&day.slice(0,7)<=CALENDAR.maxMonth,events=outside?[]:calAllOnDay(day);return `<div class="calendar-cell ${outside?'outside':''} ${day===calDay?'selected-day':''}"><button class="day-number ${day===calToday()?'today':''}" data-cal-day="${day}" aria-label="${day}，${events.length}项事件" aria-pressed="${day===calDay}" ${!allowed?'disabled':''}>${Number(day.slice(8))}</button>${events.slice(0,2).map(e=>`<button class="calendar-event cal-category-${e.category}" data-cal-event="${e.id}" title="${esc(e.name)} · ${calClock(e)}${e.allDay?'':calZone==='Asia/Shanghai'?' 北京时间':' 美东时间'}" aria-label="${day} ${esc(e.name)} ${calClock(e)}"><small>${e.allDay?'当地日':calendarClock(e.instant,calZone)}</small>${esc(e.short)}</button>`).join('')}${events.length>2?`<button class="more-events" data-cal-day="${day}">+${events.length-2} 项</button>`:''}</div>`}).join('');
 $('#cal-list').innerHTML=monthEvents.length?monthEvents.map(e=>`<button class="calendar-list-row ${calDate(e)===calDay?'is-selected':''}" data-cal-event="${e.id}"><time>${calDate(e)}<br>${calClock(e)}</time><span><strong>${esc(e.name)}</strong><small>${e.tentative?'官方暂定 · ':''}${e.focus?'重点事件':'常规关注'}${e.allDay?' · 美国当地日期':''}</small></span><span class="event-category cal-category-${e.category}">${calCategories[e.category]}</span></button>`).join(''):'<div class="calendar-list-empty">本月没有符合筛选条件的已录入事件。<br>请调整类别或“仅看重点事件”。</div>';
 $$('[data-cal-day]').forEach(b=>b.onclick=()=>calSelect(b.dataset.calDay));$$('[data-cal-event]').forEach(b=>b.onclick=()=>calSelectEvent(b.dataset.calEvent));
 renderCalendarDetail();
}
function renderCalendarDetail(){
 $('#cal-detail-date').textContent=calDay;const events=calAllOnDay(calDay),now=new Date();
 $('#cal-day-events').innerHTML=events.length?events.map(e=>{const past=e.allDay?e.date<calendarDate(now,'America/New_York'):new Date(e.instant)<now;return `<article class="detail-event cal-category-${e.category}"><div class="event-category"><span>${calCategories[e.category]}</span>${e.focus?'重点事件':'常规关注'}</div><h3>${esc(e.name)}</h3><div class="event-times">${e.allDay?'美国当地 '+e.date+' · 全天日期标记':`北京时间 ${calendarDate(e.instant,'Asia/Shanghai')} ${e.approximate?'约 ':''}${calendarClock(e.instant,'Asia/Shanghai')}<br>美东时间 ${e.date} ${e.approximate?'约 ':''}${e.time}`}</div><span class="impact-label">事件概述</span><p>${esc(e.summary)}</p><p>${esc(e.details)}</p>${past&&e.resultSummary?`<span class="impact-label">官方公布摘要</span><p>${esc(e.resultSummary)}</p><a class="detail-source" href="${esc(e.resultSource)}" target="_blank" rel="noopener">该次官方发布原文 ↗</a>`:''}<span class="impact-label">关注什么</span><p>${esc(e.impact)}</p><a class="detail-source" href="${esc(e.source)}" target="_blank" rel="noopener">查看官方日程 ↗</a> <a class="detail-source" href="${esc(e.overviewSource)}" target="_blank" rel="noopener">指标说明 / 官方资料 ↗</a>${e.timeSource?` <a class="detail-source" href="${e.timeSource}" target="_blank" rel="noopener">发布时间说明 ↗</a>`:''}<span class="schedule-status">${past?(e.resultSummary?'已核实官方发布摘要':'日期已过，实际结果待核实'):e.tentative?'官方暂定日程':'按官方日程安排'} · 日程与概述核对 ${e.verifiedAt||CALENDAR.verifiedAt}${past&&e.resultSummary?' · 结果核对 '+e.resultVerifiedAt:''}</span></article>`}).join(''):'<p class="day-empty">这一天没有符合当前筛选的已录入事件。空白不代表没有市场风险。</p>';
}
function moveCalMonth(delta){const date=new Date(calMonth+'-01T00:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta);const month=date.toISOString().slice(0,7);if(month<CALENDAR.minMonth||month>CALENDAR.maxMonth)return;calMonth=month;calDefaultDay();renderCalendar()}
$('#cal-prev').onclick=()=>moveCalMonth(-1);$('#cal-next').onclick=()=>moveCalMonth(1);
$('#cal-today').onclick=()=>{const today=calToday();calMonth=today.slice(0,7);if(calMonth<CALENDAR.minMonth||calMonth>CALENDAR.maxMonth){calMonth=calMonth<CALENDAR.minMonth?CALENDAR.minMonth:CALENDAR.maxMonth;toast('当前日期超出已录入日程范围。')}calDefaultDay();renderCalendar()};
$('#cal-zone').onchange=()=>{const oldEvent=calAllOnDay(calDay)[0];calZone=$('#cal-zone').value;if(oldEvent)calSelect(calDate(oldEvent));else{calDefaultDay();renderCalendar()}};
$$('[data-cal-filter]').forEach(button=>button.onclick=()=>{calFilter=button.dataset.calFilter;$$('[data-cal-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',b===button)});calDefaultDay();renderCalendar()});
$('#cal-focus').onchange=()=>{calFocus=$('#cal-focus').checked;calDefaultDay();renderCalendar()};
$$('[data-cal-view]').forEach(button=>button.onclick=()=>{calView=button.dataset.calView;$$('[data-cal-view]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',b===button)});renderCalendar()});
function calICSText(events){
 const clean=value=>String(value).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(';','\\;').replaceAll(',','\\,');
 const utc=value=>value.replace(/[-:]/g,'').replace('.000','');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nasdaq Observatory//US Market Calendar//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 for(const e of events){lines.push('BEGIN:VEVENT','UID:'+e.id+'@nasdaq-observatory','DTSTAMP:'+CALENDAR.verifiedAt.replaceAll('-','')+'T000000Z');if(e.allDay){const end=new Date(e.date+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);lines.push('DTSTART;VALUE=DATE:'+e.date.replaceAll('-',''),'DTEND;VALUE=DATE:'+end.toISOString().slice(0,10).replaceAll('-',''))}else lines.push('DTSTART:'+utc(e.instant));lines.push('SUMMARY:'+clean(e.name),'DESCRIPTION:'+clean(e.summary+'\n'+e.details+'\n'+e.impact+(e.resultSummary?'\n官方公布摘要：'+e.resultSummary+'\n原文：'+e.resultSource:'')+'\n指标说明：'+e.overviewSource+'\n日程核对：'+CALENDAR.verifiedAt+'；请以源站后续调整为准。'),'URL:'+e.source,'STATUS:'+(e.tentative?'TENTATIVE':'CONFIRMED'),'END:VEVENT')}
 lines.push('END:VCALENDAR');
 // Fold by UTF-8 bytes without splitting a multi-byte code point (RFC 5545).
 return lines.flatMap(line=>{let rows=[],row='',bytes=0;for(const character of line){const size=new TextEncoder().encode(character).length;if(bytes+size>73){rows.push(row);row=' ';bytes=1}row+=character;bytes+=size}rows.push(row);return rows}).join('\r\n')+'\r\n';
}
$('#cal-export').onclick=()=>{const events=calEventsForMonth();if(!events.length){toast('当前筛选下没有可导出的事件。');return}const url=URL.createObjectURL(new Blob([calICSText(events)],{type:'text/calendar;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`美国重要日期_${calMonth}.ics`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`已导出本月 ${events.length} 项事件，可导入个人日历。`)};
function routePage(){
 const calendar=['#calendar','#calendar-sources'].includes(location.hash),nextPage=calendar?'calendar':'premium',changed=nextPage!==currentPage;
 currentPage=nextPage;$('#premium-page').hidden=calendar;$('#calendar-page').hidden=!calendar;
 $$('[data-page]').forEach(a=>{const active=a.dataset.page===nextPage;a.classList.toggle('selected',active);active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')});
 $$('.sidebar .navlink').forEach(a=>a.classList.toggle('active',calendar?a.getAttribute('href')==='#calendar':a.getAttribute('href')===(['#funds','#method'].includes(location.hash)?location.hash:'#overview')));
 $('#breadcrumb').innerHTML=calendar?'市场观察 <span class="slash">/</span> 美国重要日期':'市场观察 <span class="slash">/</span> 纳斯达克 100';$('#page-help').href=calendar?'#calendar-sources':'#method';$('#page-help').textContent=calendar?'日程来源 ↗':'数据口径 ↗';
 if(calendar)renderCalendar();else requestAnimationFrame(()=>renderChart());
 if(changed||['#overview','#calendar'].includes(location.hash))window.scrollTo({top:0,behavior:'instant'});
 if(['#funds','#method','#calendar-sources'].includes(location.hash))requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView());
}
calDefaultDay();routePage();window.addEventListener('hashchange',routePage);
