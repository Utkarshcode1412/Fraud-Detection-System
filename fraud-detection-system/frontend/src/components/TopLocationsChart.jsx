import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function TopLocationsChart({ data }) {
  const formatted = (data || []).map((d) => ({ country: d.country, fraud: Number(d.fraud_count) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={formatted} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#242C38" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#8A93A3' }} axisLine={false} tickLine={false} />
        <YAxis dataKey="country" type="category" tick={{ fontSize: 12, fill: '#E6E9EF' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={{ background: '#141A23', border: '1px solid #242C38', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="fraud" fill="#FB7185" radius={[0, 4, 4, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
