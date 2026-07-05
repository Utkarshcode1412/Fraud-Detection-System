import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = { low: '#60A5FA', medium: '#F5A623', high: '#FB7185', critical: '#EF4444' };

export default function RiskDistributionChart({ data }) {
  const formatted = (data || []).map((d) => ({ name: d.risk_level, value: Number(d.count) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={formatted}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
        >
          {formatted.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.name] || '#8A93A3'} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#141A23', border: '1px solid #242C38', borderRadius: 8, fontSize: 12 }} />
        <Legend
          iconType="circle"
          formatter={(value) => <span style={{ color: '#8A93A3', fontSize: 12, textTransform: 'capitalize' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
