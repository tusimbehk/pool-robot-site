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
        const totalUsers = (funnel.data || []).find((f: FunnelData) => f.stage === '访问')?.count || 0;
        const totalOrders = (funnel.data || []).find((f: FunnelData) => f.stage === '完成购买')?.count || 0;

        setKpiData({
          totalUsers,
          totalOrders,
          totalRevenue: (product.data || []).reduce((sum: number, p: ProductData) =>
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
