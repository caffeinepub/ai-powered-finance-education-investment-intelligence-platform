import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';
import type { Message } from '../backend';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  isUser: boolean;
  displayName?: string;
}

export default function ChatMessage({ message, isUser, displayName }: ChatMessageProps) {
  const time = new Date(Number(message.timestamp) / 1_000_000);
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={cn('flex gap-3 animate-fade-in', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className="shrink-0">
        {isUser ? (
          <Avatar className="h-8 w-8 border border-primary/30">
            <AvatarImage src="/assets/generated/default-avatar.dim_128x128.png" />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {displayName ? displayName.slice(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center">
            <Bot className="h-4 w-4 text-teal" />
          </div>
        )}
      </div>

      <div className={cn('max-w-[75%] space-y-1', isUser ? 'items-end' : 'items-start', 'flex flex-col')}>
        <div className={cn(
          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-primary/20 border border-primary/20 text-foreground rounded-tr-sm'
            : 'glass-card border-border/40 text-foreground rounded-tl-sm'
        )}>
          {message.content}
        </div>
        <span className="text-xs text-muted-foreground px-1">{timeStr}</span>
      </div>
    </div>
  );
}
