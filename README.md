# 纳指 ETF 溢价看板 · Pages + Actions

公开静态站点，无登录。保留 12 只 ETF 的真实历史、对比图、CSV 导出及官方经济日历。VIX 区块展示 Cboe 官方日收盘值、日变化和近 30 个交易日走势，非实时行情。VIX 衡量标普 500 未来 30 天预期波动率，不是纳斯达克专属指数，也不表示涨跌方向。数据通过 scripts/collect-vix.mjs 随定时采集更新，失败保留上次成功记录，data/vix.json 记录日期与来源。右上角图标开关切换深浅色，偏好保存在当前浏览器。

前端使用 React + Vite + Motion，图标使用 Lucide，图表保留 SVG。Node.js 24，使用 pnpm 与锁文件安装依赖。仍为静态站点，无额外后端服务。

```sh
pnpm install --frozen-lockfile
pnpm dev         # 开发与热更新
pnpm build       # 生成 dist/
pnpm check       # 基金公式、日历、DST、财报名单、ICS、构建产物
pnpm test        # 数据合并、快照验证、区间与 CSV 回归
pnpm test:e2e    # 已构建产物的浏览器回归；本地使用已安装的 Edge
pnpm preview    # http://127.0.0.1:4174
```

CI 浏览器测试使用 Chromium，可先执行 `pnpm exec playwright install --with-deps chromium`。本地测试默认 Edge；命令行 `CI=1` 使用 Playwright Chromium。

`src/components/` 包含基金页、SVG 曲线、VIX 指针、延迟加载的日历和共享分段选择器；`src/lib/` 提供数据验证、合并与导出。`src/styles.css` 使用统一语义 token 控制深浅主题、字体、间距和动画。`worker/api.js` 继续由 Node 采集脚本复用，`worker/calendar-utils.js` 为采集数据与 React 共享的时区函数，并非线上 Worker 服务。

Vite 使用相对资源地址，兼容 GitHub Pages 仓库子路径和自定义域名。构建输出 `index.html`、版本化资源、`snapshot.json`、`calendar.json` 和 `.nojekyll`。开发服务器通过 Vite 插件提供同样的数据入口。首次加载读取快照；进入日历后才加载日历代码和数据。保留旧版 `localStorage` 的关注、主题和有效快照。

设计依据见 [设计规范](design-system/nasdaq-observatory/MASTER.md)，skill 使用、实现取舍和验证流程见 [重构流程](docs/react-refactor.md)。

Actions 每天北京时间 09:17、18:17 采集，亦可手动运行。GitHub 调度可能延迟。刷新按钮仅读取最近发布的 snapshot.json，不在浏览器请求行情源。单只采集失败保留旧值，工作流发布可用数据后报告失败。

日历日期、中文概述和引用保留人工核实日期。Actions 检查五个官方来源的可访问性与内容变化，记录 data/source-checks.json；网页变化只表示需要复核，不自动宣称日程或公布摘要已核实。中文内容由本聊天每日维护任务复核；详情见 data/calendar-maintenance.md。

部署使用仓库自带 GITHUB_TOKEN，无需长期个人 token。Pages 发布源设为 GitHub Actions，自定义域名通过仓库 Pages 设置绑定。CNAME 指向 mastermo66.github.io。
