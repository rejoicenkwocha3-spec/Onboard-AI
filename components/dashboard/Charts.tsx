"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axis = { fontSize: 12, fill: "#697586" };

export function BarCard({ data, x, y, color = "#2563EB" }: { data: Record<string, string | number>[]; x: string; y: string; color?: string }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Bar chart">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF1" vertical={false} />
          <XAxis dataKey={x} tick={axis} interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} tick={axis} />
          <Tooltip />
          <Bar dataKey={y} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineCard({ data, x, y }: { data: Record<string, string | number>[]; x: string; y: string }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Line chart">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF1" vertical={false} />
          <XAxis dataKey={x} tick={axis} />
          <YAxis allowDecimals={false} tick={axis} />
          <Tooltip />
          <Line type="monotone" dataKey={y} stroke="#14B8A6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
