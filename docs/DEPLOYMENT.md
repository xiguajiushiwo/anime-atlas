# 当前部署

更新：2026-11-02。

- 正式站点：https://anima.wayella.com
- GitHub 私有仓库：https://github.com/xiguajiushiwo/anime-atlas
- 主分支：`main`
- Cloudflare Worker：`anime-atlas`
- 当前发布版本：`0d4b8b2e-3e08-4bd3-89d1-af6061e8ab4f`
- D1 数据库：`anime-atlas`，绑定名 `DB`，实际 ID 已保存在 `wrangler.jsonc`。

站点使用现有 wayella.com 域名下的独立子域名，已绑定至 anime-atlas Worker。Cloudflare 自动签发 HTTPS 证书，原数据库与密码保留。免费 workers.dev 入口继续开启，但当前网络下该域名解析异常，不用作买家入口。公网入口同样需要解锁码，`?preview=1` 不会绕过密码。

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

本次长题更新通过 30 项自动测试、本地 HTTP 36 / 60 / 90 题检查，以及 1440×900 桌面 60 题、390×844 手机 90 题浏览器检查。报告、暂存恢复、历史与 PNG 下载通过。Cloudflare 发布成功，无数据库迁移。新增 anima.wayella.com 后，在系统代理关闭的环境中通过真实 HTTPS 36 / 60 / 90 题验证，覆盖解锁、报告、权限与记录隔离。GitHub 普通推送连接超时，使用可连通的 GitHub API 同步精确 Git 对象。仅新增该测试子域名，不改动其他站点、系统代理或本机 DNS。

自定义域名配置已保存于 wrangler.jsonc。创建前通过 Cloudflare changeset 确认无已有记录冲突，绑定时禁用 DNS 与已有站点覆盖；原始 workers.dev 地址继续可用于适用网络下的诊断。

当前入口：每次点击「开始测试」或「再测一次」都先验证解锁码，即使浏览器已有有效会话也不跳过。封面和密码框说明可重复测试。此轮通过 9 项访问测试，以及本地、正式站点的桌面和手机尺寸入口复验；重复输入同一码仍保留本机进度和历史。
