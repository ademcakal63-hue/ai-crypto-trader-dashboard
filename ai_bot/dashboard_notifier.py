"""
Dashboard Notifier - Dashboard'a bildirim gönderme modülü
"""

import requests
from typing import Dict, Optional
from datetime import datetime
from models import normalize_params

class DashboardNotifier:
    """Dashboard'a bildirim gönderen sınıf"""
    
    def __init__(self, dashboard_url: str = "http://localhost:3000"):
        self.dashboard_url = dashboard_url
    
    def send_notification(self, notification_type: str, title: str, message: str, data: Optional[Dict] = None):
        """Genel bildirim gönder"""
        try:
            payload = {
                "type": notification_type,
                "title": title,
                "message": message,
                "data": data or {},
                "timestamp": datetime.now().isoformat()
            }
            
            resp = requests.post(
                f"{self.dashboard_url}/api/trpc/bot.notification",
                json={"json": payload},
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            return resp.status_code == 200
        except Exception as e:
            print(f"Notification error: {e}")
            return False
    
    def send_status(self, symbol: str, mode: str, strategy: str, capital: float, 
                    risk_per_trade: float, max_daily_loss: float, daily_pnl: float):
        """Bot durumu bildirimi"""
        return self.send_notification(
            "BOT_STATUS",
            f"Bot Status: {symbol}",
            f"Mode: {mode}, Strategy: {strategy}",
            {
                "symbol": symbol,
                "mode": mode,
                "strategy": strategy,
                "capital": capital,
                "risk_per_trade": risk_per_trade,
                "max_daily_loss": max_daily_loss,
                "daily_pnl": daily_pnl
            }
        )
    
    def send_order_placed(self, symbol: str, side: str, price: float, 
                          stop_loss: float, take_profit: float, 
                          reason: str = None, reasoning: str = None):  # Geriye uyumluluk
        """Emir yerleştirildi bildirimi"""
        # STANDART: reasoning kullan
        final_reason = reasoning or reason or "AI decision"
        return self.send_notification(
            "ORDER_PLACED",
            f"Limit Order: {side} {symbol}",
            f"Price: ${price:,.2f}, SL: ${stop_loss:,.2f}, TP: ${take_profit:,.2f}",
            {
                "symbol": symbol,
                "side": side,
                "price": price,
                "stop_loss": stop_loss,
                "take_profit": take_profit,
                "reasoning": final_reason
            }
        )
    
    def send_position_opened(self, symbol: str, side: str, entry_price: float,
                             position_size: float, stop_loss: float, take_profit: float, 
                             reason: str = None, reasoning: str = None):  # Geriye uyumluluk
        """Pozisyon açıldı bildirimi"""
        # STANDART: reasoning kullan
        final_reason = reasoning or reason or "AI decision"
        return self.send_notification(
            "POSITION_OPENED",
            f"Position Opened: {side} {symbol}",
            f"Entry: ${entry_price:,.2f}, Size: ${position_size:,.2f}",
            {
                "symbol": symbol,
                "side": side,
                "entry_price": entry_price,
                "position_size": position_size,
                "stop_loss": stop_loss,
                "take_profit": take_profit,
                "reasoning": final_reason
            }
        )
    
    def send_position_closed(self, symbol: str, pnl: float, 
                              reason: str = None, reasoning: str = None,
                              close_type: str = None, entry_price: float = None,
                              exit_price: float = None, side: str = None,
                              pnl_percent: float = None, duration_minutes: int = None):  # Geriye uyumluluk
        """Pozisyon kapandı bildirimi - Detaylı"""
        # STANDART: reasoning kullan
        final_reason = reasoning or reason or "Position closed"
        emoji = "🟢" if pnl >= 0 else "🔴"
        
        # Close type emoji
        close_emoji = ""
        if close_type == "STOP_LOSS" or close_type == "SL":
            close_emoji = "🚨 STOP LOSS"
        elif close_type == "TAKE_PROFIT" or close_type == "TP":
            close_emoji = "🎯 TAKE PROFIT"
        elif close_type == "MANUAL":
            close_emoji = "✋ MANUAL"
        else:
            close_emoji = close_type or "CLOSED"
        
        # Build detailed message
        message_parts = [f"P&L: ${pnl:,.2f}"]
        if pnl_percent is not None:
            message_parts.append(f"({pnl_percent:+.2f}%)")
        if entry_price and exit_price:
            message_parts.append(f"| Entry: ${entry_price:,.2f} → Exit: ${exit_price:,.2f}")
        if duration_minutes is not None:
            if duration_minutes >= 60:
                hours = duration_minutes // 60
                mins = duration_minutes % 60
                message_parts.append(f"| Duration: {hours}h {mins}m")
            else:
                message_parts.append(f"| Duration: {duration_minutes}m")
        
        return self.send_notification(
            "POSITION_CLOSED",
            f"{emoji} {close_emoji}: {symbol}",
            " ".join(message_parts),
            {
                "symbol": symbol,
                "pnl": pnl,
                "pnl_percent": pnl_percent,
                "close_type": close_type,
                "entry_price": entry_price,
                "exit_price": exit_price,
                "side": side,
                "duration_minutes": duration_minutes,
                "reasoning": final_reason
            }
        )
    
    def send_error(self, symbol: str, error_message: str):
        """Hata bildirimi"""
        return self.send_notification(
            "ERROR",
            f"Error: {symbol}",
            error_message,
            {
                "symbol": symbol,
                "error": error_message
            }
        )
    
    def send_ai_decision(self, symbol: str, action: str, confidence: float, reasoning: str):
        """AI karar bildirimi"""
        return self.send_notification(
            "AI_DECISION",
            f"AI Decision: {action}",
            f"Confidence: {confidence*100:.0f}% - {reasoning[:100]}...",
            {
                "symbol": symbol,
                "action": action,
                "confidence": confidence,
                "reasoning": reasoning
            }
        )
