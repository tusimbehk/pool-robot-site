# Phase 3: 数据分析仪表板 - 设计文档

**日期**: 2026-02-06
**状态**: 设计完成

## 目标

为 PoolClean 网站创建管理员后台数据分析仪表板，提供用户活跃度、订单转化和产品销售的实时可视化。

## 技术选型

| 组件 | 技术选择 | 理由 |
|------|----------|------|
| 图表库 | Recharts | 免费功能足够，React 生态成熟 |
| 框架 | Next.js 15 (RSC) | 已有基础设施 |
| 样式 | Tailwind CSS | 已有基础设施 |
| 图标 | Lucide React | 已有基础设施 |
| 状态管理 | Zustand | 已有基础设施 |

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (Admin)                    │
├─────────────────────────────────────────────────────────┤
│  /admin/login                                           │
│  ├── Simple password form                               │
│  └── Sets admin token in localStorage                   │
├─────────────────────────────────────────────────────────┤
│  /admin/dashboard                                       │
│  ├── Layout: Sidebar navigation                         │
│  └── Page: 3 Charts (Recharts)                          │
│      - User Activity (LineChart)                        │
│      - Order Funnel (BarChart)                          │
│      - Product Sales (BarChart horizontal)              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   API Routes (/api/admin/*)             │
├─────────────────────────────────────────────────────────┤
│  GET /api/admin/analytics/user-activity                 │
│  GET /api/admin/analytics/order-funnel                  │
│  GET /api/admin/analytics/product-sales                 │
│  POST /api/admin/auth/login                             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                │
├─────────────────────────────────────────────────────────┤
│  users, user_events, user_sessions, orders, order_items │
└─────────────────────────────────────────────────────────┘
```

## 文件结构

```
src/app/
├── admin/
│   ├── page.tsx                # 登录页 (重定向到 dashboard 或 login)
│   ├── layout.tsx              # Admin layout (认证检查)
│   └── dashboard/
│       ├── layout.tsx          # 仪表板布局（侧边栏）
│       └── page.tsx            # 主仪表板（图表）
│   └── login/
│       └── page.tsx            # 登录表单
├── api/
│   └── admin/
│       ├── auth/
│       │   └── login/
│       │       └── route.ts    # 管理员登录
│       └── analytics/
│           ├── user-activity/
│           │   └── route.ts    # 用户活跃度数据
│           ├── order-funnel/
│           │   └── route.ts    # 订单转化漏斗
│           └── product-sales/
│               └── route.ts    # 产品销售统计
├── components/
│   └── admin/
│       ├── charts/
│       │   ├── UserActivityChart.tsx    # 用户活跃度图表
│       │   ├── OrderFunnelChart.tsx     # 订单漏斗图表
│       │   └── ProductSalesChart.tsx    # 产品销售图表
│       ├── dashboard-layout.tsx         # 仪表板布局组件
│       ├── kpi-card.tsx                 # KPI 卡片组件
│       └── sidebar.tsx                  # 侧边栏导航
└── lib/
    └── admin/
        └── auth.ts                      # 管理员认证工具
```

## API 端点规范

### 1. 用户活跃度数据
```
GET /api/admin/analytics/user-activity?days=30

Response:
{
  "data": [
    { "date": "2026-01-08", "activeUsers": 45 },
    { "date": "2026-01-09", "activeUsers": 52 },
    ...
  ]
}
```

SQL 查询思路:
```sql
SELECT
  DATE(occurred_at) as date,
  COUNT(DISTINCT user_id) as active_users
FROM user_events
WHERE occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(occurred_at)
ORDER BY date;
```

### 2. 订单转化漏斗
```
GET /api/admin/analytics/order-funnel

Response:
{
  "data": [
    { "stage": "访问", "count": 1500 },
    { "stage": "加入购物车", "count": 320 },
    { "stage": "开始结账", "count": 180 },
    { "stage": "完成购买", "count": 120 }
  ]
}
```

SQL 查询思路:
```sql
SELECT
  '访问' as stage, COUNT(*) FROM user_sessions WHERE ...
UNION ALL
SELECT '加入购物车', COUNT(*) FROM user_sessions WHERE added_to_cart = true
UNION ALL
SELECT '开始结账', COUNT(*) FROM user_sessions WHERE started_checkout = true
UNION ALL
SELECT '完成购买', COUNT(*) FROM user_sessions WHERE completed_purchase = true
```

### 3. 产品销售排行
```
GET /api/admin/analytics/product-sales?limit=10

Response:
{
  "data": [
    { "product": "PoolClean Pro X1", "quantity": 45, "revenue": "13455.00" },
    { "product": "PoolClean Plus X2", "quantity": 32, "revenue": "9568.00" },
    ...
  ]
}
```

SQL 查询思路:
```sql
SELECT
  product_title,
  SUM(quantity) as quantity,
  SUM(quantity * price) as revenue
FROM order_items
GROUP BY product_title
ORDER BY quantity DESC
LIMIT 10;
```

### 4. 管理员登录
```
POST /api/admin/auth/login
{ "password": "..." }

Response:
{
  "success": true,
  "token": "admin_token_hash"
}
```

## 组件设计

### Dashboard Layout
```
┌────────────────────────────────────────────┐
│  ┌──────┐                                  │
│  │ Logo │  PoolClean Admin Dashboard      │
│  └──────┘                                  │
├──────┬─────────────────────────────────────┤
│      │  ┌──────────┐ ┌──────────┐ ┌─────┐│
│  📊  │  │   KPI    │ │   KPI    │ │ KPI ││
│  概览 │  │  卡片1   │ │  卡片2   │ │  3  ││
│      │  └──────────┘ └──────────┘ └─────┘│
│      ├─────────────────────────────────────┤
│  📈  │  ┌─────────────────────────────┐   │
│  分析 │  │   用户活跃度趋势 (折线图)     │   │
│      │  └─────────────────────────────┘   │
│      ├─────────────────────────────────────┤
│  🛒  │  ┌─────────────────────────────┐   │
│  订单 │  │   订单转化漏斗 (柱状图)      │   │
│      │  └─────────────────────────────┘   │
│      ├─────────────────────────────────────┤
│  📦  │  ┌─────────────────────────────┐   │
│  产品 │  │   产品销售排行 (条形图)      │   │
│      │  └─────────────────────────────┘   │
└──────┴─────────────────────────────────────┘
```

## 认证方案

**简化版 MVP**:
- 环境变量配置管理员密码: `ADMIN_PASSWORD`
- 登录后生成简单 token，存储在 localStorage
- 每个请求验证 token（middleware 或 API 检查）

**未来改进**:
- 实现基于角色的访问控制 (RBAC)
- 支持多个管理员账户
- JWT token with refresh

## 安装依赖

```bash
npm install recharts
npm install -D @types/recharts
```

## KPI 指标

在仪表板顶部显示 3 个关键指标卡片：

1. **总用户数** - COUNT(*) FROM users
2. **总订单数** - COUNT(*) FROM orders
3. **总收入** - SUM(total_price) FROM orders

## 数据刷新

- 页面加载时获取数据
- 可选: 添加"刷新"按钮手动刷新
- 未来: WebSocket 实时更新

## 响应式设计

- 移动端: 图表垂直堆叠
- 桌面端: 2x2 网格布局

## 实施任务清单

1. 安装 Recharts 依赖
2. 创建 admin 路由结构
3. 实现管理员登录 API
4. 实现认证中间件/工具
5. 创建 3 个分析 API 端点
6. 创建图表组件
7. 创建仪表板布局
8. 创建侧边栏导航
9. 实现 KPI 卡片
10. 集成所有组件到仪表板页面

## 测试计划

1. 单元测试: API 端点返回正确数据
2. 集成测试: 图表能正确渲染数据
3. E2E 测试: 完整登录 → 查看仪表板流程

## 安全考虑

- 所有 /admin/* 路由需要认证
- API 速率限制防止滥用
- SQL 注入防护 (使用 Drizzle ORM)
- CORS 配置（如需要）
