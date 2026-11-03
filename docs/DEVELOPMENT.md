# 开发与维护

## 运行结构

前端入口是 `public/index.html` 与 `public/app.js`。`public/letter.css` 负责来信布局，`public/report-image.js` 在浏览器生成长图，`public/character-copy.js` 提供页面和长图共用的作品发现文案。

`worker/index.mjs` 将 `/api/*` 交给 `server/app.mjs`，其余请求交给 Cloudflare 静态资源。开发入口 `scripts/dev.mjs` 使用同一 API 与 `D1Store`，通过 `scripts/sqlite-adapter.mjs` 适配 Node.js 内置 SQLite。

`server/engine.mjs` 负责抽题、计分和角色匹配；`server/analysis.mjs` 根据实际选项组织来信；`server/character-display.mjs` 对旧结果补齐角色介绍。发码逻辑独立位于 `server/fulfillment.mjs` 与 `server/access-codes.mjs`。

## 数据文件为何保留

- `data/questions.mjs` 是统一入口，转出 `questions-v4.mjs`。v4 引用 v3 的 1000 道基础题，再补充 1000 道，因此两个版本文件都在使用。
- `data/characters.mjs` 汇总多个角色资料模块，再通过 `roster-policy.mjs` 的明确名单筛选。不能只凭文件名或当前入选数量删除仍被导入的资料模块。
- `data/test-modes.mjs` 保留旧题量模式，用于已有测试兼容；用户入口只显示 36 / 60 / 90 题。
- `tests/fixtures/` 保存 249 位角色在 24 / 36 / 60 / 90 题下的真实答题见证。它们是回归依据，不是临时输出。
- `schema.sql` 中旧账户相关字段和 `migrations/` 中已发布迁移继续保留，避免破坏现有数据库；不再使用的注册、账户核销代码已移除。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动本地网页、API 与 SQLite，默认 `127.0.0.1:4173` |
| `pnpm codes --count 5 --local` | 生成并导入本地测试码 |
| `pnpm test` | 运行全部自动测试 |
| `pnpm roster` | 重建 `docs/CHARACTER_ROSTER.md` |
| `pnpm build:check` | 打包到 `work/build-check/`，不部署 |
| `pnpm package` | 用 `git archive` 导出当前提交到 `work/exports/` |
| `pnpm deploy` | 发布到 `wrangler.jsonc` 指定站点 |

源码包仅包含当前 Git 提交的文件；有未提交修改时先提交，再生成交付包。Git 历史、依赖、SQLite、密码清单和忽略文件不会进入源码包。

## 修改人物、题库和匹配

保持角色 ID 和题目 ID 稳定。修改匹配公式、人物参数、题目权重或入选名单后，重新生成受影响题量的答题见证，并运行测试：

```bash
node scripts/audit-reachability.mjs 24
node scripts/audit-reachability.mjs 36
node scripts/audit-reachability.mjs 60
node scripts/audit-reachability.mjs 90
pnpm test
pnpm roster
```

这些搜索比普通测试耗时更长；纯文档、样式或未改变题库与评分的清理不需要重新搜索。已有见证仍由自动测试重新计分验证。可达性不代表自然用户匹配频率均匀，详见 [匹配说明](MATCHING.md)。

## 本地文件保留规则

| 路径 | 性质与处理 |
| --- | --- |
| `work/codes/` | 密码库存与发货记录，保留并单独备份，不提交 |
| `work/local.sqlite*` | 本地数据及 SQLite 日志，运行期间不可直接删除 |
| `work/character-research/` | 人物资料核对底稿，不发布、不打包；有编辑用途时保留 |
| `work/build-check/`、`work/exports/` | 可重新生成的打包产物，按需清理 |
| `.wrangler/state/` | Wrangler 本地数据库状态，不当作普通缓存清空 |
| `.wrangler/tmp/`、日志、旧截图 | 确认无任务使用后可清理；文档引用的正式截图在 `docs/images/` |
| `node_modules/` | 开发依赖，可按锁文件重装，不提交 |

工程之外的原创设定、宣传素材和交付文件是独立成果，不属于网页运行依赖，也不等于垃圾文件。

## 本次整理

2026-11-03 清理了无引用的 v2 题库、早期抓取与头像下载脚本、停用的角色目录交互、旧注册存储实现、历史无用样式以及临时构建与检查产物。部署和发货说明分离；角色名单与验证记录移入 `docs/`。恢复旧版本应使用 Git 历史或本机整理前备份，不把整份旧工程重新混入运行目录。
