import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Brain,
  BarChart3,
  Zap,
  Award,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

export default function TradeHistory() {
  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [searchSymbol, setSearchSymbol] = useState("");

  const { data: trades, isLoading, refetch } = trpc.dashboard.tradeHistory.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const stats = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalPnl: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
      };
    }

    const wins = trades.filter((t: any) => parseFloat(t.pnl || "0") > 0);
    const losses = trades.filter((t: any) => parseFloat(t.pnl || "0") <= 0);
    
    const totalPnl = trades.reduce((sum: number, t: any) => sum + parseFloat(t.pnl || "0"), 0);
    const totalWins = wins.reduce((sum: number, t: any) => sum + parseFloat(t.pnl || "0"), 0);
    const totalLosses = Math.abs(losses.reduce((sum: number, t: any) => sum + parseFloat(t.pnl || "0"), 0));

    return {
      totalTrades: trades.length,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      totalPnl,
      avgWin: wins.length > 0 ? totalWins / wins.length : 0,
      avgLoss: losses.length > 0 ? totalLosses / losses.length : 0,
      largestWin: wins.length > 0 ? Math.max(...wins.map((t: any) => parseFloat(t.pnl || "0"))) : 0,
      largestLoss: losses.length > 0 ? Math.min(...losses.map((t: any) => parseFloat(t.pnl || "0"))) : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
    };
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (!trades) return [];
    
    return trades.filter((trade: any) => {
      if (filterDirection !== "all" && trade.direction !== filterDirection) {
        return false;
      }
      
      const pnl = parseFloat(trade.pnl || "0");
      if (filterResult === "win" && pnl <= 0) return false;
      if (filterResult === "loss" && pnl > 0) return false;
      
      if (searchSymbol && !trade.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [trades, filterDirection, filterResult, searchSymbol]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">Trade Geçmişi Yükleniyor</p>
            <p className="text-sm text-muted-foreground mt-1">Veriler hazırlanıyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-8">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <History className="h-6 w-6 text-blue-400" />
                </div>
                <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30">
                  {stats.totalTrades} İşlem
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Trade Geçmişi
              </h1>
              <p className="text-slate-400 mt-2 max-w-lg">
                Tamamlanan tüm işlemlerin detaylı listesi
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="border-slate-700 hover:border-slate-600 hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam İşlem</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <History className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalTrades}</div>
            <p className="text-xs text-slate-500 mt-2">Tamamlanan trade sayısı</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Başarı Oranı</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Target className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              stats.winRate >= 60 ? "text-emerald-400" : stats.winRate >= 50 ? "text-amber-400" : "text-red-400"
            )}>
              {stats.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 mt-2">Karlı işlem oranı</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
          <div className={cn(
            "absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2",
            stats.totalPnl >= 0 ? "bg-emerald-500/5" : "bg-red-500/5"
          )} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam P&L</CardTitle>
            <div className={cn(
              "p-2 rounded-lg",
              stats.totalPnl >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
            )}>
              <DollarSign className={cn(
                "h-4 w-4",
                stats.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
              )} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              stats.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-2">Net kar/zarar</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Profit Factor</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              stats.profitFactor >= 1.5 ? "text-emerald-400" : stats.profitFactor >= 1 ? "text-amber-400" : "text-red-400"
            )}>
              {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-2">Toplam kar / Toplam zarar</p>
          </CardContent>
        </Card>
      </div>

      {/* Win/Loss Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <CardTitle className="text-lg">Kazanç İstatistikleri</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
              <span className="text-slate-400">Ortalama Kazanç:</span>
              <span className="font-bold text-emerald-400">+${stats.avgWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
              <span className="text-slate-400">En Büyük Kazanç:</span>
              <span className="font-bold text-emerald-400">+${stats.largestWin.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <TrendingDown className="h-5 w-5 text-red-400" />
              </div>
              <CardTitle className="text-lg">Kayıp İstatistikleri</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
              <span className="text-slate-400">Ortalama Kayıp:</span>
              <span className="font-bold text-red-400">-${stats.avgLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
              <span className="text-slate-400">En Büyük Kayıp:</span>
              <span className="font-bold text-red-400">${stats.largestLoss.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-500/10 border border-slate-500/20">
              <Filter className="h-5 w-5 text-slate-400" />
            </div>
            <CardTitle className="text-lg">Filtreler</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Sembol ara (örn: BTC)"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                className="bg-slate-800/50 border-slate-700 focus:border-primary"
              />
            </div>
            <Select value={filterDirection} onValueChange={setFilterDirection}>
              <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Yön" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Yönler</SelectItem>
                <SelectItem value="LONG">Long</SelectItem>
                <SelectItem value="SHORT">Short</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterResult} onValueChange={setFilterResult}>
              <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Sonuç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Sonuçlar</SelectItem>
                <SelectItem value="win">Kazanç</SelectItem>
                <SelectItem value="loss">Kayıp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trade List */}
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <BarChart3 className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg">İşlem Listesi</CardTitle>
                <CardDescription>{filteredTrades.length} işlem gösteriliyor</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-2xl bg-slate-800/50 mb-4">
                <AlertCircle className="h-12 w-12 text-slate-500" />
              </div>
              <p className="text-lg font-medium text-slate-300">Henüz işlem yok</p>
              <p className="text-sm text-slate-500 mt-2 max-w-md">
                Bot işlem yaptıkça burada görünecek
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-7 gap-4 px-4 py-2 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                <div>Tarih</div>
                <div>Sembol</div>
                <div>Yön</div>
                <div className="text-right">Giriş</div>
                <div className="text-right">Çıkış</div>
                <div className="text-right">P&L</div>
                <div className="text-right">Pattern</div>
              </div>
              
              {/* Trade Rows */}
              {filteredTrades.map((trade: any) => {
                const pnl = parseFloat(trade.pnl || "0");
                const isProfit = pnl > 0;
                
                return (
                  <div
                    key={trade.id}
                    className={cn(
                      "grid grid-cols-2 md:grid-cols-7 gap-4 p-4 rounded-xl border transition-all hover:bg-slate-800/50",
                      isProfit 
                        ? "border-emerald-500/20 bg-emerald-500/5" 
                        : "border-red-500/20 bg-red-500/5"
                    )}
                  >
                    {/* Date */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <div>
                        <div className="text-sm text-white">
                          {new Date(trade.closedAt || trade.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(trade.closedAt || trade.createdAt).toLocaleTimeString('tr-TR')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Symbol */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{trade.symbol}</span>
                    </div>
                    
                    {/* Direction */}
                    <div className="flex items-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "gap-1",
                          trade.direction === "LONG" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        )}
                      >
                        {trade.direction === "LONG" ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {trade.direction}
                      </Badge>
                    </div>
                    
                    {/* Entry Price */}
                    <div className="text-right">
                      <div className="text-sm text-white">${parseFloat(trade.entryPrice).toFixed(1)}</div>
                    </div>
                    
                    {/* Exit Price */}
                    <div className="text-right">
                      <div className="text-sm text-white">${parseFloat(trade.exitPrice || trade.entryPrice).toFixed(1)}</div>
                    </div>
                    
                    {/* P&L */}
                    <div className="text-right">
                      <div className={cn(
                        "text-sm font-bold",
                        isProfit ? "text-emerald-400" : "text-red-400"
                      )}>
                        {isProfit ? "+" : ""}${pnl.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Pattern */}
                    <div className="flex items-center justify-end gap-2">
                      <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 border-0 gap-1">
                        <Brain className="h-3 w-3" />
                        {trade.pattern || "AI Analysis"}
                      </Badge>
                      <div className="text-xs text-slate-500">
                        % {trade.confidence || 75}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
