import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'teal' | 'gold' | 'violet' | 'lime' | 'none';
  variant?: 'default' | 'aurora';
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className,
  hover = false,
  glow = 'none',
  variant = 'default',
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-4 animate-enter',
        variant === 'aurora' ? 'glass-card-aurora' : 'glass-card',
        hover && 'tilt-card cursor-pointer',
        glow === 'teal' && 'hover:shadow-violet',
        glow === 'violet' && 'hover:shadow-violet',
        glow === 'gold' && 'hover:shadow-lime',
        glow === 'lime' && 'hover:shadow-lime',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
