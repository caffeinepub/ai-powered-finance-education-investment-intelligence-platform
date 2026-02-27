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
import GlassCard from '../components/GlassCard';

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

// Updated to use new palette colors
const SECTOR_COLORS: Record<string, string> = {
  Technology: '#a855f7',   // violet
  Consumer: '#84cc16',     // lime
  Automotive: '#22d3ee',   // cyan
  Media: '#f472b6',        // pink
  Finance: '#818cf8',      // indigo
  Healthcare: '#34d399',   // emerald
  Energy: '#fb923c',       // orange
  Retail: '#c084fc',       // purple
  Other: '#6b7280',
};

const PIE_COLORS = ['#a855f7', '#84cc16', '#22d3ee', '#f472b6', '#818cf8', '#34d399', '#fb923c', '#c084fc'];

function getRiskLevel(score: number): { label: string; color: string; description: string } {
  if (score <= 30) return { label: 'Low', color: '#34d399', description: 'Conservative portfolio with stable assets' };
  if (score <= 60) return { label: 'Moderate', color: '#84cc16', description: 'Balanced mix of growth and stability' };
  if (score <= 80) return { label: 'High', color: '#fb923c', description: 'Growth-oriented with higher volatility' };
  return { label: 'Very High', color: '#f87171', description: 'Aggressive portfolio, significant risk exposure' };
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
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
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
    <GlassCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ background: color + '22' }}>
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
      <p className="text-2xl font-bold text-foreground font-display">
        <span key={value} className="animate-number-tick inline-block">{value}</span>
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
    </GlassCard>
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
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <Shield size={16} className="text-primary" />
        <h3 className="font-semibold text-foreground font-display">Risk Analysis</h3>
      </div>
      <div className="flex items-center gap-4 mb-5 p-3 rounded-xl bg-white/5">
        <div className="text-center">
          <div className="text-3xl font-bold font-display" style={{ color: risk.color }}>{riskScore}</div>
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
          <Radar dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground font-display">{holdings.length}</p>
          <p className="text-xs text-muted-foreground">Holdings</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground font-display">{sectorCount}</p>
          <p className="text-xs text-muted-foreground">Sectors</p>
        </div>
      </div>
    </GlassCard>
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
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Plus size={16} className="text-primary" />
        <h3 className="font-semibold text-foreground font-display">Add Holding</h3>
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
      <Button type="submit" size="sm" className="w-full btn-violet rounded-xl animate-pulse-accent" onClick={handleSubmit}>
        <Plus size={14} className="mr-1" /> Add to Portfolio
      </Button>
    </GlassCard>
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
        <GlassCard variant="aurora" className="text-center p-10 max-w-sm">
          <Shield size={40} className="mx-auto mb-4 text-primary opacity-60" />
          <h2 className="text-xl font-bold text-foreground font-display mb-2">Authentication Required</h2>
          <p className="text-sm text-muted-foreground">Please log in to access your portfolio analyzer.</p>
        </GlassCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-violet/8 via-background to-lime/5 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-violet/15">
                  <PieIcon size={20} className="text-violet" />
                </div>
                <h1 className="text-2xl font-bold text-foreground font-display">Portfolio Analyzer</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Real-time allocation, performance tracking, and risk exposure analysis.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || holdings.length === 0}
              className="btn-violet gap-2 rounded-xl animate-pulse-accent"
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
              color="#a855f7"
              trend={totalPnL >= 0 ? 'up' : 'down'}
            />
            <SummaryCard
              label="Unrealized P&L"
              value={`${totalPnL >= 0 ? '+' : ''}${formatCurrency(totalPnL)}`}
              sub={`${totalPnLPct >= 0 ? '+' : ''}${totalPnLPct.toFixed(2)}%`}
              icon={totalPnL >= 0 ? TrendingUp : TrendingDown}
              color={totalPnL >= 0 ? '#34d399' : '#f87171'}
              trend={totalPnL >= 0 ? 'up' : 'down'}
            />
            <SummaryCard
              label="Cost Basis"
              value={formatCurrency(totalCostBasis)}
              icon={Target}
              color="#818cf8"
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
          <TabsList className="mb-6 bg-white/5 border border-border/30 rounded-xl">
            <TabsTrigger value="overview" className="gap-2 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <PieIcon size={14} /> Overview
            </TabsTrigger>
            <TabsTrigger value="holdings" className="gap-2 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <BarChart2 size={14} /> Holdings
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Activity size={14} /> Performance
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-2 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Shield size={14} /> Risk
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Allocation Pie */}
              <GlassCard className="p-5">
                <h3 className="font-semibold text-foreground mb-4 font-display flex items-center gap-2">
                  <PieIcon size={15} className="text-violet" /> Asset Allocation
                </h3>
                {allocationData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    Add holdings to see allocation
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={allocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                        {allocationData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'oklch(0.16 0.022 275)', border: '1px solid oklch(0.28 0.025 275 / 0.5)', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(v: number) => [formatCurrency(v), 'Value']}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </GlassCard>

              {/* Sector Allocation */}
              <GlassCard className="p-5">
                <h3 className="font-semibold text-foreground mb-4 font-display flex items-center gap-2">
                  <BarChart2 size={15} className="text-lime" /> Sector Breakdown
                </h3>
                {sectorData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    Add holdings to see sectors
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sectorData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} width={80} />
                      <Tooltip
                        contentStyle={{ background: 'oklch(0.16 0.022 275)', border: '1px solid oklch(0.28 0.025 275 / 0.5)', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(v: number) => [formatCurrency(v), 'Value']}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {sectorData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </GlassCard>
            </div>

            {/* Add Holding */}
            <div className="mt-5">
              <AddHoldingForm onAdd={addHolding} />
            </div>
          </TabsContent>

          {/* Holdings Tab */}
          <TabsContent value="holdings">
            <GlassCard className="p-0 overflow-hidden">
              {holdings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <PieIcon size={40} className="text-muted-foreground mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">No holdings yet. Add your first position.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/20">
                        {['Asset', 'Shares', 'Live Price', 'Avg Cost', 'Value', 'P&L', ''].map(h => (
                          <th key={h} className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right first:text-left">{h}</th>
                        ))}
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
            </GlassCard>
            <div className="mt-5">
              <AddHoldingForm onAdd={addHolding} />
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <GlassCard className="p-5">
              <h3 className="font-semibold text-foreground mb-4 font-display flex items-center gap-2">
                <Activity size={15} className="text-cyan" /> 30-Day Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="benchmarkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#84cc16" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: 'oklch(0.16 0.022 275)', border: '1px solid oklch(0.28 0.025 275 / 0.5)', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(v: number) => [formatCurrency(v)]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="value" name="Portfolio" stroke="#a855f7" fill="url(#portfolioGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="benchmark" name="Benchmark" stroke="#84cc16" fill="url(#benchmarkGrad)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <RiskMetricsPanel holdings={holdings} riskScore={riskScore} />
              <GlassCard className="p-5">
                <h3 className="font-semibold text-foreground mb-4 font-display flex items-center gap-2">
                  <AlertTriangle size={15} className="text-lime" /> Risk Score Adjustment
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Manually adjust the risk score to reflect your portfolio's risk tolerance.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Risk Score</span>
                    <span className="text-lg font-bold font-display" style={{ color: getRiskLevel(riskScore).color }}>
                      {riskScore} — {getRiskLevel(riskScore).label}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={riskScore}
                    onChange={e => setRiskScore(Number(e.target.value))}
                    className="w-full accent-violet-500"
                    style={{ accentColor: '#a855f7' }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Conservative</span>
                    <span>Moderate</span>
                    <span>Aggressive</span>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-border/20">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {getRiskLevel(riskScore).description}. Consider diversifying across sectors to balance risk and return.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
