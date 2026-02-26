import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Plus } from 'lucide-react';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, symbols: string[]) => void;
  isLoading?: boolean;
}

export default function CreatePostModal({
  open,
  onClose,
  onSubmit,
  isLoading,
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [symbolInput, setSymbolInput] = useState('');
  const [symbols, setSymbols] = useState<string[]>([]);

  const handleAddSymbol = () => {
    const sym = symbolInput.trim().toUpperCase();
    if (sym && !symbols.includes(sym) && symbols.length < 5) {
      setSymbols([...symbols, sym]);
      setSymbolInput('');
    }
  };

  const handleSymbolKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSymbol();
    }
  };

  const handleRemoveSymbol = (sym: string) => {
    setSymbols(symbols.filter(s => s !== sym));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content.trim(), symbols);
    setContent('');
    setSymbols([]);
    setSymbolInput('');
  };

  const handleClose = () => {
    setContent('');
    setSymbols([]);
    setSymbolInput('');
    onClose();
  };

  const remaining = 500 - content.length;

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="glass-card border-border/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Share Your Insight</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Your Post</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value.slice(0, 500))}
              placeholder="Share your market insights, analysis, or questions with the community..."
              rows={4}
              className="bg-secondary/50 border-border/50 resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Max 500 characters</p>
              <p
                className={`text-xs font-medium ${
                  remaining < 50 ? 'text-red-400' : 'text-muted-foreground'
                }`}
              >
                {remaining} remaining
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stock Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                value={symbolInput}
                onChange={e => setSymbolInput(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={handleSymbolKeyDown}
                placeholder="e.g. AAPL"
                className="bg-secondary/50 border-border/50 uppercase"
                maxLength={6}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddSymbol}
                disabled={!symbolInput.trim() || symbols.length >= 5}
                className="border-border/50 shrink-0"
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
                    className="text-xs border-primary/30 text-primary gap-1 pr-1"
                  >
                    ${sym}
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
            <p className="text-xs text-muted-foreground">Add up to 5 stock symbols to tag your post</p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!content.trim() || isLoading}
              className="btn-teal"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Posting...
                </>
              ) : (
                'Post Insight'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
