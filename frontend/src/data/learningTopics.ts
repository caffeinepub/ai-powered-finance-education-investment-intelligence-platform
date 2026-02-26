export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  estimatedMinutes: number;
  content: string;
  quiz: QuizQuestion[];
}

export const learningTopics: LearningTopic[] = [
  {
    id: 'stocks-basics',
    title: 'Stock Market Basics',
    description: 'Understand how stocks work, what drives prices, and how to read market data.',
    icon: '📈',
    color: 'teal',
    estimatedMinutes: 15,
    content: `## What is a Stock?

A **stock** (also called a share or equity) represents ownership in a company. When you buy a stock, you become a part-owner (shareholder) of that company.

### How Stock Prices Work

Stock prices are determined by **supply and demand** in the marketplace. When more people want to buy a stock than sell it, the price goes up. When more people want to sell, the price goes down.

Key factors that influence stock prices:
- **Company earnings**: Profits and revenue growth
- **Economic conditions**: Interest rates, inflation, GDP growth
- **Market sentiment**: Investor confidence and fear
- **Industry trends**: Sector-wide developments
- **News events**: Mergers, product launches, scandals

### Types of Stocks

1. **Common Stock**: Most prevalent type; shareholders get voting rights and may receive dividends
2. **Preferred Stock**: Priority over common stock for dividends; usually no voting rights
3. **Growth Stocks**: Companies expected to grow faster than average (e.g., tech companies)
4. **Value Stocks**: Undervalued companies trading below their intrinsic value
5. **Dividend Stocks**: Companies that regularly pay dividends to shareholders

### Key Metrics

- **P/E Ratio (Price-to-Earnings)**: Stock price divided by earnings per share. Lower = potentially undervalued
- **Market Cap**: Total value of all shares (Price × Shares Outstanding)
- **EPS (Earnings Per Share)**: Company profit divided by number of shares
- **Dividend Yield**: Annual dividend divided by stock price

### Reading a Stock Quote

A typical stock quote shows:
- **Ticker Symbol**: Short code (e.g., AAPL for Apple)
- **Current Price**: Last traded price
- **Change**: Price change from previous close
- **Volume**: Number of shares traded
- **52-Week High/Low**: Price range over the past year

### Market Indices

Indices track the performance of a group of stocks:
- **S&P 500**: 500 largest US companies
- **Dow Jones (DJIA)**: 30 major US companies
- **NASDAQ**: Technology-heavy index`,
    quiz: [
      {
        question: 'What does owning a stock represent?',
        options: ['A loan to the company', 'Partial ownership of the company', 'A guaranteed return', 'A bond contract'],
        correctIndex: 1,
        explanation: 'A stock represents partial ownership (equity) in a company. Shareholders are part-owners of the business.'
      },
      {
        question: 'What is the P/E ratio?',
        options: ['Profit divided by expenses', 'Price divided by earnings per share', 'Portfolio divided by equity', 'Performance evaluation ratio'],
        correctIndex: 1,
        explanation: 'The P/E (Price-to-Earnings) ratio is calculated by dividing the stock price by the earnings per share. It helps assess if a stock is over or undervalued.'
      },
      {
        question: 'Which index tracks 500 of the largest US companies?',
        options: ['Dow Jones', 'NASDAQ', 'S&P 500', 'Russell 2000'],
        correctIndex: 2,
        explanation: 'The S&P 500 tracks 500 of the largest publicly traded companies in the United States and is widely considered the best gauge of large-cap US equities.'
      },
      {
        question: 'What primarily determines a stock\'s price?',
        options: ['Government regulations', 'Supply and demand', 'Company age', 'Number of employees'],
        correctIndex: 1,
        explanation: 'Stock prices are primarily determined by supply and demand in the marketplace. When demand exceeds supply, prices rise; when supply exceeds demand, prices fall.'
      },
      {
        question: 'What is a dividend yield?',
        options: ['Annual dividend divided by stock price', 'Stock price divided by annual dividend', 'Total earnings per share', 'Market cap divided by revenue'],
        correctIndex: 0,
        explanation: 'Dividend yield is calculated by dividing the annual dividend payment by the current stock price, expressed as a percentage. It shows the return from dividends alone.'
      },
      {
        question: 'Which type of stock typically gives shareholders voting rights?',
        options: ['Preferred stock', 'Common stock', 'Bond', 'ETF'],
        correctIndex: 1,
        explanation: 'Common stock typically gives shareholders voting rights on company matters such as electing board members. Preferred stockholders usually do not have voting rights.'
      }
    ]
  },
  {
    id: 'bonds-fixed-income',
    title: 'Bonds & Fixed Income',
    description: 'Learn about bonds, yield curves, credit ratings, and fixed income investing strategies.',
    icon: '🏦',
    color: 'gold',
    estimatedMinutes: 12,
    content: `## Understanding Bonds

A **bond** is a debt instrument where an investor loans money to an entity (corporate or governmental) that borrows the funds for a defined period at a fixed interest rate.

### How Bonds Work

When you buy a bond, you are lending money to the issuer. In return, the issuer promises to:
1. Pay you **interest** (called the coupon) at regular intervals
2. Return the **principal** (face value) at maturity

### Key Bond Terms

- **Face Value (Par Value)**: The amount the bond will be worth at maturity (typically $1,000)
- **Coupon Rate**: Annual interest rate paid on the face value
- **Maturity Date**: When the bond expires and principal is returned
- **Yield**: The actual return on the bond considering current price
- **Duration**: Measure of a bond's sensitivity to interest rate changes

### Types of Bonds

1. **Government Bonds**: Issued by national governments (e.g., US Treasury bonds)
   - T-Bills: Short-term (< 1 year)
   - T-Notes: Medium-term (2-10 years)
   - T-Bonds: Long-term (20-30 years)

2. **Corporate Bonds**: Issued by companies to raise capital
   - Investment Grade: Higher credit quality (BBB or above)
   - High Yield (Junk): Lower credit quality, higher risk/return

3. **Municipal Bonds**: Issued by state/local governments; often tax-exempt

### Bond Pricing and Yield

**Inverse relationship**: When interest rates rise, bond prices fall, and vice versa.

- If market rates > coupon rate → bond trades at a **discount** (below par)
- If market rates < coupon rate → bond trades at a **premium** (above par)

### Credit Ratings

Rating agencies (Moody's, S&P, Fitch) assess bond creditworthiness:
- **AAA/Aaa**: Highest quality
- **BBB/Baa**: Lowest investment grade
- **BB/Ba and below**: Speculative (junk bonds)

### The Yield Curve

The yield curve plots yields of bonds with equal credit quality but different maturities:
- **Normal**: Long-term yields > short-term yields (healthy economy)
- **Inverted**: Short-term yields > long-term yields (recession signal)
- **Flat**: Similar yields across maturities`,
    quiz: [
      {
        question: 'What is a bond\'s coupon rate?',
        options: ['The bond\'s current market price', 'The annual interest rate paid on face value', 'The bond\'s credit rating', 'The maturity period'],
        correctIndex: 1,
        explanation: 'The coupon rate is the annual interest rate paid on the bond\'s face value. For example, a 5% coupon on a $1,000 bond pays $50 per year.'
      },
      {
        question: 'What happens to bond prices when interest rates rise?',
        options: ['Bond prices rise', 'Bond prices fall', 'Bond prices stay the same', 'Bond prices double'],
        correctIndex: 1,
        explanation: 'Bond prices and interest rates have an inverse relationship. When interest rates rise, existing bonds with lower coupon rates become less attractive, so their prices fall.'
      },
      {
        question: 'What does an inverted yield curve typically signal?',
        options: ['Economic growth', 'Potential recession', 'Rising inflation', 'Stock market rally'],
        correctIndex: 1,
        explanation: 'An inverted yield curve, where short-term yields exceed long-term yields, has historically been a reliable predictor of economic recession.'
      },
      {
        question: 'Which bond type is typically considered the safest?',
        options: ['Corporate junk bonds', 'Municipal bonds', 'US Treasury bonds', 'Emerging market bonds'],
        correctIndex: 2,
        explanation: 'US Treasury bonds are backed by the full faith and credit of the US government and are considered among the safest investments in the world.'
      },
      {
        question: 'What is bond duration?',
        options: ['The time until maturity', 'A measure of sensitivity to interest rate changes', 'The coupon payment frequency', 'The credit rating period'],
        correctIndex: 1,
        explanation: 'Duration measures how sensitive a bond\'s price is to changes in interest rates. Higher duration means greater price sensitivity to rate changes.'
      },
      {
        question: 'What credit rating is the lowest investment-grade rating from S&P?',
        options: ['AAA', 'AA', 'BBB', 'BB'],
        correctIndex: 2,
        explanation: 'BBB (or Baa from Moody\'s) is the lowest investment-grade rating. Bonds rated below BBB are considered speculative or "junk" bonds.'
      }
    ]
  },
  {
    id: 'portfolio-theory',
    title: 'Modern Portfolio Theory',
    description: 'Master diversification, risk-return tradeoffs, efficient frontier, and asset allocation.',
    icon: '🎯',
    color: 'teal',
    estimatedMinutes: 18,
    content: `## Modern Portfolio Theory (MPT)

Developed by Harry Markowitz in 1952, **Modern Portfolio Theory** provides a framework for constructing portfolios that maximize expected return for a given level of risk.

### Core Concepts

#### Risk and Return
- **Expected Return**: The weighted average of possible returns
- **Risk (Volatility)**: Measured by standard deviation of returns
- **Risk-Return Tradeoff**: Higher potential returns require accepting higher risk

#### Diversification
The key insight of MPT: **combining assets reduces portfolio risk** without necessarily reducing returns.

Why diversification works:
- Different assets respond differently to market events
- When one asset falls, another may rise
- **Correlation** measures how assets move together (-1 to +1)
  - Correlation of -1: Perfect negative correlation (ideal for diversification)
  - Correlation of 0: No relationship
  - Correlation of +1: Perfect positive correlation (no diversification benefit)

### Types of Risk

1. **Systematic Risk (Market Risk)**: Affects the entire market; cannot be diversified away
   - Examples: Recessions, interest rate changes, geopolitical events
   - Measured by **Beta** (β)

2. **Unsystematic Risk (Specific Risk)**: Affects individual companies/sectors; can be diversified away
   - Examples: Management changes, product failures, lawsuits

### The Efficient Frontier

The efficient frontier represents the set of optimal portfolios that offer:
- The highest expected return for a given level of risk, OR
- The lowest risk for a given expected return

Portfolios below the efficient frontier are suboptimal.

### Asset Allocation

Strategic distribution of investments across asset classes:
- **Equities (Stocks)**: Higher risk, higher potential return
- **Fixed Income (Bonds)**: Lower risk, stable income
- **Cash/Equivalents**: Lowest risk, lowest return
- **Alternative Assets**: Real estate, commodities, private equity

### The Capital Asset Pricing Model (CAPM)

CAPM describes the relationship between systematic risk and expected return:

**Expected Return = Risk-Free Rate + Beta × (Market Return - Risk-Free Rate)**

- **Beta > 1**: More volatile than the market
- **Beta < 1**: Less volatile than the market
- **Beta = 1**: Moves with the market

### Sharpe Ratio

Measures risk-adjusted return:
**Sharpe Ratio = (Portfolio Return - Risk-Free Rate) / Portfolio Standard Deviation**

Higher Sharpe ratio = better risk-adjusted performance`,
    quiz: [
      {
        question: 'What does Modern Portfolio Theory primarily aim to optimize?',
        options: ['Maximum returns regardless of risk', 'Maximum return for a given level of risk', 'Minimum taxes on investments', 'Maximum number of holdings'],
        correctIndex: 1,
        explanation: 'MPT aims to construct portfolios that maximize expected return for a given level of risk, or equivalently, minimize risk for a given expected return.'
      },
      {
        question: 'What is the correlation value that provides the best diversification benefit?',
        options: ['+1', '0', '-1', '+0.5'],
        correctIndex: 2,
        explanation: 'A correlation of -1 (perfect negative correlation) provides the maximum diversification benefit, as the assets move in exactly opposite directions.'
      },
      {
        question: 'What type of risk CANNOT be eliminated through diversification?',
        options: ['Company-specific risk', 'Industry risk', 'Systematic (market) risk', 'Management risk'],
        correctIndex: 2,
        explanation: 'Systematic risk (market risk) affects the entire market and cannot be diversified away. Only unsystematic (specific) risk can be reduced through diversification.'
      },
      {
        question: 'A stock with a Beta of 1.5 means:',
        options: ['It moves 50% less than the market', 'It moves 50% more than the market', 'It has 50% higher dividends', 'It has 50% lower P/E ratio'],
        correctIndex: 1,
        explanation: 'A Beta of 1.5 means the stock is expected to move 50% more than the market. If the market rises 10%, the stock is expected to rise 15%.'
      },
      {
        question: 'What does the Sharpe Ratio measure?',
        options: ['Total portfolio return', 'Risk-adjusted return', 'Portfolio diversification level', 'Market correlation'],
        correctIndex: 1,
        explanation: 'The Sharpe Ratio measures risk-adjusted return by dividing excess return (above risk-free rate) by the portfolio\'s standard deviation. Higher is better.'
      },
      {
        question: 'What is the efficient frontier?',
        options: ['The maximum possible return', 'The set of optimal portfolios with best risk-return tradeoffs', 'The minimum risk portfolio', 'The market index benchmark'],
        correctIndex: 1,
        explanation: 'The efficient frontier represents the set of optimal portfolios that offer the highest expected return for each level of risk, or the lowest risk for each level of return.'
      }
    ]
  },
  {
    id: 'technical-analysis',
    title: 'Technical Analysis',
    description: 'Learn chart patterns, indicators, support/resistance levels, and trading signals.',
    icon: '📊',
    color: 'gold',
    estimatedMinutes: 20,
    content: `## Technical Analysis

**Technical analysis** is the study of historical price and volume data to forecast future price movements. Unlike fundamental analysis, it focuses on price patterns and market psychology.

### Core Principles

1. **Market discounts everything**: All known information is reflected in the price
2. **Prices move in trends**: Prices tend to move in identifiable trends
3. **History repeats itself**: Patterns recur due to consistent human psychology

### Chart Types

- **Line Chart**: Connects closing prices; simplest view
- **Bar Chart**: Shows Open, High, Low, Close (OHLC) for each period
- **Candlestick Chart**: Visual OHLC representation; most popular
  - Green/White candle: Close > Open (bullish)
  - Red/Black candle: Close < Open (bearish)

### Support and Resistance

- **Support**: Price level where buying interest is strong enough to prevent further decline
- **Resistance**: Price level where selling pressure prevents further advance
- When support breaks, it often becomes resistance (and vice versa)

### Trend Analysis

- **Uptrend**: Series of higher highs and higher lows
- **Downtrend**: Series of lower highs and lower lows
- **Sideways/Consolidation**: Price moves within a range

**Trend Lines**: Lines drawn connecting swing highs or lows to identify trend direction

### Moving Averages

Smooth out price data to identify trends:
- **Simple Moving Average (SMA)**: Average of closing prices over N periods
- **Exponential Moving Average (EMA)**: Gives more weight to recent prices

**Golden Cross**: Short-term MA crosses above long-term MA (bullish signal)
**Death Cross**: Short-term MA crosses below long-term MA (bearish signal)

### Key Indicators

1. **RSI (Relative Strength Index)**: Measures momentum (0-100)
   - Above 70: Overbought (potential sell signal)
   - Below 30: Oversold (potential buy signal)

2. **MACD (Moving Average Convergence Divergence)**: Trend-following momentum indicator
   - MACD line crosses above signal line: Bullish
   - MACD line crosses below signal line: Bearish

3. **Bollinger Bands**: Volatility bands around a moving average
   - Price near upper band: Potentially overbought
   - Price near lower band: Potentially oversold

4. **Volume**: Confirms price movements
   - Rising price + rising volume: Strong uptrend
   - Rising price + falling volume: Weak uptrend (potential reversal)

### Common Chart Patterns

**Reversal Patterns**:
- Head and Shoulders (bearish reversal)
- Double Top/Bottom
- Inverse Head and Shoulders (bullish reversal)

**Continuation Patterns**:
- Flags and Pennants
- Triangles (ascending, descending, symmetrical)
- Cup and Handle`,
    quiz: [
      {
        question: 'What does a "Golden Cross" signal in technical analysis?',
        options: ['A bearish reversal', 'A bullish signal when short-term MA crosses above long-term MA', 'A stock reaching all-time high', 'A dividend announcement'],
        correctIndex: 1,
        explanation: 'A Golden Cross occurs when a short-term moving average (e.g., 50-day) crosses above a long-term moving average (e.g., 200-day), which is considered a bullish signal.'
      },
      {
        question: 'An RSI reading above 70 typically indicates:',
        options: ['Oversold conditions', 'Strong uptrend', 'Overbought conditions', 'High trading volume'],
        correctIndex: 2,
        explanation: 'An RSI above 70 indicates overbought conditions, suggesting the asset may be due for a price correction or pullback.'
      },
      {
        question: 'What is a "support level" in technical analysis?',
        options: ['A price level where selling pressure is strong', 'A price level where buying interest prevents further decline', 'The 52-week high price', 'The average trading volume'],
        correctIndex: 1,
        explanation: 'A support level is a price point where buying interest is strong enough to prevent the price from falling further. It acts as a "floor" for the price.'
      },
      {
        question: 'What does increasing volume during a price rise indicate?',
        options: ['Weak uptrend', 'Strong uptrend confirmation', 'Potential reversal', 'Overbought conditions'],
        correctIndex: 1,
        explanation: 'Rising price accompanied by rising volume confirms the strength of the uptrend. Volume acts as a confirmation tool for price movements.'
      },
      {
        question: 'What type of candlestick indicates a bearish session?',
        options: ['Green/white candle', 'Red/black candle', 'Long-wicked candle', 'Doji candle'],
        correctIndex: 1,
        explanation: 'A red or black candlestick indicates that the closing price was lower than the opening price, representing a bearish (down) session.'
      },
      {
        question: 'What is the MACD indicator used for?',
        options: ['Measuring trading volume', 'Identifying trend-following momentum', 'Calculating dividend yield', 'Measuring market capitalization'],
        correctIndex: 1,
        explanation: 'MACD (Moving Average Convergence Divergence) is a trend-following momentum indicator that shows the relationship between two moving averages of a security\'s price.'
      }
    ]
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    description: 'Master position sizing, stop-losses, risk-reward ratios, and portfolio protection strategies.',
    icon: '🛡️',
    color: 'teal',
    estimatedMinutes: 16,
    content: `## Risk Management in Investing

**Risk management** is the process of identifying, assessing, and controlling threats to your investment portfolio. It's arguably the most important skill for long-term investment success.

### Why Risk Management Matters

- Preserves capital during market downturns
- Allows you to stay in the market long-term
- Reduces emotional decision-making
- Improves risk-adjusted returns

### Key Risk Management Concepts

#### Position Sizing

How much capital to allocate to each investment:
- **1% Rule**: Never risk more than 1-2% of total portfolio on a single trade
- **Kelly Criterion**: Mathematical formula to optimize position size
- **Equal Weighting**: Allocate equal amounts to each position

#### Stop-Loss Orders

Predetermined price at which you'll sell to limit losses:
- **Fixed Stop-Loss**: Set at a specific price (e.g., 10% below entry)
- **Trailing Stop-Loss**: Moves up with the price, locks in profits
- **Volatility-Based Stop**: Based on ATR (Average True Range)

#### Risk-Reward Ratio

Compare potential profit to potential loss:
- **2:1 Ratio**: For every $1 risked, expect $2 in potential profit
- Minimum recommended: 1.5:1 or 2:1
- Higher ratios allow for lower win rates while remaining profitable

### Types of Investment Risk

1. **Market Risk**: Overall market decline
2. **Concentration Risk**: Too much in one stock/sector
3. **Liquidity Risk**: Unable to sell at desired price
4. **Currency Risk**: Foreign exchange fluctuations
5. **Inflation Risk**: Returns don't keep pace with inflation
6. **Interest Rate Risk**: Rising rates hurt bond prices
7. **Credit Risk**: Borrower defaults on debt

### Hedging Strategies

Reduce risk by taking offsetting positions:
- **Options**: Put options protect against downside
- **Short Selling**: Profit from declining prices
- **Inverse ETFs**: Move opposite to the market
- **Diversification**: Spread across uncorrelated assets

### The Maximum Drawdown

Measures the largest peak-to-trough decline:
- **Formula**: (Trough Value - Peak Value) / Peak Value
- Lower maximum drawdown = better risk management
- Important metric for evaluating fund managers

### Value at Risk (VaR)

Statistical measure of potential loss:
- "There is a 95% probability that the portfolio will not lose more than X% in a day"
- Helps quantify and communicate risk

### Portfolio Protection Strategies

1. **Rebalancing**: Periodically restore target allocations
2. **Dollar-Cost Averaging**: Invest fixed amounts regularly
3. **Asset Allocation**: Mix of stocks, bonds, cash
4. **Correlation Management**: Hold assets that don't move together
5. **Cash Reserves**: Maintain liquidity for opportunities and emergencies`,
    quiz: [
      {
        question: 'What does the "1% Rule" in risk management refer to?',
        options: ['Invest only 1% in stocks', 'Never risk more than 1-2% of portfolio on a single trade', 'Expect 1% monthly returns', 'Rebalance portfolio every 1%'],
        correctIndex: 1,
        explanation: 'The 1% Rule states that you should never risk more than 1-2% of your total portfolio capital on any single trade, helping to preserve capital during losing streaks.'
      },
      {
        question: 'What is a trailing stop-loss?',
        options: ['A stop-loss that never changes', 'A stop-loss that moves up with the price to lock in profits', 'A stop-loss based on time', 'A stop-loss set at purchase price'],
        correctIndex: 1,
        explanation: 'A trailing stop-loss automatically adjusts upward as the price rises, locking in profits while still protecting against significant reversals.'
      },
      {
        question: 'What does a 2:1 risk-reward ratio mean?',
        options: ['Risk $2 to make $1', 'Risk $1 to potentially make $2', 'Win 2 out of every 3 trades', 'Double your position size'],
        correctIndex: 1,
        explanation: 'A 2:1 risk-reward ratio means for every $1 you risk (potential loss), you expect to make $2 in potential profit. This allows profitability even with a 40% win rate.'
      },
      {
        question: 'What is concentration risk?',
        options: ['Risk from focusing too much on one stock or sector', 'Risk from not paying attention to markets', 'Risk from high trading frequency', 'Risk from using leverage'],
        correctIndex: 0,
        explanation: 'Concentration risk occurs when too much of a portfolio is invested in a single stock, sector, or asset class, making it vulnerable to that specific area\'s performance.'
      },
      {
        question: 'What does maximum drawdown measure?',
        options: ['Maximum daily trading volume', 'Largest peak-to-trough portfolio decline', 'Maximum position size allowed', 'Highest annual return achieved'],
        correctIndex: 1,
        explanation: 'Maximum drawdown measures the largest percentage decline from a portfolio\'s peak value to its lowest point before recovering. It\'s a key risk metric.'
      },
      {
        question: 'Which strategy involves investing fixed amounts at regular intervals?',
        options: ['Lump-sum investing', 'Dollar-cost averaging', 'Value investing', 'Momentum investing'],
        correctIndex: 1,
        explanation: 'Dollar-cost averaging involves investing a fixed amount at regular intervals regardless of price, reducing the impact of volatility and eliminating the need to time the market.'
      }
    ]
  },
  {
    id: 'fundamental-analysis',
    title: 'Fundamental Analysis',
    description: 'Evaluate company financials, valuation metrics, competitive moats, and intrinsic value.',
    icon: '🔍',
    color: 'gold',
    estimatedMinutes: 22,
    content: `## Fundamental Analysis

**Fundamental analysis** evaluates a security's intrinsic value by examining related economic, financial, and other qualitative and quantitative factors.

### Financial Statements

#### Income Statement
Shows profitability over a period:
- **Revenue**: Total sales
- **Gross Profit**: Revenue - Cost of Goods Sold
- **Operating Income (EBIT)**: Gross Profit - Operating Expenses
- **Net Income**: Bottom line profit after all expenses and taxes
- **EPS**: Net Income / Shares Outstanding

#### Balance Sheet
Snapshot of financial position:
- **Assets**: What the company owns (cash, inventory, property)
- **Liabilities**: What the company owes (debt, accounts payable)
- **Shareholders' Equity**: Assets - Liabilities (book value)

#### Cash Flow Statement
Tracks actual cash movement:
- **Operating Cash Flow**: Cash from core business operations
- **Investing Cash Flow**: Capital expenditures, acquisitions
- **Financing Cash Flow**: Debt issuance/repayment, dividends

### Key Valuation Metrics

| Metric | Formula | What It Measures |
|--------|---------|-----------------|
| P/E Ratio | Price / EPS | Earnings valuation |
| P/B Ratio | Price / Book Value | Asset valuation |
| P/S Ratio | Price / Revenue per Share | Revenue valuation |
| EV/EBITDA | Enterprise Value / EBITDA | Operational valuation |
| PEG Ratio | P/E / Earnings Growth Rate | Growth-adjusted valuation |

### Profitability Metrics

- **Gross Margin**: Gross Profit / Revenue
- **Operating Margin**: Operating Income / Revenue
- **Net Margin**: Net Income / Revenue
- **ROE (Return on Equity)**: Net Income / Shareholders' Equity
- **ROA (Return on Assets)**: Net Income / Total Assets
- **ROIC (Return on Invested Capital)**: NOPAT / Invested Capital

### Competitive Moats

Warren Buffett's concept of durable competitive advantages:
1. **Cost Advantage**: Lower production costs than competitors
2. **Network Effects**: Product becomes more valuable as more people use it
3. **Switching Costs**: High cost for customers to switch to competitors
4. **Intangible Assets**: Brands, patents, regulatory licenses
5. **Efficient Scale**: Natural monopoly in a limited market

### Discounted Cash Flow (DCF) Analysis

Estimates intrinsic value based on future cash flows:
1. Project future free cash flows
2. Determine appropriate discount rate (WACC)
3. Calculate terminal value
4. Discount all cash flows to present value

**Intrinsic Value = Sum of (Future Cash Flows / (1 + Discount Rate)^n)**

### Qualitative Factors

- Management quality and track record
- Industry dynamics and competitive position
- Regulatory environment
- Brand strength and customer loyalty
- Innovation pipeline`,
    quiz: [
      {
        question: 'What does the income statement primarily show?',
        options: ['Company\'s assets and liabilities', 'Company\'s profitability over a period', 'Cash flow from operations', 'Stock price history'],
        correctIndex: 1,
        explanation: 'The income statement shows a company\'s revenues, expenses, and profits over a specific period, revealing whether the company is profitable.'
      },
      {
        question: 'What is Return on Equity (ROE)?',
        options: ['Revenue divided by equity', 'Net income divided by shareholders\' equity', 'Stock price divided by book value', 'Dividends divided by stock price'],
        correctIndex: 1,
        explanation: 'ROE measures how efficiently a company uses shareholders\' equity to generate profit. It\'s calculated as Net Income / Shareholders\' Equity.'
      },
      {
        question: 'What is a "competitive moat" in investing?',
        options: ['A company\'s debt level', 'A durable competitive advantage that protects market position', 'The company\'s cash reserves', 'The stock\'s trading volume'],
        correctIndex: 1,
        explanation: 'A competitive moat refers to a company\'s sustainable competitive advantages that protect it from competitors, such as brand strength, network effects, or switching costs.'
      },
      {
        question: 'What does DCF analysis estimate?',
        options: ['Daily trading volume', 'A stock\'s intrinsic value based on future cash flows', 'Dividend payment schedule', 'Debt-to-capital ratio'],
        correctIndex: 1,
        explanation: 'DCF (Discounted Cash Flow) analysis estimates a company\'s intrinsic value by projecting future free cash flows and discounting them back to present value.'
      },
      {
        question: 'Which financial statement shows a company\'s assets, liabilities, and equity?',
        options: ['Income statement', 'Cash flow statement', 'Balance sheet', 'Annual report'],
        correctIndex: 2,
        explanation: 'The balance sheet provides a snapshot of a company\'s financial position at a specific point in time, showing what it owns (assets), owes (liabilities), and the residual equity.'
      },
      {
        question: 'What does the PEG ratio account for that the P/E ratio does not?',
        options: ['Dividend payments', 'Earnings growth rate', 'Debt levels', 'Cash flow'],
        correctIndex: 1,
        explanation: 'The PEG ratio (P/E divided by earnings growth rate) adjusts the P/E ratio for growth, making it more useful for comparing companies with different growth rates.'
      }
    ]
  }
];
