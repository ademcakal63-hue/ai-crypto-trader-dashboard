import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Settings as SettingsIcon, DollarSign, TrendingUp, Shield, Save, AlertCircle } from "lucide-react";

export default function Settings() {
  const { data: settings, isLoading, refetch } = trpc.settings.get.useQuery();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Ayarlar başarıyla kaydedildi!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    totalCapital: settings?.totalCapital || "1000",
    usedCapital: settings?.usedCapital || "500",
    compoundEnabled: settings?.compoundEnabled || false,
    dailyLossLimitPercent: settings?.dailyLossLimitPercent || "4.00",
    riskPerTradePercent: settings?.riskPerTradePercent || "2.00",
    maxDailyTrades: settings?.maxDailyTrades || 10,
  });

  // Settings yüklendiğinde form'u güncelle
  useState(() => {
    if (settings) {
      setFormData({
        totalCapital: settings.totalCapital,
        usedCapital: settings.usedCapital,
        compoundEnabled: settings.compoundEnabled,
        dailyLossLimitPercent: settings.dailyLossLimitPercent,
        riskPerTradePercent: settings.riskPerTradePercent,
        maxDailyTrades: settings.maxDailyTrades,
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasyon
    const totalCap = parseFloat(formData.totalCapital);
    const usedCap = parseFloat(formData.usedCapital);
    
    if (usedCap > totalCap) {
      toast.error("Kullanılacak sermaye, toplam sermayeden fazla olamaz!");
      return;
    }
    
    if (usedCap < 100) {
      toast.error("Minimum kullanılacak sermaye 100 USDT olmalıdır!");
      return;
    }

    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  const usedCapitalPercent = ((parseFloat(formData.usedCapital) / parseFloat(formData.totalCapital)) * 100).toFixed(1);
  const dailyLossLimit = (parseFloat(formData.usedCapital) * parseFloat(formData.dailyLossLimitPercent) / 100).toFixed(2);
  const riskPerTrade = (parseFloat(formData.usedCapital) * parseFloat(formData.riskPerTradePercent) / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Bot Ayarları</h1>
              <p className="text-sm text-slate-400 mt-1">Sermaye ve risk yönetimi parametrelerini yapılandır</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sermaye Ayarları */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Sermaye Ayarları
              </CardTitle>
              <CardDescription className="text-slate-400">
                Hesabınızdaki toplam sermaye ve bot'un kullanacağı miktarı belirleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toplam Sermaye */}
              <div className="space-y-2">
                <Label htmlFor="totalCapital" className="text-slate-300">
                  Toplam Sermaye (USDT)
                </Label>
                <Input
                  id="totalCapital"
                  type="number"
                  step="0.01"
                  min="100"
                  value={formData.totalCapital}
                  onChange={(e) => setFormData({ ...formData, totalCapital: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="1000.00"
                />
                <p className="text-xs text-slate-500">
                  Binance hesabınızdaki toplam USDT miktarı
                </p>
              </div>

              {/* Kullanılacak Sermaye */}
              <div className="space-y-2">
                <Label htmlFor="usedCapital" className="text-slate-300">
                  Bot'un Kullanacağı Sermaye (USDT)
                </Label>
                <Input
                  id="usedCapital"
                  type="number"
                  step="0.01"
                  min="100"
                  max={formData.totalCapital}
                  value={formData.usedCapital}
                  onChange={(e) => setFormData({ ...formData, usedCapital: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="500.00"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Toplam sermayenin <span className="text-blue-400 font-semibold">%{usedCapitalPercent}</span>'i
                  </span>
                  <span className="text-slate-500">
                    Minimum: 100 USDT
                  </span>
                </div>
              </div>

              {/* Bileşik Getiri */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <Label htmlFor="compound" className="text-slate-300 cursor-pointer">
                      Bileşik Getiri (Compound)
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Kazançları otomatik olarak sermayeye ekle ve hesabı büyüt
                    </p>
                  </div>
                </div>
                <Switch
                  id="compound"
                  checked={formData.compoundEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, compoundEnabled: checked })}
                />
              </div>

              {formData.compoundEnabled && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-300">
                      <p className="font-semibold mb-1">Bileşik Getiri Aktif</p>
                      <p className="text-xs text-blue-400">
                        Bot, her kazançlı işlemden sonra sermayeyi otomatik olarak artıracak. 
                        Örneğin: 500 USDT ile başlayıp 50 USDT kazanırsanız, bir sonraki işlemde 550 USDT kullanılacak.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Yönetimi */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Risk Yönetimi
              </CardTitle>
              <CardDescription className="text-slate-400">
                Günlük kayıp limiti ve işlem başına risk parametreleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Günlük Kayıp Limiti */}
              <div className="space-y-2">
                <Label htmlFor="dailyLossLimit" className="text-slate-300">
                  Günlük Kayıp Limiti (%)
                </Label>
                <Input
                  id="dailyLossLimit"
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={formData.dailyLossLimitPercent}
                  onChange={(e) => setFormData({ ...formData, dailyLossLimitPercent: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="4.00"
                />
                <p className="text-xs text-slate-500">
                  Günlük maksimum kayıp: <span className="text-red-400 font-semibold">${dailyLossLimit} USDT</span>
                </p>
              </div>

              {/* İşlem Başına Risk */}
              <div className="space-y-2">
                <Label htmlFor="riskPerTrade" className="text-slate-300">
                  İşlem Başına Risk (%)
                </Label>
                <Input
                  id="riskPerTrade"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="5"
                  value={formData.riskPerTradePercent}
                  onChange={(e) => setFormData({ ...formData, riskPerTradePercent: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="2.00"
                />
                <p className="text-xs text-slate-500">
                  Her işlemde risk: <span className="text-yellow-400 font-semibold">${riskPerTrade} USDT</span>
                </p>
              </div>

              {/* Maksimum Günlük İşlem */}
              <div className="space-y-2">
                <Label htmlFor="maxTrades" className="text-slate-300">
                  Maksimum Günlük İşlem Sayısı
                </Label>
                <Input
                  id="maxTrades"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxDailyTrades}
                  onChange={(e) => setFormData({ ...formData, maxDailyTrades: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="10"
                />
                <p className="text-xs text-slate-500">
                  Bot günde en fazla {formData.maxDailyTrades} işlem açabilir
                </p>
              </div>

              {/* Risk Özeti */}
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-2">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Risk Özeti</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-500">Günlük Maksimum Kayıp</p>
                    <p className="text-red-400 font-semibold">${dailyLossLimit} USDT</p>
                  </div>
                  <div>
                    <p className="text-slate-500">İşlem Başına Risk</p>
                    <p className="text-yellow-400 font-semibold">${riskPerTrade} USDT</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Maksimum Günlük İşlem</p>
                    <p className="text-blue-400 font-semibold">{formData.maxDailyTrades} işlem</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Günlük Limit Dolana Kadar</p>
                    <p className="text-green-400 font-semibold">
                      {Math.floor(parseFloat(dailyLossLimit) / parseFloat(riskPerTrade))} kayıp
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kaydet Butonu */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="container mx-auto space-y-6">
        <Skeleton className="h-32 bg-slate-800" />
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    </div>
  );
}
