import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import {
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Backtest() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Backtest parameters
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [days, setDays] = useState("30");
  const [initialCapital, setInitialCapital] = useState("10000");
  const [riskPerTrade, setRiskPerTrade] = useState("2");

  const backtestMutation = trpc.backtest.run.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setIsRunning(false);
      setProgress(100);
      toast.success(`Backtest tamamlandı! ${data.stats.totalTrades} işlem analiz edildi.`);
    },
    onError: (error) => {
      setError(error.message);
      setIsRunning(false);
      setProgress(0);
      toast.error(`Backtest hatası: ${error.message}`);
    },
  });

  const runBacktest = async () => {
    setIsRunning(true);
    setProgress(10);
    setResults(null);
    setError(null);
    
    // Simulate progress while waiting for API
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    backtestMutation.mutate({
      symbol,
      timeframe,
      days: parseInt(days),
      initialCapital: parseFloat(initialCapital),
      riskPerTrade: parseFloat(riskPerTrade),
    });
  };

  const resetBacktest = () => {
    setResults(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Strateji Backtest</h1>
        <p className="text-muted-foreground mt-1">
          AI trading stratejisini gerçek Binance verileriyle test edin
        </p>
      </div>

      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Backtest Parametreleri
          </CardTitle>
          <CardDescription>
            Gerçek piyasa verileriyle strateji testi için parametreleri ayarlayın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Sembol</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                  <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Zaman Dilimi</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5m">5 Dakika</SelectItem>
                  <SelectItem value="15m">15 Dakika</SelectItem>
                  <SelectItem value="1h">1 Saat</SelectItem>
                  <SelectItem value="4h">4 Saat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Test Süresi (Gün)</Label>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                min="7"
                max="90"
              />
              <p className="text-xs text-muted-foreground">Max 90 gün</p>
            </div>

            <div className="space-y-2">
              <Label>Başlangıç Sermayesi ($)</Label>
              <Input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                min="1000"
              />
            </div>

            <div className="space-y-2">
              <Label>İşlem Başına Risk (%)</Label>
              <Input
                type="number"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(e.target.value)}
                min="0.5"
                max="5"
                step="0.5"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              onClick={runBacktest}
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Gerçek Veriler Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Backtest Başlat
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetBacktest}
              disabled={isRunning}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Sıfırla
            </Button>
          </div>

          {isRunning && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Binance'den veri çekiliyor ve analiz ediliyor...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam P&L</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  results.stats.totalPnl >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {results.stats.totalPnl >= 0 ? "+" : ""}${results.stats.totalPnl}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {results.stats.totalPnlPercent}% getiri
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  parseFloat(results.stats.winRate) >= 50 ? "text-green-500" : "text-yellow-500"
                )}>
                  {results.stats.winRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {results.stats.wins}W / {results.stats.losses}L
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  parseFloat(results.stats.maxDrawdown) <= 15 ? "text-green-500" : "text-red-500"
                )}>
                  -{results.stats.maxDrawdown}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maksimum düşüş
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  parseFloat(results.stats.sharpeRatio) >= 1 ? "text-green-500" : "text-yellow-500"
                )}>
                  {results.stats.sharpeRatio}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Risk-adjusted return
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Equity Curve */}
          <Card>
            <CardHeader>
              <CardTitle>Equity Curve</CardTitle>
              <CardDescription>
                Gerçek {symbol} verileriyle sermaye değişimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.equityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="date"
                      stroke="#888"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke="#888"
                      fontSize={12}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sermaye']}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Drawdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Drawdown</CardTitle>
              <CardDescription>
                Sermaye düşüşü grafiği
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.equityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="date"
                      stroke="#888"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke="#888"
                      fontSize={12}
                      tickFormatter={(value) => `-${value}%`}
                      reversed
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
                      formatter={(value: number) => [`-${value}%`, 'Drawdown']}
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily P&L */}
          <Card>
            <CardHeader>
              <CardTitle>Günlük P&L</CardTitle>
              <CardDescription>
                Her günün kar/zarar durumu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.equityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="date"
                      stroke="#888"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke="#888"
                      fontSize={12}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                    />
                    <Bar
                      dataKey="dailyPnl"
                      fill="#22c55e"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Performans Metrikleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Toplam İşlem:</span>
                  <span className="font-medium">{results.stats.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit Factor:</span>
                  <span className="font-medium">{results.stats.profitFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Sermaye:</span>
                  <span className="font-medium">${results.stats.finalEquity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ortalama Kazanç:</span>
                  <span className="font-medium text-green-500">${results.stats.avgWin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ortalama Kayıp:</span>
                  <span className="font-medium text-red-500">${results.stats.avgLoss}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Risk Metrikleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Drawdown:</span>
                  <span className="font-medium text-red-500">-{results.stats.maxDrawdown}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sharpe Ratio:</span>
                  <span className="font-medium">{results.stats.sharpeRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk/Trade:</span>
                  <span className="font-medium">{riskPerTrade}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Test Süresi:</span>
                  <span className="font-medium">{days} gün</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zaman Dilimi:</span>
                  <span className="font-medium">{timeframe}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Backtest Summary */}
          <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Backtest Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                <strong>{symbol}</strong> için {days} günlük gerçek verilerle yapılan backtest sonucunda, 
                ${initialCapital} başlangıç sermayesi ile{" "}
                <span className={results.stats.totalPnl >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                  ${Math.abs(results.stats.totalPnl).toLocaleString()} {results.stats.totalPnl >= 0 ? "kar" : "zarar"}
                </span>{" "}
                elde edildi. Toplam {results.stats.totalTrades} işlem yapıldı, başarı oranı %{results.stats.winRate}, 
                maksimum drawdown %{results.stats.maxDrawdown}.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!results && !isRunning && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Gerçek Veri Backtest</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
              Parametreleri ayarlayın ve "Backtest Başlat" butonuna tıklayarak
              AI trading stratejisini gerçek Binance verileriyle test edin.
              SMC pattern'leri (OB, FVG, Liquidity Sweep, BOS) tespit edilecek.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
