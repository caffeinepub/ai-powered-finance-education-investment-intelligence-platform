import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { mockStocks } from '../data/mockStocks';
import type { Holding } from '../backend';

interface HoldingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (holding: Holding) => void;
  initialHolding?: Holding;
  isLoading?: boolean;
}

export default function HoldingForm({ open, onClose, onSubmit, initialHolding, isLoading }: HoldingFormProps) {
  const [symbol, setSymbol] = useState(initialHolding?.symbol ?? '');
  const [shares, setShares] = useState(initialHolding ? Number(initialHolding.shares).toString() : '');
  const [avgBuyPrice, setAvgBuyPrice] = useState(initialHolding ? initialHolding.avgBuyPrice.toString() : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !shares || !avgBuyPrice) return;
    onSubmit({
      symbol,
      shares: BigInt(Math.floor(Number(shares))),
      avgBuyPrice: parseFloat(avgBuyPrice),
    });
  };

  const selectedStock = mockStocks.find(s => s.symbol === symbol);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {initialHolding ? 'Edit Holding' : 'Add Holding'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Stock Symbol</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue placeholder="Select a stock..." />
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
            {selectedStock && (
              <p className="text-xs text-muted-foreground">
                Current price: <span className="text-primary font-medium">${selectedStock.currentPrice.toFixed(2)}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Number of Shares</Label>
            <Input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="e.g. 10"
              min="1"
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Average Buy Price ($)</Label>
            <Input
              type="number"
              value={avgBuyPrice}
              onChange={(e) => setAvgBuyPrice(e.target.value)}
              placeholder="e.g. 150.00"
              step="0.01"
              min="0.01"
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={!symbol || !shares || !avgBuyPrice || isLoading}
              className="btn-teal"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {initialHolding ? 'Update' : 'Add Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
