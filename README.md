# 次元来信 · 动漫人物测试

可本地运行、可部署到 Cloudflare Workers + D1 的网站。当前精选 58 部作品、249 位角色、2000 道题。用户只需输入购买后收到的解锁码，不注册、不绑定账户；同一码可重复使用，也可在不同浏览器使用。

网站已部署到 https://anime-atlas.1510351214.workers.dev ，源码同步在私有仓库 https://github.com/xiguajiushiwo/anime-atlas 。网站解锁、批量密码文件和按订单发码接口已经实现；真实小红书订单、收款或买家消息尚未接入。按订单发码接口必须由已核验付款的发货服务调用，不会自行判断小红书订单是否付款。

## 本地运行

需要 Node.js 24 或以上。

```bash
node scripts/dev.mjs
node scripts/codes.mjs --count 5 --local --site http://127.0.0.1:4173
```

打开 `http://127.0.0.1:4173/`。首页保留封面和「开始测试」按钮；点击后只显示一个解锁码输入框。解锁后依次进入测试介绍、角色性别与题量选择、答题和个性化来信。提供 36 / 60 / 90 题，默认 60 题。选完自动进入下一题，可返回修改；暂存后可在选择页继续，结果支持回看与 PNG 长图保存。

解锁码从命令输出的 `codes.txt` 取得。`?preview=1` 也需要解锁，不再自动创建免码体验权限。

本地数据库位于 `work/local.sqlite`。启动时自动为旧本地数据库补充解锁码会话字段，原有数据保留。原先没有解锁码的体验会话不再授予访问权限。

## 解锁与记录

- 新生成的解锁码为 6 位纯数字，保留开头的零；无需账户名、登录密码、手机号或邮箱。已发出的旧长码仍可使用。
- 同一个解锁码可反复进入，支持多人和多浏览器使用，不限制绑定人数。
- 当前浏览器通过 HttpOnly Cookie 记住解锁状态，会话有效期为 90 天，持续使用时滑动续期。清除 Cookie 或会话过期后可重新输入原码。
- 每个浏览器的答题记录相互独立。共享解锁码不会共享历史记录；退出后重新进入会建立新的浏览器记录。
- 题目、评分和历史接口都检查有效解锁状态；停用某个码后，其已有会话也不能继续访问受保护接口。
- 验证码表只保存解锁码哈希。按订单发码需重发原码，因此另以 AES-GCM 加密保存订单对应的码；加密密钥只放在服务器配置中。

首页不展示角色清单、题库规模、评分参数或发货配置。用户结果返回角色名字及基于本轮答案的分析，不返回评分向量、答案权重或完整名单。完整角色名单及资料来源见 `CHARACTER_ROSTER.md`，仅供所有者审核。

## 发货准备

详见 `docs/SALES_SETUP.md`，包括密码库存和按订单生成两种对接方式。

```bash
node scripts/codes.mjs --count 100 --site https://你的正式域名
```

命令在 `work/codes/批次号/` 生成 `codes.csv`（码与批次清单）、`codes.txt`（一行一码）、`delivery.txt`（一行一份链接、密码及说明，需指定 `--site`）以及 `import.sql`（只有哈希，用于导入数据库）。

这些本地生成的码必须导入与网站对应的数据库后才能使用。`--local` 仅导入本地预览数据库，不导入公网数据库。生成时会避开本机已有批次和本地数据库中的码；正式数据库导入仍以唯一键检查，确认整批导入成功后再交付。

## Cloudflare 部署

使用 Workers Static Assets 和 D1，网页与 API 同源。可先使用 `workers.dev` 地址，也可绑定自己的域名。

当前账户的数据库和 Worker 已创建，`wrangler.jsonc` 已填入实际绑定。维护现有站点时使用 `npx wrangler deploy`；不要重复创建数据库或执行旧版本升级 SQL。以下首次配置步骤用于新账户或全新站点，需替换 `account_id` 与 `database_id`。GitHub 保存源码，后续推送不会自动触发 Cloudflare 部署，目前使用 Wrangler 发布。

```bash
npm install
npx wrangler login
npx wrangler d1 create anime-atlas
```

把数据库 ID 填入 `wrangler.jsonc` 的 `database_id`。新数据库执行：

```bash
npx wrangler d1 execute anime-atlas --remote --file schema.sql
```

如果已有 2026-11-02 密码改版前的数据库，保留原数据，改为执行一次升级文件；新数据库不要再执行该升级文件：

```bash
npx wrangler d1 execute anime-atlas --remote --file migrations/2026-11-02-password-access.sql
```

部署并导入实际批次的密码：

```bash
npx wrangler deploy
npx wrangler d1 execute anime-atlas --remote --file work/codes/实际批次号/import.sql
```

按订单自动生成不依赖预先导入密码，但需要在服务器配置发货服务认证密钥、码加密密钥和商品标识。具体对接合同见 `docs/SALES_SETUP.md`。未配置时发码接口关闭。

只有 `public/` 作为静态资源发布。不要将源码、数据库、密码明文、订单资料或密钥复制到该目录。

## 匹配与检查

六类题目均衡随机抽取，优先避开最近三轮抽过的题。题库有限，不承诺永不重复。用户入口提供 36 / 60 / 90 题，默认 60 题；保留旧 12 / 24 / 36 题模式以兼容未完成测试。

角色按八维相对倾向和四组投入程度匹配。人物参数是编辑解读，不是官方测量或心理诊断；角色可达不代表自然用户的结果频率均匀。每部人数不设配额，实际名单由 `data/roster-policy.mjs` 控制。

```bash
node --test tests/*.test.mjs
node scripts/audit-reachability.mjs 24
node scripts/audit-reachability.mjs 36
node scripts/audit-reachability.mjs 60
node scripts/audit-reachability.mjs 90
node scripts/export-roster.mjs
```

24 / 36 / 60 / 90 题的答题见证保存于 `tests/fixtures/`。自动测试会从真实选项重新计分，并检查同角色不同回答的报告差异、证据与实际选择一致、解锁、共享码的记录隔离、停用、订单重复通知和发码认证。数据库用途、匹配规则、可达性边界与报告逻辑详见 `docs/MATCHING.md`。

`scripts/verify-deployment.mjs` 可检查真实部署：用 `SMOKE_ORIGIN` 指定站点，`SMOKE_CODE_FILE` 指向已导入该站点数据库的密码文本文件。脚本会建立独立浏览器会话、完成三轮测试并核对权限与记录隔离；它不会打印密码。测试会在数据库留下少量测试记录。

备份生产 D1 数据库与发码加密密钥，妥善保管密码清单。自动退款撤码、平台回调适配和平台消息发送需要根据实际发货工具另行接入；本版不声称这些已经上线。
