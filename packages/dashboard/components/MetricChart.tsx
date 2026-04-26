"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MetricChartProps {
  data: any[];
  title: string;
  dataKey: string;
  color?: string;
  className?: string;
}

const MetricChart: React.FC<MetricChartProps> = ({
  data,
  title,
  dataKey,
  color = "#3b82f6",
  className,
}) => {
  return (
    <div className={className}>
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">{title}</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#64748b", fontSize: 10 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#0f172a", 
                border: "1px solid #ffffff10",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#fff"
              }}
              itemStyle={{ color: color }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricChart;
