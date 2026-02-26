import React from 'react';
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
    color: 'text-teal',
    bg: 'bg-teal/10',
  },
  {
    to: '/playground',
    icon: TrendingUp,
    title: 'Stock Playground',
    description: 'Practice predictions and compare with AI-generated forecasts.',
    color: 'text-gold',
    bg: 'bg-gold/10',
  },
  {
    to: '/news',
    icon: Newspaper,
    title: 'News Intelligence',
    description: 'Analyze financial news sentiment and its market impact.',
    color: 'text-teal',
    bg: 'bg-teal/10',
  },
  {
    to: '/portfolio',
    icon: PieChart,
    title: 'Portfolio Analyzer',
    description: 'Track allocation, performance, and risk exposure.',
    color: 'text-gold',
    bg: 'bg-gold/10',
  },
  {
    to: '/advisor',
    icon: Bot,
    title: 'AI Advisor',
    description: 'Get personalized strategy suggestions from your AI advisor.',
    color: 'text-teal',
    bg: 'bg-teal/10',
  },
  {
    to: '/community',
    icon: Users,
    title: 'Community',
    description: 'Share insights and discuss strategies with fellow investors.',
    color: 'text-gold',
    bg: 'bg-gold/10',
  },
];

const features = [
  { icon: Zap, title: 'AI-Powered Insights', desc: 'Rule-based intelligence analyzes patterns and generates actionable guidance.' },
  { icon: Shield, title: 'Secure & Decentralized', desc: 'Built on the Internet Computer with Internet Identity authentication.' },
  { icon: BarChart2, title: 'Rich Visualizations', desc: 'Interactive charts and dashboards for deep market understanding.' },
];

export default function HomePage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/generated/hero-banner.dim_1440x500.png"
            alt="FinIQ Hero"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
              <Zap className="h-3 w-3" />
              AI-Powered Finance Intelligence Platform
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Learn, Predict &{' '}
              <span className="text-teal">Invest</span>{' '}
              Smarter
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              The unified ecosystem that bridges financial education, real-world market intelligence,
              and AI-driven advisory into a single powerful platform.
            </p>
            <div className="flex flex-wrap gap-3">
              {!isAuthenticated ? (
                <Button
                  onClick={login}
                  disabled={isLoggingIn}
                  className="btn-teal text-base px-6 py-3 h-auto gap-2"
                >
                  {isLoggingIn ? 'Connecting...' : 'Get Started Free'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Link to="/learn">
                  <Button className="btn-teal text-base px-6 py-3 h-auto gap-2">
                    Continue Learning
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link to="/news">
                <Button variant="outline" className="text-base px-6 py-3 h-auto border-border/50 hover:border-primary/40">
                  Explore News
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {features.map(({ icon: Icon, title, desc }) => (
            <GlassCard key={title} className="text-center p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </GlassCard>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">
            Everything You Need in One Place
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Six integrated modules designed to take you from financial novice to confident investor.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(({ to, icon: Icon, title, description, color, bg }) => (
            <Link key={to} to={to}>
              <GlassCard hover glow="teal" className="h-full group">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>
                <div className={`flex items-center gap-1 text-xs font-medium ${color}`}>
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
