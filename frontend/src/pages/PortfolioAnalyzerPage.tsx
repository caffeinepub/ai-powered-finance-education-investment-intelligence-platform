import React, { useState, useMemo } from 'react';
import { useGetPortfolio, useSavePortfolio } from '../hooks/useQueries';
import PortfolioAllocationChart from '../components/PortfolioAllocationChart';
import PortfolioPerformanceChart from '../components/PortfolioPerformanceChart';
import PortfolioRiskHeatmap from '../components/PortfolioRiskHeatmap';
import HoldingForm from '../components/HoldingForm';
import LivePriceTicker from '../components/LivePriceTicker';
import GlassCard from '../components/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Plus, Edit2, Trash2, TrendingUp, TrendingDown, AlertTriangle, Loader2, BarChart2, Activity } from 'lucide-react';
import { mockStocks } from '../data/mockStocks';
import { useLivePrice } from '../hooks/useLivePrice';
import type { Holding, Portfolio } from '../backend';
import { cn } from '@/lib/utils';

function getRiskLabel(score: number): { label: string; color: string } {
  if (score <= 3) return { label: 'Low', color: 'text-emerald-400' };
  if (score <= 6) return { label: 'Medium', color: 'text-yellow-400' };
  return { label: 'High', color: 'text-red-400' };
}

function calculateRiskScore(holdings: Holding[], livePrices: Record<string, number>): number {
  if (holdings.length === 0) return 0;
  const totalValue = holdings.reduce((sum, h) => {
    const price = livePrices[h.symbol] ?? (mockStocks.find(s => s.symbol === h.symbol)?.currentPrice ?? Number(h.avgBuyPrice));
    return sum + price * Number(h.shares);
  }, 0);
  if (totalValue === 0) return 0;
  const maxWeight = Math.max(...holdings.map(h => {
    const price = livePrices[h.symbol] ?? (mockStocks.find(s => s.symbol === h.symbol)?.currentPrice ?? Number(h.avgBuyPrice));
    const val = price * Number(h.shares);
    return val / totalValue;
  }));
  if (maxWeight > 0.5) return 8;
  if (maxWeight > 0.35) return 6;
  if (maxWeight > 0.25) return 4;
  return 2;
}

function getDiversificationSuggestions(holdings: Holding[]): string[] {
  const suggestions: string[] = [];
  if (holdings.length === 0) return ['Add your first holding to get started.'];
  const sectors = new Set(holdings.map(h => mockStocks.find(s => s.symbol === h.symbol)?.sector ?? 'Unknown'));
  if (sectors.size < 3) suggestions.push('Consider diversifying across more sectors to reduce concentration risk.');
  if (holdings.length < 5) suggestions.push('A portfolio of 5-15 holdings typically provides good diversification.');
  const totalValue = holdings.reduce((sum, h) => {
    const stock = mockStocks.find(s => s.symbol === h.symbol);
    return sum + (stock?.currentPrice ?? Number(h.avgBuyPrice)) * Number(h.shares);
  }, 0);
  const maxHolding = holdings.reduce((max, h) => {
    const stock = mockStocks.find(s => s.symbol === h.symbol);
    const val = (stock?.currentPrice ?? Number(h.avgBuyPrice)) * Number(h.shares);
    return val > max.val ? { symbol: h.symbol, val } : max;
  }, { symbol: '', val: 0 });
  if (totalValue > 0 && maxHolding.val / totalValue > 0.3) {
    suggestions.push(`${maxHolding.symbol} represents over 30% of your portfolio. Consider trimming to reduce concentration.`);
  }
  if (!sectors.has('Bonds') && !sectors.has('Fixed Income')) {
    suggestions.push('Consider adding bonds or fixed income assets to reduce overall portfolio volatility.');
  }
  if (suggestions.length === 0) suggestions.push('Your portfolio looks well-diversified! Continue monitoring sector allocations.');
  return suggestions;
}

// Sub-component so each holding gets its own useLivePrice hook call at the top level
function HoldingRow({
  holding,
  index,
  onEdit,
  onRemove,
  isPending,
  onPriceUpdate,
}: {
  holding: Holding;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
  isPending: boolean;
  onPriceUpdate: (symbol: string, price: number) => void;
}) {
  const { price } = useLivePrice(holding.symbol);
  const stock = mockStocks.find(s => s.symbol === holding.symbol);

  // Notify parent of live price so it can aggregate totals
  React.useEffect(() => {
    onPriceUpdate(holding.symbol, price);
  }, [holding.symbol, price, onPriceUpdate]);

  const value = price * Number(holding.shares);
  const cost = Number(holding.avgBuyPrice) * Number(holding.shares);
  const gain = value - cost;
  const gainPct = cost > 0 ? ((price - Number(holding.avgBuyPrice)) / Number(holding.avgBuyPrice)) * 100 : 0;

  return (
    <GlassCard key={index} className="flex items-center gap-4">
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div>
          <div className="font-display font-bold text-primary">{holding.symbol}</div>
          <div className="text-xs text-muted-foreground">{stock?.name ?? holding.symbol}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Shares</div>
          <div className="font-semibold text-foreground">{Number(holding.shares)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Avg Buy</div>
          <div className="font-semibold text-foreground">${Number(holding.avgBuyPrice).toFixed(2)}</div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <div className="text-xs text-muted-foreground mb-0.5">Live Price</div>
          <LivePriceTicker symbol={holding.symbol} compact />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Gain/Loss</div>
          <div className={cn('font-semibold text-sm', gain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {gain >= 0 ? '+' : ''}${Math.abs(gain).toFixed(2)}
          </div>
          <div className={cn('text-xs', gain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)
          </div>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8 hover:text-primary"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={isPending}
          className="h-8 w-8 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </GlassCard>
  );
}

export default function PortfolioAnalyzerPage() {
  const { data: portfolio, isLoading } = useGetPortfolio();
  const savePortfolio = useSavePortfolio();
  const [showForm, setShowForm] = useState(false);
  const [editingHolding, setEditingHolding] = useState<{ holding: Holding; index: number } | null>(null);
  // Map of symbol -> latest live price for aggregation
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  const holdings: Holding[] = portfolio?.holdings ?? [];

  const handlePriceUpdate = React.useCallback((symbol: string, price: number) => {
    setLivePrices(prev => {
      if (prev[symbol] === price) return prev;
      return { ...prev, [symbol]: price };
    });
  }, []);

  // Aggregate totals using live prices where available
  const totalValue = useMemo(() => holdings.reduce((sum, h) => {
    const price = livePrices[h.symbol] ?? (mockStocks.find(s => s.symbol === h.symbol)?.currentPrice ?? Number(h.avgBuyPrice));
    return sum + price * Number(h.shares);
  }, 0), [holdings, livePrices]);

  const totalCost = useMemo(() => holdings.reduce((sum, h) => sum + Number(h.avgBuyPrice) * Number(h.shares), 0), [holdings]);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const riskScore = useMemo(() => calculateRiskScore(holdings, livePrices), [holdings, livePrices]);
  const { label: riskLabel, color: riskColor } = getRiskLabel(riskScore);
  const suggestions = useMemo(() => getDiversificationSuggestions(holdings), [holdings]);

  const handleAddHolding = async (holding: Holding) => {
    const newHoldings = [...holdings, holding];
    const newRisk = calculateRiskScore(newHoldings, livePrices);
    const newTotal = newHoldings.reduce((sum, h) => {
      const price = livePrices[h.symbol] ?? (mockStocks.find(s => s.symbol === h.symbol)?.currentPrice ?? Number(h.avgBuyPrice));
      return sum + price * Number(h.shares);
    }, 0);
    const newPortfolio: Portfolio = {
      holdings: newHoldings,
      totalValue: newTotal,
      riskScore: BigInt(newRisk),
    };
    await savePortfolio.mutateAsync(newPortfolio);
    setShowForm(false);
  };

  const handleEditHolding = async (holding: Holding) => {
    if (editingHolding === null) return;
    const newHoldings = holdings.map((h, i) => i === editingHolding.index ? holding : h);
    const newRisk = calculateRiskScore(newHoldings, livePrices);
    const newTotal = newHoldings.reduce((sum, h) => {
      const price = livePrices[h.symbol] ?? (mockStocks.find(s => s.symbol === h.symbol)?.currentPrice ?? Number(h.avgBuyPrice));
      return sum + price * Number(h.shares);
    }, 0);
    await savePortfolio.mutateAsync({ holdings: newHoldings, totalValue: newTotal, riskScore: BigInt(newRisk) });
    setEditingHolding(null);
  };

  const handleRemoveHolding = async (index: number) => {
    const newHoldings = holdings.filter((_, i) => i !== index);
    const newRisk = calculateRiskScore(newHoldings, livePrices);
    const newTotal = newHoldings.reduce((sum, h) => {
      const price = livePrices[h.symbol] ?? (mockStocks.find(s => s.symbol === h.symbol)?.currentPrice ?? Number(h.avgBuyPrice));
      return sum + price * Number(h.shares);
    }, 0);
    await savePortfolio.mutateAsync({ holdings: newHoldings, totalValue: newTotal, riskScore: BigInt(newRisk) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
            <PieChart className="h-4 w-4" />
            Portfolio Analyzer
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">My Portfolio</h1>
          <p className="text-muted-foreground">Track allocation, performance, and risk exposure.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="btn-teal gap-2">
          <Plus className="h-4 w-4" />
          Add Holding
        </Button>
      </div>

      {/* Summary Cards — live-updating */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <GlassCard className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Value (Live)</div>
          <div className="font-display text-xl font-bold text-foreground">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Unrealized P&amp;L</div>
          <div className={cn('font-display text-xl font-bold', totalGain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {totalGain >= 0 ? '+' : ''}${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={cn('text-xs', totalGain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Holdings</div>
          <div className="font-display text-xl font-bold text-foreground">{holdings.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
          <div className={cn('font-display text-xl font-bold', riskColor)}>{riskLabel}</div>
          <div className="text-xs text-muted-foreground">Score: {riskScore}/10</div>
        </GlassCard>
      </div>

      {holdings.length === 0 ? (
        <GlassCard className="text-center py-20">
          <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">No Holdings Yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Add your first holding to start analyzing your portfolio.</p>
          <Button onClick={() => setShowForm(true)} className="btn-teal gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Holding
          </Button>
        </GlassCard>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 bg-secondary/50">
            <TabsTrigger value="overview" className="gap-2"><PieChart className="h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="performance" className="gap-2"><BarChart2 className="h-4 w-4" />Performance</TabsTrigger>
            <TabsTrigger value="risk" className="gap-2"><Activity className="h-4 w-4" />Risk Analysis</TabsTrigger>
            <TabsTrigger value="holdings" className="gap-2"><TrendingUp className="h-4 w-4" />Holdings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard>
                <h3 className="font-display font-semibold text-foreground mb-4">Allocation by Holding</h3>
                <PortfolioAllocationChart holdings={holdings} height={280} />
              </GlassCard>
              <GlassCard>
                <h3 className="font-display font-semibold text-foreground mb-4">Diversification Insights</h3>
                <div className="space-y-3">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <AlertTriangle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <GlassCard>
              <h3 className="font-display font-semibold text-foreground mb-4">Gain/Loss by Holding</h3>
              <PortfolioPerformanceChart holdings={holdings} height={280} />
            </GlassCard>
          </TabsContent>

          <TabsContent value="risk">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">Risk Concentration Map</h3>
                <Badge className={cn('text-xs', riskColor === 'text-emerald-400' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : riskColor === 'text-yellow-400' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20')}>
                  {riskLabel} Risk
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Bubble size represents position value. X-axis shows portfolio weight, Y-axis shows estimated volatility.</p>
              <PortfolioRiskHeatmap holdings={holdings} height={280} />
            </GlassCard>
          </TabsContent>

          <TabsContent value="holdings">
            <div className="space-y-3">
              {holdings.map((holding, i) => (
                <HoldingRow
                  key={`${holding.symbol}-${i}`}
                  holding={holding}
                  index={i}
                  onEdit={() => setEditingHolding({ holding, index: i })}
                  onRemove={() => handleRemoveHolding(i)}
                  isPending={savePortfolio.isPending}
                  onPriceUpdate={handlePriceUpdate}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <HoldingForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleAddHolding}
        isLoading={savePortfolio.isPending}
      />
      {editingHolding && (
        <HoldingForm
          open={true}
          onClose={() => setEditingHolding(null)}
          onSubmit={handleEditHolding}
          initialHolding={editingHolding.holding}
          isLoading={savePortfolio.isPending}
        />
      )}
    </div>
  );
}
