import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { mockStocks, generateAIPrediction, simulateOutcome } from '../data/mockStocks';
import { useGetUserPredictions, useSubmitPrediction } from '../hooks/useQueries';
import StockPriceChart from '../components/StockPriceChart';
import LivePriceTicker from '../components/LivePriceTicker';
import LivePriceChart from '../components/LivePriceChart';
import PredictionCard from '../components/PredictionCard';
import GlassCard from '../components/GlassCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus, Loader2, Bot, User, Target, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Prediction } from '../backend';

type Direction = 'Up' | 'Down' | 'Flat';

export default function StockPlaygroundPage() {
  const { identity } = useInternetIdentity();
  const [selectedSymbol, setSelectedSymbol] = useState(mockStocks[0].symbol);
  const [userDirection, setUserDirection] = useState<Direction | null>(null);
  const [pendingResult, setPendingResult] = useState<{
    aiPrediction: { direction: string; confidence: number; reasoning: string };
    outcome: { outcome: string; explanation: string };
  } | null>(null);

  const { data: predictions = [], isLoading: predictionsLoading } = useGetUserPredictions();
  const submitPrediction = useSubmitPrediction();

  const selectedStock = mockStocks.find(s => s.symbol === selectedSymbol)!;
  const isPositive = selectedStock.change >= 0;

  const handleSubmit = async () => {
    if (!userDirection || !identity) return;

    const aiPred = generateAIPrediction(selectedStock);
    const outcome = simulateOutcome(selectedStock);

    const isUserCorrect = userDirection === outcome.outcome;
    const isAiCorrect = aiPred.direction === outcome.outcome;

    const explanation = `${outcome.explanation} Your prediction was ${isUserCorrect ? 'correct ✓' : 'incorrect ✗'}. The AI predicted ${aiPred.direction} (${isUserCorrect === isAiCorrect ? 'also ' : ''}${isAiCorrect ? 'correct' : 'incorrect'}). ${aiPred.reasoning}`;

    const prediction: Prediction = {
      user: identity.getPrincipal(),
      stockSymbol: selectedSymbol,
      direction: userDirection,
      aiPrediction: aiPred.direction,
      actualOutcome: outcome.outcome,
      result: explanation,
    };

    setPendingResult({ aiPrediction: aiPred, outcome });

    try {
      await submitPrediction.mutateAsync(prediction);
    } catch {
      // Continue
    }
  };

  const correctPredictions = predictions.filter(p => p.direction === p.actualOutcome).length;
  const accuracy = predictions.length > 0 ? Math.round((correctPredictions / predictions.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <TrendingUp className="h-4 w-4" />
          Stock Prediction Playground
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Prediction Arena</h1>
        <p className="text-muted-foreground">
          Predict stock movements and compare with AI-generated forecasts.
        </p>
      </div>

      <Tabs defaultValue="predict">
        <TabsList className="mb-6 bg-secondary/50">
          <TabsTrigger value="predict" className="gap-2">
            <Target className="h-4 w-4" />
            Make Prediction
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History ({predictions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predict">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Stock Selection, Live Ticker, Charts */}
            <div className="lg:col-span-2 space-y-5">
              {/* Stock Selector */}
              <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1.5 block">Select Stock</label>
                    <Select value={selectedSymbol} onValueChange={(v) => { setSelectedSymbol(v); setUserDirection(null); setPendingResult(null); }}>
                      <SelectTrigger className="bg-secondary/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50">
                        {mockStocks.map(s => (
                          <SelectItem key={s.symbol} value={s.symbol}>
                            <span className="font-semibold">{s.symbol}</span>
                            <span className="text-muted-foreground ml-2 text-xs">{s.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Change</div>
                      <div className={cn('font-semibold text-sm', isPositive ? 'text-emerald-400' : 'text-red-400')}>
                        {isPositive ? '+' : ''}{selectedStock.change.toFixed(2)} ({isPositive ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Sector</div>
                      <Badge variant="outline" className="text-xs border-border/50">{selectedStock.sector}</Badge>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Live Price Ticker */}
              <LivePriceTicker symbol={selectedSymbol} />

              {/* Live Price Chart */}
              <LivePriceChart symbol={selectedSymbol} height={200} />

              {/* Historical Chart */}
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground">
                    Historical Price
                    <span className="text-xs text-muted-foreground font-normal ml-2">— 30 Day History</span>
                  </h3>
                  <Badge variant="outline" className="text-xs border-border/50">{selectedStock.marketCap}</Badge>
                </div>
                <StockPriceChart data={selectedStock.history} symbol={selectedStock.symbol} height={220} />
              </GlassCard>

              {/* Pending Result */}
              {pendingResult && (
                <GlassCard className="border-primary/20 animate-fade-in">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Round Result
                  </h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <User className="h-3 w-3" /> Your Prediction
                      </div>
                      <div className={cn('font-bold', userDirection === 'Up' ? 'text-emerald-400' : userDirection === 'Down' ? 'text-red-400' : 'text-yellow-400')}>
                        {userDirection}
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                        <Bot className="h-3 w-3" /> AI Prediction
                      </div>
                      <div className={cn('font-bold', pendingResult.aiPrediction.direction === 'Up' ? 'text-emerald-400' : pendingResult.aiPrediction.direction === 'Down' ? 'text-red-400' : 'text-yellow-400')}>
                        {pendingResult.aiPrediction.direction}
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <div className="text-xs text-muted-foreground mb-1">Actual Outcome</div>
                      <div className={cn('font-bold', pendingResult.outcome.outcome === 'Up' ? 'text-emerald-400' : pendingResult.outcome.outcome === 'Down' ? 'text-red-400' : 'text-yellow-400')}>
                        {pendingResult.outcome.outcome}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground leading-relaxed">{pendingResult.outcome.explanation}</p>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="text-primary font-semibold">AI Reasoning: </span>
                      {pendingResult.aiPrediction.reasoning}
                    </p>
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Right: Prediction Panel */}
            <div className="space-y-5">
              {/* Stats */}
              <GlassCard>
                <h3 className="font-display font-semibold text-foreground mb-4">Your Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-2xl font-bold font-display text-teal">{predictions.length}</div>
                    <div className="text-xs text-muted-foreground">Total Predictions</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="text-2xl font-bold font-display text-gold">{accuracy}%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                </div>
              </GlassCard>

              {/* Prediction Input */}
              <GlassCard>
                <h3 className="font-display font-semibold text-foreground mb-4">Make Your Prediction</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Where do you think <span className="text-primary font-semibold">{selectedSymbol}</span> will move next?
                </p>

                <div className="space-y-2 mb-5">
                  {(['Up', 'Down', 'Flat'] as Direction[]).map(dir => (
                    <button
                      key={dir}
                      onClick={() => setUserDirection(dir)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150',
                        userDirection === dir
                          ? dir === 'Up' ? 'border-emerald-400/60 bg-emerald-400/10' : dir === 'Down' ? 'border-red-400/60 bg-red-400/10' : 'border-yellow-400/60 bg-yellow-400/10'
                          : 'border-border/40 hover:border-border/70 hover:bg-secondary/30'
                      )}
                    >
                      {dir === 'Up' && <TrendingUp className={cn('h-5 w-5', userDirection === dir ? 'text-emerald-400' : 'text-muted-foreground')} />}
                      {dir === 'Down' && <TrendingDown className={cn('h-5 w-5', userDirection === dir ? 'text-red-400' : 'text-muted-foreground')} />}
                      {dir === 'Flat' && <Minus className={cn('h-5 w-5', userDirection === dir ? 'text-yellow-400' : 'text-muted-foreground')} />}
                      <span className={cn('font-semibold text-sm', userDirection === dir ? (dir === 'Up' ? 'text-emerald-400' : dir === 'Down' ? 'text-red-400' : 'text-yellow-400') : 'text-foreground')}>
                        {dir}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {dir === 'Up' ? 'Price will rise' : dir === 'Down' ? 'Price will fall' : 'Price stays flat'}
                      </span>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!userDirection || submitPrediction.isPending}
                  className="w-full btn-teal"
                >
                  {submitPrediction.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</>
                  ) : (
                    'Submit Prediction'
                  )}
                </Button>
              </GlassCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          {predictionsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : predictions.length === 0 ? (
            <GlassCard className="text-center py-16">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">No Predictions Yet</h3>
              <p className="text-muted-foreground text-sm">Make your first prediction to see your history here.</p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {[...predictions].reverse().map((pred, i) => (
                <PredictionCard key={i} prediction={pred} index={predictions.length - 1 - i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
