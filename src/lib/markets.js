export const MARKETS = {
  nasdaq100: { label: '纳指 100', name: '纳斯达克 100', defaults: ['513100', '159941', '513300'] },
  sp500: { label: '标普 500', name: '标普 500', defaults: ['513500', '513650', '159655'] },
};

export const FUND_CATALOG = [
  ...['513100', '159941', '513300', '159632', '159501', '159513', '159659', '159660', '159696', '513110', '513390', '513870'].map(code => ({ code, index: 'nasdaq100' })),
  { code: '513500', index: 'sp500', name: '标普500ETF博时', manager: '博时', exchange: '上交所', officialSource: 'https://www.bosera.com/fund/etfList.do?fundCode=513500' },
  { code: '513650', index: 'sp500', name: '标普500ETF南方', manager: '南方', exchange: '上交所', officialSource: 'https://www.nffund.com/main/files/2025/06/10/576087501397.pdf' },
  { code: '159655', index: 'sp500', name: '标普500ETF华夏', manager: '华夏', exchange: '深交所', officialSource: 'https://www.chinaamc.com.cn/upload/resources/file/2026/01/22/a511f9691a574b73a5bb406274fa572f.pdf' },
  { code: '159612', index: 'sp500', name: '标普500ETF国泰', manager: '国泰', exchange: '深交所', officialSource: 'https://st.gtfund.com/pis/www/CN_50010000_159612_FA010080_20250001_159612_20250930_090000_01.pdf' },
];

export function marketOf(fund) { return FUND_CATALOG.find(item => item.code === fund.code)?.index; }
export function fundsForMarket(funds, index) { return funds.filter(fund => marketOf(fund) === index); }
