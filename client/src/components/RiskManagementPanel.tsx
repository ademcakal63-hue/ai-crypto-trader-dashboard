import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, TrendingDown, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RiskManagementPanelProps {
  currentBalance: number;
  dailyPnl: number;
  dailyLossLimit: number; // %4 = $60 (1500'ün %4'ü)
  riskPerTrade: number; // %2 = $30
  openPositionsCount: number;
}

export default function RiskManagementPanel({
  currentBalance,
  dailyPnl,
  dailyLossLimit,
  riskPerTrade,
  openPositionsCount,
}: RiskManagementPanelProps) {
  // Günlük limit hesaplamaları
  const dailyLossLimitAmount = (currentBalance * dailyLossLimit) / 100;
  const usedDailyRisk = Math.abs(Math.min(dailyPnl, 0)); // Sadece zarar varsa
  const remainingDailyRisk = Math.max(dailyLossLimitAmount - usedDailyRisk, 0);
  const dailyRiskPercentage = (usedDailyRisk / dailyLossLimitAmount) * 100;

  // İşlem başına risk
  const riskPerTradeAmount = (currentBalance * riskPerTrade) / 100;
  const maxDailyTrades = Math.floor(dailyLossLimitAmount / riskPerTradeAmount);
  const remainingTrades = Math.max(maxDailyTrades - Math.floor(usedDailyRisk / riskPerTradeAmount), 0);

  // Risk seviyesi
  const getRiskLevel = () => {
    if (dailyRiskPercentage >= 80) return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Yüksek Risk' };
    if (dailyRiskPercentage >= 50) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Orta Risk' };
    return { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Düşük Risk' };
  };

  const riskLevel = getRiskLevel();

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Risk Yönetimi
        </CardTitle>
        <CardDescription className="text-slate-400">
          Günlük kayıp limiti ve pozisyon kontrolü
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Günlük Kayıp Limiti */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Günlük Kayıp Limiti</span>
            </div>
            <Badge variant="outline" className={`${riskLevel.bg} ${riskLevel.color} border-${riskLevel.color.replace('text-', '')}/30`}>
              {riskLevel.label}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <div 
                className={`h-full transition-all ${
                  dailyRiskPercentage >= 80 ? 'bg-red-500' :
                  dailyRiskPercentage >= 50 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(dailyRiskPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">
                Kullanılan: <span className={riskLevel.color}>${usedDailyRisk.toFixed(2)}</span>
              </span>
              <span className="text-slate-400">
                Kalan: <span className="text-green-400">${remainingDailyRisk.toFixed(2)}</span>
              </span>
              <span className="text-slate-400">
                Limit: <span className="text-slate-300">${dailyLossLimitAmount.toFixed(2)}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Günlük Limit</p>
              <p className="text-lg font-semibold text-white">{dailyLossLimit}%</p>
              <p className="text-xs text-slate-500">${dailyLossLimitAmount.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Kullanım Oranı</p>
              <p className={`text-lg font-semibold ${riskLevel.color}`}>
                {dailyRiskPercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500">${usedDailyRisk.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* İşlem Başına Risk */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">İşlem Başına Risk</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Risk Oranı</p>
              <p className="text-lg font-semibold text-white">{riskPerTrade}%</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Risk Miktarı</p>
              <p className="text-lg font-semibold text-white">${riskPerTradeAmount.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Max İşlem</p>
              <p className="text-lg font-semibold text-blue-400">{remainingTrades}/{maxDailyTrades}</p>
            </div>
          </div>
        </div>

        {/* Uyarılar */}
        {dailyRiskPercentage >= 80 && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Yüksek Risk Uyarısı</p>
              <p className="text-xs text-red-300 mt-1">
                Günlük kayıp limitinin %{dailyRiskPercentage.toFixed(0)}'ine ulaştınız. 
                Yeni pozisyon açmadan önce dikkatli olun.
              </p>
            </div>
          </div>
        )}

        {remainingTrades === 0 && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Günlük Limit Doldu</p>
              <p className="text-xs text-red-300 mt-1">
                Bugün için maksimum işlem sayısına ulaştınız. Yeni pozisyon açılamaz.
              </p>
            </div>
          </div>
        )}

        {/* Acil Durdur Butonu */}
        {openPositionsCount > 0 && (
          <Button 
            variant="destructive" 
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
            onClick={() => {
              // TODO: Tüm pozisyonları kapat
              alert('Acil Durdur: Tüm açık pozisyonlar kapatılacak!');
            }}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Acil Durdur - Tüm Pozisyonları Kapat
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
