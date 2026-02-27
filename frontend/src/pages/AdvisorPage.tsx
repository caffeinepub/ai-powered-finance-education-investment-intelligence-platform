import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGetConversation, useSendMessage, useGetPortfolio, useGetNewsArticles, useGetUserPredictions } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { getLivePrice } from '../data/mockStocks';
import {
  Bot, Send, User, TrendingUp, TrendingDown, Newspaper, PieChart,
  Zap, RefreshCw, ChevronDown, Sparkles, Brain, Shield, BarChart2,
  MessageSquare, Lightbulb, AlertTriangle, Clock, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: string[];
}

interface ContextChip {
  label: string;
  icon: React.ElementType;
  color: string;
  active: boolean;
}

// ─── AI Response Engine ────────────────────────────────────────────────────────
function buildSystemContext(portfolio: any, articles: any[], predictions: any[]): string {
  const parts: string[] = [];

  if (portfolio && portfolio.holdings.length > 0) {
    const holdingsSummary = portfolio.holdings
      .map((h: any) => {
        const livePrice = getLivePrice(h.symbol);
        const value = Number(h.shares) * livePrice;
        const pnl = value - Number(h.shares) * h.avgBuyPrice;
        return `${h.symbol}: ${h.shares} shares @ $${h.avgBuyPrice.toFixed(2)} avg, live $${livePrice.toFixed(2)}, P&L ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)}`;
      })
      .join('; ');
    parts.push(`PORTFOLIO: ${holdingsSummary}. Risk score: ${portfolio.riskScore}/100.`);
  }

  if (articles.length > 0) {
    const recentNews = articles.slice(0, 5).map(a =>
      `"${a.title}" (${a.sentiment}, impact: ${a.marketImpact})`
    ).join('; ');
    parts.push(`RECENT NEWS: ${recentNews}`);
  }

  if (predictions.length > 0) {
    const correct = predictions.filter((p: any) => p.result === 'correct').length;
    const accuracy = predictions.length > 0 ? Math.round((correct / predictions.length) * 100) : 0;
    parts.push(`PREDICTION HISTORY: ${predictions.length} predictions, ${accuracy}% accuracy`);
  }

  return parts.join('\n');
}

function generateAIResponse(userMessage: string, context: string): string {
  const msg = userMessage.toLowerCase();

  // Portfolio-specific responses
  if (msg.includes('portfolio') || msg.includes('holding') || msg.includes('allocation')) {
    if (context.includes('PORTFOLIO:')) {
      const portfolioLine = context.split('\n').find(l => l.startsWith('PORTFOLIO:')) ?? '';
      return `Based on your current portfolio, here's my analysis:\n\n${portfolioLine}\n\n**Key Insights:**\n• Your portfolio shows a mix of growth and value positions\n• Consider rebalancing if any single position exceeds 25% of total value\n• The risk score indicates your current exposure level\n\n**Recommendations:**\n1. Diversify across sectors if concentrated in tech\n2. Consider adding defensive positions (healthcare, utilities) for stability\n3. Review positions with negative P&L for potential tax-loss harvesting\n\nWould you like a deeper analysis of any specific holding?`;
    }
    return `To provide personalized portfolio advice, please add your holdings in the Portfolio Analyzer first. Once set up, I can analyze your allocation, identify concentration risks, and suggest rebalancing strategies tailored to your risk tolerance.`;
  }

  // News-specific responses
  if (msg.includes('news') || msg.includes('market') || msg.includes('sentiment')) {
    if (context.includes('RECENT NEWS:')) {
      const newsLine = context.split('\n').find(l => l.startsWith('RECENT NEWS:')) ?? '';
      return `Here's what the latest financial news signals:\n\n${newsLine}\n\n**Market Sentiment Analysis:**\n• ML models are detecting mixed signals across sectors\n• High-impact events (score >80) warrant immediate attention\n• Negative sentiment in key holdings may indicate short-term headwinds\n\n**Strategic Implications:**\n1. Monitor positions in companies with recent negative news\n2. Positive earnings surprises often create momentum opportunities\n3. Macro events (Fed decisions, inflation data) affect all holdings\n\nShall I cross-reference this news with your specific portfolio holdings?`;
    }
    return `The financial news landscape is constantly evolving. Key factors to watch:\n\n• **Earnings Season**: Beat/miss estimates drive 5-15% price moves\n• **Fed Policy**: Rate decisions impact growth stocks significantly\n• **Sector Rotation**: Money flows between sectors based on macro conditions\n• **Geopolitical Events**: Can cause sudden volatility spikes\n\nVisit the News Intelligence module to see ML-analyzed sentiment scores for current articles.`;
  }

  // Prediction-specific responses
  if (msg.includes('predict') || msg.includes('forecast') || msg.includes('accuracy')) {
    if (context.includes('PREDICTION HISTORY:')) {
      const predLine = context.split('\n').find(l => l.startsWith('PREDICTION HISTORY:')) ?? '';
      return `Your prediction track record: ${predLine}\n\n**Performance Analysis:**\n• Accuracy above 55% suggests edge over random chance\n• Focus on sectors where your predictions are strongest\n• Review incorrect predictions to identify systematic biases\n\n**Improvement Strategies:**\n1. Combine technical analysis with fundamental research\n2. Use the News Intelligence module to inform directional bets\n3. Start with larger-cap, more predictable stocks\n4. Track your reasoning for each prediction to identify patterns\n\nWould you like tips on improving prediction accuracy for specific sectors?`;
    }
    return `Stock prediction is challenging even for professionals. Here are evidence-based approaches:\n\n**Technical Analysis:**\n• Moving averages (50/200-day) for trend identification\n• RSI for overbought/oversold conditions\n• Volume analysis to confirm price moves\n\n**Fundamental Analysis:**\n• P/E ratios relative to sector peers\n• Revenue growth trajectory\n• Profit margin trends\n\nUse the Stock Prediction Playground to practice and track your accuracy over time.`;
  }

  // Risk-related responses
  if (msg.includes('risk') || msg.includes('safe') || msg.includes('volatile') || msg.includes('hedge')) {
    return `**Risk Management Framework:**\n\n**Position Sizing:**\n• Never risk more than 2-5% of portfolio on a single trade\n• Use the Kelly Criterion for optimal position sizing\n• Scale into positions gradually\n\n**Diversification:**\n• Aim for 15-25 uncorrelated positions\n• Spread across sectors, geographies, and asset classes\n• Include defensive assets (bonds, gold) for downside protection\n\n**Hedging Strategies:**\n• Options (puts) for downside protection on large positions\n• Inverse ETFs for broad market hedges\n• Stop-loss orders to limit maximum drawdown\n\n**Your Risk Score:** ${context.includes('Risk score:') ? context.match(/Risk score: (\d+)/)?.[1] + '/100' : 'Set up your portfolio to see your personalized risk score'}\n\nWould you like specific hedging recommendations for your portfolio?`;
  }

  // Investment strategy responses
  if (msg.includes('strategy') || msg.includes('invest') || msg.includes('buy') || msg.includes('sell')) {
    return `**Investment Strategy Considerations:**\n\n**Time Horizon Matters:**\n• Short-term (< 1 year): Focus on momentum, technical signals\n• Medium-term (1-3 years): Earnings growth, sector trends\n• Long-term (3+ years): Compounding, dividend reinvestment\n\n**Current Market Context:**\n• High interest rate environment favors value over growth\n• AI/tech sector showing strong momentum\n• Energy sector benefiting from supply constraints\n\n**Actionable Framework:**\n1. Define your investment thesis before buying\n2. Set price targets and stop-losses upfront\n3. Review positions quarterly against original thesis\n4. Don't let emotions override your strategy\n\nBased on your portfolio and recent news sentiment, I can provide more specific buy/sell recommendations. What's your investment horizon?`;
  }

  // Crypto/alternative assets
  if (msg.includes('crypto') || msg.includes('bitcoin') || msg.includes('ethereum') || msg.includes('defi')) {
    return `**Cryptocurrency & Digital Assets:**\n\n**Risk Profile:** Extremely high volatility (50-80% annual swings common)\n\n**Key Considerations:**\n• Crypto markets operate 24/7, unlike traditional markets\n• Regulatory uncertainty remains a significant risk factor\n• Correlation with tech stocks has increased in recent years\n\n**If Considering Crypto Exposure:**\n• Limit to 1-5% of total portfolio for most investors\n• Bitcoin and Ethereum are considered lower risk within crypto\n• DeFi protocols carry smart contract and liquidity risks\n• Use dollar-cost averaging to reduce timing risk\n\n**Tax Implications:**\n• Crypto is treated as property in most jurisdictions\n• Every trade is a taxable event\n• Consider tax-loss harvesting opportunities\n\nWould you like to discuss how crypto might fit into your overall asset allocation?`;
  }

  // Macroeconomic questions
  if (msg.includes('inflation') || msg.includes('fed') || msg.includes('interest rate') || msg.includes('recession')) {
    return `**Macroeconomic Analysis:**\n\n**Current Environment:**\n• Central banks navigating the inflation vs. growth tradeoff\n• Interest rate changes ripple through all asset classes\n• Leading indicators (PMI, yield curve) signal economic direction\n\n**Impact on Asset Classes:**\n• **Rising rates:** Bonds fall, growth stocks hurt, banks benefit\n• **Falling rates:** Bonds rise, growth stocks rally, utilities outperform\n• **High inflation:** Real assets (commodities, real estate) outperform\n• **Recession fears:** Defensive sectors (healthcare, consumer staples) hold up\n\n**Portfolio Positioning:**\n• In high-rate environments, consider shorter-duration bonds\n• Value stocks tend to outperform growth during rate hikes\n• International diversification can reduce domestic macro risk\n\nHow is your portfolio currently positioned relative to the macro environment?`;
  }

  // Earnings/valuation questions
  if (msg.includes('earnings') || msg.includes('valuation') || msg.includes('p/e') || msg.includes('revenue')) {
    return `**Earnings & Valuation Analysis:**\n\n**Key Valuation Metrics:**\n• **P/E Ratio:** Price relative to earnings (lower = cheaper)\n• **PEG Ratio:** P/E adjusted for growth (< 1 = potentially undervalued)\n• **EV/EBITDA:** Enterprise value vs. operating cash flow\n• **Price/Sales:** Useful for pre-profit growth companies\n\n**Earnings Quality Indicators:**\n• Revenue growth consistency\n• Margin expansion/contraction trends\n• Free cash flow conversion\n• Guidance vs. actual performance history\n\n**Red Flags:**\n• Earnings beats driven by one-time items\n• Revenue growth without margin improvement\n• Increasing accounts receivable relative to revenue\n• Management guidance consistently missing\n\nWould you like me to analyze the valuation of any specific stocks in your portfolio?`;
  }

  // General financial questions
  if (msg.includes('dividend') || msg.includes('income') || msg.includes('yield')) {
    return `**Dividend & Income Investing:**\n\n**Dividend Fundamentals:**\n• Dividend yield = Annual dividend / Stock price\n• Payout ratio = Dividends / Earnings (< 60% is sustainable)\n• Dividend growth rate matters more than current yield\n\n**High-Quality Dividend Stocks:**\n• Dividend Aristocrats: 25+ years of consecutive increases\n• Look for companies with strong free cash flow\n• Avoid "yield traps" — high yields from falling stock prices\n\n**Income Strategy:**\n• Reinvest dividends for compounding (DRIP)\n• Diversify across dividend-paying sectors\n• Consider dividend ETFs for instant diversification\n\n**Tax Efficiency:**\n• Qualified dividends taxed at lower capital gains rates\n• Hold dividend stocks in tax-advantaged accounts when possible\n\nWould you like recommendations for dividend stocks that complement your current holdings?`;
  }

  // Greeting/introduction
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('help') || msg.length < 20) {
    return `Hello! I'm your **AI Financial Strategy Advisor** 👋\n\nI have access to:\n• 📊 **Your Portfolio** — real-time holdings, P&L, and risk metrics\n• 📰 **News Intelligence** — ML-analyzed market sentiment\n• 🎯 **Prediction History** — your track record and patterns\n\n**I can help you with:**\n• Portfolio analysis and rebalancing suggestions\n• Market sentiment interpretation\n• Risk assessment and hedging strategies\n• Investment strategy for any time horizon\n• Stock valuation and earnings analysis\n• Macroeconomic impact on your holdings\n\nWhat would you like to explore today?`;
  }

  // Default comprehensive response
  return `Great question! Let me provide a comprehensive financial perspective:\n\n**Key Principles for "${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}":**\n\n1. **Data-Driven Decisions:** Always base investment decisions on fundamental and technical analysis, not emotions\n\n2. **Risk-Adjusted Returns:** The goal isn't maximum returns, but optimal risk-adjusted returns for your situation\n\n3. **Diversification:** Spreading risk across uncorrelated assets reduces portfolio volatility\n\n4. **Time in Market:** Consistent long-term investing typically outperforms market timing\n\n5. **Continuous Learning:** Markets evolve — stay informed through our News Intelligence module\n\n${context ? `\n**Your Context:**\n${context.split('\n').map(l => `• ${l}`).join('\n')}` : ''}\n\nWould you like me to dive deeper into any specific aspect of this topic?`;
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const lines = message.content.split('\n');

  const renderContent = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-primary/20' : 'bg-accent/20'
      }`}>
        {isUser ? <User size={14} className="text-primary" /> : <Bot size={14} className="text-accent" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-primary/15 border border-primary/20 rounded-tr-sm'
          : 'bg-white/5 border border-border/20 rounded-tl-sm'
      }`}>
        <div className="text-sm text-foreground/90 leading-relaxed space-y-1">
          {lines.map((line, i) => {
            if (line.startsWith('• ') || line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ') || line.startsWith('5. ')) {
              return <p key={i} className="pl-2">{renderContent(line)}</p>;
            }
            if (line === '') return <div key={i} className="h-1" />;
            return <p key={i}>{renderContent(line)}</p>;
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ─── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
        <Bot size={14} className="text-accent" />
      </div>
      <div className="bg-white/5 border border-border/20 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Context Panel ─────────────────────────────────────────────────────────────
function ContextPanel({ portfolio, articles, predictions }: {
  portfolio: any; articles: any[]; predictions: any[];
}) {
  const totalValue = portfolio?.holdings.reduce((sum: number, h: any) => {
    return sum + Number(h.shares) * getLivePrice(h.symbol);
  }, 0) ?? 0;

  const recentSentiment = articles.length > 0
    ? articles.slice(0, 3).filter(a => a.sentiment.includes('positive')).length > 1 ? 'Bullish' : 'Mixed'
    : 'No data';

  const predAccuracy = predictions.length > 0
    ? Math.round((predictions.filter((p: any) => p.result === 'correct').length / predictions.length) * 100)
    : null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Live Context</h3>

      {/* Portfolio context */}
      <div className="glass-card rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <PieChart size={13} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">Portfolio</span>
        </div>
        {portfolio ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Value</span>
              <span className="text-foreground font-mono">${totalValue.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Holdings</span>
              <span className="text-foreground">{portfolio.holdings.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Risk</span>
              <span className="text-amber-400">{portfolio.riskScore}/100</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No portfolio data</p>
        )}
      </div>

      {/* News context */}
      <div className="glass-card rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Newspaper size={13} className="text-accent" />
          <span className="text-xs font-semibold text-foreground">News Sentiment</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Articles</span>
            <span className="text-foreground">{articles.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Trend</span>
            <span className={recentSentiment === 'Bullish' ? 'text-emerald-400' : 'text-amber-400'}>
              {recentSentiment}
            </span>
          </div>
        </div>
      </div>

      {/* Predictions context */}
      <div className="glass-card rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Target size={13} className="text-amber-400" />
          <span className="text-xs font-semibold text-foreground">Predictions</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total</span>
            <span className="text-foreground">{predictions.length}</span>
          </div>
          {predAccuracy !== null && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Accuracy</span>
              <span className={predAccuracy >= 55 ? 'text-emerald-400' : 'text-red-400'}>{predAccuracy}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick prompts */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">Quick Prompts</h3>
        <div className="space-y-1.5">
          {[
            'Analyze my portfolio risk',
            'What does recent news signal?',
            'How can I improve my predictions?',
            'Suggest a rebalancing strategy',
            'Explain current market conditions',
          ].map(prompt => (
            <button key={prompt}
              className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all border border-border/20 hover:border-primary/30">
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdvisorPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: conversation, isLoading: convLoading } = useGetConversation();
  const { data: portfolio } = useGetPortfolio();
  const { data: articles = [] } = useGetNewsArticles();
  const { data: predictions = [] } = useGetUserPredictions();
  const { mutate: sendMessageToBackend } = useSendMessage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (!initialized) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your **AI Financial Strategy Advisor** 👋\n\nI have access to:\n• 📊 **Your Portfolio** — real-time holdings, P&L, and risk metrics\n• 📰 **News Intelligence** — ML-analyzed market sentiment\n• 🎯 **Prediction History** — your track record and patterns\n\n**I can help you with:**\n• Portfolio analysis and rebalancing suggestions\n• Market sentiment interpretation\n• Risk assessment and hedging strategies\n• Investment strategy for any time horizon\n• Stock valuation and earnings analysis\n• Macroeconomic impact on your holdings\n\nWhat would you like to explore today?`,
        timestamp: Date.now(),
      }]);
      setInitialized(true);
    }
  }, [initialized]);

  // Load conversation history from backend
  useEffect(() => {
    if (conversation && conversation.messages.length > 0 && initialized) {
      const backendMessages: ChatMessage[] = conversation.messages.map(m => ({
        id: `backend-${m.timestamp}`,
        role: m.sender.toString() === identity?.getPrincipal().toString() ? 'user' : 'assistant',
        content: m.content,
        timestamp: Number(m.timestamp) / 1_000_000,
      }));
      // Only add if we don't already have them
      if (backendMessages.length > 0 && messages.length <= 1) {
        setMessages(prev => [...prev, ...backendMessages]);
      }
    }
  }, [conversation, initialized]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const context = useMemo(() =>
    buildSystemContext(portfolio, articles, predictions),
    [portfolio, articles, predictions]
  );

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Save to backend
    if (isAuthenticated) {
      sendMessageToBackend(trimmed);
    }

    // Simulate AI thinking time
    const thinkTime = 800 + Math.random() * 1200;
    await new Promise(resolve => setTimeout(resolve, thinkTime));

    const aiResponse = generateAIResponse(trimmed, context);
    const assistantMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center glass-card rounded-2xl p-10 max-w-sm">
          <Bot size={40} className="mx-auto mb-4 text-primary opacity-60" />
          <h2 className="text-xl font-bold text-foreground mb-2">Authentication Required</h2>
          <p className="text-sm text-muted-foreground">Please log in to access your AI Financial Advisor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/20">
              <Brain size={20} className="text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AI Financial Strategy Advisor</h1>
              <p className="text-xs text-muted-foreground">Powered by portfolio, news & prediction context</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Online
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <ContextPanel portfolio={portfolio} articles={articles} predictions={predictions} />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1"
            style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {convLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick prompts (mobile) */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-3">
            {['Analyze my portfolio', 'Market sentiment', 'Risk assessment', 'Strategy tips'].map(p => (
              <button key={p} onClick={() => handleQuickPrompt(p)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                {p}
              </button>
            ))}
          </div>

          {/* Input area */}
          <div className="glass-card rounded-2xl p-3 border border-border/30">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your portfolio, market conditions, investment strategies..."
              className="min-h-[60px] max-h-[120px] bg-transparent border-0 resize-none text-sm focus-visible:ring-0 p-0 text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</span>
              </div>
              <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="sm"
                className="bg-primary hover:bg-primary/90 gap-1.5 rounded-xl">
                {isTyping ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
