"""
Risk Management System
Hard limits: 2% per trade, 4% daily loss
OpenAI decides within these limits
"""

import time
from typing import Dict, Tuple, Optional
from datetime import datetime
from dashboard_client import DashboardClient

class RiskManager:
    """
    Risk Management with Hard Limits
    
    HARD LIMITS (Cannot be exceeded):
    - Max position size: 2% of capital per trade
    - Max daily loss: 4% of capital
    - Stop loss: MANDATORY for every trade
    
    OpenAI decides WITHIN these limits:
    - Position size: 0.5% - 2%
    - Stop loss placement
    - Whether to open trade today (daily loss check)
    """
    
    # HARD LIMITS - CANNOT BE CHANGED
    MAX_RISK_PER_TRADE_PERCENT = 2.0  # Maximum risk per trade (stop loss distance)
    MAX_DAILY_LOSS_PERCENT = 4.0  # Maximum daily loss (2R = 2 trades × 2%)
    MIN_POSITION_SIZE_PERCENT = 0.5
    MIN_RISK_REWARD_RATIO = 2.0  # Minimum 1:2 risk/reward - always aim for 2x profit vs risk
    
    def __init__(self):
        self.dashboard = DashboardClient()
        self.daily_pnl = {}
        self.daily_loss_trades = {}  # Track losing trades per day
        self._load_daily_pnl()
    
    def _load_daily_pnl(self):
        """Load daily P&L from database"""
        try:
            settings = self.dashboard.get_settings()
            self.daily_pnl = settings.get('daily_pnl', {})
            self.daily_loss_trades = settings.get('daily_loss_trades', {})
        except:
            self.daily_pnl = {}
            self.daily_loss_trades = {}
    
    def _save_daily_pnl(self):
        """Save daily P&L to database"""
        try:
            self.dashboard.update_settings({
                'daily_pnl': self.daily_pnl,
                'daily_loss_trades': self.daily_loss_trades
            })
        except Exception as e:
            print(f"⚠️ Failed to save daily P&L: {e}")
    
    def record_trade_pnl(self, pnl_usd: float):
        """Record trade P&L for daily tracking"""
        today = datetime.now().strftime("%Y-%m-%d")
        if today not in self.daily_pnl:
            self.daily_pnl[today] = 0
            self.daily_loss_trades[today] = 0
        
        self.daily_pnl[today] += pnl_usd
        
        # Track losing trades
        if pnl_usd < 0:
            self.daily_loss_trades[today] += 1
        
        self._save_daily_pnl()
    
    def get_daily_pnl(self, capital: float) -> Dict:
        """
        Get today's P&L
        
        Returns:
            {
                'pnl_usd': float,
                'pnl_percent': float,
                'remaining_loss_allowance_usd': float,
                'remaining_loss_allowance_percent': float
            }
        """
        today = datetime.now().strftime("%Y-%m-%d")
        pnl_usd = self.daily_pnl.get(today, 0)
        pnl_percent = (pnl_usd / capital) * 100 if capital > 0 else 0
        
        max_loss_usd = capital * (self.MAX_DAILY_LOSS_PERCENT / 100)
        remaining_loss_usd = max_loss_usd + pnl_usd  # pnl_usd is negative if loss
        remaining_loss_percent = (remaining_loss_usd / capital) * 100 if capital > 0 else 0
        
        return {
            'pnl_usd': pnl_usd,
            'pnl_percent': pnl_percent,
            'remaining_loss_allowance_usd': remaining_loss_usd,
            'remaining_loss_allowance_percent': remaining_loss_percent
        }
    
    def can_open_trade(self, capital: float) -> Tuple[bool, str]:
        """
        Check if new trade can be opened based on daily loss limit
        
        Args:
            capital: Current capital in USD
            
        Returns:
            (can_open, reason)
        """
        today = datetime.now().strftime("%Y-%m-%d")
        daily_pnl = self.get_daily_pnl(capital)
        
        # Removed: No longer limiting by trade count, only by total loss %
        
        # Check if daily loss limit reached
        if daily_pnl['pnl_percent'] <= -self.MAX_DAILY_LOSS_PERCENT:
            return False, f"❌ Daily loss limit reached ({daily_pnl['pnl_percent']:.2f}%)"
        
        # Warning if close to limit (80%)
        if daily_pnl['pnl_percent'] <= -(self.MAX_DAILY_LOSS_PERCENT * 0.8):
            print(f"⚠️ WARNING: Close to daily loss limit ({daily_pnl['pnl_percent']:.2f}%)")
        
        # Warning based on loss percentage, not trade count
        
        return True, "✅ OK to trade"
    
    def calculate_position_from_risk(self,
                                     capital: float,
                                     entry_price: float,
                                     stop_loss: float,
                                     side: str,
                                     risk_percent: Optional[float] = None) -> Dict:
        """
        Calculate position size based on risk amount
        
        Formula:
        - Risk amount (USD) = capital × risk_percent
        - SL distance (%) = |entry - stop_loss| / entry × 100
        - Position size (USD) = risk_amount / (SL_distance / 100)
        - Position size (%) = (position_size_usd / capital) × 100
        - Leverage = position_size_percent / 100
        
        Args:
            capital: Current capital in USD
            entry_price: Entry price
            stop_loss: Stop loss price
            side: BUY or SELL
            risk_percent: Risk percentage (default: MAX_RISK_PER_TRADE_PERCENT)
            
        Returns:
            {
                'position_size_usd': float,
                'position_size_percent': float,
                'leverage': float,
                'risk_amount_usd': float,
                'risk_amount_percent': float,
                'sl_distance_percent': float
            }
        """
        
        if risk_percent is None:
            risk_percent = self.MAX_RISK_PER_TRADE_PERCENT
        
        # Calculate SL distance
        if side == "BUY":
            if stop_loss >= entry_price:
                raise ValueError("Stop loss must be below entry for BUY")
            sl_distance_percent = ((entry_price - stop_loss) / entry_price) * 100
        else:  # SELL
            if stop_loss <= entry_price:
                raise ValueError("Stop loss must be above entry for SELL")
            sl_distance_percent = ((stop_loss - entry_price) / entry_price) * 100
        
        # Calculate risk amount
        risk_amount_usd = capital * (risk_percent / 100)
        
        # Calculate position size
        position_size_usd = risk_amount_usd / (sl_distance_percent / 100)
        position_size_percent = (position_size_usd / capital) * 100
        
        # Calculate leverage
        leverage = position_size_percent / 100
        
        return {
            'position_size_usd': position_size_usd,
            'position_size_percent': position_size_percent,
            'leverage': round(leverage, 1),
            'risk_amount_usd': risk_amount_usd,
            'risk_amount_percent': risk_percent,
            'sl_distance_percent': sl_distance_percent
        }
    
    def validate_position_size(self, 
                               position_size_percent: float,
                               capital: float) -> Tuple[bool, str, float]:
        """
        Validate and adjust position size
        
        Args:
            position_size_percent: Proposed position size (%)
            capital: Current capital in USD
            
        Returns:
            (is_valid, reason, adjusted_size_percent)
        """
        
        # Check minimum
        if position_size_percent < self.MIN_POSITION_SIZE_PERCENT:
            adjusted = self.MIN_POSITION_SIZE_PERCENT
            return True, f"⚠️ Position size too small, adjusted to {adjusted}%", adjusted
        
        # Position size can be large, but risk must be <= 2%
        # No hard limit on position size itself
        
        return True, "✅ Position size OK", position_size_percent
    
    def validate_stop_loss(self,
                          entry_price: float,
                          stop_loss: float,
                          side: str) -> Tuple[bool, str]:
        """
        Validate stop loss
        
        Args:
            entry_price: Entry price
            stop_loss: Stop loss price
            side: BUY or SELL
            
        Returns:
            (is_valid, reason)
        """
        
        if not stop_loss or stop_loss <= 0:
            return False, "❌ Stop loss is MANDATORY"
        
        # Calculate stop loss distance
        if side == "BUY":
            if stop_loss >= entry_price:
                return False, "❌ Stop loss must be below entry for BUY"
            sl_distance_percent = ((entry_price - stop_loss) / entry_price) * 100
        else:  # SELL
            if stop_loss <= entry_price:
                return False, "❌ Stop loss must be above entry for SELL"
            sl_distance_percent = ((stop_loss - entry_price) / entry_price) * 100
        
        # Check if stop loss is too tight (< 0.3%)
        if sl_distance_percent < 0.3:
            return False, f"❌ Stop loss too tight ({sl_distance_percent:.2f}%), minimum 0.3%"
        
        # Check if stop loss is too wide (> 5%)
        if sl_distance_percent > 5:
            return False, f"❌ Stop loss too wide ({sl_distance_percent:.2f}%), maximum 5%"
        
        return True, f"✅ Stop loss OK ({sl_distance_percent:.2f}%)"
    
    def validate_risk_reward(self,
                            entry_price: float,
                            stop_loss: float,
                            take_profit: float,
                            side: str) -> Tuple[bool, str, float]:
        """
        Validate risk/reward ratio
        
        Args:
            entry_price: Entry price
            stop_loss: Stop loss price
            take_profit: Take profit price
            side: BUY or SELL
            
        Returns:
            (is_valid, reason, risk_reward_ratio)
        """
        
        if side == "BUY":
            risk = entry_price - stop_loss
            reward = take_profit - entry_price
        else:  # SELL
            risk = stop_loss - entry_price
            reward = entry_price - take_profit
        
        if risk <= 0:
            return False, "❌ Invalid stop loss", 0
        
        if reward <= 0:
            return False, "❌ Invalid take profit", 0
        
        risk_reward_ratio = reward / risk
        
        if risk_reward_ratio < self.MIN_RISK_REWARD_RATIO:
            return False, f"❌ Risk/Reward ratio {risk_reward_ratio:.2f} below minimum {self.MIN_RISK_REWARD_RATIO}", risk_reward_ratio
        
        return True, f"✅ Risk/Reward ratio OK ({risk_reward_ratio:.2f})", risk_reward_ratio
    
    def validate_trade(self,
                      capital: float,
                      position_size_percent: float,
                      entry_price: float,
                      stop_loss: float,
                      take_profit: float,
                      side: str) -> Tuple[bool, str, Dict]:
        """
        Validate entire trade setup
        
        Args:
            capital: Current capital
            position_size_percent: Position size (%)
            entry_price: Entry price
            stop_loss: Stop loss price
            take_profit: Take profit price
            side: BUY or SELL
            
        Returns:
            (is_valid, reason, details)
        """
        
        details = {}
        
        # 1. Check daily loss limit
        can_trade, reason = self.can_open_trade(capital)
        if not can_trade:
            return False, reason, details
        
        # 2. Validate position size
        is_valid, reason, adjusted_size = self.validate_position_size(position_size_percent, capital)
        if not is_valid:
            return False, reason, details
        
        details['position_size_percent'] = adjusted_size
        details['position_size_usd'] = capital * (adjusted_size / 100)
        
        # 3. Validate stop loss
        is_valid, reason = self.validate_stop_loss(entry_price, stop_loss, side)
        if not is_valid:
            return False, reason, details
        
        # 4. Validate risk/reward
        is_valid, reason, rr_ratio = self.validate_risk_reward(entry_price, stop_loss, take_profit, side)
        if not is_valid:
            return False, reason, details
        
        details['risk_reward_ratio'] = rr_ratio
        
        # 5. Calculate risk amount
        if side == "BUY":
            sl_distance_percent = ((entry_price - stop_loss) / entry_price) * 100
        else:
            sl_distance_percent = ((stop_loss - entry_price) / entry_price) * 100
        
        risk_amount_usd = details['position_size_usd'] * (sl_distance_percent / 100)
        risk_amount_percent = (risk_amount_usd / capital) * 100
        
        details['risk_amount_usd'] = risk_amount_usd
        details['risk_amount_percent'] = risk_amount_percent
        details['sl_distance_percent'] = sl_distance_percent
        
           # Check if risk amount exceeds 2%
        if risk_amount_percent > self.MAX_RISK_PER_TRADE_PERCENT:
            return False, f"❌ Risk amount {risk_amount_percent:.2f}% exceeds {self.MAX_RISK_PER_TRADE_PERCENT}% limit", details
        
        return True, "✅ Trade validated", details
    
    def get_risk_summary(self, capital: float) -> Dict:
        """Get risk management summary"""
        daily_pnl = self.get_daily_pnl(capital)
        
        return {
            'capital': capital,
            'max_risk_per_trade_percent': self.MAX_RISK_PER_TRADE_PERCENT,
            'max_risk_per_trade_usd': capital * (self.MAX_RISK_PER_TRADE_PERCENT / 100),
            'max_daily_loss_percent': self.MAX_DAILY_LOSS_PERCENT,
            'max_daily_loss_usd': capital * (self.MAX_DAILY_LOSS_PERCENT / 100),
            'daily_pnl_usd': daily_pnl['pnl_usd'],
            'daily_pnl_percent': daily_pnl['pnl_percent'],
            'remaining_loss_allowance_usd': daily_pnl['remaining_loss_allowance_usd'],
            'remaining_loss_allowance_percent': daily_pnl['remaining_loss_allowance_percent'],
            'min_risk_reward_ratio': self.MIN_RISK_REWARD_RATIO
        }


# Example usage
if __name__ == "__main__":
    risk_manager = RiskManager()
    capital = 10000
    
    # Validate trade
    is_valid, reason, details = risk_manager.validate_trade(
        capital=capital,
        position_size_percent=2,
        entry_price=43500,
        stop_loss=42800,
        take_profit=45000,
        side="BUY"
    )
    
    print(f"\nTrade Validation: {reason}")
    print(f"Details: {details}")
    
    # Get risk summary
    summary = risk_manager.get_risk_summary(capital)
    print(f"\nRisk Summary:")
    for key, value in summary.items():
        print(f"  {key}: {value}")
