// Exact published dates, manually reconciled with the linked official calendars.
// Do not generate monthly dates from rules such as "first Friday".
import {nyInstant} from '../worker/calendar-utils.js';
import {CALENDAR_REVIEW} from './calendar-editorial.mjs';
const events=[];
const types={
 CPI:{name:'CPI 消费者物价指数',short:'CPI',category:'inflation',focus:true,impact:'观察总体与核心通胀相对市场预期的差异，可能影响利率预期、债券收益率与科技股估值。'},
 NFP:{name:'非农就业报告',short:'非农就业',category:'jobs',focus:true,impact:'一起关注非农新增就业、失业率、平均时薪和前值修订；劳动力市场变化可能影响美联储政策预期。'},
 PPI:{name:'PPI 生产者物价指数',short:'PPI',category:'inflation',focus:false,impact:'观察上游价格压力及其向消费者价格的传导，市场也会关注与 PCE 分项相关的指标。'},
 JOLTS:{name:'JOLTS 职位空缺',short:'JOLTS',category:'jobs',focus:false,impact:'职位空缺与离职率提供劳动力供需信息，可能改变市场对工资压力和利率路径的判断。'},
 PCE:{name:'PCE 通胀 / 个人收支',short:'PCE 通胀',category:'inflation',focus:true,impact:'个人收入与支出报告包含 PCE 和核心 PCE 价格指标，可用于观察通胀和消费状况。'},
 GDP:{name:'美国 GDP',short:'GDP',category:'growth',focus:false,impact:'关注实际增长率、消费及价格指标；初值与修订值的信息含量不同，影响取决于结果与预期的差异。'},
 FOMC:{name:'FOMC 利率决议',short:'利率决议',category:'fed',focus:true,impact:'关注利率决定、政策声明与未来利率路径；经济预测会议同时关注点阵图。'},
 PRESS:{name:'美联储主席新闻发布会',short:'联储发布会',category:'fed',focus:true,impact:'关注主席对政策声明、经济前景与后续政策的解释。开始时间约为决议发布后半小时。'}
};
function add(type,date,time,source,details='',extra={}){
 events.push({id:type+'-'+date,...types[type],type,date,time,instant:nyInstant(date,time),source,details,allDay:false,...extra});
}
function bls(type,year,dates,time='08:30'){
 dates.split(' ').forEach((date,index)=>{const month=date.slice(0,2);let ref=new Date(Date.UTC(year,Number(month)-2,1));const period=`${ref.getUTCFullYear()}年${ref.getUTCMonth()+1}月`;add(type,`${year}-${date}`,time,`https://www.bls.gov/schedule/${year}/home.htm`,`统计期：${period}；日期采用 BLS 正式日程。`)});
}
bls('CPI',2026,'01-13 02-13 03-11 04-10 05-12 06-10 07-14 08-12 09-11 10-14 11-10 12-10');
bls('NFP',2026,'01-09 02-11 03-06 04-03 05-08 06-05 07-02 08-07 09-04 10-02 11-06 12-04');
bls('PPI',2026,'01-30 02-27 03-18 04-14 05-13 06-11 07-15 08-13 09-10 10-15 11-13 12-15');
add('PPI','2026-01-14','08:30','https://www.bls.gov/schedule/2026/home.htm','统计期：2025年11月；特殊调整后的官方发布时间。');
for(const [date,period] of [['01-07','2025年11月'],['02-05','2025年12月'],['03-13','2026年1月'],['03-31','2026年2月'],['05-05','2026年3月'],['06-02','2026年4月'],['06-30','2026年5月'],['08-04','2026年6月'],['09-01','2026年7月'],['09-29','2026年8月'],['11-03','2026年9月'],['12-01','2026年10月']])add('JOLTS','2026-'+date,'10:00','https://www.bls.gov/schedule/2026/home.htm','统计期：'+period+'；按 BLS 正式日程。');
bls('CPI',2027,'01-13 02-11 03-10 04-13 05-12 06-10 07-14 08-11 09-14 10-14 11-10 12-10');
bls('NFP',2027,'01-08 02-05 03-05 04-02 05-07 06-04 07-02 08-06 09-03 10-08 11-05 12-03');
bls('PPI',2027,'01-14 02-12 03-12 04-14 05-13 06-11 07-15 08-10 09-10 10-15 11-12 12-15');
const fed='https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm';
for(const [year,dates] of [[2026,'01-28 03-18* 04-29 06-17* 07-29 09-16* 10-28 12-09*'],[2027,'01-27 03-17* 04-28 06-09* 07-28 09-15* 10-27 12-08*']]){
 for(const value of dates.split(' ')){
  const date=year+'-'+value.replace('*',''),projections=value.includes('*');
  const details=`两日议息会议的第二日。${projections?'包含经济预测摘要与点阵图。':''}美联储日程可能调整；2027年日期为官方暂定安排。`;
  add('FOMC',date,'14:00',fed,details,{tentative:year===2027});
  add('PRESS',date,'14:30',fed,'约美东14:30开始，准确开场以官方直播安排为准。'+details,{approximate:true,tentative:year===2027,timeSource:'https://www.federalreserve.gov/newsevents/pressreleases/monetary20130313a.htm'});
 }
}
const bea='https://www.bea.gov/news/schedule/full';
for(const [date,time,period] of [['01-22','10:00','2025年10月与11月'],['02-20','08:30','2025年12月'],['03-13','08:30','2026年1月'],['04-09','08:30','2026年2月'],['04-30','08:30','2026年3月'],['05-28','08:30','2026年4月'],['06-25','08:30','2026年5月'],['07-30','08:30','2026年6月'],['08-26','08:30','2026年7月'],['09-30','08:30','2026年8月'],['10-29','08:30','2026年9月'],['11-25','08:30','2026年10月'],['12-23','08:30','2026年11月']])add('PCE','2026-'+date,time,bea,'统计期：'+period+'；个人收入与支出报告，含 PCE 价格指标。');
for(const [date,period,stage] of [['01-22','2025年第三季度','更新值'],['02-20','2025年第四季度','初值'],['03-13','2025年第四季度','二次估计'],['04-09','2025年第四季度','三次估计'],['04-30','2026年第一季度','初值'],['05-28','2026年第一季度','二次估计'],['06-25','2026年第一季度','三次估计'],['07-30','2026年第二季度','初值'],['08-26','2026年第二季度','二次估计'],['09-30','2026年第二季度','三次估计'],['10-29','2026年第三季度','初值'],['11-25','2026年第三季度','二次估计'],['12-23','2026年第三季度','三次估计']])add('GDP','2026-'+date,'08:30',bea,period+' · '+stage,{name:'美国 GDP · '+stage});
events.push({id:'MIDTERMS-2026-11-03',type:'MIDTERMS',name:'美国中期选举 · 投票日',short:'中期选举',category:'politics',focus:true,date:'2026-11-03',instant:null,allDay:true,source:'https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/',details:'美国当地11月3日投票，各州投票时间不同；计票与最终结果可能跨越多个交易日。不是统一的结果公布时刻。',impact:'国会席位变化可能影响财政、税收、监管与政策推进预期。日历仅标记投票日，不预测结果或市场涨跌。'});
for(const event of events){Object.assign(event,CALENDAR_REVIEW.types[event.type],{verifiedAt:CALENDAR_REVIEW.verifiedAt},CALENDAR_REVIEW.events[event.id]||{})}
export const CALENDAR={verifiedAt:CALENDAR_REVIEW.verifiedAt,reviewCadence:CALENDAR_REVIEW.cadence,minMonth:'2026-01',maxMonth:'2027-12',coverage:'2026–2027 CPI / 非农 / PPI / FOMC；2026 JOLTS / PCE / GDP；2026中期选举。2027 BEA 与 JOLTS 暂未录入。',events:events.sort((a,b)=>(a.instant||a.date).localeCompare(b.instant||b.date))};
