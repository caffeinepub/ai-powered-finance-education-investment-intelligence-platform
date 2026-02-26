import React, { useEffect, useRef, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetConversation, useSendMessage, useGetPortfolio, useGetUserPredictions, useGetNewsArticles, useGetCallerUserProfile } from '../hooks/useQueries';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import GlassCard from '../components/GlassCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Sparkles, TrendingUp, PieChart, Newspaper, Loader2 } from 'lucide-react';
import { mockStocks } from '../data/mockStocks';

// Rule-based AI advisor response generator
function generateAdvisorResponse(
  userMessage: string,
  portfolioHoldings: string[],
  predictionAccuracy: number,
  newsSentiment: string,
  displayName: string
): string {
  const msg = userMessage.toLowerCase();
  const name = displayName || 'there';

  // Portfolio-related queries
  if (msg.includes('portfolio') || msg.includes('holding') || msg.includes('allocation')) {
    if (portfolioHoldings.length === 0) {
      return `Hi ${name}! I notice you haven't set up your portfolio yet. Head over to the Portfolio Analyzer to add your holdings, and I'll be able to provide personalized insights on your allocation, risk exposure, and diversification opportunities.`;
    }
    return `Based on your portfolio with ${portfolioHoldings.length} holdings (${portfolioHoldings.slice(0, 3).join(', ')}${portfolioHoldings.length > 3 ? '...' : ''}), here are my observations:\n\n• **Diversification**: ${portfolioHoldings.length < 5 ? 'Consider adding more positions to reduce concentration risk.' : 'Good number of holdings for diversification.'}\n• **Current Market Sentiment**: ${newsSentiment === 'positive' ? 'News sentiment is positive — a good environment for growth stocks.' : newsSentiment === 'negative' ? 'Negative news sentiment suggests caution. Consider defensive positions.' : 'Mixed sentiment — maintain balanced exposure.'}\n• **Recommendation**: Review your sector allocation and ensure no single position exceeds 25-30% of your portfolio.`;
  }

  // Prediction/trading queries
  if (msg.includes('prediction') || msg.includes('accuracy') || msg.includes('trading')) {
    const accText = predictionAccuracy > 0
      ? `Your current prediction accuracy is ${predictionAccuracy.toFixed(0)}%.`
      : 'You haven\'t made any predictions yet.';
    return `${accText}\n\n${predictionAccuracy >= 60 ? '🎯 Great accuracy! You\'re demonstrating strong market intuition.' : predictionAccuracy > 0 ? '📊 Keep practicing — prediction accuracy improves with experience and analysis.' : '🚀 Start making predictions in the Stock Playground to track your performance.'}\n\nTips to improve:\n• Study technical indicators before predicting\n• Follow news sentiment for the stocks you\'re predicting\n• Look for momentum patterns in price history`;
  }

  // News/sentiment queries
  if (msg.includes('news') || msg.includes('sentiment') || msg.includes('market')) {
    return `Current market intelligence shows ${newsSentiment === 'positive' ? 'bullish' : newsSentiment === 'negative' ? 'bearish' : 'mixed'} sentiment in recent news.\n\n**Market Outlook**: ${newsSentiment === 'positive' ? 'Positive news flow typically supports equity prices. Consider maintaining or slightly increasing equity exposure.' : newsSentiment === 'negative' ? 'Negative sentiment may create short-term volatility. Consider defensive positioning and stop-loss orders.' : 'Neutral sentiment suggests a wait-and-see approach. Focus on quality holdings with strong fundamentals.'}\n\nCheck the News Intelligence module for detailed sentiment analysis on specific stocks.`;
  }

  // Diversification queries
  if (msg.includes('diversif') || msg.includes('risk') || msg.includes('hedge')) {
    return `Diversification is one of the most powerful risk management tools. Here's a framework:\n\n**Asset Allocation**:\n• 60-70% Equities (across sectors)\n• 20-30% Fixed Income (bonds)\n• 5-10% Cash/Alternatives\n\n**Sector Diversification**: Spread across Technology, Healthcare, Financials, Consumer, Energy, and Utilities.\n\n**Geographic Diversification**: Consider international exposure (20-30% non-US).\n\n${portfolioHoldings.length > 0 ? `For your current portfolio (${portfolioHoldings.join(', ')}), focus on adding uncorrelated assets.` : 'Start building your portfolio with holdings from different sectors.'}`;
  }

  // Stop-loss queries
  if (msg.includes('stop loss') || msg.includes('stop-loss') || msg.includes('cut loss')) {
    return `Stop-loss orders are essential for capital preservation. Here's how to use them effectively:\n\n**Setting Stop-Losses**:\n• **Fixed Stop**: Set 8-15% below your entry price\n• **Trailing Stop**: Move up with the price (e.g., 10% below peak)\n• **Volatility-Based**: Use 2x ATR below entry\n\n**Key Principles**:\n• Never move a stop-loss further away from entry\n• Set stops before entering a trade\n• Consider the stock's normal volatility range\n\n${portfolioHoldings.length > 0 ? `For your holdings like ${portfolioHoldings[0]}, review current prices and set appropriate stop levels.` : 'Apply stop-losses to all positions once you build your portfolio.'}`;
  }

  // Sector rotation
  if (msg.includes('sector') || msg.includes('rotation')) {
    return `Sector rotation is a strategy of moving investments between sectors based on economic cycles:\n\n**Economic Cycle Sectors**:\n• **Early Recovery**: Financials, Consumer Discretionary\n• **Mid Cycle**: Technology, Industrials, Materials\n• **Late Cycle**: Energy, Healthcare, Consumer Staples\n• **Recession**: Utilities, Healthcare, Consumer Staples\n\n**Current Signal**: ${newsSentiment === 'positive' ? 'Positive sentiment suggests mid-to-late cycle positioning. Consider Technology and Industrials.' : 'Defensive positioning may be warranted. Healthcare and Utilities tend to outperform in uncertain markets.'}\n\nMonitor the News Intelligence module for sector-specific sentiment shifts.`;
  }

  // Valuation queries
  if (msg.includes('valuation') || msg.includes('p/e') || msg.includes('overvalued') || msg.includes('undervalued')) {
    return `Valuation analysis helps identify whether stocks are fairly priced:\n\n**Key Metrics**:\n• **P/E Ratio**: Compare to industry average and historical range\n• **PEG Ratio**: P/E adjusted for growth (< 1 = potentially undervalued)\n• **P/B Ratio**: Price vs book value (< 1 = trading below assets)\n• **EV/EBITDA**: Enterprise value vs earnings (useful for comparing across capital structures)\n\n**Quick Framework**:\n1. Calculate intrinsic value using DCF analysis\n2. Compare P/E to sector peers\n3. Check if growth justifies the premium\n4. Look for margin of safety (buy at 20-30% discount)\n\nUse the Learning Module to deepen your fundamental analysis skills.`;
  }

  // General finance questions
  if (msg.includes('invest') || msg.includes('stock') || msg.includes('buy') || msg.includes('sell')) {
    return `Great question, ${name}! Here are some key investment principles:\n\n**Core Principles**:\n• **Buy quality**: Focus on companies with strong moats and consistent earnings\n• **Diversify**: Never put all eggs in one basket\n• **Long-term mindset**: Time in the market beats timing the market\n• **Risk management**: Never risk more than you can afford to lose\n\n**Before Buying**:\n1. Understand the business model\n2. Check financial health (debt, cash flow)\n3. Assess competitive position\n4. Determine fair value\n5. Set entry/exit criteria\n\nWould you like specific advice on any of your current holdings?`;
  }

  // Default response
  return `Hello ${name}! I'm your AI Financial Strategy Advisor. I can help you with:\n\n• 📊 **Portfolio Analysis** — Review your holdings and allocation\n• 📈 **Market Insights** — Interpret news sentiment and trends\n• 🎯 **Trading Strategy** — Improve your prediction accuracy\n• 🛡️ **Risk Management** — Stop-losses, diversification, hedging\n• 📚 **Financial Education** — Explain concepts and strategies\n\nWhat would you like to explore today? Try asking about your portfolio, market conditions, or specific investment strategies!`;
}

const QUICK_PROMPTS = [
  { icon: PieChart, text: 'Analyze my portfolio' },
  { icon: TrendingUp, text: 'How can I improve my predictions?' },
  { icon: Newspaper, text: 'What does current news sentiment mean?' },
  { icon: Sparkles, text: 'Give me diversification tips' },
];

export default function AdvisorChatPage() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { data: conversation, isLoading: convLoading } = useGetConversation();
  const { data: portfolio } = useGetPortfolio();
  const { data: predictions = [] } = useGetUserPredictions();
  const { data: newsArticles = [] } = useGetNewsArticles();
  const sendMessage = useSendMessage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState<Array<{ content: string; isUser: boolean; timestamp: number }>>([]);

  const portfolioHoldings = portfolio?.holdings.map(h => h.symbol) ?? [];
  const predictionAccuracy = profile?.predictionAccuracy ?? 0;
  const avgSentiment = newsArticles.length > 0
    ? newsArticles.reduce((sum, a) => sum + Number(a.score), 0) / newsArticles.length
    : 0;
  const newsSentiment = avgSentiment > 1 ? 'positive' : avgSentiment < -1 ? 'negative' : 'neutral';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, conversation]);

  const handleSend = async (content: string) => {
    const userMsg = { content, isUser: true, timestamp: Date.now() };
    setLocalMessages(prev => [...prev, userMsg]);

    // Generate AI response immediately (rule-based)
    const aiResponse = generateAdvisorResponse(
      content,
      portfolioHoldings,
      predictionAccuracy,
      newsSentiment,
      profile?.displayName ?? ''
    );

    setTimeout(() => {
      setLocalMessages(prev => [...prev, { content: aiResponse, isUser: false, timestamp: Date.now() }]);
    }, 600);

    // Also save to backend
    try {
      await sendMessage.mutateAsync(content);
    } catch {
      // Continue even if backend save fails
    }
  };

  const allMessages = localMessages;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <Bot className="h-4 w-4" />
          AI Financial Advisor
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Strategy Advisor</h1>
        <p className="text-muted-foreground">
          Personalized financial guidance powered by your portfolio, predictions, and market data.
        </p>
      </div>

      {/* Context Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <GlassCard className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Portfolio</div>
          <div className="font-semibold text-foreground text-sm">{portfolioHoldings.length} Holdings</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Prediction Accuracy</div>
          <div className="font-semibold text-foreground text-sm">{predictionAccuracy > 0 ? `${predictionAccuracy.toFixed(0)}%` : 'N/A'}</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">News Sentiment</div>
          <div className={`font-semibold text-sm capitalize ${newsSentiment === 'positive' ? 'text-emerald-400' : newsSentiment === 'negative' ? 'text-red-400' : 'text-yellow-400'}`}>
            {newsSentiment}
          </div>
        </GlassCard>
      </div>

      {/* Chat Window */}
      <GlassCard className="mb-4 p-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-[420px] overflow-y-auto p-4 space-y-4 scrollbar-thin"
        >
          {allMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground mb-1">Your AI Advisor is Ready</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ask me anything about your portfolio, market trends, investment strategies, or financial concepts.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    onClick={() => handleSend(text)}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/80 border border-border/40 hover:border-primary/30 transition-all text-left text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="shrink-0">
                {msg.isUser ? (
                  <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                    {profile?.displayName ? profile.displayName.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-teal" />
                  </div>
                )}
              </div>
              <div className={`max-w-[80%] flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.isUser
                    ? 'bg-primary/20 border border-primary/20 text-foreground rounded-tr-sm'
                    : 'glass-card border-border/40 text-foreground rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-muted-foreground px-1 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {sendMessage.isPending && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-teal" />
              </div>
              <div className="glass-card border-border/40 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      <ChatInput
        onSend={handleSend}
        isLoading={sendMessage.isPending}
      />
    </div>
  );
}
