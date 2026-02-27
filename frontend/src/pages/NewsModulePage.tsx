import React, { useState, useEffect, useRef } from 'react';
import { useGetNewsArticles, useGetSummaryStatistics, useInitializeNewsDatabase, useMarketAlerts } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import MarketAlertBanner from '../components/MarketAlertBanner';
import UploadNewsModal from '../components/UploadNewsModal';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, Brain, Activity,
  Search, RefreshCw, Bell, ChevronDown, ChevronUp, BarChart2, Globe, Clock, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SentimentDataPoint {
  date: string;
  score: number;
  impact: number;
  sentiment: string;
  title: string;
}

interface SymbolImpactData {
  symbol: string;
  avgScore: number;
  articleCount: number;
  avgImpact: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sentimentColor = (s: string) => {
  if (s === 'very_positive') return '#10b981';
  if (s === 'positive') return '#34d399';
  if (s === 'neutral') return '#f59e0b';
  if (s === 'negative') return '#f87171';
  if (s === 'very_negative') return '#ef4444';
  return '#6b7280';
};

const sentimentLabel = (s: string) => {
  const map: Record<string, string> = {
    very_positive: 'Very Positive',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    very_negative: 'Very Negative',
  };
  return map[s] ?? s;
};

const formatDate = (ts: bigint) => {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatRelative = (ts: bigint) => {
  const ms = Number(ts) / 1_000_000;
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

// ─── Drastic Event Alert Generator ────────────────────────────────────────────
interface LocalAlert {
  id: string;
  headline: string;
  severity: 'critical' | 'high' | 'medium';
  symbols: string[];
  detectedAt: number;
  score: number;
  dismissed: boolean;
}

function generateLocalAlerts(articles: Array<{
  _id: bigint;
  title: string;
  symbols: string[];
  marketImpact: bigint;
  score: bigint;
  date: bigint;
}>): LocalAlert[] {
  const alerts: LocalAlert[] = [];
  for (const article of articles) {
    const impact = Number(article.marketImpact);
    const score = Number(article.score);
    const absScore = Math.abs(score);
    if (impact >= 85 || absScore >= 20) {
      const severity: 'critical' | 'high' | 'medium' =
        impact >= 90 || absScore >= 25 ? 'critical' :
        impact >= 80 || absScore >= 20 ? 'high' : 'medium';
      alerts.push({
        id: `local-${article._id}`,
        headline: article.title,
        severity,
        symbols: article.symbols,
        detectedAt: Number(article.date) / 1_000_000,
        score: impact,
        dismissed: false,
      });
    }
  }
  return alerts.sort((a, b) => b.detectedAt - a.detectedAt).slice(0, 5);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SentimentBadge({ sentiment }: { sentiment: string }) {
  const color = sentimentColor(sentiment);
  const label = sentimentLabel(sentiment);
  const Icon = sentiment.includes('positive') ? TrendingUp :
               sentiment.includes('negative') ? TrendingDown : Minus;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: color + '22', color, border: `1px solid ${color}55` }}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}

function ImpactBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 80 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{pct}</span>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg" style={{ background: color + '22' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Drastic Event Alert Panel ─────────────────────────────────────────────────
function DrasticEventAlerts({ articles }: { articles: Array<{
  _id: bigint;
  title: string;
  symbols: string[];
  marketImpact: bigint;
  score: bigint;
  date: bigint;
}> }) {
  const [alerts, setAlerts] = useState<LocalAlert[]>([]);
  const [newAlertIds, setNewAlertIds] = useState<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const generated = generateLocalAlerts(articles);
    setAlerts(generated);
  }, [articles]);

  // Simulate real-time detection: every 30s re-evaluate and potentially surface a new alert
  useEffect(() => {
    if (alerts.length === 0 || articles.length === 0) return;
    const interval = setInterval(() => {
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      if (!randomArticle) return;
      const impact = Number(randomArticle.marketImpact);
      if (impact >= 70) {
        const newId = `rt-${Date.now()}`;
        const severity: 'critical' | 'high' | 'medium' =
          impact >= 90 ? 'critical' : impact >= 80 ? 'high' : 'medium';
        const newAlert: LocalAlert = {
          id: newId,
          headline: `[LIVE] ${randomArticle.title}`,
          severity,
          symbols: randomArticle.symbols,
          detectedAt: Date.now(),
          score: impact,
          dismissed: false,
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
        setNewAlertIds(prev => new Set([...prev, newId]));
        // Play chime
        try {
          if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
          const ctx = audioCtxRef.current;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = severity === 'critical' ? 880 : severity === 'high' ? 660 : 440;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.8);
        } catch {
          // ignore audio errors
        }
        setTimeout(() => {
          setNewAlertIds(prev => {
            const s = new Set(prev);
            s.delete(newId);
            return s;
          });
        }, 3000);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [alerts, articles]);

  const dismiss = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-red-500/20">
          <Bell size={14} className="text-red-400 animate-pulse" />
        </div>
        <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Drastic Event Alerts</h3>
        <span className="ml-auto text-xs text-muted-foreground">{alerts.length} active</span>
      </div>
      <div className="space-y-2">
        {alerts.map(alert => {
          const isNew = newAlertIds.has(alert.id);
          const borderColor = alert.severity === 'critical' ? '#ef4444' :
                              alert.severity === 'high' ? '#f59e0b' : '#10b981';
          const bgColor = alert.severity === 'critical' ? 'rgba(239,68,68,0.08)' :
                          alert.severity === 'high' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)';
          return (
            <div
              key={alert.id}
              className={`rounded-lg p-3 flex items-start gap-3 transition-all ${isNew ? 'animate-pulse' : ''}`}
              style={{ background: bgColor, border: `1px solid ${borderColor}44` }}
            >
              <div className="mt-0.5">
                {alert.severity === 'critical' ? (
                  <AlertTriangle size={14} style={{ color: borderColor }} className="animate-pulse" />
                ) : (
                  <Zap size={14} style={{ color: borderColor }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ background: borderColor + '33', color: borderColor }}
                  >
                    {alert.severity}
                  </span>
                  {alert.symbols.slice(0, 3).map(s => (
                    <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-foreground font-mono">{s}</span>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(alert.detectedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">{alert.headline}</p>
                <div className="mt-1.5">
                  <ImpactBar value={alert.score} />
                </div>
              </div>
              <button
                onClick={() => dismiss(alert.id)}
                className="text-muted-foreground hover:text-foreground transition-colors text-xs ml-1 shrink-0"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ML Sentiment Impact Chart ─────────────────────────────────────────────────
function SentimentImpactChart({ data }: { data: SentimentDataPoint[] }) {
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-primary" />
        <h3 className="font-semibold text-foreground">ML Sentiment × Market Impact Timeline</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={sorted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="impactGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
            formatter={(val: number, name: string) => [val, name === 'score' ? 'Sentiment Score' : 'Market Impact']}
          />
          <Area type="monotone" dataKey="score" stroke="#10b981" fill="url(#scoreGrad)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="impact" stroke="#f59e0b" fill="url(#impactGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-center">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" /> Sentiment Score
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-0.5 bg-amber-400 inline-block rounded" /> Market Impact
        </span>
      </div>
    </div>
  );
}

// ─── Symbol Impact Radar ───────────────────────────────────────────────────────
function SymbolImpactRadar({ data }: { data: SymbolImpactData[] }) {
  const top = data.slice(0, 8);
  const radarData = top.map(d => ({
    symbol: d.symbol,
    impact: d.avgImpact,
    sentiment: Math.abs(d.avgScore),
    coverage: d.articleCount * 10,
  }));
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-accent" />
        <h3 className="font-semibold text-foreground">Symbol Impact Radar</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="symbol" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <PolarRadiusAxis tick={{ fontSize: 8, fill: '#9ca3af' }} />
          <Radar name="Impact" dataKey="impact" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
          <Radar name="Sentiment" dataKey="sentiment" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Sentiment Distribution Pie ────────────────────────────────────────────────
function SentimentPie({ stats }: {
  stats: { positiveCount: bigint; negativeCount: bigint; neutralCount: bigint; averageScore: number } | null | undefined;
}) {
  if (!stats) return null;
  const data = [
    { name: 'Positive', value: Number(stats.positiveCount), color: '#10b981' },
    { name: 'Neutral', value: Number(stats.neutralCount), color: '#f59e0b' },
    { name: 'Negative', value: Number(stats.negativeCount), color: '#ef4444' },
  ].filter(d => d.value > 0);
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={16} className="text-primary" />
        <h3 className="font-semibold text-foreground">Sentiment Distribution</h3>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
            dataKey="value" paddingAngle={3}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Market Movement Scatter ───────────────────────────────────────────────────
function MarketMovementScatter({ data }: { data: SentimentDataPoint[] }) {
  const scatterData = data.map(d => ({
    x: d.score,
    y: d.impact,
    z: 1,
    title: d.title,
    sentiment: d.sentiment,
  }));
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={16} className="text-accent" />
        <h3 className="font-semibold text-foreground">Sentiment vs Market Movement</h3>
        <span className="text-xs text-muted-foreground ml-auto">ML correlation analysis</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="x" name="Sentiment Score" tick={{ fontSize: 10, fill: '#9ca3af' }}
            label={{ value: 'Sentiment Score', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#9ca3af' }} />
          <YAxis dataKey="y" name="Market Impact" tick={{ fontSize: 10, fill: '#9ca3af' }}
            label={{ value: 'Impact', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' }} />
          <ZAxis dataKey="z" range={[40, 40]} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as { title: string; x: number; y: number };
              return (
                <div className="p-2 text-xs bg-[#0f172a] border border-white/10 rounded-lg">
                  <p className="font-semibold text-foreground mb-1 max-w-[180px] truncate">{d.title}</p>
                  <p>Score: <span className="text-emerald-400">{d.x}</span></p>
                  <p>Impact: <span className="text-amber-400">{d.y}</span></p>
                </div>
              );
            }}
          />
          <Scatter data={scatterData} fill="#10b981">
            {scatterData.map((entry, i) => (
              <Cell key={i} fill={sentimentColor(entry.sentiment)} fillOpacity={0.8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── News Article Card ─────────────────────────────────────────────────────────
function ArticleCard({ article, expanded, onToggle }: {
  article: {
    _id: bigint;
    title: string;
    summary: string;
    symbols: string[];
    sentiment: string;
    score: bigint;
    marketImpact: bigint;
    date: bigint;
  };
  expanded: boolean;
  onToggle: () => void;
}) {
  const impact = Number(article.marketImpact);
  const score = Number(article.score);
  return (
    <div
      className="glass-card rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <SentimentBadge sentiment={article.sentiment} />
            {article.symbols.slice(0, 3).map((s: string) => (
              <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono border border-primary/20">{s}</span>
            ))}
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={10} />
              {formatRelative(article.date)}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-foreground leading-snug">{article.title}</h4>
          {expanded && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{article.summary}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground mb-1">ML Sentiment Score</p>
                  <p className="text-lg font-bold" style={{ color: score >= 0 ? '#10b981' : '#ef4444' }}>
                    {score >= 0 ? '+' : ''}{score}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground mb-1">Market Impact</p>
                  <ImpactBar value={impact} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 mt-0.5">
          {expanded
            ? <ChevronUp size={14} className="text-muted-foreground" />
            : <ChevronDown size={14} className="text-muted-foreground" />
          }
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function NewsModulePage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: articles = [], isLoading: articlesLoading } = useGetNewsArticles();
  const { data: stats } = useGetSummaryStatistics();
  const { data: backendAlerts = [] } = useMarketAlerts();
  const { mutate: initDb, isPending: initPending } = useInitializeNewsDatabase();

  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'analytics'>('feed');

  // Build chart data
  const sentimentData: SentimentDataPoint[] = articles.map(a => ({
    date: formatDate(a.date),
    score: Number(a.score),
    impact: Number(a.marketImpact),
    sentiment: a.sentiment,
    title: a.title,
  }));

  // Symbol impact aggregation
  const symbolMap = new Map<string, { scores: number[]; impacts: number[] }>();
  for (const a of articles) {
    for (const sym of a.symbols) {
      if (!symbolMap.has(sym)) symbolMap.set(sym, { scores: [], impacts: [] });
      symbolMap.get(sym)!.scores.push(Number(a.score));
      symbolMap.get(sym)!.impacts.push(Number(a.marketImpact));
    }
  }
  const symbolImpactData: SymbolImpactData[] = Array.from(symbolMap.entries())
    .map(([symbol, { scores, impacts }]) => ({
      symbol,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      articleCount: scores.length,
      avgImpact: impacts.reduce((a, b) => a + b, 0) / impacts.length,
    }))
    .sort((a, b) => b.avgImpact - a.avgImpact);

  // Filtered articles
  const filtered = articles.filter(a => {
    const matchSearch = search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()) ||
      a.symbols.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchSentiment = sentimentFilter === 'all' || a.sentiment === sentimentFilter;
    return matchSearch && matchSentiment;
  });

  const avgScore = stats ? stats.averageScore.toFixed(1) : '—';
  const totalArticles = articles.length;
  const positiveRatio = stats && totalArticles > 0
    ? Math.round((Number(stats.positiveCount) / totalArticles) * 100)
    : 0;

  // Compute next article ID for upload modal
  const nextId = articles.length > 0
    ? BigInt(Math.max(...articles.map(a => Number(a._id))) + 1)
    : BigInt(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Brain size={20} className="text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Financial News Intelligence</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                ML-powered sentiment analysis evaluating financial news and its real-time impact on market movement.
              </p>
            </div>
            {isAuthenticated && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpload(true)}
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  + Upload Article
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => initDb()}
                  disabled={initPending}
                  className="border-border/50 text-muted-foreground hover:bg-white/5"
                >
                  {initPending ? <RefreshCw size={14} className="animate-spin mr-1" /> : null}
                  Seed DB
                </Button>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <StatCard label="Total Articles" value={totalArticles} icon={Globe} color="#10b981" />
            <StatCard label="Avg ML Score" value={avgScore} sub="sentiment index" icon={Brain} color="#6366f1" />
            <StatCard label="Positive Ratio" value={`${positiveRatio}%`} sub="bullish coverage" icon={TrendingUp} color="#f59e0b" />
            <StatCard label="Active Alerts" value={backendAlerts.length} sub="market events" icon={Bell} color="#ef4444" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Drastic Event Alerts */}
        <DrasticEventAlerts articles={articles} />

        {/* Backend alerts banner */}
        <MarketAlertBanner alerts={backendAlerts ?? []} />

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-border/30 w-fit mb-6">
          {(['feed', 'analytics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'feed' ? '📰 News Feed' : '📊 ML Analytics'}
            </button>
          ))}
        </div>

        {activeTab === 'analytics' ? (
          /* ── Analytics Tab ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SentimentImpactChart data={sentimentData} />
              <SentimentPie stats={stats} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MarketMovementScatter data={sentimentData} />
              <SymbolImpactRadar data={symbolImpactData} />
            </div>
            {/* Symbol breakdown table */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={16} className="text-primary" />
                <h3 className="font-semibold text-foreground">Symbol Impact Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Symbol</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Articles</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Avg Score</th>
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Avg Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symbolImpactData.slice(0, 10).map(row => (
                      <tr key={row.symbol} className="border-b border-border/10 hover:bg-white/3 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-primary">{row.symbol}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">{row.articleCount}</td>
                        <td
                          className="py-2 px-3 text-right font-mono"
                          style={{ color: row.avgScore >= 0 ? '#10b981' : '#ef4444' }}
                        >
                          {row.avgScore >= 0 ? '+' : ''}{row.avgScore.toFixed(1)}
                        </td>
                        <td className="py-2 px-3 w-32"><ImpactBar value={row.avgImpact} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ── News Feed Tab ── */
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search articles, symbols..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 bg-white/5 border-border/30 text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'very_positive', 'positive', 'neutral', 'negative', 'very_negative'].map(f => (
                  <button
                    key={f}
                    onClick={() => setSentimentFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      sentimentFilter === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-white/5 text-muted-foreground border-border/30 hover:border-primary/30'
                    }`}
                  >
                    {f === 'all' ? 'All' : sentimentLabel(f)}
                  </button>
                ))}
              </div>
            </div>

            {articlesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Globe size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No articles found</p>
                <p className="text-sm mt-1">Try adjusting your filters or seed the database</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(article => (
                  <ArticleCard
                    key={article._id.toString()}
                    article={article}
                    expanded={expandedId === article._id}
                    onToggle={() => setExpandedId(expandedId === article._id ? null : article._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal — pass required props */}
      {showUpload && (
        <UploadNewsModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          nextId={nextId}
        />
      )}
    </div>
  );
}
