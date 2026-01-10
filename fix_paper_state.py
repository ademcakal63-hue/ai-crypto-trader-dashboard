#!/usr/bin/env python3
"""
Fix paper trading state with correct historical data
"""

import json
import requests

API_BASE = "http://199.247.0.148:3000/api/trpc"

# Get all closed trades from database
response = requests.get(f"{API_BASE}/dashboard.tradeHistory")
trades_data = response.json()['result']['data']['json']

# Calculate correct values
trades = []
total_pnl = 0
wins = 0
losses = 0

for t in trades_data:
    pnl = float(t.get('pnl', 0))
    total_pnl += pnl
    
    if pnl > 0:
        wins += 1
    else:
        losses += 1
    
    # Convert to paper trading format
    trade = {
        "id": f"paper_{t['id']}",
        "symbol": t['symbol'],
        "side": "BUY" if t['direction'] == "LONG" else "SELL",
        "entry_price": float(t['entryPrice']),
        "exit_price": float(t['exitPrice']),
        "stop_loss": float(t['stopLoss']),
        "take_profit": float(t['takeProfit']),
        "position_size_usd": float(t['positionSize']),
        "pnl_usd": pnl,
        "pnl_percent": float(t.get('pnlPercentage', 0)),
        "close_reason": t.get('exitReason', 'MANUAL'),
        "status": "CLOSED",
        "db_id": t['id']
    }
    trades.append(trade)

# Calculate statistics
initial_balance = 10000
current_balance = initial_balance + total_pnl
win_rate = (wins / len(trades) * 100) if trades else 0
total_trades = len(trades)
current_cycle = (total_trades // 100) + 1
trades_in_cycle = total_trades % 100

# Build correct state
correct_state = {
    "currentBalance": current_balance,
    "initialBalance": initial_balance,
    "totalPnl": total_pnl,
    "totalPnlPercent": (total_pnl / initial_balance) * 100,
    "currentCycle": current_cycle,
    "tradesInCycle": trades_in_cycle,
    "tradesPerCycle": 100,
    "totalTrades": total_trades,
    "winRate": win_rate,
    "avgWin": sum(t['pnl_usd'] for t in trades if t['pnl_usd'] > 0) / wins if wins > 0 else 0,
    "avgLoss": sum(t['pnl_usd'] for t in trades if t['pnl_usd'] <= 0) / losses if losses > 0 else 0,
    "largestWin": max((t['pnl_usd'] for t in trades if t['pnl_usd'] > 0), default=0),
    "largestLoss": min((t['pnl_usd'] for t in trades if t['pnl_usd'] <= 0), default=0),
    "mode": "PAPER",
    "trades": trades,
    "open_positions": {},
    "daily_pnl": {},
    "last_updated": None
}

print("=" * 50)
print("CORRECTED PAPER TRADING STATE")
print("=" * 50)
print(f"Total Trades: {total_trades}")
print(f"Wins: {wins}, Losses: {losses}")
print(f"Win Rate: {win_rate:.1f}%")
print(f"Total PnL: ${total_pnl:.2f}")
print(f"Current Balance: ${current_balance:.2f}")
print(f"Cycle: {current_cycle}, Trades in Cycle: {trades_in_cycle}")
print("=" * 50)

# Update settings via API
update_data = {
    "paperTradingState": json.dumps(correct_state)
}

# Use settings update endpoint
response = requests.post(
    f"{API_BASE}/settings.update",
    json={"json": update_data},
    headers={"Content-Type": "application/json"}
)

print(f"\nAPI Response: {response.status_code}")
if response.status_code == 200:
    print("✅ Paper trading state updated successfully!")
else:
    print(f"❌ Failed to update: {response.text}")
    
    # Try alternative method - direct mutation
    print("\nTrying alternative method...")
