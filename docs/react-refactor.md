# React 重构与 skill 工作流程

## 目标与范围

将原生 HTML/CSS/JavaScript 看板改为 React + Vite。保留 12 只基金真实历史、最多四只对比、日期范围、CSV、排序、搜索、关注、快照刷新、主题、经济日历、双时区、事件详情、财报名单和 ICS 导出。静态 JSON、定时采集与 GitHub Pages 部署继续使用。

## 使用的 skill 与方案

| 来源 | 在本项目中的职责 | 具体落地 |
| --- | --- | --- |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 产品匹配、视觉规范、React 实现建议 | Financial Dashboard；统一 token、字体、密度、间距、双主题；派生值在 render / memo 中计算 |
| [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) | 组件与加载性能 | 日历懒加载、请求去重、图表 memo、日期索引 Map、事件监听清理、局部状态 |
| [Web Design Guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | 交互与可访问性审查 | 语义 HTML、可见焦点、跳转链接、控件标签、按下状态、主题色、减少动态效果、错误反馈 |
| [Motion](https://motion.dev/docs/react) | 动画机制 | LazyMotion、分段选择器 spring、主题滑块、VIX 回弹、toast |
| [Vite](https://vite.dev/guide/) | 开发、构建与静态发布 | 相对 base、代码拆分、数据资产生成、开发数据入口 |

现有 `design-taste-frontend` 主要用于展示页，本次只参考其保留品牌与克制动效原则，未将它作为看板主流程。未引入 shadcn/ui：现有界面使用简单原生控件，共享 Segmented 组件即可满足需求，避免为少量控件增加另一套样式和配置。

## 实施顺序

1. **审计原版**：核对组件、公式、存储键、日历边界、数据来源和 Actions；确认当前工作区无待保留的本地修改。
2. **查询设计依据**：UI UX Pro Max 首次完整查询中的营销结构不匹配；以 product 域查询缩小到 Financial Dashboard，保留可用的字体、密度、对比度与动效建议。
3. **明确规范**：将最终决定写入 `design-system/nasdaq-observatory/MASTER.md`，将语义颜色、字体、间距、圆角和动画时间落实到 CSS 变量。
4. **拆分 React**：App 管理加载、页面路由、主题与快照；PremiumPage 管理基金交互；PremiumChart 管理坐标与游标；VixGauge 管理指针；CalendarPage 管理日历；Segmented 提供统一切换反馈。
5. **隔离数据逻辑**：验证、增量合并、日期区间、曲线数据和 CSV 放入纯函数；ICS 从旧版抽出；复用原时区函数与数据源。请求失败保留当前有效数据，并阻止旧快照回退。
6. **控制渲染与加载**：主快照、日历数据分开加载；日历组件动态 import；重复挂载请求去重；曲线不随搜索框逐字重算；Motion 使用 LazyMotion（10 月 24 日切换为含 layout 能力的 domMax）；系统字体免外链请求。
7. **审查与回归**：保留原公式、DST、财报名单和 ICS 检查；新增数据回退与重复代码测试；浏览器覆盖搜索、关注、对比上限、导出、失败反馈、双主题、日历过滤与时区；四种宽度运行 axe 和截图检查。
8. **准备部署**：锁定依赖，Actions 安装后构建、检查、运行单元测试；新增 PR / 手动触发的 Chromium 浏览器检查。Vite 输出相对路径，兼容仓库子目录与自定义域名。线上发布仍由仓库 Actions 触发。

## 文件入口

- `src/App.jsx`：应用外壳、hash 页面路由、数据获取、主题和反馈。
- `src/components/PremiumPage.jsx`、`PremiumChart.jsx`、`VixGauge.jsx`：基金看板。
- `src/components/CalendarPage.jsx`：独立日历代码块与数据请求。
- `src/lib/funds.js`、`calendar-export.js`：纯逻辑与导出。
- `src/styles.css`：全局设计 token 与响应式样式。
- `vite.config.js`：构建、开发数据入口与静态数据资产。
- `tests/`：数据单元测试及浏览器回归。

## 验证命令

```sh
pnpm build
pnpm check
pnpm test
pnpm test:e2e
```

本地重构与生产发布分开：生成 `dist/` 不代表 GitHub Pages 已更新。浏览器检测反映本地构建的功能、布局与自动化可访问性结果，不替代真实设备性能测量或人工屏幕阅读器测试。

## 本次验证结果（2026-10-23）

- Vite 生产构建成功；主 JS gzip 约 121.62 kB，日历独立 JS gzip 约 6.59 kB，CSS gzip 约 6.57 kB。数据 JSON 独立加载。这是产物体积记录，并非相对原生版的性能提升证明。
- 原数据检查通过：12 只基金的同日净值公式；161 项事件；20 家财报名单；DST、跨日、日期型事件与 ICS UTF-8 折行。
- 新增 3 项数据单元测试全部通过：无效快照、回退保护、图表区间与 CSV。
- 7 项 Edge 浏览器回归全部通过，涵盖功能、375 / 768 / 1024 / 1440px、主题、键盘和 GitHub Pages 子目录部署。
- 四种宽度分别运行基金页浅 / 深色与日历深色 axe 检查，目标 WCAG 2 A / AA、2.1 AA，报告零违规；截图人工检查通过。未据此宣称完整 WCAG 认证。
- 修复平板侧栏收起文字后缺少链接名称的问题；VIX SVG 指针使用正确的 `(200, 205)` 原点，并验证当前值对应的旋转角度。
- `pnpm install --frozen-lockfile --offline` 通过。仅允许 esbuild 所需构建脚本；锁文件未绑定下载镜像。
- 新增 Chromium Actions 工作流已准备，尚未在 GitHub 运行。当前结果来自本地 Edge；未提交、推送或部署线上站点。

本地预览：`http://127.0.0.1:4174`。截图保存在忽略目录 `preview/react-desktop.png`、`preview/react-calendar.png`、`preview/react-calendar-dark.png`、`preview/react-mobile.png`。

## 界面精简与动效调整（2026-10-24）

- 按用户反馈移除两页宣传标题、英文装饰标签、曲线操作提示、对比数量提示和重复副标题；页面直接从快照操作和数据开始。
- VIX 仪表盘、搜索、日期和时区控件取消外侧矩形焦点框，键盘操作改为控件内部下划线或针色提示。
- 新增共享 StatCard：概览与历史统计使用卡片，区间均值采用绿色数值面板；鼠标倾斜、浮起、光晕跟随和回弹均通过 Motion values / springs 驱动，鼠标移动时不重新渲染整页。手机和减少动态效果模式保持稳定。
- 修复 Motion 功能集缺少 layout 能力的问题：LazyMotion 从 domAnimation 改为 domMax，让分段指示器、基金标签与排序布局动画实际生效。另加入曲线绘制、游标缓动、浮层、页面与日历切换过渡。
- 构建、原数据检查和 3 项单元测试通过；9 项浏览器回归全部通过，包含排序、四种屏幕宽度、深浅主题 axe 检查、无外侧焦点框、卡片悬停 / 回正、减少动态效果和 Pages 子目录。
- 新主 JS gzip 约 137.92 kB，日历 JS gzip 约 6.66 kB；增加的是布局动画与卡片功能，未添加新依赖。数据文件与采集逻辑保持不变。
- 新截图：`preview/stat-cards-light.png`、`preview/stat-cards-hover.png`、`preview/stat-cards-mobile.png`、`preview/stat-cards-mobile-dark.png`。

## iOS pointer 与弧线交互（2026-10-24）

- 参考 [Motion iOS pointer 示例](https://motion.dev/examples/react-ios-pointer) 的公开交互：圆点跟随、按钮吸附与填充形状融合。官方示例的 Cursor 属于 Motion+；项目使用已安装的开源 Motion values / springs 独立实现 `IOSPointer.jsx`，不包含付费组件或会员源码。
- 自定义指针只在支持悬停的鼠标设备上显示；原生输入、精确拖动、键盘、触屏、减少动态效果和强制颜色模式回退原生指针。显示、隐藏、位置和形状不依赖每次鼠标移动重渲染 React；单个控件内复用已缓存的边界。
- `CompareButton.jsx` 与 `FundChip.jsx` 使用官方 [arc API](https://motion.dev/docs/arc) 的 `transition.path`，不是用直线路径假装曲线。标签进入 / 退出 600ms、图标切换 450ms；保留 1–4 只比较限制。
- 标签退出期间禁用并移出可访问树，避免连续点击把移除项重新加入；动画在面板内裁剪，避免手机出现横向溢出。
- 日历重点事件栏固定高度，筛选出 3 / 1 / 0 项时高度保持不变；桌面与手机分别设置适合内容的尺寸。
- 最终验证：构建、原公式 / 时区 / ICS 检查和 3 项单元测试通过；14 项浏览器回归全部通过，包含指针磁吸、按压、输入与键盘回退、触摸、减少动态效果、固定栏高与弧线增删。主 JS gzip 约 140.68 kB。未添加新依赖或部署线上版本。
- 磁吸状态截图：`preview/ios-pointer-magnetic.png`。本地预览入口：`http://127.0.0.1:4174/?v=ios-pointer-20261024`。
