import React, { useEffect, useRef, useState } from 'react';
import { useLivePrice } from '../hooks/useLivePrice';
import GlassCard from './GlassCard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LivePriceTickerProps {
  symbol: string;
  compact?: boolean;
}

export default function LivePriceTicker({ symbol, compact = false }: LivePriceTickerProps) {
  const { price, changePercent, absoluteChange, isUp } = useLivePrice(symbol);
  const [flashKey, setFlashKey] = useState(0);
  const prevPriceRef = useRef(price);

  // Trigger flash animation on each price change
  useEffect(() => {
    if (price !== prevPriceRef.current) {
      prevPriceRef.current = price;
      setFlashKey(k => k + 1);
    }
  }, [price]);

  const isFlat = Math.abs(absoluteChange) < 0.001;
  const colorClass = isFlat ? 'text-yellow-400' : isUp ? 'text-emerald-400' : 'text-red-400';
  const bgClass = isFlat ? 'bg-yellow-400/10' : isUp ? 'bg-emerald-400/10' : 'bg-red-400/10';
  const borderClass = isFlat ? 'border-yellow-400/20' : isUp ? 'border-emerald-400/20' : 'border-red-400/20';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span
          key={flashKey}
          className={cn('font-display font-bold text-sm price-flash', colorClass)}
        >
          ${price.toFixed(2)}
        </span>
        <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded border', colorClass, bgClass, borderClass)}>
          {absoluteChange >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
    );
  }

  return (
    <GlassCard className={cn('border', borderClass)}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Symbol + Live badge */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-foreground">{symbol}</span>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                LIVE
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Real-time simulated price</div>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div
              key={flashKey}
              className={cn('font-display font-bold text-2xl price-flash', colorClass)}
            >
              ${price.toFixed(2)}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              {isFlat ? (
                <Minus className={cn('h-3.5 w-3.5', colorClass)} />
              ) : isUp ? (
                <TrendingUp className={cn('h-3.5 w-3.5', colorClass)} />
              ) : (
                <TrendingDown className={cn('h-3.5 w-3.5', colorClass)} />
              )}
              <span className={cn('text-sm font-semibold', colorClass)}>
                {absoluteChange >= 0 ? '+' : ''}{absoluteChange.toFixed(2)}
              </span>
              <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded border', colorClass, bgClass, borderClass)}>
                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
