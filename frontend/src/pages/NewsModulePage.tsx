import React, { useState } from 'react';
import { useGetNewsArticles, useMarketAlerts } from '../hooks/useQueries';
import NewsArticleCard from '../components/NewsArticleCard';
import SentimentImpactChart from '../components/SentimentImpactChart';
import GlassCard from '../components/GlassCard';
import MarketAlertBanner from '../components/MarketAlertBanner';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, Search, TrendingUp, TrendingDown, Minus, BarChart2, Loader2 } from 'lucide-react';

export default function NewsModulePage() {
  const { data: articles = [], isLoading } = useGetNewsArticles();
  const { data: alerts, isLoading: alertsLoading } = useMarketAlerts();
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');

  const filtered = articles.filter(a => {
    const matchSearch = search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase());
    const matchSentiment = sentimentFilter === 'all' || a.sentiment.toLowerCase() === sentimentFilter;
    return matchSearch && matchSentiment;
  });

  const sorted = [...filtered].sort((a, b) => Number(b.date - a.date));

  const positiveCount = articles.filter(a => a.sentiment.toLowerCase() === 'positive').length;
  const negativeCount = articles.filter(a => a.sentiment.toLowerCase() === 'negative').length;
  const neutralCount = articles.filter(a => a.sentiment.toLowerCase() === 'neutral').length;
  const avgScore = articles.length > 0
    ? (articles.reduce((sum, a) => sum + Number(a.score), 0) / articles.length).toFixed(1)
    : '0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <Newspaper className="h-4 w-4" />
          News Intelligence
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Financial News Feed</h1>
        <p className="text-muted-foreground">
          AI-analyzed news with sentiment scoring and market impact indicators.
        </p>
      </div>

      {/* Market Alert Banner */}
      <MarketAlertBanner alerts={alerts} isLoading={alertsLoading} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <GlassCard className="text-center p-4">
          <div className="text-2xl font-bold font-display text-foreground">{articles.length}</div>
          <div className="text-xs text-muted-foreground">Total Articles</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold font-display text-emerald-400">
            <TrendingUp className="h-5 w-5" />{positiveCount}
          </div>
          <div className="text-xs text-muted-foreground">Positive</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold font-display text-red-400">
            <TrendingDown className="h-5 w-5" />{negativeCount}
          </div>
          <div className="text-xs text-muted-foreground">Negative</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold font-display text-yellow-400">
            <Minus className="h-5 w-5" />{neutralCount}
          </div>
          <div className="text-xs text-muted-foreground">Neutral</div>
        </GlassCard>
      </div>

      <Tabs defaultValue="feed">
        <TabsList className="mb-6 bg-secondary/50">
          <TabsTrigger value="feed" className="gap-2">
            <Newspaper className="h-4 w-4" />
            News Feed
          </TabsTrigger>
          <TabsTrigger value="chart" className="gap-2">
            <BarChart2 className="h-4 w-4" />
            Sentiment Chart
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search news..."
                className="pl-9 bg-secondary/50 border-border/50"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'positive', 'negative', 'neutral'].map(f => (
                <button
                  key={f}
                  onClick={() => setSentimentFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    sentimentFilter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sorted.length === 0 ? (
            <GlassCard className="text-center py-16">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {articles.length === 0 ? 'No News Articles Yet' : 'No Results Found'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {articles.length === 0
                  ? 'News articles will appear here once they are added to the platform.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {sorted.map(article => (
                <NewsArticleCard key={article._id.toString()} article={article} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chart">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-semibold text-foreground mb-1">Sentiment vs Market Impact</h3>
                <p className="text-xs text-muted-foreground">Correlation between news sentiment scores and simulated market price movement</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Avg Sentiment Score</div>
                <div className={`text-lg font-bold font-display ${Number(avgScore) > 0 ? 'text-emerald-400' : Number(avgScore) < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {Number(avgScore) > 0 ? '+' : ''}{avgScore}
                </div>
              </div>
            </div>
            {articles.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                No data available yet
              </div>
            ) : (
              <SentimentImpactChart articles={articles} height={320} />
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
