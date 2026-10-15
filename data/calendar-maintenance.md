# 日历核对

每天北京时间 09:00 在本聊天中执行自动核对；该任务不是实时数据流。

日程存放在 `calendar.mjs`，概述、资料链接和逐次发布的结果摘要存放在 `calendar-editorial.mjs`。先读取官方材料再编辑；不得只推进核对日期。每次检查未来 90 天和最近 7 天，每周检查全部覆盖年份。尚未公布的 2027 BEA/JOLTS 日程继续留空，不用规则推算。

分别核对 BLS 年度日程、美联储 FOMC 日历和发布时间说明、BEA 年度发布日程、FEC 投票日期。日期已过不等于结果已核实。摘要中的实际值必须匹配发布日和统计期，引用永久归档原文；滚动的最新报告页仅作为指标资料，不用来引用旧期结果。禁止提前展示尚未到发布时间的数值。预期值没有可靠来源就不写。

只有成功核实的事件才能更新其 verifiedAt，结果核对日期单独保存在 resultVerifiedAt。当前统一 verifiedAt 表示本次全量日程与概述复核；以后如仅核对部分条目，应在数据中保留未核对条目的原日期。源站失败时保留数据和核对日期并报告。

修改后运行 node scripts/build-pages.mjs、node scripts/check-pages.mjs、node scripts/check-calendar.mjs。提交到 GitHub masterMo66/nasdaq-pages 的 main 分支，由 Pages Actions 发布。验证 nasdaq.moqi.chat 的 calendar.json 和事件内容。保留公开访问及基金数据。GitHub 凭据不可写入文件；如缺少可用授权，保留本地变更并报告，不得宣称已发布。
