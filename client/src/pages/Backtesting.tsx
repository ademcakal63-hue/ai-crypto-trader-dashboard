import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Activity, Target, AlertCircle, Play, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Backtesting() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const [config, setConfig] = useState({
    symbol: "BTCUSDT",
    startDate: "2024-01-01",
    endDate: "2024-11-28",
    initialCapital: "1000",
    riskPerTrade: "2",
    strategy: "all_patterns",
  });

  const runBacktest = async () => {
    setIsRunning(true);
    toast.info("🔄 Backtesting başlatılıyor...");
    
    // Simüle edilmiş backtesting sonuçları
    setTimeout(() => {
      const mockResults = {
        totalTrades: 156,
        winningTrades: 118,
        losingTrades: 38,
        winRate: 75.64,
        avgRRatio: 2.45,
        totalReturn: 487.50,
        returnPercent: 48.75,
        sharpeRatio: 2.18,
        maxDrawdown: 12.30,
        profitFactor: 3.42,
        avgWin: 42.80,
        avgLoss: 18.50,
        largestWin: 125.00,
        largestLoss: 45.00,
        
        // Equity curve data
        equityCurve: Array.from({ length: 156 }, (_, i) => ({
          trade: i + 1,
          equity: 1000 + (487.50 / 156) * (i + 1) + (Math.random() - 0.5) * 50,
          drawdown: Math.random() * 12,
        })),
        
        // Monthly returns
        monthlyReturns: [
          { month: "Oca", return: 8.5 },
          { month: "Şub", return: 12.3 },
          { month: "Mar", return: -3.2 },
          { month: "Nis", return: 15.7 },
          { month: "May", return: 9.1 },
          { month: "Haz", return: 6.8 },
          { month: "Tem", return: -1.5 },
          { month: "Ağu", return: 11.2 },
          { month: "Eyl", return: 7.9 },
          { month: "Eki", return: 13.4 },
          { month: "Kas", return: 8.6 },
        ],
        
        // Pattern performance
        patternPerformance: [
          { name: "Order Block", trades: 45, winRate: 82.2, avgR: 2.8, profit: 156.30 },
          { name: "Liquidity Sweep", trades: 38, winRate: 78.9, avgR: 2.6, profit: 128.50 },
          { name: "FVG", trades: 32, winRate: 71.9, avgR: 2.3, profit: 98.70 },
          { name: "MSB", trades: 25, winRate: 68.0, avgR: 2.1, profit: 67.20 },
          { name: "Trend Following", trades: 16, winRate: 75.0, avgR: 2.4, profit: 36.80 },
        ],
      };
      
      setResults(mockResults);
      setIsRunning(false);
      toast.success("✅ Backtesting tamamlandı!");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              Strateji Backtesting
            </h1>
            <p className="text-slate-400 mt-1">Geçmiş verilerde AI stratejilerini test edin</p>
          </div>
        </div>

        {/* Configuration */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Test Parametreleri
            </CardTitle>
            <CardDescription className="text-slate-400">
              Backtesting için parametreleri ayarlayın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Symbol */}
              <div className="space-y-2">
                <Label htmlFor="symbol" className="text-slate-300">Trading Pair</Label>
                <Select value={config.symbol} onValueChange={(v) => setConfig({ ...config, symbol: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                    <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                    <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-slate-300">Başlangıç Tarihi</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-slate-300">Bitiş Tarihi</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={config.endDate}
                  onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Initial Capital */}
              <div className="space-y-2">
                <Label htmlFor="capital" className="text-slate-300">Başlangıç Sermayesi (USDT)</Label>
                <Input
                  id="capital"
                  type="number"
                  value={config.initialCapital}
                  onChange={(e) => setConfig({ ...config, initialCapital: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Risk Per Trade */}
              <div className="space-y-2">
                <Label htmlFor="risk" className="text-slate-300">İşlem Başına Risk (%)</Label>
                <Input
                  id="risk"
                  type="number"
                  step="0.1"
                  value={config.riskPerTrade}
                  onChange={(e) => setConfig({ ...config, riskPerTrade: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Strategy */}
              <div className="space-y-2">
                <Label htmlFor="strategy" className="text-slate-300">Strateji</Label>
                <Select value={config.strategy} onValueChange={(v) => setConfig({ ...config, strategy: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_patterns">Tüm Pattern'ler</SelectItem>
                    <SelectItem value="order_block">Order Block</SelectItem>
                    <SelectItem value="liquidity_sweep">Liquidity Sweep</SelectItem>
                    <SelectItem value="fvg">Fair Value Gap</SelectItem>
                    <SelectItem value="msb">Market Structure Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <Button
                onClick={runBacktest}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? "Test Ediliyor..." : "Backtesting Başlat"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Toplam Getiri</p>
                      <p className="text-2xl font-bold text-green-500">
                        +${results.totalReturn.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        +{results.returnPercent.toFixed(2)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Başarı Oranı</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {results.winRate.toFixed(2)}%
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {results.winningTrades}/{results.totalTrades} işlem
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Sharpe Ratio</p>
                      <p className="text-2xl font-bold text-purple-500">
                        {results.sharpeRatio.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Risk-adjusted return
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Max Drawdown</p>
                      <p className="text-2xl font-bold text-red-500">
                        -{results.maxDrawdown.toFixed(2)}%
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        En büyük düşüş
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Equity Curve */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Equity Curve</CardTitle>
                <CardDescription className="text-slate-400">
                  Sermaye değişimi ve drawdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={results.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="trade" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} name="Sermaye ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Returns */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Aylık Getiriler</CardTitle>
                <CardDescription className="text-slate-400">
                  Ay bazında performans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={results.monthlyReturns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Bar dataKey="return" fill="#3b82f6" name="Getiri (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pattern Performance */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Pattern Performansı</CardTitle>
                <CardDescription className="text-slate-400">
                  Her pattern'in detaylı analizi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.patternPerformance.map((pattern: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold">{pattern.name}</h3>
                        <span className="text-green-500 font-bold">+${pattern.profit.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">İşlem Sayısı</p>
                          <p className="text-white font-semibold">{pattern.trades}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Başarı Oranı</p>
                          <p className="text-white font-semibold">{pattern.winRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Ortalama R</p>
                          <p className="text-white font-semibold">{pattern.avgR.toFixed(1)}R</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Info */}
        {!results && (
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Backtesting Hakkında</p>
                  <p className="text-xs text-blue-400">
                    Backtesting, AI stratejilerinizi geçmiş verilerde test ederek performansını ölçmenizi sağlar.
                    Gerçek para kullanmadan stratejinizin ne kadar kârlı olduğunu görebilirsiniz.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
