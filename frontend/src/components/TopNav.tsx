import React, { useState } from 'react';
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

  const urgentAlertCount = alerts.filter(
    a =>
      a.severity === Variant_high_critical_medium.critical ||
      a.severity === Variant_high_critical_medium.high
  ).length;

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/assets/generated/finiq-logo.dim_256x256.png"
              alt="FinIQ Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
              Fin<span className="text-teal">IQ</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'nav-link flex items-center gap-1.5',
                  currentPath === to && 'active text-primary'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Bell icon with alert badge */}
            <button
              onClick={() => navigate({ to: '/news' })}
              className={cn(
                'relative p-2 rounded-md transition-colors',
                currentPath === '/news'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={`Market alerts${urgentAlertCount > 0 ? ` (${urgentAlertCount} urgent)` : ''}`}
            >
              <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
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
                  currentPath === '/profile' && 'active text-primary'
                )}
              >
                Profile
              </Link>
            )}
            <LoginButton displayName={profile?.displayName} />

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
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
                    'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    currentPath === to
                      ? 'text-primary bg-primary/10'
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
                    'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    currentPath === '/profile'
                      ? 'text-primary bg-primary/10'
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
