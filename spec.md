# Specification

## Summary
**Goal:** Add simulated real-time stock price display and a live price graph to the FinIQ Platform frontend.

**Planned changes:**
- Add a `getLivePrice(symbol)` utility and `useLivePrice(symbol, intervalMs?)` React hook in `mockStocks.ts` that simulate live price movement using a random walk on existing mock OHLCV data, updating every 3 seconds
- Create a `LivePriceTicker` component that shows the symbol, current price, absolute change, and percentage change with green/red coloring and a pulse animation on each tick, styled with `GlassCard`
- Create a `LivePriceChart` component that maintains a rolling 60-tick buffer and renders a real-time Recharts `LineChart` with a teal/red color-coded line, a reference line at session-open price, and a custom tooltip
- Integrate `LivePriceTicker` and `LivePriceChart` into the Stock Playground page above/beside the prediction form; label the new chart "Live Price" and keep the existing historical chart labeled "Historical Price"
- Integrate `LivePriceTicker` into each holding row in the Portfolio Analyzer page and update portfolio value and unrealized P&L to reflect live prices in real time

**User-visible outcome:** Users can see live-updating simulated prices and a rolling price chart on the Stock Playground page, and watch their portfolio value and P&L refresh automatically as prices tick on the Portfolio Analyzer page.
