# PoolClean Pro 部署快速参考

## 一、环境配置

### 1. 安装依赖
```bash
cd /home/tusim/dev/projects/pool-robot-site
pnpm install
```

### 2. 配置环境变量
```bash
cp packages/web/.env.example packages/web/.env.local
# 编辑 .env.local 填入您的配置
```

### 3. 本地开发测试
```bash
cd packages/web
pnpm dev
# 访问 http://localhost:3000
```

## 二、部署到 Vercel

### 安装 CLI
```bash
pnpm add -g vercel
```

### 登录并部署
```bash
vercel login
cd packages/web
vercel              # 部署预览版
vercel --prod       # 部署生产版
```

### 配置环境变量（在 Vercel 网页端）
1. Dashboard → Project → Settings → Environment Variables
2. 添加所有 .env.local 中的变量

## 三、部署到 Docker

### 构建镜像
```bash
cd packages/web
docker build -t poolclean-pro:latest .
```

### 运行容器
```bash
docker run -d \
  --name poolclean-pro \
  -p 3000:3000 \
  --env-file .env.local \
  poolclean-pro:latest
```

### 查看日志
```bash
docker logs -f poolclean-pro
```

### 停止/重启
```bash
docker stop poolclean-pro
docker start poolclean-pro
docker restart poolclean-pro
```

## 四、使用部署脚本

```bash
# 交互式部署
./scripts/deploy.sh

# 或手动选择
cd packages/web

# Vercel
vercel --prod

# Docker
./docker-build.sh && ./docker-run.sh
```

## 五、验证部署

```bash
# 健康检查
curl https://yourdomain.com/api/health

# 性能测试（使用 Lighthouse）
# Chrome DevTools → Lighthouse → Analyze
```

## 六、常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 代码检查 |
| `pnpm type-check` | TypeScript 检查 |
| `vercel` | 部署到 Vercel (预览) |
| `vercel --prod` | 部署到 Vercel (生产) |

## 七、配置获取指南

### Shopify Storefront API Token
1. Shopify Admin → Settings → Apps → Develop apps
2. Create app → Configure Storefront API
3. 权限: unauthenticated_read_product_listings
4. Install app → 复制 Storefront API access token

### Segment Write Key
1. 登录 segment.com
2. Connections → Sources → Add Source
3. 选择 Website → 复制 Write Key

### GA4 Measurement ID
1. 登录 Google Analytics
2. Admin → Create Account → Create Property
3. Data Streams → Web → 复制 Measurement ID

### Meta Pixel ID
1. 登录 Facebook Events Manager
2. Connect Data Sources → Web
3. Pixel 详情 → 复制 Pixel ID

### Sentry DSN
1. 登录 sentry.io
2. Create Project → Next.js
3. 复制 DSN

## 八、故障排查

| 问题 | 解决方案 |
|------|----------|
| 环境变量未生效 | 重新部署，Vercel 需要在网页端配置 |
| Shopify API 错误 | 检查 Storefront Token 权限 |
| 构建失败 | 检查 Node 版本 (需要 20+) |
| 图片不显示 | 配置 Shopify CDN 域名白名单 |

## 九、监控链接

- Vercel Dashboard: https://vercel.com/dashboard
- Sentry: https://sentry.io
- Segment: https://app.segment.com
- GA4: https://analytics.google.com
- Shopify Admin: https://your-store.myshopify.com/admin

## 十、联系方式

如需帮助，请查阅：
- 部署指南: `DEPLOYMENT.md`
- 验证清单: `DEPLOYMENT_STEP_BY_STEP.md`
- I18N 指南: `I18N_GUIDE.md`
