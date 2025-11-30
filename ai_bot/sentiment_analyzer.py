"""
Sentiment Analyzer - Crypto haberleri ve sentiment analizi
"""

import requests
from typing import Dict, List
from llm_client import LLMClient

class SentimentAnalyzer:
    """Crypto haber ve sentiment analizi"""
    
    def __init__(self):
        self.llm_client = LLMClient()
        self.coingecko_url = "https://api.coingecko.com/api/v3"
    
    def analyze_sentiment(self, symbol: str = "BTC") -> Dict:
        """
        Crypto için sentiment analizi yap
        
        Args:
            symbol: Crypto sembolü ("BTC", "ETH")
        
        Returns:
            {
                "sentiment_score": 0.65,  # -1 (çok negatif) ile +1 (çok pozitif) arası
                "summary": "Genel olarak pozitif sentiment. ETF haberleri olumlu.",
                "news_count": 5,
                "positive_count": 4,
                "negative_count": 1
            }
        """
        # Haberleri çek
        news = self._fetch_news(symbol)
        
        if not news:
            return {
                "sentiment_score": 0.0,
                "summary": "Haber bulunamadı",
                "news_count": 0,
                "positive_count": 0,
                "negative_count": 0
            }
        
        # LLM ile sentiment analizi
        sentiment = self._analyze_with_llm(news, symbol)
        
        return sentiment
    
    def _fetch_news(self, symbol: str) -> List[Dict]:
        """CoinGecko'dan haberleri çek (ücretsiz API)"""
        
        # CoinGecko coin ID'leri
        coin_ids = {
            "BTC": "bitcoin",
            "ETH": "ethereum",
            "BNB": "binancecoin"
        }
        
        coin_id = coin_ids.get(symbol, "bitcoin")
        
        try:
            # Market data (sentiment göstergesi)
            response = requests.get(
                f"{self.coingecko_url}/coins/{coin_id}",
                params={"localization": "false", "tickers": "false", "community_data": "true", "developer_data": "false"},
                timeout=10
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Sentiment göstergeleri
            market_data = data.get("market_data", {})
            community_data = data.get("community_data", {})
            
            news_items = []
            
            # Fiyat değişimi (sentiment göstergesi)
            price_change_24h = market_data.get("price_change_percentage_24h", 0)
            price_change_7d = market_data.get("price_change_percentage_7d", 0)
            
            news_items.append({
                "title": f"{symbol} 24 saatlik fiyat değişimi: {price_change_24h:+.2f}%",
                "description": f"Son 7 gün: {price_change_7d:+.2f}%"
            })
            
            # Volume değişimi
            volume_change = market_data.get("total_volume_change_percentage_24h", 0)
            if abs(volume_change) > 10:
                news_items.append({
                    "title": f"{symbol} volume'de büyük değişim: {volume_change:+.2f}%",
                    "description": "Yüksek volume genellikle güçlü hareket sinyalidir"
                })
            
            # Community sentiment
            sentiment_up = community_data.get("sentiment_votes_up_percentage", 50)
            sentiment_down = community_data.get("sentiment_votes_down_percentage", 50)
            
            if sentiment_up > 60:
                news_items.append({
                    "title": f"{symbol} community sentiment pozitif: %{sentiment_up:.0f} bullish",
                    "description": "Topluluk genel olarak yükseliş bekliyor"
                })
            elif sentiment_down > 60:
                news_items.append({
                    "title": f"{symbol} community sentiment negatif: %{sentiment_down:.0f} bearish",
                    "description": "Topluluk genel olarak düşüş bekliyor"
                })
            
            return news_items
            
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Haber çekme hatası: {e}")
            return []
    
    def _analyze_with_llm(self, news: List[Dict], symbol: str) -> Dict:
        """LLM ile haberleri analiz et ve sentiment skoru ver"""
        
        # Haberleri formatla
        news_text = "\n\n".join([
            f"Başlık: {item['title']}\nAçıklama: {item['description']}"
            for item in news
        ])
        
        prompt = f"""
Sen bir crypto market analisti'sin. {symbol} için aşağıdaki haberleri analiz et ve genel sentiment skorunu belirle.

=== HABERLER ===

{news_text}

=== GÖREV ===

Bu haberlere göre {symbol} fiyatı için sentiment skoru ver:

- -1.0: Çok negatif (fiyat düşecek)
- -0.5: Negatif
- 0.0: Nötr
- +0.5: Pozitif
- +1.0: Çok pozitif (fiyat yükselecek)

Ayrıca kısa bir özet yaz (1-2 cümle).

JSON formatında cevap ver:
{{
  "sentiment_score": 0.65,
  "summary": "Genel olarak pozitif. Fiyat artışı ve yüksek volume pozitif sinyaller.",
  "positive_count": 4,
  "negative_count": 1
}}
"""
        
        try:
            response = self.llm_client.api_url
            
            import json
            result = requests.post(
                self.llm_client.api_url,
                headers={
                    "Authorization": f"Bearer {self.llm_client.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": "Sen bir crypto market analisti'sin."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3
                },
                timeout=30
            )
            
            result.raise_for_status()
            data = result.json()
            
            content = data["choices"][0]["message"]["content"]
            sentiment = json.loads(content)
            
            sentiment["news_count"] = len(news)
            
            return sentiment
            
        except Exception as e:
            print(f"⚠️ Sentiment analizi hatası: {e}")
            # Fallback: Basit sentiment hesaplama
            positive = sum(1 for item in news if any(word in item["title"].lower() for word in ["yükseliş", "pozitif", "bullish", "artış", "+"]))
            negative = sum(1 for item in news if any(word in item["title"].lower() for word in ["düşüş", "negatif", "bearish", "azalış", "-"]))
            
            total = max(len(news), 1)
            score = (positive - negative) / total
            
            return {
                "sentiment_score": max(-1.0, min(1.0, score)),
                "summary": f"{positive} pozitif, {negative} negatif haber",
                "news_count": len(news),
                "positive_count": positive,
                "negative_count": negative
            }


# Test
if __name__ == "__main__":
    analyzer = SentimentAnalyzer()
    result = analyzer.analyze_sentiment("BTC")
    
    import json
    print(json.dumps(result, indent=2, ensure_ascii=False))
