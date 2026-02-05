# Deployment Guide - PoolClean Pro

## Overview

This guide covers deploying the PoolClean Pro e-commerce website to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
4. [Post-Deployment](#post-deployment)
5. [Monitoring](#monitoring)

## Prerequisites

Before deploying, ensure you have:

- Node.js 20+ installed
- pnpm package manager
- A Shopify store with Storefront API access
- Analytics accounts (Segment, GA4, Meta)
- Error tracking (Sentry) account
- Domain name configured

## Environment Setup

### 1. Environment Variables

Copy the example environment file:

```bash
cp packages/web/.env.example packages/web/.env.local
```

Fill in the required values:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Your Shopify store domain | Yes |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Storefront API token | Yes |
| `NEXT_PUBLIC_SEGMENT_WRITE_KEY` | Segment write key | Recommended |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 measurement ID | Recommended |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID | Recommended |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN | Recommended |
| `NEXT_PUBLIC_CHATWOOT_TOKEN` | Chatwoot token | Optional |

### 2. Shopify Setup

1. Go to Shopify Admin > Apps > Manage private apps
2. Create a private app with Storefront API access
3. Enable these scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_checkouts`
4. Copy the Storefront API access token

### 3. Shopify Markets (Multi-Currency)

1. Go to Settings > Markets
2. Add markets for each target country:
   - United States (USD)
   - Germany (EUR)
   - France (EUR)
   - Spain (EUR)
   - Italy (EUR)
3. Configure pricing for each market

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the best experience for Next.js applications.

#### Initial Setup

1. Install Vercel CLI:
```bash
pnpm add -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd packages/web
vercel
```

#### Environment Variables in Vercel

Add environment variables in Vercel dashboard:
1. Go to Project > Settings > Environment Variables
2. Add each variable from `.env.local`
3. Select applicable environments (Production, Preview, Development)

#### Custom Domain

1. Go to Project > Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Option 2: Docker

Build and run with Docker:

```bash
# Build the image
docker build -t poolclean-pro packages/web/

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=xxx \
  -e NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxx \
  poolclean-pro
```

#### Docker Compose

```bash
docker-compose up -d
```

### Option 3: Traditional VPS

#### Build

```bash
cd packages/web
pnpm build
```

#### Run with PM2

```bash
# Install PM2
pnpm add -g pm2

# Start the application
pm2 start npm --name "poolclean-pro" -- start

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Post-Deployment

### 1. Verify Health Check

```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {...},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test Critical Flows

- [ ] Homepage loads
- [ ] Product listing displays
- [ ] Product detail pages work
- [ ] Add to cart functions
- [ ] Checkout redirects to Shopify
- [ ] Language switcher works
- [ ] Currency switcher works
- [ ] Cookie banner displays
- [ ] Authentication works

### 3. Verify Analytics

1. Open browser DevTools > Network
2. Check for Segment events
3. Verify GA4 real-time reports
4. Check Meta Pixel helper

### 4. Test Error Tracking

Trigger an error and verify it appears in Sentry:
```javascript
// In browser console
throw new Error("Test error for Sentry");
```

## Monitoring

### Health Check Endpoint

`https://yourdomain.com/api/health`

### Key Metrics to Monitor

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| Response Time | Vercel/Sentry | > 1s (p95) |
| Error Rate | Sentry | > 1% |
| Uptime | UptimeRobot | < 99.9% |
| Page Load | Web Vitals | LCP > 2.5s |

### Setting Up Alerts

#### Sentry Alerts

1. Go to Sentry > Project > Alerts
2. Create alert rules for:
   - Error rate increase
   - New issue detection
   - Performance degradation

#### Vercel Analytics

1. Enable Vercel Analytics
2. Monitor Core Web Vitals
3. Set up alerts for performance regressions

## Rollback Procedure

### Vercel Rollback

1. Go to Deployments
2. Find previous successful deployment
3. Click "Promote to Production"

### Git Rollback

```bash
# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard <commit-hash>

# Redeploy
vercel --prod
```

## Security Checklist

- [ ] Environment variables are not exposed
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled on API routes
- [ ] Dependencies are up to date
- [ ] Content Security Policy is active

## Scaling Considerations

### When to Scale

- Average CPU > 70%
- Memory usage > 80%
- Response times increasing

### Scaling Options

1. **Vercel**: Automatic scaling included
2. **Docker**: Add more container replicas
3. **VPS**: Upgrade server resources or add load balancer

## Support

For deployment issues:
1. Check deployment logs
2. Review `/api/health` endpoint
3. Check Sentry for errors
4. Review Vercel deployment logs

## Next Steps

After successful deployment:
1. Set up monitoring dashboards
2. Configure backup strategy
3. Document access procedures
4. Train team on deployment process
5. Set up staging environment
