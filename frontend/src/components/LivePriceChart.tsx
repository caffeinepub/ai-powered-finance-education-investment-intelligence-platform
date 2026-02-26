import React, { useEffect, useRef, useState } from 'react';
import { useLivePrice } from '../hooks/useLivePrice';
import GlassCard from './GlassCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface PriceTick {
  index: number;
  price: number;
  elapsed: number; // seconds since session start
}

interface LivePriceChartProps {
  symbol: string;
  height?: number;
}

const MAX_TICKS = 60;
const INTERVAL_MS = 3000;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { price, elapsed } = payload[0].payload as PriceTick;
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs border border-border/50">
      <div className="text-muted-foreground mb-0.5">{formatElapsed(elapsed)}</div>
      <div className="font-display font-bold text-foreground">${price.toFixed(2)}</div>
    </div>
  );
}

export default function LivePriceChart({ symbol, height = 200 }: LivePriceChartProps) {
  const { price, sessionOpenPrice } = useLivePrice(symbol, INTERVAL_MS);

  const ticksRef = useRef<PriceTick[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const tickIndexRef = useRef<number>(0);
  const [ticks, setTicks] = useState<PriceTick[]>([]);

  // Reset when symbol changes
  useEffect(() => {
    ticksRef.current = [];
    startTimeRef.current = Date.now();
    tickIndexRef.current = 0;
    setTicks([]);
  }, [symbol]);

  // Append new tick whenever price updates
  useEffect(() => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const newTick: PriceTick = {
      index: tickIndexRef.current++,
      price,
      elapsed,
    };
    const updated = [...ticksRef.current, newTick].slice(-MAX_TICKS);
    ticksRef.current = updated;
    setTicks([...updated]);
  }, [price]); // eslint-disable-line react-hooks/exhaustive-deps

  const isAboveOpen = price >= sessionOpenPrice;
  // Teal when at/above session open, red when below
  const lineColor = isAboveOpen ? '#2dd4bf' : '#f87171';

  const prices = ticks.map(t => t.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : sessionOpenPrice * 0.995;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : sessionOpenPrice * 1.005;
  const padding = (maxPrice - minPrice) * 0.2 || sessionOpenPrice * 0.002;
  const yDomain: [number, number] = [minPrice - padding, maxPrice + padding];

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-foreground text-sm">Live Price</h3>
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Open: <span className="text-foreground font-medium">${sessionOpenPrice.toFixed(2)}</span></span>
          <span className={cn('font-semibold', isAboveOpen ? 'text-emerald-400' : 'text-red-400')}>
            ${price.toFixed(2)}
          </span>
        </div>
      </div>

      {ticks.length < 2 ? (
        <div
          className="flex items-center justify-center text-muted-foreground text-xs"
          style={{ height }}
        >
          Collecting data…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={ticks} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="index" hide />
            <YAxis
              domain={yDomain}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 240)' }}
              width={52}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={sessionOpenPrice}
              stroke="oklch(0.78 0.16 75)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: 'Open',
                position: 'insideTopRight',
                fontSize: 10,
                fill: 'oklch(0.78 0.16 75)',
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  );
}
