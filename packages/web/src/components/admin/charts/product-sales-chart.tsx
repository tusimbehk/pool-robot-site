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
              if (name === 'quantity') return [value.toLocaleString(), '销量'] as const;
              return [value, '收入'] as const;
            }}
          />
          <Bar dataKey="quantity" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
