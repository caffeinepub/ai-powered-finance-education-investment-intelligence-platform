import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { Holding } from '../backend';
import { mockStocks } from '../data/mockStocks';

interface PortfolioAllocationChartProps {
  holdings: Holding[];
  height?: number;
}

const COLORS = ['#2dd4bf', '#f59e0b', '#818cf8', '#34d399', '#f87171', '#60a5fa', '#a78bfa', '#fb923c'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="glass-card rounded-lg p-3 text-xs border border-border/50">
        <p className="font-semibold text-foreground">{item.name}</p>
        <p className="text-muted-foreground">${item.value.toFixed(2)}</p>
        <p className="text-primary">{(item.payload.percent * 100).toFixed(1)}%</p>
      </div>
    );
  }
  return null;
}

export default function PortfolioAllocationChart({ holdings, height = 280 }: PortfolioAllocationChartProps) {
  const data = holdings.map(h => {
    const stock = mockStocks.find(s => s.symbol === h.symbol);
    const currentPrice = stock?.currentPrice ?? Number(h.avgBuyPrice);
    const value = currentPrice * Number(h.shares);
    return {
      name: h.symbol,
      value: parseFloat(value.toFixed(2)),
    };
  }).filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No holdings to display
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={3}
            dataKey="value"
            isAnimationActive={true}
            animationDuration={800}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: 'oklch(0.55 0.02 240)' }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
