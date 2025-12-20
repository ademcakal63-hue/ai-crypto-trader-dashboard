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
  const [binanceBalance, setBinanceBalance] = useState<number | null>(null);
  const { data: balanceData } = trpc.binance.balance.useQuery(undefined, {
    enabled: settings?.isConnected || false,
    refetchInterval: 30000, // Her 30 saniyede bir güncelle
  });
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
    onSuccess: async (data) => {
      if (data.valid) {
        toast.success(`✅ ${data.message}`);
        if (data.balance) {
          toast.success(`💰 Bakiye: $${data.balance.total.toFixed(2)} USDT`);
          setBinanceBalance(data.balance.total);
        }
        
        // API test başarılı - ayarları kaydet ve isConnected=true yap
        await saveMutation.mutateAsync({
          ...formData,
          isConnected: true,
        });
        
        // Settings'i yeniden yükle
        refetch();
      } else {
        toast.error(`❌ ${data.message}`);
      }
    },
    onError: (error: any) => {
      toast.error(`❌ Bağlantı hatası: ${error.message}`);
    },
  });

  const validateOpenAIMutation = trpc.settings.validateOpenAIKey.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        toast.success(`✅ ${data.message}`);
        if (data.model) {
          toast.success(`🤖 Model: ${data.model}`);
        }
      } else {
        toast.error(`❌ ${data.message}`);
      }
    },
    onError: (error: any) => {
      toast.error(`❌ Test hatası: ${error.message}`);
    },
  });

  // Default form değerleri
  const defaultFormData = {
    binanceApiKey: "",
    binanceApiSecret: "",
    openaiApiKey: "",
    capitalLimit: "",
    useAllBalance: true,
    compoundEnabled: false,
    dailyLossLimitPercent: "4.00",
    riskPerTradePercent: "2.00",
    maxDailyTrades: 10,
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  
  // Settings yüklenindiğinde form'u güncelle (HER ZAMAN database'den)
  // localStorage kullanmıyoruz - iframe/preview panel sorunları için
  useEffect(() => {
    if (settings && !isFormLoaded) {
      const newFormData = {
        binanceApiKey: settings.binanceApiKey || "",
        binanceApiSecret: settings.binanceApiSecret || "",
        openaiApiKey: settings.openaiApiKey || "",
        capitalLimit: settings.capitalLimit || "",
        useAllBalance: settings.useAllBalance ?? true,
        compoundEnabled: settings.compoundEnabled ?? false,
        dailyLossLimitPercent: settings.dailyLossLimitPercent || "4.00",
        riskPerTradePercent: settings.riskPerTradePercent || "2.00",
        maxDailyTrades: settings.maxDailyTrades || 10,
      };
      setFormData(newFormData);
      setIsFormLoaded(true);
    }
  }, [settings, isFormLoaded]);  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasyon
    // Eğer useAllBalance aktif değilse ve capitalLimit girilmişse, minimum kontrol yap
    if (!formData.useAllBalance && formData.capitalLimit) {
      const usedCap = parseFloat(formData.capitalLimit);
      if (usedCap < 100) {
        toast.error("Minimum sermaye limiti 100 USDT olmalıdır!");
        return;
      }
    }
    
    if (!formData.binanceApiKey || !formData.binanceApiSecret) {
      toast.error("Binance API Key ve Secret gereklidir!");
      return;
    }

    saveMutation.mutate(formData);
  };

  // Bakiye güncelleme
  useEffect(() => {
    if (balanceData?.balance) {
      setBinanceBalance(balanceData.balance);
    }
  }, [balanceData]);

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  // Gerçek sermaye hesaplama
  const getActualCapital = (): number | null => {
    if (!binanceBalance) return null;
    
    // Tüm bakiye kullanılıyorsa
    if (formData.useAllBalance) {
      return binanceBalance;
    }
    
    // Sermaye limiti varsa
    if (formData.capitalLimit) {
      const limit = parseFloat(formData.capitalLimit);
      return Math.min(binanceBalance, limit);
    }
    
    return binanceBalance;
  };

  const actualCapital = getActualCapital();
  
  // Risk hesaplamaları gerçek sermayeye göre
  const dailyLossLimit = actualCapital
    ? (actualCapital * parseFloat(formData.dailyLossLimitPercent) / 100).toFixed(2)
    : "Hesap bağlantısı bekleniyor";
  const riskPerTrade = actualCapital
    ? (actualCapital * parseFloat(formData.riskPerTradePercent) / 100).toFixed(2)
    : "Hesap bağlantısı bekleniyor";
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
                      • API Key oluştururken <strong>"Enable Futures"</strong> yetkisi verin (bot kaldıraçlı işlem yapar)<br />
                      • <strong>"Enable Withdrawals"</strong> (çekim) yetkisi vermeyin (güvenlik)<br />
                      • <strong>IP Whitelist</strong> kullanın (opsiyonel ama önerilir)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OpenAI API Key */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-500" />
                OpenAI API Key
              </CardTitle>
              <CardDescription className="text-slate-400">
                AI karar verme sistemi için OpenAI API key'inizi girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openaiApiKey" className="text-slate-300">
                  OpenAI API Key
                </Label>
                <Input
                  id="openaiApiKey"
                  type="password"
                  value={formData.openaiApiKey || ""}
                  onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                  placeholder="sk-..."
                />
                <p className="text-xs text-slate-500">
                  OpenAI Platform'dan API key oluşturun: <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-400 hover:underline">platform.openai.com/api-keys</a>
                </p>
              </div>

              {/* Test OpenAI Key Button */}
              <Button
                type="button"
                onClick={() => {
                  if (!formData.openaiApiKey) {
                    toast.error('❌ OpenAI API Key giriniz!');
                    return;
                  }
                  validateOpenAIMutation.mutate({
                    apiKey: formData.openaiApiKey,
                  });
                }}
                disabled={validateOpenAIMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Key className="w-4 h-4 mr-2" />
                {validateOpenAIMutation.isPending ? 'Test Ediliyor...' : 'OpenAI API Key Test Et'}
              </Button>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-semibold mb-1">Maliyet Bilgisi</p>
                    <p className="text-xs text-blue-400">
                      • GPT-4 Turbo kullanılıyor<br />
                      • 100 trade ≈ $10-15 maliyet<br />
                      • Aylık tahmini: $50-100
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
                <Label htmlFor="capitalLimit" className="text-slate-300">
                  Sermaye Limiti (USDT) - Opsiyonel
                </Label>
                <Input
                  id="capitalLimit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.capitalLimit}
                  onChange={(e) => setFormData({ ...formData, capitalLimit: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Boş bırakırsan tüm bakiye kullanılır"
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
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    useAllBalance: checked,
                    compoundEnabled: checked ? true : formData.compoundEnabled // Tüm bakiye kullanılıyorsa compound otomatik aktif
                  })}
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
