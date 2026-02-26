export interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MockStock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  marketCap: string;
  history: OHLCData[];
}

function generateHistory(basePrice: number, days: number = 30): OHLCData[] {
  const history: OHLCData[] = [];
  let price = basePrice;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const change = (Math.random() - 0.48) * price * 0.03;
    const open = price;
    price = Math.max(price + change, price * 0.5);
    const high = Math.max(open, price) * (1 + Math.random() * 0.015);
    const low = Math.min(open, price) * (1 - Math.random() * 0.015);
    const volume = Math.floor(Math.random() * 50000000 + 10000000);

    history.push({
      date: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume
    });
  }
  return history;
}

export const mockStocks: MockStock[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    currentPrice: 189.45,
    previousClose: 187.20,
    change: 2.25,
    changePercent: 1.20,
    marketCap: '$2.94T',
    history: generateHistory(189.45)
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    currentPrice: 415.32,
    previousClose: 412.10,
    change: 3.22,
    changePercent: 0.78,
    marketCap: '$3.08T',
    history: generateHistory(415.32)
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Technology',
    currentPrice: 175.68,
    previousClose: 173.90,
    change: 1.78,
    changePercent: 1.02,
    marketCap: '$2.18T',
    history: generateHistory(175.68)
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'Consumer Discretionary',
    currentPrice: 198.12,
    previousClose: 195.40,
    change: 2.72,
    changePercent: 1.39,
    marketCap: '$2.07T',
    history: generateHistory(198.12)
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    currentPrice: 875.40,
    previousClose: 862.15,
    change: 13.25,
    changePercent: 1.54,
    marketCap: '$2.15T',
    history: generateHistory(875.40)
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Consumer Discretionary',
    currentPrice: 248.50,
    previousClose: 252.30,
    change: -3.80,
    changePercent: -1.51,
    marketCap: '$792B',
    history: generateHistory(248.50)
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    sector: 'Communication Services',
    currentPrice: 512.75,
    previousClose: 508.20,
    change: 4.55,
    changePercent: 0.90,
    marketCap: '$1.31T',
    history: generateHistory(512.75)
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financials',
    currentPrice: 198.30,
    previousClose: 196.80,
    change: 1.50,
    changePercent: 0.76,
    marketCap: '$572B',
    history: generateHistory(198.30)
  },
  {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    sector: 'Healthcare',
    currentPrice: 152.40,
    previousClose: 153.10,
    change: -0.70,
    changePercent: -0.46,
    marketCap: '$367B',
    history: generateHistory(152.40)
  },
  {
    symbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    sector: 'Energy',
    currentPrice: 112.85,
    previousClose: 111.20,
    change: 1.65,
    changePercent: 1.48,
    marketCap: '$449B',
    history: generateHistory(112.85)
  },
  {
    symbol: 'BRK',
    name: 'Berkshire Hathaway',
    sector: 'Financials',
    currentPrice: 358.90,
    previousClose: 356.40,
    change: 2.50,
    changePercent: 0.70,
    marketCap: '$782B',
    history: generateHistory(358.90)
  },
  {
    symbol: 'V',
    name: 'Visa Inc.',
    sector: 'Financials',
    currentPrice: 278.60,
    previousClose: 276.90,
    change: 1.70,
    changePercent: 0.61,
    marketCap: '$572B',
    history: generateHistory(278.60)
  }
];

export function getStockBySymbol(symbol: string): MockStock | undefined {
  return mockStocks.find(s => s.symbol === symbol);
}

// ─── Live Price Simulation ────────────────────────────────────────────────────

// Stores the current simulated price per symbol so drift accumulates across calls
const livePriceMap = new Map<string, number>();

/**
 * Returns a simulated live price for the given symbol.
 * Each call applies a small random walk (±0.5%) to the previous price.
 * Prices are initialised from the stock's last OHLCV close on first access.
 */
export function getLivePrice(symbol: string): number {
  const stock = mockStocks.find(s => s.symbol === symbol);
  const basePrice = stock
    ? stock.history[stock.history.length - 1]?.close ?? stock.currentPrice
    : 100;

  const prev = livePriceMap.get(symbol) ?? basePrice;
  // ±0.5% random walk
  const delta = prev * (Math.random() * 0.01 - 0.005);
  const next = parseFloat((prev + delta).toFixed(2));
  livePriceMap.set(symbol, next);
  return next;
}

export function generateAIPrediction(stock: MockStock): { direction: string; confidence: number; reasoning: string } {
  const recentHistory = stock.history.slice(-10);
  const prices = recentHistory.map(h => h.close);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const recentAvg = prices.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const momentum = (recentAvg - avgPrice) / avgPrice;
  const volatility = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length) / avgPrice;

  let direction: string;
  let confidence: number;
  let reasoning: string;

  if (momentum > 0.02) {
    direction = 'Up';
    confidence = Math.min(85, 60 + momentum * 500);
    reasoning = `Strong upward momentum detected. Recent 3-day average ($${recentAvg.toFixed(2)}) is ${(momentum * 100).toFixed(1)}% above the 10-day average. Low volatility (${(volatility * 100).toFixed(1)}%) supports continuation.`;
  } else if (momentum < -0.02) {
    direction = 'Down';
    confidence = Math.min(85, 60 + Math.abs(momentum) * 500);
    reasoning = `Downward pressure observed. Recent prices are ${(Math.abs(momentum) * 100).toFixed(1)}% below the 10-day average. Elevated volatility (${(volatility * 100).toFixed(1)}%) suggests continued selling pressure.`;
  } else {
    direction = 'Flat';
    confidence = 55 + Math.random() * 15;
    reasoning = `Consolidation pattern detected. Price is trading near the 10-day average with ${(volatility * 100).toFixed(1)}% volatility. Market appears to be in a wait-and-see mode.`;
  }

  return { direction, confidence: Math.round(confidence), reasoning };
}

export function simulateOutcome(stock: MockStock): { outcome: string; explanation: string } {
  const rand = Math.random();
  let outcome: string;
  let explanation: string;

  const recentHistory = stock.history.slice(-5);
  const avgVolume = recentHistory.reduce((sum, h) => sum + h.volume, 0) / recentHistory.length;
  const priceChange = ((stock.currentPrice - recentHistory[0].open) / recentHistory[0].open) * 100;

  if (rand < 0.4) {
    outcome = 'Up';
    explanation = `${stock.symbol} gained ground as buying pressure increased. Volume was ${avgVolume > 30000000 ? 'above' : 'below'} average at ${(avgVolume / 1000000).toFixed(1)}M shares. The ${priceChange > 0 ? 'positive' : 'mixed'} recent trend contributed to the upward movement.`;
  } else if (rand < 0.7) {
    outcome = 'Down';
    explanation = `${stock.symbol} faced selling pressure during the session. ${priceChange < 0 ? 'Continued weakness from recent sessions' : 'Profit-taking after recent gains'} drove prices lower. Volume patterns suggested institutional distribution.`;
  } else {
    outcome = 'Flat';
    explanation = `${stock.symbol} traded in a tight range with minimal directional conviction. Buyers and sellers were evenly matched, resulting in a consolidation session. This often precedes a significant move in either direction.`;
  }

  return { outcome, explanation };
}
