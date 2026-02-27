import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, CheckCircle2, Upload } from 'lucide-react';
import { useAddNewsArticle } from '../hooks/useQueries';
import type { NewsArticle } from '../backend';

interface UploadNewsModalProps {
  open: boolean;
  onClose: () => void;
  nextId: bigint;
}

export default function UploadNewsModal({ open, onClose, nextId }: UploadNewsModalProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [symbolInput, setSymbolInput] = useState('');
  const [symbols, setSymbols] = useState<string[]>([]);
  const [marketImpact, setMarketImpact] = useState('70');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const addArticle = useAddNewsArticle();

  const handleAddSymbol = () => {
    const sym = symbolInput.trim().toUpperCase();
    if (sym && !symbols.includes(sym) && symbols.length < 5) {
      setSymbols(prev => [...prev, sym]);
      setSymbolInput('');
    }
  };

  const handleSymbolKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSymbol();
    }
  };

  const handleRemoveSymbol = (sym: string) => {
    setSymbols(prev => prev.filter(s => s !== sym));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!summary.trim()) {
      setError('Summary is required.');
      return;
    }

    const impact = parseInt(marketImpact, 10);
    if (isNaN(impact) || impact < 0 || impact > 100) {
      setError('Market impact must be a number between 0 and 100.');
      return;
    }

    const article: NewsArticle = {
      _id: nextId,
      title: title.trim(),
      summary: summary.trim(),
      date: BigInt(Date.now()) * BigInt(1_000_000), // nanoseconds
      symbols,
      sentiment: 'neutral', // will be recalculated by backend
      score: BigInt(0),
      marketImpact: BigInt(impact),
    };

    try {
      await addArticle.mutateAsync(article);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload article.';
      setError(msg.includes('Unauthorized') ? 'Only admins can upload news articles.' : msg);
    }
  };

  const handleClose = () => {
    setTitle('');
    setSummary('');
    setSymbolInput('');
    setSymbols([]);
    setMarketImpact('70');
    setSuccess(false);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload News Article
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Add a new financial news article. Sentiment score is calculated automatically from the summary.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-14 w-14 text-emerald-400" />
            <div className="text-center">
              <h3 className="font-display font-semibold text-foreground text-lg mb-1">Article Published!</h3>
              <p className="text-muted-foreground text-sm">The news article has been added to the feed.</p>
            </div>
            <Button onClick={handleClose} className="mt-2">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="news-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="news-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Apple Beats Q3 Earnings Expectations"
                className="bg-secondary/50 border-border/50"
                maxLength={200}
              />
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <Label htmlFor="news-summary">
                Summary <span className="text-destructive">*</span>
                <span className="text-muted-foreground text-xs ml-2">(used for sentiment scoring)</span>
              </Label>
              <Textarea
                id="news-summary"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Write a concise summary of the news article..."
                className="bg-secondary/50 border-border/50 resize-none"
                rows={4}
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground text-right">{summary.length}/1000</div>
            </div>

            {/* Stock Symbols */}
            <div className="space-y-1.5">
              <Label>Related Stock Symbols <span className="text-muted-foreground text-xs">(optional, up to 5)</span></Label>
              <div className="flex gap-2">
                <Input
                  value={symbolInput}
                  onChange={e => setSymbolInput(e.target.value.toUpperCase())}
                  onKeyDown={handleSymbolKeyDown}
                  placeholder="e.g. AAPL"
                  className="bg-secondary/50 border-border/50 uppercase"
                  maxLength={10}
                  disabled={symbols.length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddSymbol}
                  disabled={!symbolInput.trim() || symbols.length >= 5}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {symbols.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {symbols.map(sym => (
                    <Badge
                      key={sym}
                      variant="outline"
                      className="border-primary/40 text-primary gap-1 pr-1"
                    >
                      {sym}
                      <button
                        type="button"
                        onClick={() => handleRemoveSymbol(sym)}
                        className="hover:text-destructive transition-colors ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Market Impact */}
            <div className="space-y-1.5">
              <Label htmlFor="market-impact">
                Market Impact Score
                <span className="text-muted-foreground text-xs ml-2">(0–100)</span>
              </Label>
              <Input
                id="market-impact"
                type="number"
                min={0}
                max={100}
                value={marketImpact}
                onChange={e => setMarketImpact(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={addArticle.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={addArticle.isPending} className="gap-2">
                {addArticle.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Publish Article
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
