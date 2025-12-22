"""
Paper Trading Manager
Simulates trades without real money
Tracks performance for first 100 trades before real trading
"""

import json
import time
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dashboard_client import DashboardClient
from models import Position, TradeRecord, normalize_params, validate_position_params

class PaperTradingManager:
    def __init__(self, initial_balance: float = 10000):
        """
        Initialize Paper Trading Manager
        
        Args:
            initial_balance: Starting balance in USD
        """
        self.initial_balance = initial_balance
        self.current_balance = initial_balance
        self.dashboard = DashboardClient()
        
        # Load state from database
        self.state = self._load_state()
        
        self.trades = self.state.get('trades', [])
        self.open_positions = self.state.get('open_positions', {})
        self.daily_pnl = self.state.get('daily_pnl', {})
        
        print(f"📄 Paper Trading Mode: ${self.current_balance:,.2f}")
        print(f"   Total trades: {len(self.trades)}")
        print(f"   Open positions: {len(self.open_positions)}")
    
    def _load_state(self) -> Dict:
        """Load paper trading state from database"""
        try:
            settings = self.dashboard.get_settings()
            paper_state = settings.get('paper_trading_state', {})
            
            if paper_state:
                self.current_balance = paper_state.get('current_balance', self.initial_balance)
            
            # Load open positions from database
            try:
                import requests
                print(f"📡 Loading positions from: {self.dashboard.api_base}/dashboard.openPositions")
                response = requests.get(
                    f"{self.dashboard.api_base}/dashboard.openPositions",
                    timeout=10
                )
                print(f"📡 Response status: {response.status_code}")
                if response.status_code == 200:
                    db_positions = response.json().get('result', {}).get('data', {}).get('json', [])
                    
                    # Convert database positions to paper trading format
                    if db_positions:
                        open_positions = {}
                        for pos in db_positions:
                            position_id = f"paper_{pos['id']}"
                            position_size_usd = float(pos['positionSize'])
                            # Calculate leverage from position size and initial balance
                            leverage = position_size_usd / self.initial_balance
                            position_size_percent = leverage * 100
                            
                            open_positions[position_id] = {
                                "id": position_id,
                                "symbol": pos['symbol'],
                                "side": "SELL" if pos['direction'] == "SHORT" else "BUY",
                                "entry_price": float(pos['entryPrice']),
                                "stop_loss": float(pos['stopLoss']),
                                "take_profit": float(pos['takeProfit']),
                                "quantity": float(pos['positionSize']) / float(pos['entryPrice']),
                                "position_size_usd": position_size_usd,
                                "position_size_percent": position_size_percent,
                                "leverage": round(leverage, 2),
                                "confidence": float(pos.get('confidence', 0.85)),
                                "reasoning": pos.get('pattern', 'AI Analysis'),
                                "opened_at": pos['openedAt'],
                                "status": "OPEN"
                            }
                        paper_state['open_positions'] = open_positions
                        print(f"📥 Loaded {len(open_positions)} open positions from database")
            except Exception as e:
                print(f"⚠️ Failed to load positions from database: {e}")
            
            return paper_state
        except:
            return {}
    
    def _save_state(self):
        """Save paper trading state to database for dashboard display"""
        try:
            # Calculate statistics
            stats = self.get_statistics()
            
            # Calculate cycle info
            total_trades = len(self.trades)
            current_cycle = (total_trades // 100) + 1
            trades_in_cycle = total_trades % 100
            
            # Build state object matching dashboard expectations
            state = {
                # Balance info
                'currentBalance': self.current_balance,
                'initialBalance': self.initial_balance,
                'totalPnl': stats['total_pnl_usd'],
                'totalPnlPercent': stats['total_pnl_percent'],
                
                # Cycle info
                'currentCycle': current_cycle,
                'tradesInCycle': trades_in_cycle,
                'tradesPerCycle': 100,
                'totalTrades': total_trades,
                
                # Performance
                'winRate': stats['win_rate'],
                'avgWin': stats['avg_win'],
                'avgLoss': stats['avg_loss'],
                'largestWin': stats['largest_win'],
                'largestLoss': stats['largest_loss'],
                
                # Mode
                'mode': 'PAPER',
                
                # Raw data (for recovery)
                'trades': self.trades[-100:],  # Keep last 100 trades only
                'open_positions': self.open_positions,
                'daily_pnl': self.daily_pnl,
                'last_updated': time.time()
            }
            
            self.dashboard.update_settings({'paper_trading_state': state})
        except Exception as e:
            print(f"⚠️ Failed to save paper trading state: {e}")
    
    def open_position(self, 
                     symbol: str,
                     side: str,
                     entry_price: float,
                     stop_loss: float,
                     take_profit: float,
                     position_size_percent: float,
                     confidence: float,
                     reasoning: str) -> Dict:
        """
        Open a paper trading position
        
        Args:
            symbol: Trading pair
            side: BUY or SELL
            entry_price: Entry price
            stop_loss: Stop loss price
            take_profit: Take profit price
            position_size_percent: Position size as % of balance
            confidence: AI confidence score
            reasoning: AI reasoning
            
        Returns:
            Trade result dict
        """
        
        # Calculate position size in USD
        # SINGLE POSITION - Full capital available
        # Position size is determined by risk (2% of capital / SL distance)
        # This can result in leveraged positions
        
        # Calculate position size from percentage
        position_size_usd = self.initial_balance * (position_size_percent / 100)
        
        # Calculate quantity
        quantity = position_size_usd / entry_price
        
        # Calculate leverage (position size / capital)
        # If position_size > capital, we're using leverage
        leverage = position_size_usd / self.initial_balance
        
        # Cap leverage at 10x for safety
        MAX_LEVERAGE = 10
        if leverage > MAX_LEVERAGE:
            leverage = MAX_LEVERAGE
            position_size_usd = self.initial_balance * MAX_LEVERAGE
            quantity = position_size_usd / entry_price
        
        # Create position
        position = {
            "id": f"paper_{int(time.time())}_{symbol}",
            "symbol": symbol,
            "side": side,
            "entry_price": entry_price,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "quantity": quantity,
            "position_size_usd": position_size_usd,
            "position_size_percent": position_size_percent,
            "leverage": round(leverage, 1),
            "confidence": confidence,
            "reasoning": reasoning,
            "opened_at": time.time(),
            "status": "OPEN"
        }
        
        # Store position
        self.open_positions[position['id']] = position
        
        # Save state
        self._save_state()
        
        # Notify dashboard and get database ID
        try:
            dashboard_data = {
                "symbol": symbol,
                "direction": "SHORT" if side == "SELL" else "LONG",
                "entryPrice": str(entry_price),
                "stopLoss": str(stop_loss),
                "takeProfit": str(take_profit),
                "positionSize": str(position_size_usd),
                "riskAmount": str(abs(entry_price - stop_loss) * quantity),
                "pattern": "AI Analysis",
                "confidence": str(confidence)
            }
            db_id = self.dashboard.open_position_notification(dashboard_data)
            if db_id:
                # Store database ID for later use when closing
                position['db_id'] = db_id
                self.open_positions[position['id']] = position
        except Exception as e:
            print(f"⚠️ Dashboard bildirim hatası: {e}")
        
        print(f"\n📄 Paper Trade Opened:")
        print(f"   Symbol: {symbol}")
        print(f"   Side: {side}")
        print(f"   Entry: ${entry_price:,.2f}")
        print(f"   Size: ${position_size_usd:,.2f} ({position_size_percent:.1f}%)")
        print(f"   Leverage: {leverage:.1f}x")
        print(f"   Stop Loss: ${stop_loss:,.2f}")
        print(f"   Take Profit: ${take_profit:,.2f}")
        print(f"   Confidence: {confidence:.2f}")
        print(f"   Open positions: {len(self.open_positions)}/2")
        
        return position
    
    def check_positions(self, current_prices: Dict[str, float]):
        """
        Check open positions and close if stop loss or take profit hit
        
        Args:
            current_prices: Dict of symbol -> current price
        """
        
        for position_id, position in list(self.open_positions.items()):
            symbol = position['symbol']
            current_price = current_prices.get(symbol)
            
            if not current_price:
                continue
            
            side = position['side']
            entry_price = position['entry_price']
            stop_loss = position['stop_loss']
            take_profit = position['take_profit']
            
            # Check if position should be closed
            should_close = False
            close_reason = ""
            
            if side == "BUY":
                if current_price <= stop_loss:
                    should_close = True
                    close_reason = "STOP_LOSS"
                elif current_price >= take_profit:
                    should_close = True
                    close_reason = "TAKE_PROFIT"
            
            elif side == "SELL":
                if current_price >= stop_loss:
                    should_close = True
                    close_reason = "STOP_LOSS"
                elif current_price <= take_profit:
                    should_close = True
                    close_reason = "TAKE_PROFIT"
            
            if should_close:
                self.close_position(position_id, current_price, close_reason)
    
    def close_position(self, position_id: str, exit_price: float, reason: str) -> Dict:
        """
        Close a paper trading position
        
        Args:
            position_id: Position ID
            exit_price: Exit price
            reason: Close reason (STOP_LOSS, TAKE_PROFIT, MANUAL)
            
        Returns:
            Trade result dict
        """
        
        if position_id not in self.open_positions:
            print(f"⚠️ Position {position_id} not found")
            return {}
        
        position = self.open_positions[position_id]
        
        # Calculate P&L
        entry_price = position['entry_price']
        quantity = position['quantity']
        side = position['side']
        
        if side == "BUY":
            pnl_usd = (exit_price - entry_price) * quantity
        else:  # SELL
            pnl_usd = (entry_price - exit_price) * quantity
        
        pnl_percent = (pnl_usd / position['position_size_usd']) * 100
        
        # Update balance
        self.current_balance += pnl_usd
        
        # Create trade record
        # Handle opened_at as string or float
        opened_at = position.get('opened_at', time.time())
        if isinstance(opened_at, str):
            try:
                from datetime import datetime as dt
                opened_at = dt.fromisoformat(opened_at.replace('Z', '+00:00')).timestamp()
            except:
                opened_at = time.time()
        
        trade = {
            **position,
            "exit_price": exit_price,
            "pnl_usd": pnl_usd,
            "pnl_percent": pnl_percent,
            "close_reason": reason,
            "closed_at": time.time(),
            "duration_seconds": time.time() - opened_at,
            "status": "CLOSED"
        }
        
        # Add to trades list
        self.trades.append(trade)
        
        # Update daily P&L
        today = datetime.now().strftime("%Y-%m-%d")
        if today not in self.daily_pnl:
            self.daily_pnl[today] = 0
        self.daily_pnl[today] += pnl_usd
        
        # Notify dashboard to close position in database (BEFORE removing from dict)
        try:
            # Calculate R ratio (risk/reward)
            sl_distance = abs(entry_price - position.get('stop_loss', entry_price))
            if sl_distance > 0:
                r_ratio = abs(pnl_usd) / (sl_distance * quantity)
            else:
                r_ratio = 0
            
            # Determine exit reason format
            exit_reason_map = {
                'STOP_LOSS': 'SL',
                'TAKE_PROFIT': 'TP',
                'MANUAL': 'MANUAL',
                'SL': 'SL',
                'TP': 'TP'
            }
            exit_reason = exit_reason_map.get(reason.upper(), 'MANUAL')
            
            # Calculate duration in minutes
            duration_minutes = int((time.time() - opened_at) / 60)
            
            # Use database ID if available, otherwise try to parse from position_id
            db_id = position.get('db_id')
            if not db_id:
                try:
                    # Try to extract numeric ID from position_id
                    id_part = position_id.replace("paper_", "").split("_")[0]
                    db_id = int(id_part)
                except:
                    db_id = 0
            
            dashboard_data = {
                "positionId": db_id,
                "exitPrice": str(exit_price),
                "exitReason": exit_reason,
                "finalPnl": str(round(pnl_usd, 2)),
                "finalPnlPercentage": str(round(pnl_percent, 2)),
                "rRatio": str(round(r_ratio, 2)),
                "result": "WIN" if pnl_usd >= 0 else "LOSS",
                "duration": duration_minutes
            }
            self.dashboard.close_position_notification(dashboard_data)
        except Exception as e:
            print(f"⚠️ Dashboard close notification hatası: {e}")
        
        # Remove from open positions (AFTER dashboard notification)
        del self.open_positions[position_id]
        
        # Save state
        self._save_state()
        
        # Check if cycle completed (every 100 trades)
        if len(self.trades) > 0 and len(self.trades) % 100 == 0:
            print(f"\n🎯 CYCLE {len(self.trades) // 100} COMPLETED!")
            print(f"   Total trades: {len(self.trades)}")
            print(f"   Current balance: ${self.current_balance:,.2f}")
        
        print(f"\n📄 Paper Trade Closed:")
        print(f"   Symbol: {position['symbol']}")
        print(f"   Side: {side}")
        print(f"   Entry: ${entry_price:,.2f}")
        print(f"   Exit: ${exit_price:,.2f}")
        print(f"   P&L: ${pnl_usd:,.2f} ({pnl_percent:+.2f}%)")
        print(f"   Reason: {reason}")
        print(f"   Balance: ${self.current_balance:,.2f}")
        
        return trade
    
    def get_open_positions(self) -> List[Dict]:
        """Get list of open positions"""
        return list(self.open_positions.values())
    
    def update_position_pnl(self, position_id: str, current_price: float) -> Optional[Dict]:
        """
        Update P&L for an open position
        
        Args:
            position_id: Position ID
            current_price: Current market price
            
        Returns:
            Updated position or None if not found
        """
        if position_id not in self.open_positions:
            return None
        
        position = self.open_positions[position_id]
        entry_price = position['entry_price']
        position_size = position['position_size']
        side = position['side']
        
        # Calculate P&L
        if side == 'BUY':
            pnl_percent = ((current_price - entry_price) / entry_price) * 100
        else:
            pnl_percent = ((entry_price - current_price) / entry_price) * 100
        
        pnl_usd = (pnl_percent / 100) * position_size
        
        # Update position
        position['current_price'] = current_price
        position['pnl'] = pnl_usd
        position['pnl_percent'] = pnl_percent
        
        return position
    
    def get_daily_loss_percent(self) -> float:
        """Get today's loss as percentage of initial balance"""
        today = datetime.now().strftime("%Y-%m-%d")
        daily_pnl_usd = self.daily_pnl.get(today, 0)
        return (daily_pnl_usd / self.initial_balance) * 100
    
    def can_open_trade(self, position_size_percent: float) -> tuple[bool, str]:
        """
        Check if a new trade can be opened
        
        SINGLE POSITION RULE:
        - Only 1 position at a time (full capital utilization)
        - Must close current position before opening new one
        
        Args:
            position_size_percent: Proposed position size (can be >100% with leverage)
            
        Returns:
            (can_open, reason)
        """
        
        # SINGLE POSITION RULE - No new position if one already exists
        if len(self.open_positions) > 0:
            return False, "Position already open. Close current position first."
        
        # Check daily loss limit (4%)
        daily_loss_percent = self.get_daily_loss_percent()
        if daily_loss_percent <= -4:
            return False, f"Daily loss limit reached ({daily_loss_percent:.2f}%)"
        
        # Check if balance is sufficient
        if self.current_balance <= 0:
            return False, "Insufficient balance"
        
        return True, "OK"
    
    def get_statistics(self) -> Dict:
        """Get paper trading statistics"""
        
        if not self.trades:
            return {
                "total_trades": 0,
                "win_rate": 0,
                "total_pnl_usd": 0,
                "total_pnl_percent": 0,
                "avg_win": 0,
                "avg_loss": 0,
                "largest_win": 0,
                "largest_loss": 0,
                "current_balance": self.current_balance
            }
        
        wins = [t for t in self.trades if t['pnl_usd'] > 0]
        losses = [t for t in self.trades if t['pnl_usd'] <= 0]
        
        total_pnl_usd = sum(t['pnl_usd'] for t in self.trades)
        total_pnl_percent = ((self.current_balance - self.initial_balance) / self.initial_balance) * 100
        
        return {
            "total_trades": len(self.trades),
            "win_rate": len(wins) / len(self.trades) * 100 if self.trades else 0,
            "total_pnl_usd": total_pnl_usd,
            "total_pnl_percent": total_pnl_percent,
            "avg_win": sum(t['pnl_usd'] for t in wins) / len(wins) if wins else 0,
            "avg_loss": sum(t['pnl_usd'] for t in losses) / len(losses) if losses else 0,
            "largest_win": max((t['pnl_usd'] for t in wins), default=0),
            "largest_loss": min((t['pnl_usd'] for t in losses), default=0),
            "current_balance": self.current_balance,
            "initial_balance": self.initial_balance
        }
    
    def should_trigger_finetuning(self) -> bool:
        """Check if 100 trades completed and fine-tuning should be triggered"""
        return len(self.trades) > 0 and len(self.trades) % 100 == 0
    
    def get_trades_for_finetuning(self) -> List[Dict]:
        """Get last 100 trades for fine-tuning"""
        return self.trades[-100:] if len(self.trades) >= 100 else self.trades


# Example usage
if __name__ == "__main__":
    manager = PaperTradingManager(initial_balance=10000)
    
    # Open position
    position = manager.open_position(
        symbol="BTCUSDT",
        side="BUY",
        entry_price=43500,
        stop_loss=42800,
        take_profit=45000,
        position_size_percent=2,
        confidence=0.85,
        reasoning="Strong bullish signals"
    )
    
    # Check positions
    manager.check_positions({"BTCUSDT": 45100})  # Take profit hit
    
    # Get statistics
    stats = manager.get_statistics()
    print(json.dumps(stats, indent=2))
