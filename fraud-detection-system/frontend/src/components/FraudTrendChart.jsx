import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function FraudTrendChart({ data }) {
  const formatted = (data || []).map((d) => ({
    day: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fraud: Number(d.fraud_transactions),
    total: Number(d.total_transactions),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fraudGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#242C38" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A93A3' }} axisLine={{ stroke: '#242C38' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#8A93A3' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#141A23', border: '1px solid #242C38', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#E6E9EF' }}
        />
        <Area type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={2} fill="url(#fraudGradient)" name="Fraud transactions" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
