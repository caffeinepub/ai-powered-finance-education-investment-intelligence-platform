import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
} from 'recharts';
import type { Holding } from '../backend';
import { mockStocks } from '../data/mockStocks';

interface PortfolioRiskHeatmapProps {
  holdings: Holding[];
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { symbol: string; weight: number; volatility: number; value: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload;
    return (
      <div className="glass-card rounded-lg p-3 text-xs border border-border/50">
        <p className="font-semibold text-foreground mb-1">{d?.symbol}</p>
        <p className="text-muted-foreground">Weight: <span className="text-foreground">{d?.weight.toFixed(1)}%</span></p>
        <p className="text-muted-foreground">Volatility: <span className="text-foreground">{d?.volatility.toFixed(1)}%</span></p>
        <p className="text-muted-foreground">Value: <span className="text-foreground">${d?.value.toFixed(0)}</span></p>
      </div>
    );
  }
  return null;
}

export default function PortfolioRiskHeatmap({ holdings, height = 220 }: PortfolioRiskHeatmapProps) {
  const totalValue = holdings.reduce((sum, h) => {
    const stock = mockStocks.find(s => s.symbol === h.symbol);
    const price = stock?.currentPrice ?? Number(h.avgBuyPrice);
    return sum + price * Number(h.shares);
  }, 0);

  const data = holdings.map(h => {
    const stock = mockStocks.find(s => s.symbol === h.symbol);
    const price = stock?.currentPrice ?? Number(h.avgBuyPrice);
    const value = price * Number(h.shares);
    const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
    // Simulate volatility based on sector
    const sectorVolatility: Record<string, number> = {
      'Technology': 28,
      'Consumer Discretionary': 32,
      'Financials': 22,
      'Healthcare': 18,
      'Energy': 35,
      'Communication Services': 25,
    };
    const volatility = (sectorVolatility[stock?.sector ?? ''] ?? 25) + (Math.random() - 0.5) * 5;

    return {
      symbol: h.symbol,
      weight: parseFloat(weight.toFixed(1)),
      volatility: parseFloat(volatility.toFixed(1)),
      value: parseFloat(value.toFixed(2)),
      z: value,
    };
  });

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.015 240 / 0.3)" />
          <XAxis
            dataKey="weight"
            name="Portfolio Weight"
            tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            label={{ value: 'Weight %', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
          />
          <YAxis
            dataKey="volatility"
            name="Volatility"
            tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
            label={{ value: 'Volatility %', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
          />
          <ZAxis dataKey="z" range={[60, 400]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            data={data}
            fill="#2dd4bf"
            fillOpacity={0.7}
            isAnimationActive={true}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
