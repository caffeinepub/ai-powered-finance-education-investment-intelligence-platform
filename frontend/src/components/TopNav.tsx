import React, { useState, useRef, useEffect } from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useMarketAlerts } from '../hooks/useQueries';
import LoginButton from './LoginButton';
import { Menu, X, TrendingUp, BookOpen, Newspaper, PieChart, Bot, Users, Bell, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Variant_high_critical_medium } from '../backend';

const navLinks = [
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/playground', label: 'Playground', icon: TrendingUp },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/portfolio', label: 'Portfolio', icon: PieChart },
  { to: '/advisor', label: 'AI Advisor', icon: Bot },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/api', label: 'API', icon: Code2 },
];

export default function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { data: alerts } = useMarketAlerts();
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;

  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const urgentAlertCount = (alerts ?? []).filter(
    a =>
      a.severity === Variant_high_critical_medium.critical ||
      a.severity === Variant_high_critical_medium.high
  ).length;

  // Sliding active indicator
  useEffect(() => {
    if (!navRef.current) return;
    const activeLink = navRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeLink) {
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      setIndicatorStyle({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
        opacity: 1,
      });
    } else {
      setIndicatorStyle(s => ({ ...s, opacity: 0 }));
    }
  }, [currentPath]);

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <img
                src="/assets/generated/logo-mark-new.dim_128x128.png"
                alt="FinIQ Logo"
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/generated/finiq-logo.dim_256x256.png';
                }}
              />
              <div className="absolute inset-0 rounded-full bg-violet/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors tracking-tight">
              Fin<span className="gradient-text">IQ</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div ref={navRef} className="hidden md:flex items-center gap-0.5 relative">
            {/* Sliding indicator */}
            <div
              className="absolute bottom-0 h-full rounded-full pointer-events-none transition-all duration-300 ease-out"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                opacity: indicatorStyle.opacity,
                background: 'oklch(0.65 0.26 300 / 0.14)',
                boxShadow: '0 0 0 1px oklch(0.65 0.26 300 / 0.28)',
              }}
            />
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                data-active={currentPath === to ? 'true' : undefined}
                className={cn(
                  'nav-link flex items-center gap-1.5 relative z-10',
                  currentPath === to && 'active text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Bell icon with alert badge */}
            <button
              onClick={() => navigate({ to: '/news' })}
              className={cn(
                'relative p-2 rounded-full transition-all duration-200',
                currentPath === '/news'
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              )}
              aria-label={`Market alerts${urgentAlertCount > 0 ? ` (${urgentAlertCount} urgent)` : ''}`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {urgentAlertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none border border-background">
                  {urgentAlertCount > 9 ? '9+' : urgentAlertCount}
                </span>
              )}
            </button>

            {identity && (
              <Link
                to="/profile"
                className={cn(
                  'hidden md:block nav-link text-sm',
                  currentPath === '/profile' && 'active text-foreground'
                )}
              >
                Profile
              </Link>
            )}
            <LoginButton displayName={profile?.displayName} />

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-border/30 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    currentPath === to
                      ? 'text-foreground bg-primary/12 shadow-[0_0_0_1px_oklch(0.65_0.26_300/0.3)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {to === '/news' && urgentAlertCount > 0 && (
                    <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {urgentAlertCount > 9 ? '9+' : urgentAlertCount}
                    </span>
                  )}
                </Link>
              ))}
              {identity && (
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    currentPath === '/profile'
                      ? 'text-foreground bg-primary/12 shadow-[0_0_0_1px_oklch(0.65_0.26_300/0.3)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  Profile
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
