import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { NewsArticle } from '../backend';

interface SentimentImpactChartProps {
  articles: NewsArticle[];
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 text-xs border border-border/50 max-w-[200px]">
        <p className="text-muted-foreground mb-2 font-medium">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="text-foreground font-semibold">{p.value?.toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function SentimentImpactChart({ articles, height = 280 }: SentimentImpactChartProps) {
  const sorted = [...articles]
    .sort((a, b) => Number(a.date - b.date))
    .slice(-20);

  const chartData = sorted.map((article, i) => {
    const date = new Date(Number(article.date) / 1_000_000);
    const sentimentScore = Number(article.score);
    const marketImpact = Number(article.marketImpact);
    const simulatedPrice = 100 + (i * 0.5) + (sentimentScore * 0.3) + (Math.random() - 0.5) * 2;

    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sentiment: sentimentScore,
      impact: marketImpact,
      price: parseFloat(simulatedPrice.toFixed(2)),
    };
  });

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.015 240 / 0.3)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(chartData.length / 5)}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
            tickLine={false}
            axisLine={false}
            width={45}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: 'oklch(0.55 0.02 240)' }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="sentiment"
            name="Sentiment Score"
            stroke="#2dd4bf"
            fill="url(#sentimentGradient)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={1000}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="price"
            name="Market Price"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={1200}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
