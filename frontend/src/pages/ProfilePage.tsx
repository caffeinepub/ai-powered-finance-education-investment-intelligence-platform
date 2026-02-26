import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetCallerUserProfile,
  useGetLearningProgress,
  useGetUserPredictions,
  useGetPortfolio,
} from '../hooks/useQueries';
import GlassCard from '../components/GlassCard';
import PasswordSetupModal from '../components/PasswordSetupModal';
import BiometricAuthButton from '../components/BiometricAuthButton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { learningTopics } from '../data/learningTopics';
import { mockStocks } from '../data/mockStocks';
import {
  BookOpen,
  TrendingUp,
  PieChart,
  Target,
  CheckCircle,
  ArrowRight,
  Loader2,
  Lock,
  KeyRound,
  Fingerprint,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: learningProgress, isLoading: learningLoading } = useGetLearningProgress();
  const { data: predictions = [], isLoading: predictionsLoading } = useGetUserPredictions();
  const { data: portfolio, isLoading: portfolioLoading } = useGetPortfolio();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isLoading = profileLoading || learningLoading || predictionsLoading || portfolioLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedLessons = learningProgress ? Number(learningProgress.completedLessons) : 0;
  const totalLessons = learningTopics.length;
  const learningPercent = Math.round((completedLessons / totalLessons) * 100);

  const correctPredictions = predictions.filter(p => p.direction === p.actualOutcome).length;
  const predictionAccuracy =
    predictions.length > 0 ? Math.round((correctPredictions / predictions.length) * 100) : 0;

  const portfolioValue =
    portfolio?.holdings.reduce((sum, h) => {
      const stock = mockStocks.find(s => s.symbol === h.symbol);
      return sum + (stock?.currentPrice ?? Number(h.avgBuyPrice)) * Number(h.shares);
    }, 0) ?? 0;

  const portfolioCost =
    portfolio?.holdings.reduce(
      (sum, h) => sum + Number(h.avgBuyPrice) * Number(h.shares),
      0
    ) ?? 0;
  const portfolioGain = portfolioValue - portfolioCost;
  const portfolioGainPct = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0;

  const principalStr = identity?.getPrincipal().toString() ?? '';
  const shortPrincipal =
    principalStr.length > 20
      ? principalStr.slice(0, 10) + '...' + principalStr.slice(-6)
      : principalStr;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          Track your learning progress, predictions, and portfolio performance.
        </p>
      </div>

      {/* Profile Card */}
      <GlassCard className="mb-8">
        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16 border-2 border-primary/30">
            <AvatarImage src="/assets/generated/default-avatar.dim_128x128.png" />
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
              {profile?.displayName ? profile.displayName.slice(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {profile?.displayName ?? 'Anonymous User'}
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">{shortPrincipal}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {completedLessons >= totalLessons && (
                <Badge className="text-xs bg-gold/10 text-gold border-gold/20">
                  🏆 Learning Complete
                </Badge>
              )}
              {predictionAccuracy >= 70 && predictions.length >= 5 && (
                <Badge className="text-xs bg-teal/10 text-teal border-teal/20">
                  🎯 Sharp Predictor
                </Badge>
              )}
              {(portfolio?.holdings.length ?? 0) >= 5 && (
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  📊 Active Investor
                </Badge>
              )}
              {profile?.hasPassword && (
                <Badge className="text-xs bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                  🔒 Password Protected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <GlassCard className="text-center p-4">
          <div className="text-2xl font-bold font-display text-teal">
            {completedLessons}/{totalLessons}
          </div>
          <div className="text-xs text-muted-foreground">Lessons Done</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="text-2xl font-bold font-display text-gold">{predictions.length}</div>
          <div className="text-xs text-muted-foreground">Predictions</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="text-2xl font-bold font-display text-primary">{predictionAccuracy}%</div>
          <div className="text-xs text-muted-foreground">Accuracy</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="text-2xl font-bold font-display text-foreground">
            {portfolio?.holdings.length ?? 0}
          </div>
          <div className="text-xs text-muted-foreground">Holdings</div>
        </GlassCard>
      </div>

      {/* Security & Authentication — only for authenticated users */}
      {isAuthenticated && (
        <GlassCard className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="h-5 w-5 text-teal" />
            <h3 className="font-display font-semibold text-foreground">Security &amp; Authentication</h3>
          </div>

          {/* Password Section */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-gold" />
                <span className="text-sm font-medium text-foreground">Password</span>
                {profile?.hasPassword ? (
                  <Badge className="text-xs bg-emerald-400/10 text-emerald-400 border-emerald-400/20 ml-1">
                    Set
                  </Badge>
                ) : (
                  <Badge className="text-xs bg-secondary/50 text-muted-foreground border-border/30 ml-1">
                    Not set
                  </Badge>
                )}
              </div>
              <Button
                onClick={() => setPasswordModalOpen(true)}
                size="sm"
                variant="ghost"
                className="text-teal border border-teal/30 hover:bg-teal/10 text-xs font-medium"
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                {profile?.hasPassword ? 'Update Password' : 'Set Password'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {profile?.hasPassword
                ? 'Your account is protected with a password hash stored on-chain.'
                : 'Add a password for an extra layer of account security.'}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border/30 mb-5" />

          {/* Biometric Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium text-foreground">Biometric Authentication</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 pl-6">
              Register your device fingerprint or Face ID for quick local authentication using WebAuthn.
            </p>
            <div className="pl-6">
              <BiometricAuthButton />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Learning Progress */}
      <GlassCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Learning Progress</h3>
          </div>
          <Link to="/learn" className="text-xs text-primary hover:underline flex items-center gap-1">
            Continue <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {completedLessons} of {totalLessons} topics completed
          </span>
          <span className="text-sm font-bold text-primary">{learningPercent}%</span>
        </div>
        <Progress value={learningPercent} className="h-2 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {learningTopics.map((topic, i) => {
            const done = i < completedLessons;
            return (
              <div
                key={topic.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg text-xs',
                  done
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'bg-secondary/30 text-muted-foreground'
                )}
              >
                {done ? (
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-current shrink-0" />
                )}
                {topic.title}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Prediction History */}
      <GlassCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Prediction History</h3>
          </div>
          <Link
            to="/playground"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Make Prediction <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {predictions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No predictions yet. Head to the Stock Playground to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {[...predictions]
              .reverse()
              .slice(0, 5)
              .map((pred, i) => {
                const isCorrect = pred.direction === pred.actualOutcome;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-primary text-sm">{pred.stockSymbol}</span>
                      <span className="text-xs text-muted-foreground">You: {pred.direction}</span>
                      <span className="text-xs text-muted-foreground">AI: {pred.aiPrediction}</span>
                      <span className="text-xs text-muted-foreground">
                        Actual: {pred.actualOutcome}
                      </span>
                    </div>
                    <Badge
                      className={cn(
                        'text-xs shrink-0',
                        isCorrect
                          ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                          : 'bg-red-400/10 text-red-400 border-red-400/20'
                      )}
                    >
                      {isCorrect ? '✓ Correct' : '✗ Wrong'}
                    </Badge>
                  </div>
                );
              })}
            {predictions.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{predictions.length - 5} more predictions
              </p>
            )}
          </div>
        )}
      </GlassCard>

      {/* Portfolio Summary */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Portfolio Summary</h3>
          </div>
          <Link
            to="/portfolio"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View Portfolio <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {!portfolio || portfolio.holdings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No portfolio yet. Add holdings in the Portfolio Analyzer.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground mb-1">Total Value</div>
                <div className="font-bold text-foreground">
                  $
                  {portfolioValue.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground mb-1">Gain/Loss</div>
                <div
                  className={cn(
                    'font-bold',
                    portfolioGain >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}
                >
                  {portfolioGain >= 0 ? '+' : ''}$
                  {Math.abs(portfolioGain).toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div
                  className={cn(
                    'text-xs',
                    portfolioGain >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}
                >
                  {portfolioGainPct >= 0 ? '+' : ''}
                  {portfolioGainPct.toFixed(2)}%
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground mb-1">Holdings</div>
                <div className="font-bold text-foreground">{portfolio.holdings.length}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolio.holdings.map(h => (
                <Badge
                  key={h.symbol}
                  variant="outline"
                  className="text-xs border-primary/30 text-primary"
                >
                  {h.symbol}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Password Setup Modal */}
      <PasswordSetupModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        hasExistingPassword={profile?.hasPassword ?? false}
      />
    </div>
  );
}
