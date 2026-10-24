// Joined NAV is retrospective: it is not a point-in-time IOPV series.
async function fetchJSON(url,label){
 let last;
 for(let attempt=0;attempt<2;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch(url,{headers:{Referer:'https://fundf10.eastmoney.com/','User-Agent':'Mozilla/5.0'},signal:controller.signal});
   if(!response.ok)throw Error('HTTP '+response.status);
   const body=await response.json();if(body.ErrCode&&body.ErrCode!==0)throw Error('源站拒绝请求');return body;
  }catch(error){last=error}finally{clearTimeout(timer)}
 }
 throw Error(label+'获取失败（'+(last?.name==='AbortError'?'请求超时':last?.message||'网络错误')+'）');
}
export async function liveFund(fund){
 const code=fund.code;
 const market=code.startsWith('5')?'1':'0';
 const nav=new Map(fund.history.map(r=>[r.date,r.nav]));
 // Fetch newest pages until they overlap the published history, without a 13-request burst.
 let received=0;
 for(let page=1;page<=13;page++){
  const result=await fetchJSON(`https://api.fund.eastmoney.com/f10/lsjz?fundCode=${code}&pageIndex=${page}&pageSize=20`,'净值');
  const rows=result.Data?.LSJZList;if(!Array.isArray(rows)||!rows.length)throw Error('净值源站未返回有效记录');
  for(const row of rows){if(Number(row.DWJZ)>0){nav.set(row.FSRQ,Number(row.DWJZ));received++}}
  if((fund.history.length&&rows.at(-1).FSRQ<=fund.history.at(-1).date)||rows.length<20)break;
 }
 const quoteURL=`https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${market}.${code}&klt=101&fqt=0&lmt=500&end=20500101&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57`;
 let result,quoteSource='东方财富';
 try{result=await fetchJSON(quoteURL,'行情')}catch{
  try{if(!fund.latest)throw Error('新基金需要完整历史');result=await fetchJSON(quoteURL.replace('lmt=500','lmt=1'),'最新行情')}catch{
   const symbol=(market==='1'?'sh':'sz')+code;
   const backup=await fetchJSON(`https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,,,320,`,'备用行情');
   const entry=backup.data?.[symbol],rows=entry?.day,quote=entry?.qt?.[symbol];
   if(backup.code!==0||!Array.isArray(rows)||!rows.length||!quote)throw Error('备用行情未返回未复权日线');
   const quoteDate=quote[30]?.slice(0,8).replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3');
   const amount=Number(quote[35]?.split('/')[2]);
   if(quoteDate!==rows.at(-1)[0]||!Number.isFinite(amount)||amount<0)throw Error('备用行情成交额或日期无效');
   result={data:{name:quote[1],klines:rows.map(r=>[r[0],r[1],r[2],r[3],r[4],r[5],r[0]===quoteDate?amount:''].join(','))}};
   quoteSource='腾讯财经';
  }
 }
 const quote=result.data;if(!quote?.klines?.length||!received)throw Error('源站未返回有效行情或净值');
 const byDate=new Map(fund.history.map(r=>[r.date,{date:r.date,close:r.close,amount:r.amount,quoteSource:r.quoteSource||'东方财富'}]));
 if(fund.latest)byDate.set(fund.latest.date,{date:fund.latest.date,close:fund.latest.close,amount:fund.latest.amount,quoteSource:fund.quoteSource||'东方财富'});
 for(const row of quote.klines){const p=row.split(',');byDate.set(p[0],{date:p[0],close:Number(p[2]),amount:p[6]===''?byDate.get(p[0])?.amount??null:Number(p[6]),quoteSource})}
 const prices=[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
 if(prices.some(p=>!Number.isFinite(p.close)||p.close<=0||(p.amount!==null&&!Number.isFinite(p.amount))))throw Error('行情数值无效');
 const history=prices.filter(p=>nav.has(p.date)).map(p=>({...p,nav:nav.get(p.date),premium:(p.close/nav.get(p.date)-1)*100}));
 const navDate=[...nav.keys()].sort().at(-1),price=prices.at(-1);if(navDate>price.date||(fund.latest&&(price.date<fund.latest.date||navDate<fund.latest.navDate))||!history.length||(!fund.latest&&history.length<200))throw Error('源站数据日期异常或历史不足，保留原数据');
 return {...fund,name:quote.name,quoteSource,history,latest:{...price,nav:nav.get(navDate),navDate,premium:(price.close/nav.get(navDate)-1)*100},fetchedAt:new Date().toISOString()};
}
export default {async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(url.pathname==='/api/status')return Response.json({version:'refresh-v2',snapshotAt:SNAPSHOT.fetchedAt},{headers:{'Cache-Control':'no-store'}});
 if(url.pathname==='/api/fund'){
  const code=url.searchParams.get('code');if(!SNAPSHOT.funds.some(f=>f.code===code))return Response.json({error:'未知基金代码'},{status:400});
  try{return Response.json(await liveFund(SNAPSHOT.funds.find(f=>f.code===code)),{headers:{'Cache-Control':'no-store'}})}catch(error){console.error('Fund refresh failed',code,error.message);return Response.json({error:error.message||'源站暂时不可用，请稍后重试。'},{status:502,headers:{'Cache-Control':'no-store'}})}
 }
 if(url.pathname==='/favicon.ico')return new Response(null,{status:204});
 if(url.pathname!=='/')return new Response('Not found',{status:404});
 return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
}};
