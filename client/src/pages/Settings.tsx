import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Settings as SettingsIcon, DollarSign, TrendingUp, Shield, Save, AlertCircle, Key } from "lucide-react";

export default function Settings() {
  const { data: settings, isLoading, refetch } = trpc.settings.get.useQuery();
  const saveMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success('✅ Ayarlar kaydedildi!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`❌ Hata: ${error.message}`);
    },
  });
  
  const validateMutation = trpc.settings.validateApiKey.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        toast.success(`✅ ${data.message}`);
        if (data.balance) {
          toast.success(`💰 Bakiye: $${data.balance.total.toFixed(2)} USDT`);
        }
      } else {
        toast.error(`❌ ${data.message}`);
      }
    },
    onError: (error: any) => {
      toast.error(`❌ Bağlantı hatası: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    binanceApiKey: "",
    binanceApiSecret: "",
    usedCapital: "500",
    useAllBalance: false,
    compoundEnabled: false,
    dailyLossLimitPercent: "4.00",
    riskPerTradePercent: "2.00",
    maxDailyTrades: 10,
  });

  // Settings yüklendiğinde form'u güncelle
  useEffect(() => {
    if (settings) {
      setFormData({
        binanceApiKey: settings.binanceApiKey || "",
        binanceApiSecret: settings.binanceApiSecret || "",
        usedCapital: settings.usedCapital,
        useAllBalance: settings.useAllBalance || false,
        compoundEnabled: settings.compoundEnabled,
        dailyLossLimitPercent: settings.dailyLossLimitPercent,
        riskPerTradePercent: settings.riskPerTradePercent,
        maxDailyTrades: settings.maxDailyTrades,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasyon
    const usedCap = parseFloat(formData.usedCapital);
    
    if (usedCap < 100) {
      toast.error("Minimum kullanılacak sermaye 100 USDT olmalıdır!");
      return;
    }
    
    if (!formData.binanceApiKey || !formData.binanceApiSecret) {
      toast.error("Binance API Key ve Secret gereklidir!");
      return;
    }

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  const dailyLossLimit = (parseFloat(formData.usedCapital) * parseFloat(formData.dailyLossLimitPercent) / 100).toFixed(2);
  const riskPerTrade = (parseFloat(formData.usedCapital) * parseFloat(formData.riskPerTradePercent) / 100).toFixed(2);
  const isConnected = settings?.isConnected || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-7 h-7 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Bot Ayarları</h1>
                <p className="text-sm text-slate-400 mt-1">Binance hesabını bağla ve risk parametrelerini ayarla</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Dashboard'a Dön
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Binance API Bağlantısı */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-500" />
                Binance API Bağlantısı
                {isConnected && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded">
                    Bağlı
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Binance hesabınızı bağlamak için API Key ve Secret girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-slate-300">
                  Binance API Key
                </Label>
                <Input
                  id="apiKey"
                  type="text"
                  value={formData.binanceApiKey}
                  onChange={(e) => setFormData({ ...formData, binanceApiKey: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                  placeholder="Binance API Key'inizi girin"
                />
                <p className="text-xs text-slate-500">
                  Binance hesabınızdan API Key oluşturun (Spot Trading yetkisi yeterli)
                </p>
              </div>

              {/* API Secret */}
              <div className="space-y-2">
                <Label htmlFor="apiSecret" className="text-slate-300">
                  Binance API Secret
                </Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={formData.binanceApiSecret}
                  onChange={(e) => setFormData({ ...formData, binanceApiSecret: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                  placeholder="Binance API Secret'ınızı girin"
                />
                <p className="text-xs text-slate-500">
                  API Secret güvenli bir şekilde şifrelenerek saklanır
                </p>
              </div>

              {/* Test Bağlantısı Butonu */}
              <Button
                type="button"
                onClick={() => {
                  if (!formData.binanceApiKey || !formData.binanceApiSecret) {
                    toast.error('❌ API Key ve Secret giriniz!');
                    return;
                  }
                  validateMutation.mutate({
                    apiKey: formData.binanceApiKey,
                    apiSecret: formData.binanceApiSecret,
                  });
                }}
                disabled={validateMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Key className="w-4 h-4 mr-2" />
                {validateMutation.isPending ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
              </Button>

              {/* Uyarı */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-300">
                    <p className="font-semibold mb-1">Güvenlik Uyarısı</p>
                    <p className="text-xs text-yellow-400">
                      • API Key oluştururken sadece "Spot Trading" yetkisi verin<br />
                      • "Withdraw" (çekim) yetkisi vermeyin<br />
                      • IP kısıtlaması eklemek güvenliği artırır
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sermaye Ayarları */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Sermaye Ayarları
              </CardTitle>
              <CardDescription className="text-slate-400">
                Bot'un kullanacağı sermaye miktarını belirleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Kullanılacak Sermaye */}
              <div className="space-y-2">
                <Label htmlFor="usedCapital" className="text-slate-300">
                  Kullanılacak Sermaye (USDT)
                </Label>
                <Input
                  id="usedCapital"
                  type="number"
                  step="0.01"
                  min="100"
                  value={formData.usedCapital}
                  onChange={(e) => setFormData({ ...formData, usedCapital: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="500.00"
                  disabled={formData.useAllBalance}
                />
                <p className="text-xs text-slate-500">
                  Bot bu miktarı kullanarak işlem yapacak (Minimum: 100 USDT)
                </p>
              </div>

              {/* Tüm Bakiyeyi Kullan */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-yellow-500" />
                  <div>
                    <Label htmlFor="useAllBalance" className="text-slate-300 cursor-pointer">
                      Tüm Bakiyeyi Kullan
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Hesaptaki tüm USDT bakiyesini kullan (Yukarıdaki miktar devre dışı kalır)
                    </p>
                  </div>
                </div>
                <Switch
                  id="useAllBalance"
                  checked={formData.useAllBalance}
                  onCheckedChange={(checked) => setFormData({ ...formData, useAllBalance: checked })}
                />
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
              disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Kaydediliyor..." : "Ayarları Kaydet"}
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
