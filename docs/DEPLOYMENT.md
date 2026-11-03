# Cloudflare 部署指南

## 现有站点

- 正式入口：<https://anima.wayella.com>
- 源码仓库：<https://github.com/xiguajiushiwo/anime-atlas>（私有）
- 发布分支：`main`；Worker 与 D1 数据库名均为 `anime-atlas`，数据库绑定名为 `DB`。
- `wrangler.jsonc` 保存当前账户、数据库绑定和自定义域名，对应已有站点。
- GitHub 推送不会自动部署，发布需明确运行 Wrangler。

更新现有站点：

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm build:check
pnpm deploy
```

普通代码更新不需要重新初始化 D1。只有存在新的、适用于当前结构的迁移时才运行迁移文件。旧升级 SQL 不能重复执行。线上密码和历史记录保存在 D1，不随代码部署重置。

## 部署到新账户或新站点

先登录自己的账户并创建数据库：

```bash
pnpm exec wrangler login
pnpm exec wrangler d1 create anime-atlas
```

将 `wrangler.jsonc` 中的 `account_id`、`database_id`、数据库名称及 Worker 名称改为自己的配置。`routes` 中的 `anima.wayella.com` 属于现有站点；新站点应替换为自己的域名，或删除 `routes` 使用 `workers.dev`。

只对全新的数据库执行：

```bash
pnpm exec wrangler d1 execute anime-atlas --remote --file schema.sql
pnpm deploy
```

如果接手的是 2026-11-02 密码改版前的旧数据库，先备份，再执行一次：

```bash
pnpm exec wrangler d1 execute anime-atlas --remote --file migrations/2026-11-02-password-access.sql
```

使用 `schema.sql` 初始化的新数据库已经包含这些字段，不要再执行这份历史升级。

## 导入可用的解锁码

```bash
pnpm codes --count 100 --site https://你的正式域名
pnpm exec wrangler d1 execute anime-atlas --remote --file work/codes/实际批次号/import.sql
```

使用命令实际生成的批次路径；确认整批导入成功后再发货。本地 `--local` 生成的码不会自动进入线上数据库。密码明文位于 `work/codes/`，不上传 GitHub 或网站。订单自动发码、密钥配置及停用方式见 [发货配置](SALES_SETUP.md)。

## 部署后验证

设置 `SMOKE_ORIGIN` 为站点地址，`SMOKE_CODE_FILE` 为已导入对应数据库的密码文本文件，再运行：

```bash
node scripts/verify-deployment.mjs
```

脚本检查未解锁访问、36 / 60 / 90 题、结果重读、共享码的记录隔离等，不输出密码。它会在对应数据库留下独立测试会话及少量结果；解锁码不会被消耗或作废。

还应在桌面与手机浏览器检查封面、解锁、作答、刷新恢复、结果历史和 PNG 下载。真实店铺付款与发货需要另用测试订单验证；网站接口测试不能代替支付渠道验收。

## 数据与运行配置

只有 `public/` 作为静态资源发布。数据库、解锁码、订单资料、环境密钥及维护文档应留在静态目录之外。定时任务清理过期会话与限流记录，不清空已完成报告。

修改数据库前保留备份；备份发码加密密钥，避免旧订单无法解密重发。Cloudflare 敏感配置用 `wrangler secret put` 设置，配置名和用途见 [发货配置](SALES_SETUP.md)。
