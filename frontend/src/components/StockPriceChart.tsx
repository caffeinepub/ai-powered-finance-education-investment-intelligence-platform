import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { OHLCData } from '../data/mockStocks';

interface StockPriceChartProps {
  data: OHLCData[];
  symbol: string;
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const close = payload[0]?.value;
    return (
      <div className="glass-card rounded-lg p-3 text-xs border border-border/50">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="text-foreground font-semibold">${close?.toFixed(2)}</p>
      </div>
    );
  }
  return null;
}

export default function StockPriceChart({ data, symbol, height = 200 }: StockPriceChartProps) {
  const chartData = data.map(d => ({
    date: d.date.slice(5),
    close: d.close,
    open: d.open,
  }));

  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;
  const firstPrice = data[0]?.close ?? 0;
  const lastPrice = data[data.length - 1]?.close ?? 0;
  const isPositive = lastPrice >= firstPrice;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? '#2dd4bf' : '#f87171'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? '#2dd4bf' : '#f87171'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.015 240 / 0.3)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={firstPrice} stroke="oklch(0.55 0.02 240)" strokeDasharray="4 4" strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="close"
            stroke={isPositive ? '#2dd4bf' : '#f87171'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: isPositive ? '#2dd4bf' : '#f87171' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
