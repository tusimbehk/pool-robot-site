# 部署后验证清单

部署完成后，请按顺序执行以下验证：

## 1. 基础功能验证

| 项目 | 测试方法 | 预期结果 |
|------|----------|----------|
| 首页加载 | 访问 `/` | 页面正常显示，无控制台错误 |
| 产品列表 | 访问 `/products` | 显示产品卡片 |
| 产品详情 | 点击任一产品 | 显示完整产品信息 |
| 购物车 | 点击"加入购物车" | 购物车抽屉打开，商品已添加 |
| 结账 | 点击"结账" | 跳转到 Shopify |
| 用户注册 | 访问 `/account` | 可创建账户 |
| 用户登录 | 使用注册账户 | 可正常登录 |

## 2. 国际化验证

| 项目 | 测试方法 | 预期结果 |
|------|----------|----------|
| 语言切换 | 点击语言选择器 | URL 变更，内容翻译 |
| 货币切换 | 点击货币选择器 | 价格格式变更 |
| 自动检测 | 修改浏览器语言 | 自动切换到对应语言 |

## 3. 合规验证

| 项目 | 测试方法 | 预期结果 |
|------|----------|----------|
| Cookie 横幅 | 首次访问网站 | 显示 Cookie 同意横幅 |
| 隐私政策 | 访问 `/privacy` | 显示完整隐私政策 |
| 服务条款 | 访问 `/terms` | 显示完整服务条款 |

## 4. 健康检查

```bash
# 检查健康端点
curl https://yourdomain.com/api/health
```

预期响应：
```json
{
  "status": "healthy",
  "checks": {
    "memory": {"status": "pass"},
    "network": {"status": "pass"},
    "analytics": {"status": "pass"},
    "shopify": {"status": "pass"}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 5. 性能验证

使用 Lighthouse 进行性能测试：

1. 打开 Chrome DevTools
2. 点击 "Lighthouse" 标签
3. 点击 "Analyze page load"
4. 等待测试完成

| 指标 | 目标值 | 优秀 |
|------|--------|------|
| Performance | > 90 | 绿色 |
| Accessibility | > 90 | 绿色 |
| Best Practices | > 90 | 绿色 |
| SEO | > 90 | 绿色 |

## 6. 分析验证

### Segment 检查

1. 访问网站
2. 打开浏览器 DevTools > Network
3. 过滤 "cdn.segment.com"
4. 触发页面导航或添加购物车
5. 确认有请求发送到 Segment

### GA4 检查

1. 登录 Google Analytics
2. 进入 **Realtime** > **Overview**
3. 访问您的网站
4. 确认用户数增加

### Meta Pixel 检查

1. 安装 Meta Pixel Helper 扩展
2. 访问您的网站
3. 点击扩展图标
4. 确认 Pixel 正在触发

## 7. 移动端验证

| 设备 | 测试项目 |
|------|----------|
| iPhone | 布局正常，触摸目标适中 |
| Android | 布局正常，无横向滚动 |
| iPad | 响应式布局适配 |

## 8. SEO 验证

```bash
# 检查 robots.txt
curl https://yourdomain.com/robots.txt

# 检查 sitemap.xml
curl https://yourdomain.com/sitemap.xml

# 检查 Canonical 标签
curl https://yourdomain.com/products | grep "canonical"
```

## 9. 安全验证

| 检查项 | 命令/方法 |
|--------|-----------|
| HTTPS 访问 | `curl -I https://yourdomain.com` |
| HTTP 重定向 | `curl -I http://yourdomain.com` (应返回 301) |
| 安全头部 | `curl -I https://yourdomain.com | grep -i "x-frame"` |
| CSP 策略 | 检查响应头中的 Content-Security-Policy |

## 10. 错误追踪验证

触发测试错误（在浏览器控制台）：

```javascript
// 触发 Sentry 错误测试
throw new Error("Sentry 测试错误");
```

检查 Sentry Dashboard 确认错误被捕获。

## 故障排查

### 问题：首页空白

1. 检查环境变量是否正确设置
2. 查看浏览器控制台错误
3. 检查 Vercel/Sentry 日志

### 问题：产品不显示

1. 验证 Shopify API 凭据
2. 检查 Shopify Storefront API 权限
3. 查看 Network 标签中的 API 请求

### 问题：结账失败

1. 确认 Shopify 店铺正常运营
2. 检查产品是否有库存
3. 验证结账 URL 配置

### 问题：分析数据不显示

1. 检查 Write Key/API Key 是否正确
2. 确认没有广告拦截器
3. 查看浏览器控制台是否有错误

## 回滚步骤

如果发现问题需要回滚：

### Vercel 回滚

1. 访问 Vercel Dashboard
2. 进入项目 > Deployments
3. 找到之前的稳定版本
4. 点击 "Promote to Production"

### Docker 回滚

```bash
# 停止当前容器
docker stop poolclean-pro

# 重新构建旧版本
docker build -t poolclean-pro:old .

# 运行旧版本
docker run -d --name poolclean-pro -p 3000:3000 poolclean-pro:old
```
