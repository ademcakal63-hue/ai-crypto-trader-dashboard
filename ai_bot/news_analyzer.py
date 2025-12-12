"""
News Analyzer Module
Fetches and analyzes crypto news for sentiment
"""

import requests
from typing import Dict, List
from datetime import datetime, timedelta

class NewsAnalyzer:
    def __init__(self):
        self.news_cache = {}
        self.cache_duration = 3600  # 1 hour cache
    
    def get_crypto_news(self, symbol: str, limit: int = 10) -> List[Dict]:
        """
        Fetch recent crypto news for a symbol
        
        Args:
            symbol: Trading pair (e.g., BTCUSDT)
            limit: Number of news articles
            
        Returns:
            List of news articles with title, description, url, published_at
        """
        
        # Extract coin name from symbol
        coin = symbol.replace("USDT", "").replace("BUSD", "")
        
        # Check cache
        cache_key = f"{coin}_{limit}"
        if cache_key in self.news_cache:
            cached_time, cached_news = self.news_cache[cache_key]
            if (datetime.now() - cached_time).seconds < self.cache_duration:
                return cached_news
        
        # Fetch news from CoinGecko API (free, no API key needed)
        try:
            # CoinGecko trending coins endpoint
            url = "https://api.coingecko.com/api/v3/search/trending"
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                news_list = []
                
                # CoinGecko trending coins (market sentiment)
                for item in data.get('coins', [])[:limit]:
                    coin_data = item.get('item', {})
                    news_list.append({
                        "title": f"{coin_data.get('name', 'Unknown')} trending (Rank #{coin_data.get('market_cap_rank', 'N/A')})",
                        "description": f"Price: ${coin_data.get('data', {}).get('price', 'N/A')} | 24h: {coin_data.get('data', {}).get('price_change_percentage_24h', {}).get('usd', 0):.2f}%",
                        "url": f"https://www.coingecko.com/en/coins/{coin_data.get('id', '')}",
                        "published_at": datetime.now().isoformat(),
                        "source": "CoinGecko Trending"
                    })
                
                # Cache result
                self.news_cache[cache_key] = (datetime.now(), news_list)
                
                return news_list
            else:
                print(f"⚠️ CryptoPanic API error: {response.status_code}")
                return self._get_fallback_news(coin)
                
        except Exception as e:
            print(f"❌ News fetch error: {e}")
            return self._get_fallback_news(coin)
    
    def _get_fallback_news(self, coin: str) -> List[Dict]:
        """Fallback news when API fails"""
        return [
            {
                "title": f"{coin} market analysis",
                "description": f"General {coin} market sentiment",
                "url": "",
                "published_at": datetime.now().isoformat(),
                "source": "Fallback"
            }
        ]


# Example usage
if __name__ == "__main__":
    analyzer = NewsAnalyzer()
    news = analyzer.get_crypto_news("BTCUSDT", limit=5)
    
    for article in news:
        print(f"- {article['title']}")
        print(f"  Source: {article['source']}")
        print()
