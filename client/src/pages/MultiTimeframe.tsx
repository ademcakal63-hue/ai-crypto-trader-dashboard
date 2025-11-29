import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, TrendingUp, TrendingDown, Minus, Target, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function MultiTimeframe() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");

  // Simüle edilmiş multi-timeframe data
  const timeframeData = [
    {
      timeframe: "1m",
      trend: "bullish",
      strength: 65,
      patterns: ["FVG", "Order Block"],
      price: 96542.30,
      change: +0.12,
      volume: "High",
      signal: "buy",
      confidence: 72,
    },
    {
      timeframe: "5m",
      trend: "bullish",
      strength: 78,
      patterns: ["Liquidity Sweep", "MSB"],
      price: 96540.00,
      change: +0.45,
      volume: "Very High",
      signal: "buy",
      confidence: 85,
    },
    {
      timeframe: "15m",
      trend: "bullish",
      strength: 82,
      patterns: ["Order Block", "FVG", "Trend Following"],
      price: 96535.50,
      change: +1.23,
      volume: "High",
      signal: "buy",
      confidence: 88,
    },
    {
      timeframe: "1h",
      trend: "bullish",
      strength: 75,
      patterns: ["Order Block", "MSB"],
      price: 96500.00,
      change: +2.15,
      volume: "Medium",
      signal: "buy",
      confidence: 80,
    },
    {
      timeframe: "4h",
      trend: "neutral",
      strength: 45,
      patterns: ["Consolidation"],
      price: 96400.00,
      change: -0.35,
      volume: "Low",
      signal: "neutral",
      confidence: 55,
    },
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === "bullish") return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === "bearish") return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-slate-500" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "bullish") return "text-green-500";
    if (trend === "bearish") return "text-red-500";
    return "text-slate-500";
  };

  const getSignalBadge = (signal: string) => {
    if (signal === "buy") return <Badge className="bg-green-600">ALIŞ</Badge>;
    if (signal === "sell") return <Badge className="bg-red-600">SATIŞ</Badge>;
    return <Badge className="bg-slate-600">NÖTR</Badge>;
  };

  const getSignalIcon = (signal: string) => {
    if (signal === "buy") return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    if (signal === "sell") return <XCircle className="w-6 h-6 text-red-500" />;
    return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
  };

  // Timeframe uyumu analizi
  const bullishCount = timeframeData.filter(t => t.trend === "bullish").length;
  const bearishCount = timeframeData.filter(t => t.trend === "bearish").length;
  const alignment = (bullishCount / timeframeData.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-500" />
              Multi-Timeframe Analiz
            </h1>
            <p className="text-slate-400 mt-1">Farklı zaman dilimlerinde trend ve pattern analizi</p>
          </div>
          
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-48 bg-slate-900 border-slate-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
              <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
              <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Timeframe Alignment */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Timeframe Uyumu
            </CardTitle>
            <CardDescription className="text-slate-400">
              Tüm zaman dilimlerinin trend uyumu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{alignment.toFixed(0)}% Yükseliş Uyumu</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {bullishCount} timeframe yükseliş, {bearishCount} timeframe düşüş
                  </p>
                </div>
                {alignment >= 70 ? (
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                ) : alignment <= 30 ? (
                  <XCircle className="w-12 h-12 text-red-500" />
                ) : (
                  <AlertTriangle className="w-12 h-12 text-yellow-500" />
                )}
              </div>

              <div className="w-full bg-slate-800 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    alignment >= 70 ? "bg-green-500" : alignment <= 30 ? "bg-red-500" : "bg-yellow-500"
                  }`}
                  style={{ width: `${alignment}%` }}
                />
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-semibold mb-1">Yorum</p>
                    <p className="text-xs text-blue-400">
                      {alignment >= 70
                        ? "Güçlü yükseliş trendi! Tüm timeframe'ler uyumlu, yüksek güven ile ALIŞ sinyali."
                        : alignment <= 30
                        ? "Güçlü düşüş trendi! Tüm timeframe'ler uyumlu, yüksek güven ile SATIŞ sinyali."
                        : "Karışık sinyaller! Farklı timeframe'ler farklı yönde, dikkatli olun."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeframe Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timeframeData.map((tf, idx) => (
            <Card key={idx} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:border-blue-500/50 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    {tf.timeframe}
                  </CardTitle>
                  {getSignalBadge(tf.signal)}
                </div>
                <CardDescription className="text-slate-400">
                  Fiyat: ${tf.price.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trend */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(tf.trend)}
                    <div>
                      <p className="text-xs text-slate-400">Trend</p>
                      <p className={`font-semibold capitalize ${getTrendColor(tf.trend)}`}>
                        {tf.trend === "bullish" ? "Yükseliş" : tf.trend === "bearish" ? "Düşüş" : "Yatay"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Güç</p>
                    <p className="font-semibold text-white">{tf.strength}%</p>
                  </div>
                </div>

                {/* Change & Volume */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Değişim</p>
                    <p className={`font-semibold ${tf.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {tf.change >= 0 ? "+" : ""}{tf.change.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Hacim</p>
                    <p className="font-semibold text-white">{tf.volume}</p>
                  </div>
                </div>

                {/* Patterns */}
                <div>
                  <p className="text-xs text-slate-400 mb-2">Tespit Edilen Pattern'ler</p>
                  <div className="flex flex-wrap gap-2">
                    {tf.patterns.map((pattern, pidx) => (
                      <Badge key={pidx} variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Confidence */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-400">Güven Skoru</p>
                    <p className="text-sm font-semibold text-white">{tf.confidence}%</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        tf.confidence >= 80 ? "bg-green-500" : tf.confidence >= 60 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${tf.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Signal */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border-2 border-slate-700">
                  <div>
                    <p className="text-xs text-slate-400">Sinyal</p>
                    <p className="font-semibold text-white capitalize">
                      {tf.signal === "buy" ? "ALIŞ" : tf.signal === "sell" ? "SATIŞ" : "NÖTR"}
                    </p>
                  </div>
                  {getSignalIcon(tf.signal)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1">Multi-Timeframe Analiz Hakkında</p>
                <p className="text-xs text-blue-400">
                  Farklı zaman dilimlerinde trend ve pattern analizi yaparak daha güvenilir sinyaller elde edebilirsiniz.
                  Tüm timeframe'ler aynı yönde ise (uyum %70+), sinyal güvenilirliği artar.
                  Örneğin: 1m, 5m, 15m, 1h, 4h hepsi yükseliş trendinde ise, LONG pozisyon açmak daha güvenlidir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
