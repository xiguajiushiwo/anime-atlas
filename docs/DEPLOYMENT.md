# 当前部署

更新：2026-11-02。

- 正式站点：https://anime-atlas.1510351214.workers.dev
- GitHub 私有仓库：https://github.com/xiguajiushiwo/anime-atlas
- 主分支：`main`
- Cloudflare Worker：`anime-atlas`
- D1 数据库：`anime-atlas`，绑定名 `DB`，实际 ID 已保存在 `wrangler.jsonc`。

站点使用 Cloudflare 提供的 HTTPS 地址，当前未绑定自定义域名。公网入口同样需要解锁码，`?preview=1` 不会绕过密码。

首批正式密码共 20 个，已导入正式 D1 数据库。以下文件只保存在部署电脑，不上传 GitHub，也不作为网站资源发布：

- `work/codes/B20261102071601-ea51/codes.txt`：一行一个正式密码。
- `work/codes/B20261102071601-ea51/delivery.txt`：一行一份正式链接、密码和使用说明。
- 同目录 `codes.csv` 与 `import.sql`：密码批次清单和数据库导入文件。

本地试用码不自动同步到正式数据库，线上使用本批次的正式密码。每个密码可重复使用，支持多浏览器；访客的答题记录相互独立。

真实小红书订单与发货工具尚未连接，服务器发码认证和商品配置尚未启用，`/api/fulfillment/issue` 默认关闭。详情见 `SALES_SETUP.md`。

## 后续更新

源码提交并推送到 GitHub 后，在拥有当前 Cloudflare 登录权限的环境运行：

```bash
npx wrangler deploy
```

目前没有配置 GitHub 推送自动部署。现有数据库保留，不要重新初始化或重复执行旧升级文件。新批次密码需要单独导入正式 D1，再交付买家。

本地 `scripts/verify-deployment.mjs` 可复查解锁和完整答题流程。测试会留下独立的测试会话与少量结果，不会消耗或作废解锁码。
