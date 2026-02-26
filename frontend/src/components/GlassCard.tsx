import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'teal' | 'gold' | 'none';
  onClick?: () => void;
}

export default function GlassCard({ children, className, hover = false, glow = 'none', onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card rounded-xl p-4',
        hover && 'transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer',
        glow === 'teal' && 'hover:shadow-teal',
        glow === 'gold' && 'hover:shadow-gold',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
