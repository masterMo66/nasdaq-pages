# 纳指 ETF 溢价看板 · Pages + Actions

公开静态站点，无登录。保留 12 只 ETF 的真实历史、对比图、CSV 导出及官方经济日历。VIX 区块展示 Cboe 官方日收盘值、日变化和近 30 个交易日走势，非实时行情。VIX 衡量标普 500 未来 30 天预期波动率，不是纳斯达克专属指数，也不表示涨跌方向。数据通过 scripts/collect-vix.mjs 随定时采集更新，失败保留上次成功记录，data/vix.json 记录日期与来源。右上角图标开关切换深浅色，偏好保存在当前浏览器。

`npm run build` 生成 dist，`npm run check` 检查公式、日期、时区、ICS 和客户端语法。Node 24，无第三方依赖。

Actions 每天北京时间 09:17、18:17 采集，亦可手动运行。GitHub 调度可能延迟。刷新按钮仅读取最近发布的 snapshot.json，不在浏览器请求行情源。单只采集失败保留旧值，工作流发布可用数据后报告失败。

日历日期、中文概述和引用保留人工核实日期。Actions 检查五个官方来源的可访问性与内容变化，记录 data/source-checks.json；网页变化只表示需要复核，不自动宣称日程或公布摘要已核实。中文内容由本聊天每日维护任务复核；详情见 data/calendar-maintenance.md。

部署使用仓库自带 GITHUB_TOKEN，无需长期个人 token。Pages 发布源设为 GitHub Actions，自定义域名通过仓库 Pages 设置绑定。CNAME 指向 mastermo66.github.io。
