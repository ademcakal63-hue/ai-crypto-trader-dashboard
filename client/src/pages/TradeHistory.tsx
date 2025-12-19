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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Percent,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

export default function TradeHistory() {
  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [searchSymbol, setSearchSymbol] = useState("");

  // Fetch trade history
  const { data: trades, isLoading, refetch } = trpc.dashboard.tradeHistory.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate statistics
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
        avgHoldTime: "0m",
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
      avgHoldTime: "~5m", // Placeholder
    };
  }, [trades]);

  // Filter trades
  const filteredTrades = useMemo(() => {
    if (!trades) return [];
    
    return trades.filter((trade: any) => {
      // Direction filter
      if (filterDirection !== "all" && trade.direction !== filterDirection) {
        return false;
      }
      
      // Result filter
      const pnl = parseFloat(trade.pnl || "0");
      if (filterResult === "win" && pnl <= 0) return false;
      if (filterResult === "loss" && pnl > 0) return false;
      
      // Symbol search
      if (searchSymbol && !trade.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [trades, filterDirection, filterResult, searchSymbol]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <History className="h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Trade geçmişi yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Geçmişi</h1>
          <p className="text-muted-foreground mt-1">
            Tamamlanan tüm işlemlerin detaylı listesi
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İşlem</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tamamlanan trade sayısı
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
              stats.winRate >= 60 ? "text-green-500" : stats.winRate >= 50 ? "text-yellow-500" : "text-red-500"
            )}>
              {stats.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Karlı işlem oranı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              stats.totalPnl >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net kar/zarar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              stats.profitFactor >= 1.5 ? "text-green-500" : stats.profitFactor >= 1 ? "text-yellow-500" : "text-red-500"
            )}>
              {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Toplam kar / Toplam zarar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Kazanç İstatistikleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ortalama Kazanç:</span>
              <span className="font-medium text-green-500">+${stats.avgWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">En Büyük Kazanç:</span>
              <span className="font-medium text-green-500">+${stats.largestWin.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Kayıp İstatistikleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ortalama Kayıp:</span>
              <span className="font-medium text-red-500">-${stats.avgLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">En Büyük Kayıp:</span>
              <span className="font-medium text-red-500">${stats.largestLoss.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Sembol ara (örn: BTC)"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
              />
            </div>
            <Select value={filterDirection} onValueChange={setFilterDirection}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Yön" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Yönler</SelectItem>
                <SelectItem value="LONG">Long</SelectItem>
                <SelectItem value="SHORT">Short</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterResult} onValueChange={setFilterResult}>
              <SelectTrigger className="w-[150px]">
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

      {/* Trade Table */}
      <Card>
        <CardHeader>
          <CardTitle>İşlem Listesi</CardTitle>
          <CardDescription>
            {filteredTrades.length} işlem gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Henüz işlem yok</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Bot çalışmaya başladığında tamamlanan işlemler burada görünecek
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Sembol</TableHead>
                    <TableHead>Yön</TableHead>
                    <TableHead>Giriş</TableHead>
                    <TableHead>Çıkış</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Güven</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade: any, index: number) => {
                    const pnl = parseFloat(trade.pnl || "0");
                    const isProfit = pnl > 0;
                    
                    return (
                      <TableRow key={trade.id || index}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(trade.closedAt || trade.openedAt).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(trade.closedAt || trade.openedAt).toLocaleTimeString('tr-TR')}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.direction === "LONG" ? "default" : "secondary"}>
                            {trade.direction === "LONG" ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            )}
                            {trade.direction}
                          </Badge>
                        </TableCell>
                        <TableCell>${parseFloat(trade.entryPrice).toLocaleString()}</TableCell>
                        <TableCell>${parseFloat(trade.exitPrice).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            isProfit ? "text-green-500" : "text-red-500"
                          )}>
                            {isProfit ? "+" : ""}${pnl.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            <Brain className="h-3 w-3 mr-1" />
                            {trade.pattern || "AI Analysis"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Percent className="h-3 w-3 text-muted-foreground" />
                            {trade.confidence ? `${(parseFloat(trade.confidence) * 100).toFixed(0)}%` : "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
