# 🤖 Trading Bot Guide

## Overview

The AI Auto Trading Bot is an automated trading system that executes trades based on AI-generated signals. It monitors the Thai stock market and automatically buys and sells stocks according to predefined rules and risk parameters.

---

## 🎯 Key Features

### 1. **Automated Trading**
- Executes trades automatically based on AI trading signals
- Monitors positions 24/7 for exit conditions
- Supports paper trading (simulation) and live trading modes

### 2. **Risk Management**
- Stop-loss protection (automatic exit on losses)
- Take-profit targets (lock in gains)
- Trailing stops (protect profits as price rises)
- Daily loss limits
- Maximum trades per day
- Total exposure limits

### 3. **Safety Features**
- Emergency kill switch
- Auto-pause on safety limit violations
- Real-time alerts and notifications
- Comprehensive trade history

---

## 🚀 Getting Started

### Step 1: Configure Your Bot

1. Navigate to **Bot → Settings** tab
2. Configure the following:

#### Bot Status
- **Enable Bot**: Turn the bot on/off
- **Trading Mode**: 
  - **Paper Trading**: Simulated trades (recommended for testing)
  - **Live Trading**: Real trades with actual money ⚠️

#### Risk Management
- **Max Position Size**: Maximum amount per trade (฿10,000 default)
- **Max Daily Trades**: Limit trades per day (3 default)
- **Total Exposure**: Maximum total investment (฿50,000 default)
- **Daily Loss Limit**: Maximum loss allowed per day (฿5,000 default)
- **Portfolio Drawdown**: Maximum portfolio decline (20% default)

#### Trading Rules
- **Min Confidence Score**: Only trade signals above this threshold (75% default)
- **Allowed Signal Types**: Choose BUY, SELL, or HOLD signals
- **Auto Stop Loss**: Enable automatic stop-loss protection
- **Auto Take Profit**: Enable automatic profit-taking
- **Trailing Stop**: Protect profits as price rises (5% default)

### Step 2: Start Trading

1. Click **"Save Configuration"**
2. Toggle **"Enable Bot"** to ON
3. Monitor the **Dashboard** tab for real-time statistics

### Step 3: Monitor Performance

- **Dashboard**: View live bot status and statistics
- **Trades**: Review complete trade history and analytics
- **Alerts**: Stay informed about important events

---

## 📊 Understanding the Dashboard

### Safety Status Indicators

1. **Daily Loss Limit** 🟡
   - Shows: Current losses / Maximum allowed
   - Color: 
     - Green: Safe (< 50% used)
     - Yellow: Caution (50-80% used)
     - Red: Critical (> 80% used)
   - Action: Bot auto-pauses at 100%

2. **Daily Trades** 🔵
   - Shows: Trades executed / Maximum allowed
   - Bot stops trading when limit reached
   - Resets daily at midnight

3. **Total Exposure** 🟢
   - Shows: Current investments / Maximum allowed
   - Prevents over-leveraging
   - Includes all active positions

### Performance Metrics

- **Trades Today**: Number of trades executed today
- **Win Rate**: Percentage of profitable trades
- **Total P/L**: Overall profit/loss
- **Active Positions**: Current open trades

### Recent Trades

View the last 10 trades executed, including:
- Symbol and name
- Action (BUY/SELL)
- Shares and price
- Total value
- Status and confidence score

---

## 🛡️ Safety Guidelines

### 1. Start with Paper Trading
- **Always test first** with paper trading mode
- Verify bot behavior matches expectations
- Test for at least 1-2 weeks before going live

### 2. Set Conservative Limits
- Start with small position sizes
- Use strict stop-losses (5-10%)
- Limit daily trades (2-3 max)
- Set reasonable daily loss limits

### 3. Monitor Regularly
- Check dashboard daily
- Review trade history weekly
- Adjust settings based on performance

### 4. Use Emergency Stop
- Red "Emergency Stop" button available on dashboard
- Immediately disables bot
- Use if market conditions change rapidly

### 5. Understand the Risks
- ⚠️ Past performance doesn't guarantee future results
- ⚠️ All trading involves risk of loss
- ⚠️ Only invest money you can afford to lose
- ⚠️ Bot can malfunction or make errors

---

## 📈 Trade Execution Process

### How the Bot Works

1. **Signal Generation** (every 5 minutes during market hours)
   - AI analyzes market data
   - Generates BUY/SELL signals with confidence scores
   - Signals expire after 24 hours

2. **Trade Execution** (every 5 minutes during market hours)
   - Bot checks enabled configurations
   - Validates safety limits
   - Finds qualifying signals (above confidence threshold)
   - Calculates position size based on available capital
   - Executes trades in paper or live mode

3. **Position Monitoring** (every 1 minute during market hours)
   - Checks current prices
   - Evaluates exit conditions:
     - Stop-loss triggered
     - Take-profit reached
     - Trailing stop activated
   - Executes exits automatically

---

## 🔔 Alert Types

### Critical Alerts 🔴
- **Bot Auto-Paused**: Safety limit reached, bot disabled
- **Stop-Loss Triggered**: Position closed due to loss limit
- **Emergency Stop**: Manual kill switch activated

### Warning Alerts 🟡
- **Daily Loss Limit**: Approaching maximum loss
- **Max Trades Reached**: Daily trade limit hit
- **Max Exposure**: Portfolio fully invested

### Info Alerts 🔵
- **Take-Profit Hit**: Position closed with profit
- **Position Opened**: New trade executed
- **Position Closed**: Trade completed

---

## 📝 Trade History & Analytics

### Performance Metrics

- **Total P/L**: Cumulative profit/loss
- **Win Rate**: Percentage of winning trades
- **Total Trades**: Number of completed trades
- **Avg Win**: Average profit per winning trade
- **Avg Loss**: Average loss per losing trade
- **Profit Factor**: Ratio of avg win to avg loss

### Export Data

Click **"Export CSV"** to download complete trade history for:
- Tax reporting
- Performance analysis
- Record keeping

---

## 🔧 Troubleshooting

### Bot Not Trading

**Check:**
1. Is bot enabled? (toggle ON)
2. Are safety limits reached? (check dashboard)
3. Are there qualifying signals? (check AI Insights tab)
4. Is it market hours? (9 AM - 4 PM, Mon-Fri)

### Unexpected Trades

**Check:**
1. Confidence score threshold (might be too low)
2. Signal types allowed (BUY/SELL/HOLD)
3. Trade history for details

### Position Not Exiting

**Check:**
1. Stop-loss/take-profit prices
2. Current market price
3. Is monitoring function running? (check logs)

---

## ❓ FAQ

### Q: What is paper trading?
**A:** Simulated trading with fake money. Perfect for testing without risk.

### Q: How much money do I need?
**A:** Minimum ฿10,000 recommended. Start small and scale up gradually.

### Q: Can I lose money?
**A:** Yes. All trading involves risk. Use stop-losses and never invest more than you can afford to lose.

### Q: How often does the bot trade?
**A:** Depends on signals and your settings. Typically 1-5 trades per day.

### Q: Can I stop the bot anytime?
**A:** Yes. Use the toggle switch or emergency stop button.

### Q: What happens to open positions if I disable the bot?
**A:** They remain open but won't be monitored. You'll need to close them manually.

### Q: Is my money safe?
**A:** The bot operates through your connected broker account. Standard securities protections apply.

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review trade history and alerts
3. Contact support with specific error messages

---

## ⚠️ Important Disclaimers

- **Not Financial Advice**: This bot is a tool, not financial advice
- **No Guarantees**: Past performance doesn't predict future results
- **Your Responsibility**: You are responsible for all trades executed
- **Risk of Loss**: Trading involves substantial risk of loss
- **Test First**: Always use paper trading before live trading
- **Monitor Regularly**: Don't set and forget - stay engaged

---

**Last Updated:** January 2025  
**Version:** 1.0.0