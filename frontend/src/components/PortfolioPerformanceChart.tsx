import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { Holding } from '../backend';
import { mockStocks } from '../data/mockStocks';

interface PortfolioPerformanceChartProps {
  holdings: Holding[];
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const value = payload[0]?.value ?? 0;
    return (
      <div className="glass-card rounded-lg p-3 text-xs border border-border/50">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <p className={value >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
}

export default function PortfolioPerformanceChart({ holdings, height = 220 }: PortfolioPerformanceChartProps) {
  const data = holdings.map(h => {
    const stock = mockStocks.find(s => s.symbol === h.symbol);
    const currentPrice = stock?.currentPrice ?? Number(h.avgBuyPrice);
    const gainPct = ((currentPrice - Number(h.avgBuyPrice)) / Number(h.avgBuyPrice)) * 100;
    return {
      symbol: h.symbol,
      gain: parseFloat(gainPct.toFixed(2)),
    };
  });

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.015 240 / 0.3)" vertical={false} />
          <XAxis
            dataKey="symbol"
            tick={{ fontSize: 11, fill: 'oklch(0.55 0.02 240)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="oklch(0.35 0.02 240)" strokeWidth={1} />
          <Bar dataKey="gain" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={800}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.gain >= 0 ? '#2dd4bf' : '#f87171'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
