# MT5 Real-Time Trading Setup Guide

## 🎯 Overview

This system streams real-time forex prices from your MT5 terminal to your web app and executes AI-generated trading signals automatically.

**Cost: $0/month** ✅

---

## 📋 Prerequisites

1. ✅ MetaTrader 5 installed
2. ✅ XM MT5 trading account (or any MT5 broker)
3. ✅ Python 3.9+ installed
4. ✅ This project running

---

## 🚀 Part 1: Install MQL5 Price Streamer

### Step 1: Enable WebRequest in MT5

1. Open MetaTrader 5
2. Go to: **Tools → Options → Expert Advisors**
3. ✅ Check: **"Allow WebRequest for listed URLs"**
4. Add this URL to the list:
   ```
   https://ohuzblalbmgykwaaecds.supabase.co
   ```
5. Click **OK**

### Step 2: Install the EA

1. In MT5, press **F4** to open MetaEditor
2. Click: **File → Open Data Folder**
3. Navigate to: `MQL5/Experts/`
4. Copy `MT5WebSocketStreamer.mq5` to this folder
5. In MetaEditor, click **Compile** (F7)
6. Should see: "0 errors, 0 warnings" ✅

### Step 3: Attach EA to Chart

1. In MT5, open any chart (EURUSD recommended)
2. In Navigator panel, find: **Expert Advisors → MT5WebSocketStreamer**
3. Drag and drop onto the chart
4. In the settings dialog:
   - ✅ Check "Allow Automated Trading"
   - Symbols: `EURUSD,GBPUSD,USDJPY,XAUUSD` (edit as needed)
   - SendIntervalSeconds: `2` (prices update every 2 seconds)
5. Click **OK**

### Step 4: Verify Streaming

1. Check MT5 "Experts" tab (bottom of screen)
2. Should see messages like:
   ```
   ✓ EURUSD: 1.05234/1.05236
   ✓ GBPUSD: 1.25678/1.25680
   ```
3. In your web app, prices should appear in real-time chart! 📊

**Troubleshooting:**
- ❌ "WebRequest not allowed" → Add URL to allowed list (Step 1)
- ❌ No messages → Enable AutoTrading button in MT5 toolbar
- ❌ HTTP errors → Check internet connection

---

## 🤖 Part 2: Install Python Trading Bot

### Step 1: Install Dependencies

Open Command Prompt / Terminal:

```bash
pip install MetaTrader5 supabase python-dotenv
```

### Step 2: Create .env File

Create a file named `.env` in the same folder as `mt5_trading_bot.py`:

```env
SUPABASE_URL=https://ohuzblalbmgykwaaecds.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
MT5_LOGIN=12345678
MT5_PASSWORD=your_mt5_password
MT5_SERVER=XMGlobal-MT5
POLL_INTERVAL=30
```

**How to get your values:**

- **SUPABASE_SERVICE_ROLE_KEY**: 
  1. Open your project in Lovable
  2. Go to Settings → Database
  3. Copy "Service Role Key"

- **MT5_LOGIN**: Your MT5 account number
- **MT5_PASSWORD**: Your MT5 password
- **MT5_SERVER**: Your broker's server (e.g., `XMGlobal-MT5`, `XMGlobal-Demo`)

### Step 3: Run the Bot

1. Make sure MT5 is **open and logged in**
2. Run:
   ```bash
   python mt5_trading_bot.py
   ```
3. Should see:
   ```
   ✅ Connected to MT5
      Account: 12345678
      Balance: $10,000.00
   🤖 Bot started. Polling every 30 seconds...
   ```

### Step 4: Test with a Signal

1. In your web app, generate an AI trading signal (Trading Signals page)
2. Wait up to 30 seconds
3. Python bot should detect and execute:
   ```
   📊 Found 1 new signal(s)
   🎯 Signal: EURUSD BUY
      Confidence: 85%
   📤 Placing BUY order for EURUSD @ 1.05234
   ✅ Order executed: Ticket #123456789
   ```

---

## 📊 Part 3: View Real-Time Charts

1. Open your web app
2. Go to Trading Bot Dashboard
3. You should see live price charts updating in real-time
4. Green "LIVE" indicator shows streaming is active

---

## 🛠️ Common Issues

### Issue: MT5 EA not sending prices

**Solution:**
1. Check "Experts" tab for error messages
2. Verify WebRequest is enabled with correct URL
3. Ensure AutoTrading is enabled (button in toolbar)
4. Try restarting MT5

### Issue: Python bot says "MT5 initialization failed"

**Solution:**
1. Make sure MT5 is **open** before running bot
2. Check MT5_LOGIN, MT5_PASSWORD, MT5_SERVER in .env
3. Try logging out and back in to MT5

### Issue: Bot not executing signals

**Solution:**
1. Check signals exist: Go to Supabase → Table Editor → trading_signals
2. Verify signals have `executed = null` and `confidence_score >= 70`
3. Check signal hasn't expired (`expires_at > now`)
4. Check console logs for error messages

### Issue: Real-time chart not updating

**Solution:**
1. Check mt5_ticks table has recent data (last 5 minutes)
2. Verify EA is running and sending prices
3. Refresh web page
4. Check browser console for errors

---

## 🎓 Tips & Best Practices

### For Testing (Recommended)

1. **Use Demo Account First**
   - Never test with real money
   - XM offers free demo accounts
   - Practice for 1-2 weeks before live trading

2. **Start Small**
   - Bot uses 0.01 lots (micro lots)
   - Risk only 1-2% of account per trade
   - Gradually increase as you gain confidence

3. **Monitor Closely**
   - Watch bot for first few days
   - Check execution logs
   - Verify stop losses are working

### For Production

1. **Run on VPS** ($5/month)
   - 24/7 uptime
   - No interruptions
   - Faster execution

2. **Set Stop Loss Limits**
   - Configure `daily_loss_limit` in bot config
   - Never risk more than you can afford
   - Use trailing stops

3. **Diversify Symbols**
   - Don't trade only one pair
   - Spread risk across forex, gold, indices
   - Adjust based on market conditions

---

## 📈 Next Steps

### Week 1: Get Comfortable
- ✅ Stream prices from MT5
- ✅ Execute 1-2 test signals
- ✅ Monitor positions
- ✅ Verify P&L tracking

### Week 2: Optimize
- Add more symbols to EA
- Tune AI signal confidence threshold
- Implement position sizing rules
- Add email/SMS alerts

### Week 3: Scale
- Move to VPS
- Increase trading volume
- Add multiple strategies
- Implement portfolio rebalancing

---

## 🆘 Need Help?

- Check MT5 "Experts" tab for EA logs
- Check Python console for bot logs
- Check Supabase logs in edge function monitoring
- Review trade_executions table for error messages

---

## 🎉 You're Ready!

Your free, real-time AI trading system is now live! 🚀

**What you have:**
- ✅ Real-time price streaming from MT5
- ✅ AI-generated trading signals
- ✅ Automated trade execution
- ✅ Live P&L tracking
- ✅ Real-time charts on web app

**Cost: $0/month** (until you need VPS)
