import { useState, useEffect, useRef } from 'react';
import { getLivePrice } from '../data/mockStocks';

export interface LivePriceData {
  price: number;
  previousPrice: number;
  sessionOpenPrice: number;
  changePercent: number;
  absoluteChange: number;
  isUp: boolean;
}

/**
 * Hook that returns a simulated live price for the given stock symbol.
 * Updates every `intervalMs` milliseconds (default 3000ms).
 * Cleans up the interval on unmount.
 */
export function useLivePrice(symbol: string, intervalMs: number = 3000): LivePriceData {
  // Initialise with the first live price synchronously so there's no flash of 0
  const [price, setPrice] = useState<number>(() => getLivePrice(symbol));
  const [previousPrice, setPreviousPrice] = useState<number>(() => getLivePrice(symbol));
  const sessionOpenRef = useRef<number | null>(null);

  // Reset when symbol changes
  useEffect(() => {
    const initial = getLivePrice(symbol);
    sessionOpenRef.current = initial;
    setPrice(initial);
    setPreviousPrice(initial);
  }, [symbol]);

  useEffect(() => {
    const id = setInterval(() => {
      const next = getLivePrice(symbol);
      setPrice(prev => {
        setPreviousPrice(prev);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [symbol, intervalMs]);

  const sessionOpen = sessionOpenRef.current ?? price;
  const absoluteChange = price - sessionOpen;
  const changePercent = sessionOpen !== 0 ? (absoluteChange / sessionOpen) * 100 : 0;
  const isUp = price >= previousPrice;

  return { price, previousPrice, sessionOpenPrice: sessionOpen, changePercent, absoluteChange, isUp };
}
