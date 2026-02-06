# Admin Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a admin dashboard at `/admin` with user activity, order funnel, and product sales charts using Recharts.

**Architecture:** Next.js App Router with Server/Client Components. Admin API routes aggregate data from PostgreSQL. Recharts handles client-side visualization. Simple localStorage-based authentication.

**Tech Stack:** Next.js 15, Recharts 2.x, Tailwind CSS, Drizzle ORM, PostgreSQL

---

## Task 1: Install Recharts Dependency

**Files:**
- Modify: `packages/web/package.json`

**Step 1: Install recharts**

Run: `pnpm add recharts`
Expected: Package added to dependencies

**Step 2: Install types (if needed)**

Run: `pnpm add -D @types/recharts` or check if types are included
Expected: Types available

**Step 3: Commit**

```bash
git add packages/web/package.json packages/web/package-lock.json
git commit -m "deps: add recharts for data visualization"
```

---

## Task 2: Create Admin Authentication Utility

**Files:**
- Create: `packages/web/src/lib/admin/auth.ts`

**Step 1: Create auth utility file**

```typescript
// packages/web/src/lib/admin/auth.ts

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Default for development

/**
 * Generate a simple admin token (in production, use JWT)
 */
export function generateAdminToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${timestamp}:${random}`).toString('base64');
}

/**
 * Verify admin password and return token
 */
export function verifyAdminPassword(password: string): { success: boolean; token?: string } {
  if (password === ADMIN_PASSWORD) {
    return { success: true, token: generateAdminToken() };
  }
  return { success: false };
}

/**
 * Validate admin token format (basic validation)
 */
export function isValidAdminToken(token: string): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestamp] = decoded.split(':');
    const tokenTime = parseInt(timestamp, 10);

    // Check if token is not too old (24 hours)
    const oneDay = 24 * 60 * 60 * 1000;
    return Date.now() - tokenTime < oneDay;
  } catch {
    return false;
  }
}

/**
 * Get stored admin token from request headers
 */
export function getAdminTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Set admin token in localStorage (client-side)
 */
export function setAdminToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

/**
 * Get admin token from localStorage (client-side)
 */
export function getAdminToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }
  return null;
}

/**
 * Clear admin token from localStorage (client-side)
 */
export function clearAdminToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}
```

**Step 2: Commit**

```bash
git add packages/web/src/lib/admin/auth.ts
git commit -m "feat: add admin authentication utility"
```

---

## Task 3: Create Admin Login API

**Files:**
- Create: `packages/web/src/app/api/admin/auth/login/route.ts`

**Step 1: Create login API route**

```typescript
// packages/web/src/app/api/admin/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/admin/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const result = verifyAdminPassword(password);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
    });
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
```

**Step 2: Test the login endpoint**

Run: `curl -X POST http://localhost:3001/api/admin/auth/login -H "Content-Type: application/json" -d '{"password":"admin123"}'`
Expected: `{"success":true,"token":"..."}`

**Step 3: Test with wrong password**

Run: `curl -X POST http://localhost:3001/api/admin/auth/login -H "Content-Type: application/json" -d '{"password":"wrong"}'`
Expected: `{"error":"Invalid password"}` with status 401

**Step 4: Commit**

```bash
git add packages/web/src/app/api/admin/auth/login/route.ts
git commit -m "feat: add admin login API endpoint"
```

---

## Task 4: Create User Activity Analytics API

**Files:**
- Create: `packages/web/src/app/api/admin/analytics/user-activity/route.ts`

**Step 1: Create user activity API**

```typescript
// packages/web/src/app/api/admin/analytics/user-activity/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userEvents } from '@/db/schema';
import { getAdminTokenFromHeaders, isValidAdminToken } from '@/lib/admin/auth';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

interface ActivityDataPoint {
  date: string; // YYYY-MM-DD
  activeUsers: number;
}

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const token = getAdminTokenFromHeaders(request.headers);
  if (!token || !isValidAdminToken(token)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30'), 1), 365);

    // Query user activity by date
    const result = await db.execute<{
      date: string;
      active_users: bigint;
    }>(sql`
      SELECT
        DATE(occurred_at) as date,
        COUNT(DISTINCT user_id) as active_users
      FROM user_events
      WHERE occurred_at >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY DATE(occurred_at)
      ORDER BY date ASC
    `);

    const data: ActivityDataPoint[] = result.rows.map(row => ({
      date: row.date,
      activeUsers: Number(row.active_users),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Analytics] User activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
```

**Step 2: Test the endpoint**

Run: `curl -H "Authorization: Bearer <valid_token>" http://localhost:3001/api/admin/analytics/user-activity?days=7`
Expected: `{"data":[{"date":"2026-02-01","activeUsers":0},...]}`

**Step 3: Commit**

```bash
git add packages/web/src/app/api/admin/analytics/user-activity/route.ts
git commit -m "feat: add user activity analytics API"
```

---

## Task 5: Create Order Funnel Analytics API

**Files:**
- Create: `packages/web/src/app/api/admin/analytics/order-funnel/route.ts`

**Step 1: Create order funnel API**

```typescript
// packages/web/src/app/api/admin/analytics/order-funnel/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userSessions, orders } from '@/db/schema';
import { getAdminTokenFromHeaders, isValidAdminToken } from '@/lib/admin/auth';
import { sql, count } from 'drizzle-orm';

export const runtime = 'nodejs';

interface FunnelStage {
  stage: string;
  count: number;
}

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const token = getAdminTokenFromHeaders(request.headers);
  if (!token || !isValidAdminToken(token)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get total sessions (visits)
    const [totalSessions] = await db
      .select({ count: count() })
      .from(userSessions);

    // Sessions with add to cart
    const [addToCart] = await db
      .select({ count: count() })
      .from(userSessions)
      .where(sql`added_to_cart = true`);

    // Sessions with checkout started
    const [checkoutStarted] = await db
      .select({ count: count() })
      .from(userSessions)
      .where(sql`started_checkout = true`);

    // Sessions with purchase completed
    const [purchaseCompleted] = await db
      .select({ count: count() })
      .from(userSessions)
      .where(sql`completed_purchase = true`);

    const data: FunnelStage[] = [
      { stage: '访问', count: totalSessions.count },
      { stage: '加入购物车', count: addToCart.count },
      { stage: '开始结账', count: checkoutStarted.count },
      { stage: '完成购买', count: purchaseCompleted.count },
    ];

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Analytics] Order funnel error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order funnel' },
      { status: 500 }
    );
  }
}
```

**Step 2: Test the endpoint**

Run: `curl -H "Authorization: Bearer <valid_token>" http://localhost:3001/api/admin/analytics/order-funnel`
Expected: `{"data":[{"stage":"访问","count":N},{"stage":"加入购物车","count":N},...]}`

**Step 3: Commit**

```bash
git add packages/web/src/app/api/admin/analytics/order-funnel/route.ts
git commit -m "feat: add order funnel analytics API"
```

---

## Task 6: Create Product Sales Analytics API

**Files:**
- Create: `packages/web/src/app/api/admin/analytics/product-sales/route.ts`

**Step 1: Create product sales API**

```typescript
// packages/web/src/app/api/admin/analytics/product-sales/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderItems } from '@/db/schema';
import { getAdminTokenFromHeaders, isValidAdminToken } from '@/lib/admin/auth';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

interface ProductSalesData {
  product: string;
  quantity: number;
  revenue: string;
}

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const token = getAdminTokenFromHeaders(request.headers);
  if (!token || !isValidAdminToken(token)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10'), 1), 100);

    // Query product sales aggregated by product title
    const result = await db.execute<{
      product_title: string;
      quantity: bigint;
      revenue: string;
    }>(sql`
      SELECT
        product_title,
        SUM(quantity) as quantity,
        SUM(quantity * price) as revenue
      FROM order_items
      GROUP BY product_title
      ORDER BY quantity DESC
      LIMIT ${limit}
    `);

    const data: ProductSalesData[] = result.rows.map(row => ({
      product: row.product_title,
      quantity: Number(row.quantity),
      revenue: row.revenue,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Analytics] Product sales error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product sales' },
      { status: 500 }
    );
  }
}
```

**Step 2: Test the endpoint**

Run: `curl -H "Authorization: Bearer <valid_token>" http://localhost:3001/api/admin/analytics/product-sales?limit=5`
Expected: `{"data":[{"product":"...","quantity":N,"revenue":"..."},...]}`

**Step 3: Commit**

```bash
git add packages/web/src/app/api/admin/analytics/product-sales/route.ts
git commit -m "feat: add product sales analytics API"
```

---

## Task 7: Create KPI Card Component

**Files:**
- Create: `packages/web/src/components/admin/kpi-card.tsx`

**Step 1: Create KPI card component**

```typescript
// packages/web/src/components/admin/kpi-card.tsx

import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({ title, value, icon, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add packages/web/src/components/admin/kpi-card.tsx
git commit -m "feat: add KPI card component"
```

---

## Task 8: Create User Activity Chart Component

**Files:**
- Create: `packages/web/src/components/admin/charts/user-activity-chart.tsx`

**Step 1: Create user activity chart**

```typescript
// packages/web/src/components/admin/charts/user-activity-chart.tsx

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ActivityDataPoint {
  date: string;
  activeUsers: number;
}

interface UserActivityChartProps {
  data: ActivityDataPoint[];
}

export function UserActivityChart({ data }: UserActivityChartProps) {
  // Format date for display (MM-DD)
  const formattedData = data.map(point => ({
    ...point,
    displayDate: new Date(point.date).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    }),
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        用户活跃度趋势
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: '#6B7280' }}
          />
          <YAxis
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="activeUsers"
            stroke="#3B82F6"
            strokeWidth={2}
            name="活跃用户"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add packages/web/src/components/admin/charts/user-activity-chart.tsx
git commit -m "feat: add user activity chart component"
```

---

## Task 9: Create Order Funnel Chart Component

**Files:**
- Create: `packages/web/src/components/admin/charts/order-funnel-chart.tsx`

**Step 1: Create order funnel chart**

```typescript
// packages/web/src/components/admin/charts/order-funnel-chart.tsx

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FunnelDataPoint {
  stage: string;
  count: number;
}

interface OrderFunnelChartProps {
  data: FunnelDataPoint[];
}

// Colors for each stage (gradient from blue to green)
const STAGE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export function OrderFunnelChart({ data }: OrderFunnelChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        订单转化漏斗
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fill: '#6B7280' }} />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ fill: '#6B7280' }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number) => [value.toLocaleString(), '数量']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion rates */}
      <div className="mt-4 space-y-2">
        {data.slice(1).map((stage, index) => {
          const previousCount = data[index].count;
          const rate = previousCount > 0 ? (stage.count / previousCount * 100).toFixed(1) : '0.0';
          return (
            <div key={stage.stage} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {data[index].stage} → {stage.stage}
              </span>
              <span className="font-medium text-gray-900">{rate}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add packages/web/src/components/admin/charts/order-funnel-chart.tsx
git commit -m "feat: add order funnel chart component"
```

---

## Task 10: Create Product Sales Chart Component

**Files:**
- Create: `packages/web/src/components/admin/charts/product-sales-chart.tsx`

**Step 1: Create product sales chart**

```typescript
// packages/web/src/components/admin/charts/product-sales-chart.tsx

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProductSalesDataPoint {
  product: string;
  quantity: number;
  revenue: string;
}

interface ProductSalesChartProps {
  data: ProductSalesDataPoint[];
}

export function ProductSalesChart({ data }: ProductSalesChartProps) {
  // Limit product name length for display
  const formattedData = data.map(item => ({
    ...item,
    displayName: item.product.length > 20
      ? item.product.substring(0, 20) + '...'
      : item.product,
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        产品销售排行
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formattedData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fill: '#6B7280' }} />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={{ fill: '#6B7280' }}
            width={150}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'quantity') return [value.toLocaleString(), '销量'];
              return [value, '收入'];
            }}
          />
          <Bar dataKey="quantity" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add packages/web/src/components/admin/charts/product-sales-chart.tsx
git commit -m "feat: add product sales chart component"
```

---

## Task 11: Create Admin Login Page

**Files:**
- Create: `packages/web/src/app/admin/login/page.tsx`

**Step 1: Create login page**

```typescript
// packages/web/src/app/admin/login/page.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        router.push('/admin/dashboard');
      } else {
        setError('密码错误');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">PoolClean 管理后台</h1>
            <p className="text-gray-600 mt-2">请输入管理员密码登录</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add packages/web/src/app/admin/login/page.tsx
git commit -m "feat: add admin login page"
```

---

## Task 12: Create Admin Dashboard Page

**Files:**
- Create: `packages/web/src/app/admin/dashboard/page.tsx`

**Step 1: Create dashboard page (client component for data fetching)**

```typescript
// packages/web/src/app/admin/dashboard/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserActivityChart } from '@/components/admin/charts/user-activity-chart';
import { OrderFunnelChart } from '@/components/admin/charts/order-funnel-chart';
import { ProductSalesChart } from '@/components/admin/charts/product-sales-chart';
import { KPICard } from '@/components/admin/kpi-card';
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

interface ActivityData {
  date: string;
  activeUsers: number;
}

interface FunnelData {
  stage: string;
  count: number;
}

interface ProductData {
  product: string;
  quantity: number;
  revenue: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [kpiData, setKpiData] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: '0',
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    async function fetchData() {
      try {
        // Fetch all analytics data
        const [activityRes, funnelRes, productRes] = await Promise.all([
          fetch('/api/admin/analytics/user-activity?days=30', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('/api/admin/analytics/order-funnel', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('/api/admin/analytics/product-sales?limit=10', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (activityRes.status === 401 || funnelRes.status === 401 || productRes.status === 401) {
          router.push('/admin/login');
          return;
        }

        const [activity, funnel, product] = await Promise.all([
          activityRes.json(),
          funnelRes.json(),
          productRes.json(),
        ]);

        setActivityData(activity.data || []);
        setFunnelData(funnel.data || []);
        setProductData(product.data || []);

        // Calculate KPI from funnel data
        const totalUsers = funnelData.find(f => f.stage === '访问')?.count || 0;
        const totalOrders = funnelData.find(f => f.stage === '完成购买')?.count || 0;

        setKpiData({
          totalUsers,
          totalOrders,
          totalRevenue: product.data?.reduce((sum: number, p: ProductData) =>
            sum + parseFloat(p.revenue), 0
          ).toFixed(2) || '0',
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PoolClean 管理后台</h1>
              <p className="text-sm text-gray-600 mt-1">数据分析仪表板</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPICard
            title="总用户数"
            value={kpiData.totalUsers.toLocaleString()}
            icon={<Users className="w-6 h-6" />}
          />
          <KPICard
            title="总订单数"
            value={kpiData.totalOrders.toLocaleString()}
            icon={<ShoppingCart className="w-6 h-6" />}
          />
          <KPICard
            title="总收入"
            value={`$${kpiData.totalRevenue}`}
            icon={<DollarSign className="w-6 h-6" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <UserActivityChart data={activityData} />
          </div>
          <div>
            <OrderFunnelChart data={funnelData} />
          </div>
          <div>
            <ProductSalesChart data={productData} />
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add packages/web/src/app/admin/dashboard/page.tsx
git commit -m "feat: add admin dashboard page with charts"
```

---

## Task 13: Create Admin Root Page (Redirect)

**Files:**
- Create: `packages/web/src/app/admin/page.tsx`

**Step 1: Create admin root page**

```typescript
// packages/web/src/app/admin/page.tsx

import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Check if user has valid token, redirect to dashboard or login
  redirect('/admin/dashboard');
}
```

**Step 2: Commit**

```bash
git add packages/web/src/app/admin/page.tsx
git commit -m "feat: add admin root page with redirect"
```

---

## Task 14: Add Environment Variable Documentation

**Files:**
- Create: `packages/web/.env.admin.example`

**Step 1: Create admin environment example**

```bash
# Admin Dashboard
ADMIN_PASSWORD=your_secure_password_here
```

**Step 2: Commit**

```bash
git add packages/web/.env.admin.example
git commit -m "docs: add admin environment variable documentation"
```

---

## Task 15: Create Verification Test Script

**Files:**
- Create: `packages/web/src/scripts/verify-phase3.ts`

**Step 1: Create verification script**

```typescript
// packages/web/src/scripts/verify-phase3.ts

/**
 * Phase 3 验证脚本 - 测试管理员后台功能
 */

async function testAdminLogin() {
  console.log('Testing admin login...');
  const response = await fetch('http://localhost:3001/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' }),
  });

  const data = await response.json();
  if (!data.success || !data.token) {
    throw new Error('Login failed');
  }

  return data.token;
}

async function testUserActivityAPI(token: string) {
  console.log('Testing user activity API...');
  const response = await fetch(
    'http://localhost:3001/api/admin/analytics/user-activity?days=7',
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('User activity API failed');
  }

  const data = await response.json();
  console.log('  User activity data points:', data.data?.length || 0);
}

async function testOrderFunnelAPI(token: string) {
  console.log('Testing order funnel API...');
  const response = await fetch(
    'http://localhost:3001/api/admin/analytics/order-funnel',
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('Order funnel API failed');
  }

  const data = await response.json();
  console.log('  Funnel stages:', data.data?.length || 0);
}

async function testProductSalesAPI(token: string) {
  console.log('Testing product sales API...');
  const response = await fetch(
    'http://localhost:3001/api/admin/analytics/product-sales?limit=5',
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('Product sales API failed');
  }

  const data = await response.json();
  console.log('  Products:', data.data?.length || 0);
}

async function testUnauthorizedAccess() {
  console.log('Testing unauthorized access...');

  const response = await fetch(
    'http://localhost:3001/api/admin/analytics/user-activity'
  );

  if (response.status !== 401) {
    throw new Error('Expected 401 for unauthorized access');
  }

  console.log('  ✓ Unauthorized access correctly blocked');
}

async function main() {
  console.log('🧪 Phase 3 验证测试\n');

  try {
    // Test login
    const token = await testAdminLogin();
    console.log('  ✓ Login successful\n');

    // Test APIs
    await testUserActivityAPI(token);
    await testOrderFunnelAPI(token);
    await testProductSalesAPI(token);

    // Test auth
    await testUnauthorizedAccess();

    console.log('\n✅ 所有测试通过！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

main();
```

**Step 2: Run verification**

Run: `npx tsx src/scripts/verify-phase3.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add packages/web/src/scripts/verify-phase3.ts
git commit -m "test: add Phase 3 verification script"
```

---

## Task 16: Manual Testing - Full Dashboard Flow

**Files:**
- Manual verification in browser

**Step 1: Start development server**

Run: `pnpm --filter web dev`
Expected: Server starts on http://localhost:3001

**Step 2: Test login flow**

1. Navigate to http://localhost:3001/admin
2. Should redirect to /admin/login
3. Enter password: admin123
4. Should redirect to /admin/dashboard

**Step 3: Verify dashboard loads**

Check that:
- KPI cards display (may show 0 if no data)
- User activity chart renders
- Order funnel chart renders
- Product sales chart renders

**Step 4: Test logout**

Click "退出登录" button
Should redirect to login page

**Step 5: Test protected routes**

Try accessing /admin/dashboard without token
Should redirect to /admin/login

**Step 6: Commit final changes**

```bash
git add -A
git commit -m "test: manual verification complete - Phase 3 ready"
```

---

## Summary

**Total Tasks:** 16
**Estimated Time:** 2-3 hours
**Key Deliverables:**
- Admin authentication system
- 3 analytics APIs (user activity, order funnel, product sales)
- 3 chart components using Recharts
- Login page and dashboard page
- KPI cards for quick metrics

**Verification:**
- Automated test script for APIs
- Manual browser testing for full flow
