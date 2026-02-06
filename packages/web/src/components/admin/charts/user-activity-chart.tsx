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
