import React, { useState } from 'react';
import { useActor } from '../hooks/useActor';
import { NewsArticle, Alert, LeaderboardEntry } from '../backend';
import { Code, Play, Loader2, ChevronDown, ChevronUp, Zap, Database, BarChart2, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Types ────────────────────────────────────────────────────────────────────

type EndpointResult = NewsArticle[] | Alert[] | string[] | LeaderboardEntry[] | null;

interface EndpointDef {
  name: string;
  description: string;
  returnType: string;
  schema: string;
  icon: React.ElementType;
  color: string;
  call: (actor: any) => Promise<EndpointResult>;
}

// ─── Endpoint Definitions ─────────────────────────────────────────────────────

const endpoints: EndpointDef[] = [
  {
    name: 'getPublicNewsFeed',
    description: 'Returns all published news articles with sentiment scores, market impact ratings, and related stock symbols. No authentication required.',
    returnType: 'NewsArticle[]',
    schema: `{
  _id: bigint;
  title: string;
  summary: string;
  date: bigint;       // nanoseconds since epoch
  symbols: string[];  // related stock tickers
  sentiment: string;  // "bullish" | "bearish" | "neutral"
  score: bigint;      // sentiment score
  marketImpact: bigint;
}[]`,
    icon: Database,
    color: 'teal',
    call: (actor) => actor.getPublicNewsFeed(),
  },
  {
    name: 'getPublicMarketAlerts',
    description: 'Returns all market alerts sorted by trigger time descending. Includes severity levels (critical, high, medium) and sentiment scores.',
    returnType: 'Alert[]',
    schema: `{
  id: bigint;
  headline: string;
  relatedSymbols: string[];
  severity: "critical" | "high" | "medium";
  triggeredAt: bigint; // nanoseconds since epoch
  sentimentScore: number;
}[]`,
    icon: Zap,
    color: 'gold',
    call: (actor) => actor.getPublicMarketAlerts(),
  },
  {
    name: 'getPublicStockList',
    description: 'Returns the list of tracked stock symbols available on the platform. Use this to discover which tickers are supported.',
    returnType: 'StockSymbol[]',
    schema: `string[] // e.g. ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA"]`,
    icon: BarChart2,
    color: 'teal',
    call: (actor) => actor.getPublicStockList(),
  },
  {
    name: 'getPublicLeaderboard',
    description: 'Returns anonymised leaderboard entries showing display names and prediction accuracy rates. No principal IDs or private data are exposed.',
    returnType: 'LeaderboardEntry[]',
    schema: `{
  displayName: string;
  accuracyRate: number; // 0.0 – 1.0
}[]`,
    icon: Trophy,
    color: 'gold',
    call: (actor) => actor.getPublicLeaderboard(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(
      value,
      (_key, val) => (typeof val === 'bigint' ? val.toString() : val),
      2
    );
  } catch {
    return String(value);
  }
}

// ─── Endpoint Card ────────────────────────────────────────────────────────────

interface EndpointCardProps {
  endpoint: EndpointDef;
}

function EndpointCard({ endpoint }: EndpointCardProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);

  const isTeal = endpoint.color === 'teal';
  const Icon = endpoint.icon;

  const handleTryIt = async () => {
    if (!actor) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await endpoint.call(actor);
      setResult(formatJson(data));
    } catch (err: any) {
      setError(err?.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-border/40">
      {/* Header */}
      <div className={`px-5 py-4 border-b border-border/30 flex items-start gap-3 ${isTeal ? 'bg-teal/5' : 'bg-gold/5'}`}>
        <div className={`mt-0.5 p-2 rounded-lg ${isTeal ? 'bg-teal/15 text-teal' : 'bg-gold/15 text-gold'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-sm font-semibold text-foreground">{endpoint.name}()</code>
            <Badge variant="outline" className={`text-[10px] font-mono ${isTeal ? 'border-teal/40 text-teal' : 'border-gold/40 text-gold'}`}>
              QUERY
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono border-border/40 text-muted-foreground">
              {endpoint.returnType}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{endpoint.description}</p>
        </div>
      </div>

      {/* Schema toggle */}
      <div className="px-5 py-3 border-b border-border/20">
        <button
          onClick={() => setSchemaOpen(!schemaOpen)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Code className="h-3.5 w-3.5" />
          <span>Return Schema</span>
          {schemaOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {schemaOpen && (
          <pre className="mt-2 p-3 rounded-lg bg-secondary/40 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
            {endpoint.schema}
          </pre>
        )}
      </div>

      {/* Try It */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try It</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleTryIt}
            disabled={loading || actorFetching || !actor}
            className={`h-7 text-xs gap-1.5 ${isTeal ? 'border-teal/40 text-teal hover:bg-teal/10' : 'border-gold/40 text-gold hover:bg-gold/10'}`}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {loading ? 'Running…' : 'Run Query'}
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive font-mono">
            Error: {error}
          </div>
        )}

        {result !== null && (
          <ScrollArea className="h-48 rounded-lg border border-border/30 bg-secondary/30">
            <pre className="p-3 text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap break-all">
              {result}
            </pre>
          </ScrollArea>
        )}

        {result === null && !error && !loading && (
          <div className="h-12 flex items-center justify-center rounded-lg border border-dashed border-border/30">
            <span className="text-xs text-muted-foreground">Response will appear here</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApiReferencePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="mb-10 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold uppercase tracking-wider">
          <Zap className="h-3 w-3" />
          Public API
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          API Reference
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
          FinIQ exposes a set of public read-only query endpoints on the Internet Computer.
          All calls are Candid query calls — no authentication required, no state mutation.
        </p>
        <div className="flex items-center justify-center gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-teal inline-block" />
            Query (read-only)
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-gold inline-block" />
            No auth required
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            Live data
          </div>
        </div>
      </div>

      {/* Endpoint Cards */}
      <div className="grid grid-cols-1 gap-5">
        {endpoints.map((ep) => (
          <EndpointCard key={ep.name} endpoint={ep} />
        ))}
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        All endpoints are Candid query calls on the Internet Computer canister.
        Responses are returned in nanosecond timestamps (bigint).
      </p>
    </div>
  );
}
