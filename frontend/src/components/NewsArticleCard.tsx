import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { NewsArticle } from '../backend';
import GlassCard from './GlassCard';

interface NewsArticleCardProps {
  article: NewsArticle;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const lower = sentiment.toLowerCase();
  if (lower === 'positive') return <span className="sentiment-positive px-2 py-0.5 rounded-full text-xs font-medium">Positive</span>;
  if (lower === 'negative') return <span className="sentiment-negative px-2 py-0.5 rounded-full text-xs font-medium">Negative</span>;
  return <span className="sentiment-neutral px-2 py-0.5 rounded-full text-xs font-medium">Neutral</span>;
}

function ImpactIcon({ impact }: { impact: bigint }) {
  const val = Number(impact);
  if (val > 0) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  if (val < 0) return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-yellow-400" />;
}

export default function NewsArticleCard({ article }: NewsArticleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(Number(article.date) / 1_000_000);

  return (
    <GlassCard
      hover
      onClick={() => setExpanded(!expanded)}
      className="transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <SentimentBadge sentiment={article.sentiment} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ImpactIcon impact={article.marketImpact} />
              <span>Impact: {Number(article.marketImpact) > 0 ? '+' : ''}{Number(article.marketImpact)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <h3 className="font-display font-semibold text-foreground text-sm leading-snug mb-1">
            {article.title}
          </h3>
          {!expanded && (
            <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
          )}
          {expanded && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-2 animate-fade-in">{article.summary}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Score</div>
            <div className={`text-sm font-bold ${Number(article.score) > 0 ? 'text-emerald-400' : Number(article.score) < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
              {Number(article.score) > 0 ? '+' : ''}{Number(article.score)}
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && article.symbols.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/30 animate-fade-in">
          <span className="text-xs text-muted-foreground">Related:</span>
          {article.symbols.map(sym => (
            <Badge key={sym} variant="outline" className="text-xs border-primary/30 text-primary">
              {sym}
            </Badge>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
