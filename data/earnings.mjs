import {nyInstant} from '../worker/calendar-utils.js';

// Company-level US ranking, captured 2026-10-23. Share classes are not counted twice.
// Dates come from the cited company materials, never inferred from prior years.
export const EARNINGS={
 verifiedAt:'2026-10-23',rankingAsOf:'2026-10-23',
 rankingSource:'https://companiesmarketcap.com/usa/largest-companies-in-the-usa-by-market-cap/',
 scope:'美国公司市值前20（公司口径）；近期已核实财报安排，非全年日程。',
 companies:[
  {rank:1,ticker:'NVDA',company:'英伟达',period:'FY2027 Q3',date:'2026-11-17',kind:'call',source:'https://investor.nvidia.com/files/content_files/TRANSCRIPT_-NVIDIA-Corp-NVDA-US-Q2-2027-Earnings-Call-26-August-2026-5_00-PM-ET.pdf',ir:'https://investor.nvidia.com/events-and-presentations/events-and-presentations/default.aspx',note:'公司在上一季官方电话会文字稿中安排本次电话会为11月17日；具体时间待确认，未将其当作财报公布时刻。'},
  {rank:2,ticker:'AAPL',company:'苹果',period:'FY2026 Q4',date:'2026-11-02',kind:'call',time:'17:00',source:'https://investor.apple.com/investor-relations/',ir:'https://investor.apple.com/investor-relations/',note:'官方确认电话会为美西14:00／美东17:00；这里标记电话会，财报可能更早公布。'},
  {rank:3,ticker:'GOOGL',aliases:['GOOG'],company:'Alphabet',period:'2026 Q3',date:'2026-10-28',kind:'call',time:'16:30',source:'https://www.publicnow.com/view/44136C85C4D5D099F2F1F5740EF199299B51D499',sourceLabel:'公司公告（Publicnow转载）',ir:'https://abc.xyz/investor/',note:'Alphabet 10月6日公司公告确认电话会为美西13:30／美东16:30，财报在电话会之前公布；同一公司两种股类只计一次。'},
  {rank:4,ticker:'MSFT',company:'微软',period:'FY2027 Q1',date:'2026-10-28',session:'盘后',callTime:'17:30',source:'https://news.microsoft.com/source/2026/10/07/microsoft-announces-quarterly-earnings-release-date-69/',ir:'https://www.microsoft.com/en-us/investor/',note:'公司确认美股收盘后公布，未给出精确公布分钟；电话会为美西14:30／美东17:30。'},
  {rank:5,ticker:'AMZN',company:'亚马逊',period:'2026 Q3',date:'2026-10-29',kind:'call',time:'17:00',source:'https://press.aboutamazon.com/2026/10/amazon-com-to-webcast-third-quarter-2026-financial-results-conference-call',ir:'https://ir.aboutamazon.com/',note:'公司公告确认财报电话会为美西14:00／美东17:00，不将电话会时间当作财报公布时间。'},
  {rank:6,ticker:'SPCX',company:'SpaceX',period:'2026 Q3',date:'2026-10-20',session:'盘后',callTime:'16:30',source:'https://ir.spacex.com/updates/releases-details/2026/SpaceX-to-Post-Third-Quarter-2026-Results-and-Host-Webcast-on-October-20-2026-2026-QssQGye3im/default.aspx',ir:'https://ir.spacex.com/investors/',note:'公司确认美股收盘后公布；电话会为美中15:30／美东16:30。'},
  {rank:7,ticker:'META',company:'Meta',period:'2026 Q3',date:'2026-10-21',session:'盘后',callTime:'16:30',source:'https://investor.atmeta.com/investor-news/press-release-details/2026/Meta-to-Announce-Third-Quarter-2026-Results/default.aspx',ir:'https://investor.atmeta.com/',note:'公司确认美股收盘后公布；电话会为美西13:30／美东16:30。'},
  {rank:8,ticker:'AVGO',company:'博通',period:'FY2026 Q4',date:null,source:'https://investors.broadcom.com/company-information/events-presentations',ir:'https://investors.broadcom.com/',note:'本次未取得已确认的下一次财报日期，暂不入历。'},
  {rank:9,ticker:'TSLA',company:'特斯拉',period:'2026 Q3',date:'2026-10-21',session:'盘后',callTime:'17:30',source:'https://ir.tesla.com/press-release/tesla-third-quarter-2026-production-deliveries-and-deployments',ir:'https://ir.tesla.com/',note:'公司确认美股收盘后公布；问答电话会为美中16:30／美东17:30。'},
  {rank:10,ticker:'BRK-B',aliases:['BRK-A'],company:'伯克希尔',period:'2026 Q3',date:null,source:'https://www.berkshirehathaway.com/news/2026news.html',ir:'https://www.berkshirehathaway.com/',note:'本次未取得已确认的下一次财报日期，暂不入历；A/B股按同一家公司计算。'},
  {rank:11,ticker:'LLY',company:'礼来',period:'2026 Q3',date:'2026-10-29',callTime:'10:00',source:'https://investor.lilly.com/news-releases/news-release-details/lilly-confirms-date-and-conference-call-third-quarter-2026',ir:'https://investor.lilly.com/',note:'公司确认10月29日公布，未提供精确公布时间；电话会为美东10:00。'},
  {rank:12,ticker:'MU',company:'美光',period:'FY2027 Q1',date:null,source:'https://investors.micron.com/events-and-presentations/default.aspx',ir:'https://investors.micron.com/',note:'本次未完成下一次财报日期的官方核验，暂不入历，不用上一年12月日期推算。'},
  {rank:13,ticker:'WMT',company:'沃尔玛',period:'FY2027 Q3',date:'2026-11-19',time:'07:00',approximate:true,callTime:'08:00',source:'https://corporate.walmart.com/news/events/fy2027-q3-earnings-release',ir:'https://stock.walmart.com/',note:'公司说明财报材料约美中06:00／美东07:00发布；电话会为美中07:00／美东08:00。'},
  {rank:14,ticker:'JPM',company:'摩根大通',period:'2026 Q3',date:'2026-10-13',time:'06:45',approximate:true,callTime:'08:30',source:'https://www.jpmorganchase.com/ir/news/2025/jpmc-announces-conference-calls-to-review-first-quarter-second-quarter-third-quarter-and-fourth-quarter-2026-earnings',ir:'https://www.jpmorganchase.com/ir',note:'公司安排财报约美东06:45发布，电话会为美东08:30。'},
  {rank:15,ticker:'AMD',company:'AMD',period:'2026 Q3',date:'2026-11-03',session:'盘后',callTime:'17:00',source:'https://ir.amd.com/news-events/press-releases/detail/1300/amd-to-report-fiscal-third-quarter-2026-financial-results',ir:'https://ir.amd.com/',note:'公司确认美股收盘后公布；电话会为美东17:00／美西14:00。'},
  {rank:16,ticker:'V',company:'Visa',period:'FY2026 Q4',date:'2026-10-27',session:'盘后',callTime:'17:00',source:'https://visa.gcs-web.com/news-releases/news-release-details/visa-announce-fiscal-fourth-quarter-and-full-year-2026-financial',ir:'https://investor.visa.com/',note:'公司确认美股收盘后公布；电话会为美西14:00／美东17:00。'},
  {rank:17,ticker:'XOM',company:'埃克森美孚',period:'2026 Q3',date:'2026-10-30',time:'06:30',callTime:'09:30',source:'https://investor.exxonmobil.com/company-information/press-releases/detail/1212/exxonmobil-to-release-third-quarter-2026-financial-results',ir:'https://investor.exxonmobil.com/',note:'财报新闻稿于美中05:30／美东06:30发布；电话会为美中08:30／美东09:30。'},
  {rank:18,ticker:'JNJ',company:'强生',period:'2026 Q3',date:'2026-10-13',time:'06:45',approximate:true,callTime:'08:30',source:'https://www.investor.jnj.com/investor-news/news-details/2026/Johnson--Johnson-to-Host-Investor-Conference-Call-on-Third-Quarter-Results/default.aspx',ir:'https://investor.jnj.com/',note:'公司安排财报新闻稿约美东06:45发布，电话会为美东08:30。'},
  {rank:19,ticker:'MA',company:'万事达',period:'2026 Q3',date:'2026-10-29',callTime:'09:00',source:'https://investor.mastercard.com/investor-news/investor-news-details/2026/Mastercard-Incorporated-to-Host-Conference-Call-on-Third-Quarter-2026-Financial-Results/default.aspx',ir:'https://investor.mastercard.com/',note:'公司确认10月29日发布财报，未提供精确公布时间；电话会为美东09:00。'},
  {rank:20,ticker:'ABBV',company:'艾伯维',period:'2026 Q3',date:'2026-10-30',session:'盘前',callTime:'09:00',source:'https://abbvie.gcs-web.com/news-releases/news-release-details/abbvie-host-third-quarter-2026-earnings-conference-call',ir:'https://investors.abbvie.com/',note:'公司确认美股开盘前公布；电话会为美中08:00／美东09:00。'}
 ]
};
export const EARNINGS_EVENTS=EARNINGS.companies.filter(c=>c.date).map(c=>({
 id:'EARNINGS-'+c.ticker+'-'+c.date,type:'EARNINGS',category:'earnings',focus:true,
 name:c.company+' · '+c.period+(c.kind==='call'?' 财报电话会':' 财报'),short:c.ticker+(c.kind==='call'?' 电话会':' 财报'),ticker:c.ticker,
 date:c.date,time:c.time||null,instant:c.time?nyInstant(c.date,c.time):null,allDay:!c.time,dateOnly:!c.time,
 timeLabel:c.session?'美东'+c.session:'时间待确认',approximate:!!c.approximate,kind:c.kind||'release',
 callInstant:c.callTime?nyInstant(c.date,c.callTime):null,callTime:c.callTime||null,
 source:c.source,sourceLabel:c.sourceLabel||'公司财报公告',overviewSource:c.ir,verifiedAt:c.verifiedAt||EARNINGS.verifiedAt,
 summary:c.company+'（'+c.ticker+'）'+c.period+(c.kind==='call'?'财报电话会；所标时间为电话会时间，不能视为财报公布时刻。':'财报公布日；精确公布时间仅在公司明确提供后展示。'),
 details:c.note+(c.time?'':' 仅按美东日期标记，不代表全天事件或已知北京时间。'),
 impact:'关注营收、利润、业绩指引与管理层说明；本日历不填入未经核实的实际值或市场预期。'
}));
