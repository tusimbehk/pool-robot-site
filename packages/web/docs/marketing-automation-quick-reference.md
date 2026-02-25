# 营销自动化快速参考

## API 快速参考

### 1. 弃购检测 Cron
```bash
GET /api/cron/check-abandoned-carts
Authorization: Bearer CRON_SECRET
```

### 2. RFM 重算 Cron
```bash
GET /api/cron/recalculate-rfm
Authorization: Bearer CRON_SECRET
```

### 3. 手动发送弃购邮件
```bash
POST /api/marketing/send-cart-recovery
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "email": "customer@example.com",
  "cartItems": [
    {"name": "PoolClean Pro X1", "quantity": 1, "price": "299.00"}
  ],
  "cartTotal": "299.00",
  "discountCode": "SAVE10"
}
```

### 4. 获取用户 RFM 资料
```bash
GET /api/users/{userId}/profile
```

## 环境变量

```bash
# 必需
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@poolclean.com
CRON_SECRET=your-random-secret-key

# 可选
ADMIN_PASSWORD=admin123  # 默认: admin123
```

## RFM 分数速查

### Recency (最近购买)
| 天数 | 分数 |
|------|------|
| ≤ 30 | 5 |
| ≤ 60 | 4 |
| ≤ 90 | 3 |
| ≤ 180 | 2 |
| > 180 | 1 |

### Frequency (90天内订单)
| 订单数 | 分数 |
|--------|------|
| ≥ 5 | 5 |
| ≥ 3 | 4 |
| ≥ 2 | 3 |
| ≥ 1 | 2 |
| 0 | 1 |

### Monetary (90天内消费)
| 金额 | 分数 |
|------|------|
| ≥ $1000 | 5 |
| ≥ $500 | 4 |
| ≥ $250 | 3 |
| ≥ $100 | 2 |
| < $100 | 1 |

## 客户分层

| 分层 | 条件 | 策略 |
|------|------|------|
| VIP | R≥4, F≥4, M≥4 | VIP 待遇, 专属优惠 |
| Loyal | R≥3, F≥3, M≥3 | 忠诚奖励, 交叉销售 |
| Potential | R≥2, F≥2, M≥2 | 满额促销, 满减活动 |
| New | R≥3, F≤2 | 新手引导, 首单优惠 |
| At-Risk | 其他 | 挽回邮件, 大额折扣 |

## Cron 时间表

| 任务 | 时间 | 说明 |
|------|------|------|
| 弃购检测 | */15 * * * * | 每 15 分钟 |
| RFM 重算 | 0 2 * * * | 每天凌晨 2 点 |

## 测试命令

```bash
# 生成 Admin Token
node -e "console.log(Buffer.from(\`\${Date.now()}:\${Math.random().toString(36).substring(2)}\`).toString('base64'))"

# 运行验证测试
cd packages/web
DATABASE_URL="postgresql://localhost:5432/db" npx tsx src/scripts/verify-phase4.ts
```
