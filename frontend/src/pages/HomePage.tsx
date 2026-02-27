import React, { useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { BookOpen, TrendingUp, Newspaper, PieChart, Bot, Users, ArrowRight, Zap, Shield, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '../components/GlassCard';

const modules = [
  {
    to: '/learn',
    icon: BookOpen,
    title: 'Finance Learning',
    description: 'Master financial concepts with structured lessons and assessments.',
    colorClass: 'text-violet',
    bgClass: 'bg-violet/10',
    accentColor: 'oklch(0.65 0.26 300)',
  },
  {
    to: '/playground',
    icon: TrendingUp,
    title: 'Stock Playground',
    description: 'Practice predictions and compare with AI-generated forecasts.',
    colorClass: 'text-lime',
    bgClass: 'bg-lime/10',
    accentColor: 'oklch(0.84 0.22 130)',
  },
  {
    to: '/news',
    icon: Newspaper,
    title: 'News Intelligence',
    description: 'Analyze financial news sentiment and its market impact.',
    colorClass: 'text-cyan',
    bgClass: 'bg-cyan/10',
    accentColor: 'oklch(0.72 0.18 200)',
  },
  {
    to: '/portfolio',
    icon: PieChart,
    title: 'Portfolio Analyzer',
    description: 'Track allocation, performance, and risk exposure.',
    colorClass: 'text-violet',
    bgClass: 'bg-violet/10',
    accentColor: 'oklch(0.65 0.26 300)',
  },
  {
    to: '/advisor',
    icon: Bot,
    title: 'AI Advisor',
    description: 'Get personalized strategy suggestions from your AI advisor.',
    colorClass: 'text-lime',
    bgClass: 'bg-lime/10',
    accentColor: 'oklch(0.84 0.22 130)',
  },
  {
    to: '/community',
    icon: Users,
    title: 'Community',
    description: 'Share insights and discuss strategies with fellow investors.',
    colorClass: 'text-cyan',
    bgClass: 'bg-cyan/10',
    accentColor: 'oklch(0.72 0.18 200)',
  },
];

const features = [
  { icon: Zap, title: 'AI-Powered Insights', desc: 'Rule-based intelligence analyzes patterns and generates actionable guidance.', color: 'text-violet', bg: 'bg-violet/10' },
  { icon: Shield, title: 'Secure & Decentralized', desc: 'Built on the Internet Computer with Internet Identity authentication.', color: 'text-lime', bg: 'bg-lime/10' },
  { icon: BarChart2, title: 'Rich Visualizations', desc: 'Interactive charts and dashboards for deep market understanding.', color: 'text-cyan', bg: 'bg-cyan/10' },
];

// Animated SVG hero motif
function HeroMotif() {
  return (
    <svg
      viewBox="0 0 900 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      {/* Candlestick silhouettes */}
      {[
        { x: 80, h: 60, body: 40, up: true },
        { x: 140, h: 90, body: 55, up: false },
        { x: 200, h: 50, body: 30, up: true },
        { x: 260, h: 110, body: 70, up: true },
        { x: 320, h: 75, body: 45, up: false },
        { x: 380, h: 130, body: 80, up: true },
        { x: 440, h: 95, body: 60, up: true },
        { x: 500, h: 65, body: 40, up: false },
        { x: 560, h: 145, body: 90, up: true },
        { x: 620, h: 80, body: 50, up: false },
        { x: 680, h: 120, body: 75, up: true },
        { x: 740, h: 55, body: 35, up: true },
        { x: 800, h: 100, body: 65, up: false },
        { x: 860, h: 140, body: 85, up: true },
      ].map((c, i) => {
        const baseY = 320;
        const color = c.up ? 'oklch(0.65 0.26 300 / 0.25)' : 'oklch(0.84 0.22 130 / 0.2)';
        return (
          <g key={i}>
            {/* Wick */}
            <line
              x1={c.x}
              y1={baseY - c.h}
              x2={c.x}
              y2={baseY}
              stroke={color}
              strokeWidth="1.5"
            />
            {/* Body */}
            <rect
              x={c.x - 8}
              y={baseY - c.h + (c.h - c.body) / 2}
              width="16"
              height={c.body}
              rx="2"
              fill={color}
            />
          </g>
        );
      })}

      {/* Flowing trend line */}
      <path
        d="M 60 280 C 150 240, 200 200, 300 180 S 420 140, 500 120 S 620 90, 720 80 S 820 70, 900 60"
        stroke="oklch(0.65 0.26 300 / 0.5)"
        strokeWidth="2"
        strokeDasharray="400"
        strokeDashoffset="400"
        fill="none"
        style={{ animation: 'draw-line 2.5s ease-out 0.3s forwards' }}
      />
      <path
        d="M 60 300 C 150 270, 200 250, 300 230 S 420 200, 500 190 S 620 170, 720 160 S 820 150, 900 140"
        stroke="oklch(0.84 0.22 130 / 0.35)"
        strokeWidth="1.5"
        strokeDasharray="400"
        strokeDashoffset="400"
        fill="none"
        style={{ animation: 'draw-line 2.5s ease-out 0.6s forwards' }}
      />

      {/* Floating particles */}
      {[
        { cx: 200, cy: 150, r: 3, delay: '0s' },
        { cx: 380, cy: 100, r: 4, delay: '0.5s' },
        { cx: 560, cy: 80, r: 2.5, delay: '1s' },
        { cx: 720, cy: 60, r: 3.5, delay: '0.3s' },
        { cx: 850, cy: 90, r: 2, delay: '0.8s' },
        { cx: 300, cy: 200, r: 2, delay: '1.2s' },
        { cx: 650, cy: 130, r: 3, delay: '0.7s' },
      ].map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill="oklch(0.65 0.26 300 / 0.7)"
          style={{
            animation: `float-particle 4s ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}

      {/* Grid lines */}
      {[100, 160, 220, 280, 340].map((y, i) => (
        <line
          key={i}
          x1="0"
          y1={y}
          x2="900"
          y2={y}
          stroke="oklch(0.65 0.26 300 / 0.06)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export default function HomePage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[520px] flex items-center">
        {/* Background motif */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/80" />
          <HeroMotif />
          {/* Radial glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, oklch(0.65 0.26 300 / 0.08) 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-6 animate-enter"
              style={{
                background: 'oklch(0.65 0.26 300 / 0.1)',
                borderColor: 'oklch(0.65 0.26 300 / 0.3)',
                color: 'oklch(0.65 0.26 300)',
              }}
            >
              <Zap className="h-3 w-3" />
              AI-Powered Finance Intelligence Platform
            </div>

            <h1
              className="font-display text-5xl md:text-7xl font-extrabold leading-[1.05] mb-6 animate-enter"
              style={{ animationDelay: '0.1s' }}
            >
              <span className="text-foreground">Learn, Predict</span>
              <br />
              <span className="gradient-text">&amp; Invest Smarter</span>
            </h1>

            <p
              className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed animate-enter"
              style={{ animationDelay: '0.2s' }}
            >
              The unified ecosystem that bridges financial education, real-world market intelligence,
              and AI-driven advisory into a single powerful platform.
            </p>

            <div
              className="flex flex-wrap gap-3 animate-enter"
              style={{ animationDelay: '0.3s' }}
            >
              {!isAuthenticated ? (
                <Button
                  onClick={login}
                  disabled={isLoggingIn}
                  className="btn-violet text-base px-7 py-3 h-auto gap-2 rounded-full animate-pulse-accent"
                >
                  {isLoggingIn ? 'Connecting...' : 'Get Started Free'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Link to="/learn">
                  <Button className="btn-violet text-base px-7 py-3 h-auto gap-2 rounded-full animate-pulse-accent">
                    Continue Learning
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link to="/news">
                <Button
                  variant="outline"
                  className="text-base px-7 py-3 h-auto rounded-full border-border/50 hover:border-primary/40 hover:bg-primary/5"
                >
                  Explore News
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <GlassCard key={title} variant="aurora" className="text-center p-7">
              <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2 text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </GlassCard>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl font-bold mb-3">
            <span className="gradient-text">Everything You Need</span>
            <span className="text-foreground"> in One Place</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Six integrated modules designed to take you from financial novice to confident investor.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(({ to, icon: Icon, title, description, colorClass, bgClass, accentColor }) => (
            <Link key={to} to={to}>
              <GlassCard hover variant="aurora" className="h-full group p-6">
                <div className={`w-11 h-11 rounded-xl ${bgClass} flex items-center justify-center mb-4`}>
                  <Icon className={`h-5 w-5 ${colorClass}`} />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2 text-base group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: accentColor }}>
                  Explore <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
