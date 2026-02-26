import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, CheckCircle, XCircle } from 'lucide-react';
import type { Prediction } from '../backend';
import GlassCard from './GlassCard';

interface PredictionCardProps {
  prediction: Prediction;
  index: number;
}

function DirectionBadge({ direction }: { direction: string }) {
  if (direction === 'Up') return (
    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-sm">
      <TrendingUp className="h-4 w-4" /> Up
    </span>
  );
  if (direction === 'Down') return (
    <span className="flex items-center gap-1 text-red-400 font-semibold text-sm">
      <TrendingDown className="h-4 w-4" /> Down
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-yellow-400 font-semibold text-sm">
      <Minus className="h-4 w-4" /> Flat
    </span>
  );
}

export default function PredictionCard({ prediction, index }: PredictionCardProps) {
  const isCorrect = prediction.direction === prediction.actualOutcome;

  return (
    <GlassCard className="animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-primary text-lg">{prediction.stockSymbol}</span>
          <Badge variant="outline" className="text-xs border-border/50">
            #{index + 1}
          </Badge>
        </div>
        {isCorrect ? (
          <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Correct
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-400 text-sm font-medium">
            <XCircle className="h-4 w-4" />
            Incorrect
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground mb-1">Your Prediction</p>
          <DirectionBadge direction={prediction.direction} />
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground mb-1">AI Prediction</p>
          <DirectionBadge direction={prediction.aiPrediction} />
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground mb-1">Actual Outcome</p>
          <DirectionBadge direction={prediction.actualOutcome} />
        </div>
      </div>

      {prediction.result && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
          <p className="text-xs text-muted-foreground leading-relaxed">{prediction.result}</p>
        </div>
      )}
    </GlassCard>
  );
}
