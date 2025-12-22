"""
Ortak Veri Modelleri - Tüm modüller arası tutarlılık için
Bu dosya tüm parametre isimlerini ve veri yapılarını standartlaştırır.
"""

from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class OrderSide(Enum):
    """İşlem yönü"""
    BUY = "BUY"
    SELL = "SELL"
    LONG = "LONG"
    SHORT = "SHORT"


class OrderType(Enum):
    """Emir tipi"""
    MARKET = "MARKET"
    LIMIT = "LIMIT"


class PositionStatus(Enum):
    """Pozisyon durumu"""
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    PENDING = "PENDING"


class CloseReason(Enum):
    """Pozisyon kapanış sebebi"""
    TP = "TP"  # Take Profit
    SL = "SL"  # Stop Loss
    MANUAL = "MANUAL"
    AI_DECISION = "AI_DECISION"
    EXPIRED = "EXPIRED"


class TradeResult(Enum):
    """İşlem sonucu"""
    WIN = "WIN"
    LOSS = "LOSS"
    BREAKEVEN = "BREAKEVEN"


@dataclass
class Position:
    """Pozisyon veri modeli - TÜM MODÜLLERDE BU KULLANILACAK"""
    id: str
    symbol: str
    side: str  # BUY veya SELL
    entry_price: float  # STANDART: entry_price (price DEĞİL!)
    stop_loss: float = 0.0
    take_profit: float = 0.0
    position_size: float = 0.0  # USD cinsinden
    leverage: float = 1.0
    confidence: float = 0.0
    reasoning: str = ""  # STANDART: reasoning (reason DEĞİL!)
    status: str = "OPEN"
    timestamp: str = ""
    db_id: Optional[int] = None
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Dict'e çevir - JSON serialization için"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Position':
        """Dict'ten oluştur"""
        # Eski parametre isimlerini yenilere çevir
        if 'price' in data and 'entry_price' not in data:
            data['entry_price'] = data.pop('price')
        if 'reason' in data and 'reasoning' not in data:
            data['reasoning'] = data.pop('reason')
        if 'size' in data and 'position_size' not in data:
            data['position_size'] = data.pop('size')
        
        # Sadece tanımlı alanları al
        valid_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered_data = {k: v for k, v in data.items() if k in valid_fields}
        
        return cls(**filtered_data)


@dataclass
class LimitOrder:
    """Limit emir veri modeli"""
    id: str
    symbol: str
    side: str
    entry_price: float  # STANDART: entry_price
    stop_loss: float
    take_profit: float
    position_size: float
    leverage: float = 10.0
    confidence: float = 0.0
    reasoning: str = ""  # STANDART: reasoning
    zone: str = "AI_DECISION"
    expires_at: str = ""
    created_at: str = ""
    status: str = "PENDING"
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'LimitOrder':
        # Eski parametre isimlerini yenilere çevir
        if 'price' in data and 'entry_price' not in data:
            data['entry_price'] = data.pop('price')
        if 'reason' in data and 'reasoning' not in data:
            data['reasoning'] = data.pop('reason')
        
        valid_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered_data = {k: v for k, v in data.items() if k in valid_fields}
        
        return cls(**filtered_data)


@dataclass
class TradeRecord:
    """Kapanan işlem kaydı"""
    id: str
    symbol: str
    side: str
    entry_price: float
    exit_price: float
    position_size: float
    pnl: float
    pnl_percent: float
    result: str  # WIN, LOSS, BREAKEVEN
    close_reason: str  # TP, SL, MANUAL, AI_DECISION
    leverage: float = 1.0
    duration_seconds: int = 0
    opened_at: str = ""
    closed_at: str = ""
    
    def __post_init__(self):
        if not self.closed_at:
            self.closed_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AIDecision:
    """AI karar veri modeli"""
    action: str  # WAIT, PLACE_LIMIT_ORDER, MARKET_BUY, MARKET_SELL, CANCEL_ORDER, MODIFY_ORDER, CLOSE_POSITION
    confidence: float
    reasoning: str  # STANDART: reasoning
    params: Dict[str, Any] = field(default_factory=dict)
    analysis: Dict[str, Any] = field(default_factory=dict)
    risk_reward: float = 0.0
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
        
        # params içindeki eski isimleri düzelt
        if 'price' in self.params and 'entry_price' not in self.params:
            self.params['entry_price'] = self.params.pop('price')
        if 'reason' in self.params and 'reasoning' not in self.params:
            self.params['reasoning'] = self.params.pop('reason')
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class MarketData:
    """Piyasa verisi modeli"""
    symbol: str
    current_price: float
    timestamp: str = ""
    whale_bias: str = "NEUTRAL"
    buy_pressure: float = 0.5
    sell_pressure: float = 0.5
    order_book_imbalance: float = 0.0
    recent_whales: List[Dict] = field(default_factory=list)
    smc_patterns: List[Dict] = field(default_factory=list)
    candles: List[Dict] = field(default_factory=list)
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass 
class NotificationData:
    """Bildirim veri modeli - Dashboard'a gönderilecek"""
    notification_type: str
    symbol: str
    title: str
    message: str
    data: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# Yardımcı fonksiyonlar
def normalize_params(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Eski parametre isimlerini yeni standartlara çevirir.
    Bu fonksiyon tüm modüllerde kullanılabilir.
    """
    normalized = params.copy()
    
    # price -> entry_price
    if 'price' in normalized and 'entry_price' not in normalized:
        normalized['entry_price'] = normalized.pop('price')
    
    # reason -> reasoning
    if 'reason' in normalized and 'reasoning' not in normalized:
        normalized['reasoning'] = normalized.pop('reason')
    
    # size -> position_size
    if 'size' in normalized and 'position_size' not in normalized:
        normalized['position_size'] = normalized.pop('size')
    
    return normalized


def validate_position_params(params: Dict[str, Any]) -> tuple[bool, str]:
    """
    Pozisyon parametrelerini doğrular.
    Returns: (is_valid, error_message)
    """
    required = ['symbol', 'side', 'entry_price', 'stop_loss', 'take_profit']
    
    for field in required:
        if field not in params:
            return False, f"Eksik parametre: {field}"
        if params[field] is None:
            return False, f"Boş parametre: {field}"
    
    # Sayısal değer kontrolleri
    numeric_fields = ['entry_price', 'stop_loss', 'take_profit', 'position_size', 'leverage']
    for field in numeric_fields:
        if field in params and params[field] is not None:
            try:
                float(params[field])
            except (ValueError, TypeError):
                return False, f"Geçersiz sayısal değer: {field}={params[field]}"
    
    return True, ""


# Standart parametre isimleri referansı
PARAM_STANDARDS = {
    'entry_price': ['price', 'entry', 'open_price'],  # Bunlar entry_price olmalı
    'reasoning': ['reason', 'rationale', 'explanation'],  # Bunlar reasoning olmalı
    'position_size': ['size', 'amount', 'quantity'],  # Bunlar position_size olmalı
    'stop_loss': ['sl', 'stoploss', 'stop'],  # Bunlar stop_loss olmalı
    'take_profit': ['tp', 'takeprofit', 'target'],  # Bunlar take_profit olmalı
}
