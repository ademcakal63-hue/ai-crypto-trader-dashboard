"""
Trade Cycle Manager
Tracks 100-trade cycles and triggers fine-tuning
"""

import json
import time
from typing import Dict, List
from datetime import datetime
from dashboard_client import DashboardClient

class TradeCycleManager:
    """
    Manages 100-trade cycles
    
    Cycle Flow:
    - Trades 1-100: Paper Trading (Cycle 1)
    - Fine-tuning triggered
    - Trades 101-200: Paper Trading (Cycle 2)
    - Fine-tuning triggered
    - Trades 201-300: Real Trading (Cycle 3) - requires manual approval
    """
    
    TRADES_PER_CYCLE = 100
    
    def __init__(self):
        self.dashboard = DashboardClient()
        self.state = self._load_state()
        
        self.current_cycle = self.state.get('current_cycle', 1)
        self.trades_in_cycle = self.state.get('trades_in_cycle', 0)
        self.total_trades = self.state.get('total_trades', 0)
        self.cycle_history = self.state.get('cycle_history', [])
        self.mode = self.state.get('mode', 'PAPER')  # PAPER or REAL
        
        print(f"\n📊 Trade Cycle Manager")
        print(f"   Cycle: {self.current_cycle}")
        print(f"   Trades in cycle: {self.trades_in_cycle}/{self.TRADES_PER_CYCLE}")
        print(f"   Total trades: {self.total_trades}")
        print(f"   Mode: {self.mode}")
    
    def _load_state(self) -> Dict:
        """Load cycle state from database"""
        try:
            settings = self.dashboard.get_settings()
            return settings.get('trade_cycle_state', {})
        except:
            return {}
    
    def _save_state(self):
        """Save cycle state to database"""
        try:
            state = {
                'current_cycle': self.current_cycle,
                'trades_in_cycle': self.trades_in_cycle,
                'total_trades': self.total_trades,
                'cycle_history': self.cycle_history,
                'mode': self.mode,
                'last_updated': time.time()
            }
            
            self.dashboard.update_settings({'trade_cycle_state': state})
        except Exception as e:
            print(f"⚠️ Failed to save cycle state: {e}")
    
    def record_trade(self, trade: Dict):
        """
        Record a completed trade
        
        Args:
            trade: Trade dict with pnl_usd, pnl_percent, etc.
        """
        self.trades_in_cycle += 1
        self.total_trades += 1
        
        print(f"\n📊 Trade recorded: {self.trades_in_cycle}/{self.TRADES_PER_CYCLE} in Cycle {self.current_cycle}")
        
        # Check if cycle completed
        if self.trades_in_cycle >= self.TRADES_PER_CYCLE:
            self._complete_cycle()
        else:
            self._save_state()
    
    def _complete_cycle(self):
        """Complete current cycle and trigger fine-tuning"""
        
        print(f"\n🎉 CYCLE {self.current_cycle} COMPLETED!")
        print(f"   Total trades: {self.TRADES_PER_CYCLE}")
        
        # Add to cycle history
        cycle_record = {
            'cycle_number': self.current_cycle,
            'completed_at': time.time(),
            'mode': self.mode,
            'trades_count': self.TRADES_PER_CYCLE
        }
        self.cycle_history.append(cycle_record)
        
        # Trigger fine-tuning
        print(f"\n🧠 TRIGGERING FINE-TUNING...")
        self._trigger_finetuning()
        
        # Move to next cycle
        self.current_cycle += 1
        self.trades_in_cycle = 0
        
        # Check if should switch to real trading
        if self.current_cycle >= 3 and self.mode == 'PAPER':
            print(f"\n⚠️ READY FOR REAL TRADING!")
            print(f"   2 cycles of paper trading completed")
            print(f"   Manual approval required to switch to REAL mode")
            
            # Send notification
            try:
                self.dashboard.send_notification(
                    title="Ready for Real Trading",
                    message=f"Completed {self.current_cycle - 1} cycles of paper trading. Ready to switch to real trading (manual approval required).",
                    type="FINE_TUNING_SUCCESS"
                )
            except:
                pass
        
        self._save_state()
    
    def _trigger_finetuning(self):
        """Trigger fine-tuning process"""
        
        try:
            # Import learning system
            from learning_manager import LearningManager
            
            learning_manager = LearningManager()
            
            # Trigger fine-tuning
            print(f"   Running fine-tuning for Cycle {self.current_cycle}...")
            
            # This will run the appropriate learning system (A or B)
            learning_manager.run_weekly_learning()
            
            print(f"   ✅ Fine-tuning completed!")
            
            # Send notification
            try:
                self.dashboard.send_notification(
                    title=f"Cycle {self.current_cycle} Completed",
                    message=f"Fine-tuning triggered after {self.TRADES_PER_CYCLE} trades. Model updated with learned patterns.",
                    type="FINE_TUNING_SUCCESS"
                )
            except:
                pass
            
        except Exception as e:
            print(f"   ❌ Fine-tuning failed: {e}")
            
            # Send error notification
            try:
                self.dashboard.send_notification(
                    title="Fine-tuning Failed",
                    message=f"Error during fine-tuning: {str(e)}",
                    type="FINE_TUNING_FAILED"
                )
            except:
                pass
    
    def switch_to_real_trading(self, approved: bool = False):
        """
        Switch from paper trading to real trading
        
        Args:
            approved: Manual approval flag
        """
        
        if not approved:
            print(f"❌ Manual approval required to switch to real trading")
            return False
        
        if self.current_cycle < 3:
            print(f"❌ Must complete at least 2 cycles before real trading")
            return False
        
        self.mode = 'REAL'
        self._save_state()
        
        print(f"\n🚀 SWITCHED TO REAL TRADING MODE!")
        print(f"   Cycle: {self.current_cycle}")
        print(f"   ⚠️ All trades will now use real money!")
        
        # Send notification
        try:
            self.dashboard.send_notification(
                title="Real Trading Mode Activated",
                message=f"Bot switched to REAL trading mode. All trades will use real money.",
                type="BOT_WARNING"
            )
        except:
            pass
        
        return True
    
    def get_cycle_info(self) -> Dict:
        """Get current cycle information"""
        
        progress_percent = (self.trades_in_cycle / self.TRADES_PER_CYCLE) * 100
        trades_remaining = self.TRADES_PER_CYCLE - self.trades_in_cycle
        
        return {
            'current_cycle': self.current_cycle,
            'trades_in_cycle': self.trades_in_cycle,
            'trades_per_cycle': self.TRADES_PER_CYCLE,
            'trades_remaining': trades_remaining,
            'progress_percent': progress_percent,
            'total_trades': self.total_trades,
            'mode': self.mode,
            'cycle_history': self.cycle_history,
            'ready_for_real_trading': self.current_cycle >= 3 and self.mode == 'PAPER'
        }
    
    def get_cycle_statistics(self, trades: List[Dict]) -> Dict:
        """
        Calculate statistics for current cycle
        
        Args:
            trades: List of trade dicts
            
        Returns:
            Statistics dict
        """
        
        if not trades:
            return {
                'total_trades': 0,
                'win_rate': 0,
                'total_pnl': 0,
                'avg_pnl': 0
            }
        
        wins = [t for t in trades if t.get('pnl_usd', 0) > 0]
        losses = [t for t in trades if t.get('pnl_usd', 0) <= 0]
        
        total_pnl = sum(t.get('pnl_usd', 0) for t in trades)
        
        return {
            'total_trades': len(trades),
            'wins': len(wins),
            'losses': len(losses),
            'win_rate': (len(wins) / len(trades)) * 100 if trades else 0,
            'total_pnl': total_pnl,
            'avg_pnl': total_pnl / len(trades) if trades else 0,
            'avg_win': sum(t.get('pnl_usd', 0) for t in wins) / len(wins) if wins else 0,
            'avg_loss': sum(t.get('pnl_usd', 0) for t in losses) / len(losses) if losses else 0
        }


# Example usage
if __name__ == "__main__":
    cycle_manager = TradeCycleManager()
    
    # Get cycle info
    info = cycle_manager.get_cycle_info()
    print(json.dumps(info, indent=2))
    
    # Simulate recording trades
    for i in range(5):
        trade = {
            'pnl_usd': 100 if i % 2 == 0 else -50,
            'pnl_percent': 1 if i % 2 == 0 else -0.5
        }
        cycle_manager.record_trade(trade)
