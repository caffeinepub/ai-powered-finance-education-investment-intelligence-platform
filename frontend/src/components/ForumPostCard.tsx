import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, Clock } from 'lucide-react';
import type { Post } from '../backend';
import GlassCard from './GlassCard';

interface ForumPostCardProps {
  post: Post;
  index: number;
  onUpvote: (index: bigint) => void;
  isUpvoting?: boolean;
  authorName?: string;
}

export default function ForumPostCard({ post, index, onUpvote, isUpvoting, authorName }: ForumPostCardProps) {
  const time = new Date(Number(post.timestamp) / 1_000_000);
  const timeAgo = getTimeAgo(time);
  const shortPrincipal = post.author.toString().slice(0, 8) + '...';

  return (
    <GlassCard className="animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUpvote(BigInt(index))}
            disabled={isUpvoting}
            className="h-8 w-8 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold text-primary">{Number(post.votes)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-medium text-foreground">
              {authorName ?? shortPrincipal}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </div>
          </div>

          <p className="text-sm text-foreground leading-relaxed mb-2">{post.content}</p>

          {post.symbols.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.symbols.map(sym => (
                <Badge key={sym} variant="outline" className="text-xs border-primary/30 text-primary">
                  ${sym}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
