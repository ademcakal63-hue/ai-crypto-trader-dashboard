# 📄 Paper Trading & Risk Management System

## 🎯 Overview

The AI Crypto Trading Bot now includes a comprehensive **Paper Trading Mode** with strict **Risk Management** and automatic **100-Trade Cycles** for continuous learning.

---

## 🔄 System Architecture

### **3-Layer System:**

```
┌─────────────────────────────────────────────────────────┐
│  1. Paper Trading Manager (paper_trading.py)           │
│     - Simulates trades without real money              │
│     - Tracks P&L, win rate, balance                    │
│     - Stores state in database                         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  2. Risk Manager (risk_manager.py)                     │
│     - HARD LIMITS: 2% per trade, 4% daily loss         │
│     - Validates every trade before execution           │
│     - Enforces stop loss requirements                  │
│     - Tracks daily P&L                                 │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  3. Trade Cycle Manager (trade_cycle_manager.py)       │
│     - Tracks 100-trade cycles                          │
│     - Triggers automatic fine-tuning                   │
│     - Manages PAPER → REAL mode transition             │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 100-Trade Cycle Flow

### **Cycle 1: Paper Trading (Trades 1-100)**
```
Start → 100 paper trades → Fine-tuning triggered → Model updated
```

### **Cycle 2: Paper Trading (Trades 101-200)**
```
Continue → 100 paper trades → Fine-tuning triggered → Model updated
```

### **Cycle 3+: Real Trading (Trades 201+)**
```
Manual approval required → Switch to REAL mode → Real money trading
```

**Key Points:**
- First 2 cycles (200 trades) are **ALWAYS paper trading**
- Fine-tuning happens automatically after every 100 trades
- Real trading requires **manual approval** from user
- User can stay in paper mode indefinitely

---

## 🛡️ Risk Management Rules

### **HARD LIMITS (Cannot be exceeded):**

| Rule | Limit | Enforced By |
|------|-------|-------------|
| Max position size | 2% of capital | RiskManager |
| Max daily loss | 4% of capital | RiskManager |
| Stop loss | MANDATORY | RiskManager |
| Min risk/reward | 1.5:1 | OpenAI + RiskManager |
| Stop loss range | 0.5% - 5% from entry | RiskManager |

### **OpenAI Decisions (Within limits):**

| Decision | Range | Based On |
|----------|-------|----------|
| Position size | 0.5% - 2% | Confidence level |
| Stop loss placement | Dynamic | Volatility + SMC |
| Daily trade count | 0 - 10 | Daily loss tracking |

**Example:**
```python
# High confidence trade
Confidence: 0.90 → Position size: 2%

# Medium confidence trade
Confidence: 0.78 → Position size: 1.2%

# Low confidence trade
Confidence: 0.71 → Position size: 0.7%
```

---

## 🧠 OpenAI Integration

### **Updated Prompts:**

#### **Chart Analysis Prompt:**
```
RISK MANAGEMENT RULES (MANDATORY):
- Only trade if confidence > 0.7
- Risk/Reward ratio must be >= 1.5 (minimum)
- Stop loss is MANDATORY - must be 0.5% - 5% from entry
- Stop loss placement should consider volatility and SMC levels
```

#### **Final Decision Prompt:**
```
HARD LIMITS (CANNOT BE EXCEEDED):
- Maximum position size: 2% of capital
- Maximum daily loss: 4% of capital
- Stop loss: MANDATORY for every trade
- Minimum risk/reward ratio: 1.5

Position size should be based on confidence:
- High confidence (>0.85): 1.5% - 2%
- Medium confidence (0.75-0.85): 1% - 1.5%
- Low confidence (0.7-0.75): 0.5% - 1%
```

---

## 📁 File Structure

```
ai_bot/
├── paper_trading.py          # Paper trading simulation
├── risk_manager.py            # Risk management & validation
├── trade_cycle_manager.py     # 100-trade cycle tracking
├── main_with_paper_trading.py # New main entry point
├── openai_trading.py          # Updated with risk rules
├── dashboard_client.py        # Updated with update_settings()
└── ...
```

---

## 🚀 How to Use

### **1. Start Bot in Paper Trading Mode:**

```bash
cd ai_bot
python main_with_paper_trading.py --symbol BTCUSDT
```

### **2. Monitor Progress:**

Dashboard will show:
- Current cycle (1, 2, 3, ...)
- Trades in cycle (e.g., 45/100)
- Mode (PAPER or REAL)
- Win rate, P&L, balance
- Daily loss tracking

### **3. After 100 Trades:**

Bot automatically:
- Triggers fine-tuning
- Updates OpenAI model
- Starts next cycle
- Sends notification

### **4. After 200 Trades (2 cycles):**

Bot will:
- Send notification: "Ready for Real Trading"
- Wait for manual approval
- Stay in paper mode until approved

### **5. Switch to Real Trading:**

```python
from trade_cycle_manager import TradeCycleManager

cycle_manager = TradeCycleManager()
cycle_manager.switch_to_real_trading(approved=True)
```

**⚠️ WARNING:** This switches to REAL money trading!

---

## 📊 Example Trade Flow

### **Step 1: OpenAI Analyzes Market**
```
Chart signal: BUY
Confidence: 0.85
Entry: $43,500
Stop loss: $42,800 (1.6% away)
Take profit: $45,000
Risk/Reward: 2.14
```

### **Step 2: OpenAI Makes Final Decision**
```
Action: OPEN_LONG
Confidence: 0.85
Position size: 1.8% (high confidence)
Reasoning: "Strong bullish signals + positive news sentiment"
```

### **Step 3: Risk Manager Validates**
```
✅ Position size OK: 1.8% < 2% limit
✅ Stop loss OK: 1.6% distance
✅ Risk/Reward OK: 2.14 > 1.5
✅ Daily loss OK: -0.5% < 4% limit
✅ Trade validated!
```

### **Step 4: Paper Trading Executes**
```
📄 Paper Trade Opened:
   Symbol: BTCUSDT
   Side: BUY
   Entry: $43,500.00
   Size: $180.00 (1.8%)
   Stop Loss: $42,800.00
   Take Profit: $45,000.00
   Risk: $12.96 (0.13% of capital)
```

### **Step 5: Position Monitoring**
```
Bot checks every 60 seconds:
- Current price vs stop loss
- Current price vs take profit
- Auto-closes if hit
```

### **Step 6: Trade Closed**
```
📄 Paper Trade Closed:
   Exit: $45,100.00
   P&L: $27.59 (+15.33%)
   Reason: TAKE_PROFIT
   Balance: $10,027.59
```

### **Step 7: Cycle Tracking**
```
📊 Trade recorded: 46/100 in Cycle 1
   54 trades remaining until fine-tuning
```

---

## 📈 Statistics Tracking

### **Paper Trading Stats:**
```python
{
  "total_trades": 46,
  "win_rate": 65.2,
  "total_pnl_usd": 127.59,
  "total_pnl_percent": 1.28,
  "avg_win": 15.30,
  "avg_loss": -8.20,
  "largest_win": 42.50,
  "largest_loss": -18.30,
  "current_balance": 10127.59
}
```

### **Risk Summary:**
```python
{
  "capital": 10000,
  "max_position_size_usd": 200,
  "max_daily_loss_usd": 400,
  "daily_pnl_usd": -25.30,
  "daily_pnl_percent": -0.25,
  "remaining_loss_allowance_usd": 374.70,
  "remaining_loss_allowance_percent": 3.75
}
```

### **Cycle Info:**
```python
{
  "current_cycle": 1,
  "trades_in_cycle": 46,
  "trades_per_cycle": 100,
  "trades_remaining": 54,
  "progress_percent": 46.0,
  "total_trades": 46,
  "mode": "PAPER",
  "ready_for_real_trading": false
}
```

---

## 🔔 Notifications

Bot sends notifications for:

1. **Position Opened:** "BUY BTCUSDT at $43,500 (Size: 1.8%)"
2. **Position Closed:** "BTCUSDT closed at $45,100 (P&L: +$27.59)"
3. **Daily Loss Warning:** "Daily loss at 80% of limit (-3.2%)"
4. **Daily Loss Limit:** "Daily loss limit reached (-4.0%), trading paused"
5. **Cycle Completed:** "Cycle 1 completed, fine-tuning triggered"
6. **Fine-tuning Success:** "Model updated with learned patterns"
7. **Ready for Real Trading:** "2 cycles completed, ready to switch to real mode"

---

## ⚙️ Configuration

### **Settings (from Dashboard):**

```javascript
{
  "capital": 10000,              // Total capital
  "useAllBalance": true,          // Use all Binance balance
  "capitalLimit": null,           // Or set limit
  "riskPerTradePercent": 2,       // Max 2% per trade
  "dailyLossLimitPercent": 4,     // Max 4% daily loss
  "compoundEnabled": true,        // Reinvest profits
  "isActive": true                // Bot running
}
```

### **Paper Trading State (stored in DB):**

```javascript
{
  "current_balance": 10127.59,
  "trades": [...],                // All completed trades
  "open_positions": {...},        // Currently open positions
  "daily_pnl": {                  // Daily P&L tracking
    "2025-01-12": -25.30,
    "2025-01-13": 42.15
  }
}
```

### **Trade Cycle State (stored in DB):**

```javascript
{
  "current_cycle": 1,
  "trades_in_cycle": 46,
  "total_trades": 46,
  "mode": "PAPER",
  "cycle_history": [...]          // Completed cycles
}
```

---

## 🧪 Testing

### **Test Paper Trading:**
```bash
cd ai_bot
python paper_trading.py
```

### **Test Risk Manager:**
```bash
cd ai_bot
python risk_manager.py
```

### **Test Cycle Manager:**
```bash
cd ai_bot
python trade_cycle_manager.py
```

### **Test Full System:**
```bash
cd ai_bot
python main_with_paper_trading.py --symbol BTCUSDT
```

---

## 🔐 Safety Features

### **1. Paper Trading Mode:**
- ✅ No real money at risk
- ✅ Realistic simulation
- ✅ All features work the same

### **2. Hard Limits:**
- ✅ 2% max position size (enforced)
- ✅ 4% max daily loss (enforced)
- ✅ Stop loss mandatory (enforced)

### **3. Validation:**
- ✅ Every trade validated before execution
- ✅ Risk/reward checked
- ✅ Daily loss checked

### **4. Manual Approval:**
- ✅ Real trading requires explicit approval
- ✅ Cannot accidentally switch to real mode
- ✅ User always in control

### **5. Continuous Learning:**
- ✅ Fine-tuning every 100 trades
- ✅ Model improves over time
- ✅ Learns from mistakes

---

## 📝 TODO Integration

The following items in `todo.md` are now **COMPLETED**:

```markdown
## Paper Trading + Risk Management (ŞU AN - YENİ)

### Paper Trading Mode
- [x] Add paper trading mode (simulated trades, no real money)
- [x] Track first 100 trades in paper mode
- [x] Save all trade decisions and outcomes to database
- [x] Calculate success rate, win/loss ratio, profit/loss
- [ ] Auto-switch to real trading after 100 successful paper trades (manual approval required)

### Risk Management (Hard Limits)
- [x] Implement 2% max position size per trade (HARD LIMIT)
- [x] Implement 4% max daily loss limit (HARD LIMIT)
- [x] Add mandatory stop loss for every trade
- [x] Track daily P&L and block new trades if limit reached
- [x] Add position size calculator based on account balance

### OpenAI Risk Management Integration
- [x] Update OpenAI prompts to include risk management rules
- [x] OpenAI decides position size (0.5% - 2% based on confidence)
- [x] OpenAI places stop loss based on volatility + SMC
- [x] OpenAI checks daily loss limit before opening trades
- [x] OpenAI calculates risk/reward ratio (min 1:1.5)

### 100-Trade Cycle & Fine-Tuning
- [x] Add trade counter (resets every 100 trades)
- [x] Trigger automatic fine-tuning after 100 trades
- [x] Generate training dataset from completed trades
- [x] Update OpenAI model with learned patterns
- [x] Generate performance report after each cycle

### Testing
- [x] Test paper trading mode
- [x] Test risk management limits
- [x] Test 100-trade cycle
- [ ] Test fine-tuning trigger (requires 100 trades)
- [ ] Save checkpoint
```

---

## 🚀 Next Steps

1. **Test with Dashboard:** Start bot from Dashboard UI
2. **Monitor First 10 Trades:** Verify all systems working
3. **Complete First Cycle:** Run until 100 trades
4. **Verify Fine-Tuning:** Check if model updates after 100 trades
5. **Complete Second Cycle:** Another 100 trades
6. **Manual Approval:** Decide whether to switch to real trading

---

## 📞 Support

If you encounter issues:

1. Check logs: `ai_bot/logs/*.log`
2. Check notifications in Dashboard
3. Verify settings in Dashboard → Settings
4. Test individual modules (see Testing section)

---

**🎉 You're now ready to use the Paper Trading System!**
