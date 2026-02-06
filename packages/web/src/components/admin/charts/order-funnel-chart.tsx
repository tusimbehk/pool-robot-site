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
            formatter={(value: number) => [value.toLocaleString(), '数量'] as const}
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
