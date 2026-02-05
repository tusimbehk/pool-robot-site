# PoolClean Pro - 独立站项目

泳池清洁机器人独立站，面向欧洲和北美市场。

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI 组件**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **类型系统**: TypeScript
- **测试**: Vitest + Playwright
- **包管理**: pnpm (Monorepo)

## 项目结构

```
pool-robot-site/
├── packages/
│   ├── web/          # Next.js 前端应用
│   ├── api/          # 后端 API 服务（可选）
│   ├── shared/       # 共享代码
│   └── ui/           # 共享 UI 组件
├── docs/             # 项目文档
└── package.json      # 根配置
```

## 快速开始

### 安装依赖

```bash
cd pool-robot-site
pnpm install
```

### 配置环境变量

复制 `.env.example` 到 `.env.local`：

```bash
cp packages/web/.env.example packages/web/.env.local
```

填写 Shopify 和 Segment 配置：

```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
NEXT_PUBLIC_SEGMENT_WRITE_KEY=your-segment-key
```

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:3000

### 运行测试

```bash
# 单元测试
pnpm test

# UI 模式
pnpm test:ui

# E2E 测试
pnpm test:e2e
```

### 构建生产版本

```bash
pnpm build
```

## 代码规范

- 使用 Prettier 格式化代码
- 使用 ESLint 检查代码质量
- 遵循 TDD 原则（核心模块）

## 文档

详细设计文档请查看：[docs/plans/2026-02-05-pool-robot-website-design.md](docs/plans/2026-02-05-pool-robot-website-design.md)

## 开发流程

1. 创建功能分支
2. 编写测试（TDD）
3. 实现功能
4. 提交代码
5. 创建 Pull Request
