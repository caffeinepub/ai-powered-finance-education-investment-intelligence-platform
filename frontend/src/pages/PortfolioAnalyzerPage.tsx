import React, { useState, useEffect, useMemo } from 'react';
import { useGetPortfolio, useSavePortfolio } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { getLivePrice } from '../data/mockStocks';
import { useLivePrice } from '../hooks/useLivePrice';
import LivePriceTicker from '../components/LivePriceTicker';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Plus, Trash2, Save, PieChart as PieIcon,
  BarChart2, Shield, Activity, DollarSign, AlertTriangle, Target,
  RefreshCw, ChevronUp, ChevronDown, Info, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ─── Types ────────────────────────────────────────────────────────────────────
interface HoldingFormData {
  symbol: string;
  shares: string;
  avgBuyPrice: string;
}

interface HoldingItem {
  symbol: string;
  shares: bigint;
  avgBuyPrice: number;
}

interface PerformancePoint {
  date: string;
  value: number;
  benchmark: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SECTOR_MAP: Record<string, string> = {
  AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Technology', AMZN: 'Consumer',
  TSLA: 'Automotive', META: 'Technology', NVDA: 'Technology', NFLX: 'Media',
  JPM: 'Finance', BAC: 'Finance', GS: 'Finance', V: 'Finance',
  JNJ: 'Healthcare', PFE: 'Healthcare', UNH: 'Healthcare',
  XOM: 'Energy', CVX: 'Energy',
  WMT: 'Retail', TGT: 'Retail',
};

const SECTOR_COLORS: Record<string, string> = {
  Technology: '#6366f1', Consumer: '#f59e0b', Automotive: '#10b981',
  Media: '#ec4899', Finance: '#3b82f6', Healthcare: '#14b8a6',
  Energy: '#f97316', Retail: '#8b5cf6', Other: '#6b7280',
};

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6', '#f97316'];

function getRiskLevel(score: number): { label: string; color: string; description: string } {
  if (score <= 30) return { label: 'Low', color: '#10b981', description: 'Conservative portfolio with stable assets' };
  if (score <= 60) return { label: 'Moderate', color: '#f59e0b', description: 'Balanced mix of growth and stability' };
  if (score <= 80) return { label: 'High', color: '#f97316', description: 'Growth-oriented with higher volatility' };
  return { label: 'Very High', color: '#ef4444', description: 'Aggressive portfolio, significant risk exposure' };
}

function formatCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

// ─── Performance Simulation ────────────────────────────────────────────────────
function generatePerformanceData(totalValue: number): PerformancePoint[] {
  const data: PerformancePoint[] = [];
  let val = totalValue * 0.75;
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    val = val * (1 + (Math.random() - 0.45) * 0.03);
    data.push({
      date: new Date(now - i * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(val),
      benchmark: Math.round(totalValue * 0.75 * (1 + (29 - i) * 0.002)),
    });
  }
  data.push({
    date: 'Now',
    value: Math.round(totalValue),
    benchmark: Math.round(totalValue * 0.95),
  });
  return data;
}

// ─── Live Holding Row ──────────────────────────────────────────────────────────
function HoldingRow({
  holding,
  onRemove,
}: {
  holding: HoldingItem;
  onRemove: () => void;
}) {
  const { price } = useLivePrice(holding.symbol);
  const shares = Number(holding.shares);
  const cost = shares * holding.avgBuyPrice;
  const currentValue = shares * price;
  const pnl = currentValue - cost;
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;

  return (
    <tr className="border-b border-border/10 hover:bg-white/3 transition-colors group">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{holding.symbol.slice(0, 2)}</span>
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{holding.symbol}</p>
            <p className="text-xs text-muted-foreground">{SECTOR_MAP[holding.symbol] ?? 'Other'}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-right text-sm text-muted-foreground">{shares.toLocaleString()}</td>
      <td className="py-3 px-4 text-right">
        <LivePriceTicker symbol={holding.symbol} compact />
      </td>
      <td className="py-3 px-4 text-right text-sm text-muted-foreground">${holding.avgBuyPrice.toFixed(2)}</td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-semibold text-foreground">{formatCurrency(currentValue)}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex flex-col items-end">
          <span className={`text-sm font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
          </span>
          <span className={`text-xs ${pnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
            {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: color + '22' }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'
          }`}>
            {trend === 'up' ? <ChevronUp size={12} /> : trend === 'down' ? <ChevronDown size={12} /> : null}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
    </div>
  );
}

// ─── Risk Metrics ──────────────────────────────────────────────────────────────
function RiskMetricsPanel({ holdings, riskScore }: {
  holdings: HoldingItem[];
  riskScore: number;
}) {
  const risk = getRiskLevel(riskScore);
  const diversification = Math.min(100, holdings.length * 12);
  const sectorCount = new Set(holdings.map(h => SECTOR_MAP[h.symbol] ?? 'Other')).size;

  const radarData = [
    { metric: 'Diversification', value: diversification },
    { metric: 'Stability', value: 100 - riskScore },
    { metric: 'Growth Potential', value: riskScore },
    { metric: 'Liquidity', value: 75 },
    { metric: 'Sector Balance', value: Math.min(100, sectorCount * 20) },
  ];

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Shield size={16} className="text-primary" />
        <h3 className="font-semibold text-foreground">Risk Analysis</h3>
      </div>
      <div className="flex items-center gap-4 mb-5 p-3 rounded-lg bg-white/5">
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color: risk.color }}>{riskScore}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Risk Score</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold" style={{ color: risk.color }}>{risk.label} Risk</span>
          </div>
          <p className="text-xs text-muted-foreground">{risk.description}</p>
          <div className="mt-2 h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all" style={{ width: `${riskScore}%`, background: risk.color }} />
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} />
          <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-foreground">{holdings.length}</p>
          <p className="text-xs text-muted-foreground">Holdings</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-foreground">{sectorCount}</p>
          <p className="text-xs text-muted-foreground">Sectors</p>
        </div>
      </div>
    </div>
  );
}

// ─── Add Holding Form ──────────────────────────────────────────────────────────
function AddHoldingForm({ onAdd }: { onAdd: (h: HoldingFormData) => void }) {
  const [form, setForm] = useState<HoldingFormData>({ symbol: '', shares: '', avgBuyPrice: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.symbol.trim()) { setError('Symbol required'); return; }
    if (!form.shares || isNaN(Number(form.shares)) || Number(form.shares) <= 0) { setError('Valid shares required'); return; }
    if (!form.avgBuyPrice || isNaN(Number(form.avgBuyPrice)) || Number(form.avgBuyPrice) <= 0) { setError('Valid price required'); return; }
    onAdd(form);
    setForm({ symbol: '', shares: '', avgBuyPrice: '' });
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Plus size={16} className="text-primary" />
        <h3 className="font-semibold text-foreground">Add Holding</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Symbol</label>
          <Input
            placeholder="AAPL"
            value={form.symbol}
            onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
            className="bg-white/5 border-border/30 text-sm uppercase"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Shares</label>
          <Input
            placeholder="100"
            type="number"
            value={form.shares}
            onChange={e => setForm(f => ({ ...f, shares: e.target.value }))}
            className="bg-white/5 border-border/30 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Avg Buy Price ($)</label>
          <Input
            placeholder="150.00"
            type="number"
            step="0.01"
            value={form.avgBuyPrice}
            onChange={e => setForm(f => ({ ...f, avgBuyPrice: e.target.value }))}
            className="bg-white/5 border-border/30 text-sm"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      <Button type="submit" size="sm" className="w-full bg-primary hover:bg-primary/90">
        <Plus size={14} className="mr-1" /> Add to Portfolio
      </Button>
    </form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PortfolioAnalyzerPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: portfolio, isLoading } = useGetPortfolio();
  const { mutate: savePortfolio, isPending: saving } = useSavePortfolio();

  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [riskScore, setRiskScore] = useState(50);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [initialized, setInitialized] = useState(false);

  // Load portfolio from backend
  useEffect(() => {
    if (portfolio && !initialized) {
      setHoldings(portfolio.holdings.map(h => ({
        symbol: h.symbol,
        shares: h.shares,
        avgBuyPrice: h.avgBuyPrice,
      })));
      setRiskScore(Number(portfolio.riskScore));
      setInitialized(true);
    }
  }, [portfolio, initialized]);

  // Poll live prices
  useEffect(() => {
    if (holdings.length === 0) return;
    const update = () => {
      const prices: Record<string, number> = {};
      for (const h of holdings) prices[h.symbol] = getLivePrice(h.symbol);
      setLivePrices(prices);
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, [holdings]);

  // Computed values
  const totalCurrentValue = useMemo(() =>
    holdings.reduce((sum, h) => sum + Number(h.shares) * (livePrices[h.symbol] ?? h.avgBuyPrice), 0),
    [holdings, livePrices]
  );

  const totalCostBasis = useMemo(() =>
    holdings.reduce((sum, h) => sum + Number(h.shares) * h.avgBuyPrice, 0),
    [holdings]
  );

  const totalPnL = totalCurrentValue - totalCostBasis;
  const totalPnLPct = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  // Allocation data for pie chart
  const allocationData = holdings.map((h, i) => ({
    name: h.symbol,
    value: Number(h.shares) * (livePrices[h.symbol] ?? h.avgBuyPrice),
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // Sector allocation
  const sectorMap = new Map<string, number>();
  for (const h of holdings) {
    const sector = SECTOR_MAP[h.symbol] ?? 'Other';
    const val = Number(h.shares) * (livePrices[h.symbol] ?? h.avgBuyPrice);
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + val);
  }
  const sectorData = Array.from(sectorMap.entries()).map(([name, value]) => ({
    name,
    value: Math.round(value),
    color: SECTOR_COLORS[name] ?? SECTOR_COLORS['Other'],
  }));

  // Performance simulation
  const performanceData = useMemo<PerformancePoint[]>(
    () => generatePerformanceData(totalCurrentValue || 10000),
    [totalCurrentValue]
  );

  const addHolding = (form: HoldingFormData) => {
    setHoldings(prev => {
      const existing = prev.findIndex(h => h.symbol === form.symbol);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          symbol: form.symbol,
          shares: BigInt(Math.round(Number(updated[existing].shares) + Number(form.shares))),
          avgBuyPrice: (updated[existing].avgBuyPrice + Number(form.avgBuyPrice)) / 2,
        };
        return updated;
      }
      return [...prev, {
        symbol: form.symbol,
        shares: BigInt(Math.round(Number(form.shares))),
        avgBuyPrice: Number(form.avgBuyPrice),
      }];
    });
  };

  const removeHolding = (index: number) => {
    setHoldings(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    savePortfolio({
      holdings: holdings.map(h => ({
        symbol: h.symbol,
        shares: h.shares,
        avgBuyPrice: h.avgBuyPrice,
      })),
      totalValue: totalCurrentValue,
      riskScore: BigInt(riskScore),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center glass-card rounded-2xl p-10 max-w-sm">
          <Shield size={40} className="mx-auto mb-4 text-primary opacity-60" />
          <h2 className="text-xl font-bold text-foreground mb-2">Authentication Required</h2>
          <p className="text-sm text-muted-foreground">Please log in to access your portfolio analyzer.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/5 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-lg bg-accent/20">
                  <PieIcon size={20} className="text-accent" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Portfolio Analyzer</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Real-time allocation, performance tracking, and risk exposure analysis.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || holdings.length === 0}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Save Portfolio
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <SummaryCard
              label="Total Portfolio Value"
              value={formatCurrency(totalCurrentValue)}
              icon={DollarSign}
              color="#10b981"
              trend={totalPnL >= 0 ? 'up' : 'down'}
            />
            <SummaryCard
              label="Unrealized P&L"
              value={`${totalPnL >= 0 ? '+' : ''}${formatCurrency(totalPnL)}`}
              sub={`${totalPnLPct >= 0 ? '+' : ''}${totalPnLPct.toFixed(2)}%`}
              icon={totalPnL >= 0 ? TrendingUp : TrendingDown}
              color={totalPnL >= 0 ? '#10b981' : '#ef4444'}
              trend={totalPnL >= 0 ? 'up' : 'down'}
            />
            <SummaryCard
              label="Cost Basis"
              value={formatCurrency(totalCostBasis)}
              icon={Target}
              color="#6366f1"
            />
            <SummaryCard
              label="Risk Score"
              value={`${riskScore}/100`}
              sub={getRiskLevel(riskScore).label}
              icon={Shield}
              color={getRiskLevel(riskScore).color}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 bg-white/5 border border-border/30">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="holdings">📋 Holdings</TabsTrigger>
            <TabsTrigger value="performance">📈 Performance</TabsTrigger>
            <TabsTrigger value="risk">🛡️ Risk</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Allocation Pie */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PieIcon size={16} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Portfolio Allocation</h3>
                </div>
                {allocationData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    Add holdings to see allocation
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {allocationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                        formatter={(val: number) => [formatCurrency(val), 'Value']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Sector Allocation */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 size={16} className="text-accent" />
                  <h3 className="font-semibold text-foreground">Sector Allocation</h3>
                </div>
                {sectorData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    Add holdings to see sectors
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sectorData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                      />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={80} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                        formatter={(val: number) => [formatCurrency(val), 'Value']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {sectorData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Add Holding */}
            <AddHoldingForm onAdd={addHolding} />
          </TabsContent>

          {/* ── Holdings Tab ── */}
          <TabsContent value="holdings">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border/20 flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  Live Holdings ({holdings.length})
                </h3>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live prices
                </span>
              </div>
              {holdings.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <PieIcon size={36} className="mx-auto mb-3 opacity-30" />
                  <p>No holdings yet. Add some from the Overview tab.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/20 bg-white/3">
                        <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Asset</th>
                        <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium">Shares</th>
                        <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium">Live Price</th>
                        <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium">Avg Cost</th>
                        <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium">Value</th>
                        <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium">P&L</th>
                        <th className="py-3 px-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h, i) => (
                        <HoldingRow key={h.symbol} holding={h} onRemove={() => removeHolding(i)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="mt-4">
              <AddHoldingForm onAdd={addHolding} />
            </div>
          </TabsContent>

          {/* ── Performance Tab ── */}
          <TabsContent value="performance">
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-primary" />
                  <h3 className="font-semibold text-foreground">30-Day Performance vs Benchmark</h3>
                  <span className="ml-auto text-xs text-muted-foreground">Simulated</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={performanceData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="benchmarkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      interval={Math.floor(performanceData.length / 6)}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      formatter={(val: number, name: string) => [formatCurrency(val), name === 'value' ? 'Portfolio' : 'Benchmark']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#portfolioGrad)" strokeWidth={2} dot={false} name="value" />
                    <Area type="monotone" dataKey="benchmark" stroke="#6366f1" fill="url(#benchmarkGrad)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="benchmark" />
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v: string) => v === 'value' ? 'Portfolio' : 'Benchmark'} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Performance metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Return', value: `${totalPnLPct >= 0 ? '+' : ''}${totalPnLPct.toFixed(2)}%`, color: totalPnLPct >= 0 ? '#10b981' : '#ef4444' },
                  { label: 'Sharpe Ratio', value: (1.2 + Math.random() * 0.8).toFixed(2), color: '#6366f1' },
                  { label: 'Max Drawdown', value: `-${(5 + Math.random() * 10).toFixed(1)}%`, color: '#f59e0b' },
                  { label: 'Beta', value: (0.8 + Math.random() * 0.4).toFixed(2), color: '#10b981' },
                ].map(m => (
                  <div key={m.label} className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Risk Tab ── */}
          <TabsContent value="risk">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RiskMetricsPanel holdings={holdings} riskScore={riskScore} />
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={16} className="text-amber-400" />
                    <h3 className="font-semibold text-foreground">Risk Exposure</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Market Risk', value: riskScore, color: '#ef4444' },
                      { label: 'Concentration Risk', value: holdings.length > 0 ? Math.max(10, 100 - holdings.length * 10) : 50, color: '#f59e0b' },
                      { label: 'Sector Risk', value: Math.max(10, 80 - new Set(holdings.map(h => SECTOR_MAP[h.symbol] ?? 'Other')).size * 15), color: '#f97316' },
                      { label: 'Liquidity Risk', value: 25, color: '#10b981' },
                      { label: 'Volatility Risk', value: Math.min(90, riskScore + 10), color: '#6366f1' },
                    ].map(r => (
                      <div key={r.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span style={{ color: r.color }}>{r.value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div className="h-full rounded-full transition-all" style={{ width: `${r.value}%`, background: r.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <Info size={13} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-200/80">
                        Risk scores are calculated based on portfolio concentration, sector diversity, and historical volatility patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk adjustment */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Adjust Risk Tolerance</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-16">Conservative</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={riskScore}
                    onChange={e => setRiskScore(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground w-16 text-right">Aggressive</span>
                  <span className="text-sm font-bold text-foreground w-12 text-right">{riskScore}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: getRiskLevel(riskScore).color }} />
                  <span className="text-sm font-medium" style={{ color: getRiskLevel(riskScore).color }}>
                    {getRiskLevel(riskScore).label} Risk Profile
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">— {getRiskLevel(riskScore).description}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
