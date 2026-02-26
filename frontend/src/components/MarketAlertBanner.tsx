import React, { useState, useCallback } from 'react';
import { AlertTriangle, AlertCircle, Info, X, Zap } from 'lucide-react';
import type { Alert } from '../backend';
import { Variant_high_critical_medium } from '../backend';

interface MarketAlertBannerProps {
  alerts: Alert[];
  isLoading?: boolean;
}

function getRelativeTime(triggeredAt: bigint): string {
  // triggeredAt is in nanoseconds (ICP Time)
  const nowMs = Date.now();
  const triggeredMs = Number(triggeredAt) / 1_000_000;
  const diffMs = nowMs - triggeredMs;

  if (diffMs < 0) return 'just now';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function getSeverityConfig(severity: Variant_high_critical_medium) {
  switch (severity) {
    case Variant_high_critical_medium.critical:
      return {
        icon: AlertCircle,
        label: 'CRITICAL',
        containerClass: 'border-red-500/40 bg-red-500/10',
        iconClass: 'text-red-400',
        labelClass: 'text-red-400 bg-red-400/15 border-red-400/30',
        headlineClass: 'text-red-100',
        glowClass: 'shadow-[0_0_16px_oklch(0.62_0.22_25_/_0.35)]',
        badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30',
        dotClass: 'bg-red-400',
      };
    case Variant_high_critical_medium.high:
      return {
        icon: AlertTriangle,
        label: 'HIGH',
        containerClass: 'border-amber-500/40 bg-amber-500/10',
        iconClass: 'text-amber-400',
        labelClass: 'text-amber-400 bg-amber-400/15 border-amber-400/30',
        headlineClass: 'text-amber-100',
        glowClass: 'shadow-[0_0_16px_oklch(0.78_0.16_75_/_0.3)]',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-400',
      };
    case Variant_high_critical_medium.medium:
    default:
      return {
        icon: Info,
        label: 'MEDIUM',
        containerClass: 'border-teal-500/40 bg-teal-500/10',
        iconClass: 'text-teal-400',
        labelClass: 'text-teal-400 bg-teal-400/15 border-teal-400/30',
        headlineClass: 'text-teal-100',
        glowClass: 'shadow-[0_0_12px_oklch(0.72_0.18_185_/_0.2)]',
        badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        dotClass: 'bg-teal-400',
      };
  }
}

interface AlertItemProps {
  alert: Alert;
  onDismiss: (id: bigint) => void;
}

function AlertItem({ alert, onDismiss }: AlertItemProps) {
  const config = getSeverityConfig(alert.severity);
  const Icon = config.icon;
  const isCritical = alert.severity === Variant_high_critical_medium.critical;
  const isHigh = alert.severity === Variant_high_critical_medium.high;
  const isProminent = isCritical || isHigh;

  return (
    <div
      className={`
        relative flex items-start gap-3 p-3.5 rounded-xl border
        backdrop-blur-md transition-all duration-300 animate-fade-in
        ${config.containerClass} ${config.glowClass}
      `}
    >
      {/* Animated pulse dot for critical/high */}
      {isProminent && (
        <span className="absolute top-3 right-10 flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotClass}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotClass}`} />
        </span>
      )}

      {/* Severity Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${config.iconClass}`}>
        <Icon className={`${isProminent ? 'h-5 w-5' : 'h-4 w-4'}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {/* Severity badge */}
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider border ${config.labelClass}`}>
            {isCritical && <Zap className="h-2.5 w-2.5" />}
            {config.label}
          </span>

          {/* Timestamp */}
          <span className="text-[11px] text-muted-foreground/70">
            {getRelativeTime(alert.triggeredAt)}
          </span>

          {/* Sentiment score */}
          <span className={`text-[11px] font-medium ${alert.sentimentScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {alert.sentimentScore >= 0 ? '+' : ''}{alert.sentimentScore.toFixed(2)} sentiment
          </span>
        </div>

        {/* Headline */}
        <p className={`text-sm font-semibold leading-snug mb-2 ${config.headlineClass} ${isProminent ? 'text-base' : ''}`}>
          {alert.headline}
        </p>

        {/* Symbol badges */}
        {alert.relatedSymbols.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {alert.relatedSymbols.map(symbol => (
              <span
                key={symbol}
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${config.badgeClass}`}
              >
                {symbol}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(alert.id)}
        className="flex-shrink-0 p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function MarketAlertBanner({ alerts, isLoading }: MarketAlertBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = useCallback((id: bigint) => {
    setDismissedIds(prev => new Set([...prev, id.toString()]));
  }, []);

  const activeAlerts = alerts.filter(a => !dismissedIds.has(a.id.toString()));

  if (isLoading && alerts.length === 0) {
    return (
      <div className="mb-6 p-3 rounded-xl border border-border/30 bg-secondary/20 backdrop-blur-md animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-muted/50" />
          <div className="h-3 w-48 rounded bg-muted/50" />
        </div>
      </div>
    );
  }

  if (activeAlerts.length === 0) return null;

  const criticalCount = activeAlerts.filter(a => a.severity === Variant_high_critical_medium.critical).length;
  const highCount = activeAlerts.filter(a => a.severity === Variant_high_critical_medium.high).length;

  return (
    <div className="mb-6 animate-fade-in">
      {/* Banner header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
            <span className="flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
            </span>
            <span className="text-xs font-bold text-red-400 tracking-wide uppercase">Live Alerts</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {activeAlerts.length} active market event{activeAlerts.length !== 1 ? 's' : ''}
            {(criticalCount > 0 || highCount > 0) && (
              <span className="ml-1 text-amber-400">
                · {criticalCount + highCount} high-priority
              </span>
            )}
          </span>
        </div>
        <button
          onClick={() => setDismissedIds(new Set(alerts.map(a => a.id.toString())))}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Dismiss all
        </button>
      </div>

      {/* Alert items */}
      <div className="space-y-2.5">
        {activeAlerts.map(alert => (
          <AlertItem
            key={alert.id.toString()}
            alert={alert}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}
