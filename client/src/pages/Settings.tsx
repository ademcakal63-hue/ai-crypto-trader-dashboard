import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Save, 
  AlertCircle, 
  Key,
  Wallet,
  Brain,
  Zap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Percent,
  Target,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { data: settings, isLoading, refetch } = trpc.settings.get.useQuery();
  const [binanceBalance, setBinanceBalance] = useState<number | null>(null);
  const { data: balanceData } = trpc.binance.balance.useQuery(undefined, {
    enabled: settings?.isConnected || false,
    refetchInterval: 30000,
  });
  
  const saveMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success('Ayarlar kaydedildi!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Hata: ${error.message}`);
    },
  });
  
  const validateMutation = trpc.settings.validateApiKey.useMutation({
    onSuccess: async (data) => {
      if (data.valid) {
        toast.success(data.message);
        if (data.balance) {
          toast.success(`Bakiye: $${data.balance.total.toFixed(2)} USDT`);
          setBinanceBalance(data.balance.total);
        }
        await saveMutation.mutateAsync({
          ...formData,
          isConnected: true,
        });
        refetch();
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      toast.error(`Bağlantı hatası: ${error.message}`);
    },
  });

  const validateOpenAIMutation = trpc.settings.validateOpenAIKey.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        toast.success(data.message);
        if (data.model) {
          toast.success(`Model: ${data.model}`);
        }
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      toast.error(`Test hatası: ${error.message}`);
    },
  });

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
  }, [settings, isFormLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.useAllBalance && formData.capitalLimit) {
      const usedCap = parseFloat(formData.capitalLimit);
      if (usedCap < 100) {
        toast.error("Minimum sermaye limiti 100 USDT olmalıdır!");
        return;
      }
    }
    
    saveMutation.mutate(formData);
  };

  useEffect(() => {
    if (balanceData?.balance) {
      setBinanceBalance(balanceData.balance);
    }
  }, [balanceData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">Ayarlar Yükleniyor</p>
            <p className="text-sm text-muted-foreground mt-1">Lütfen bekleyin...</p>
          </div>
        </div>
      </div>
    );
  }

  const getActualCapital = (): number | null => {
    if (!binanceBalance) return null;
    if (formData.useAllBalance) return binanceBalance;
    if (formData.capitalLimit) {
      const limit = parseFloat(formData.capitalLimit);
      return Math.min(binanceBalance, limit);
    }
    return binanceBalance;
  };

  const actualCapital = getActualCapital();
  const dailyLossLimit = actualCapital
    ? (actualCapital * parseFloat(formData.dailyLossLimitPercent) / 100).toFixed(2)
    : null;
  const riskPerTrade = actualCapital
    ? (actualCapital * parseFloat(formData.riskPerTradePercent) / 100).toFixed(2)
    : null;
  const isConnected = settings?.isConnected || false;

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-8">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <SettingsIcon className="h-6 w-6 text-purple-400" />
                </div>
                {isConnected && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Bağlı
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Bot Ayarları
              </h1>
              <p className="text-slate-400 mt-2 max-w-lg">
                API bağlantılarını yapılandır ve risk parametrelerini ayarla
              </p>
            </div>
            
            <Button 
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Connections Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Binance API */}
          <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-xl border",
                    isConnected 
                      ? "bg-emerald-500/10 border-emerald-500/20" 
                      : "bg-amber-500/10 border-amber-500/20"
                  )}>
                    <Key className={cn(
                      "h-5 w-5",
                      isConnected ? "text-emerald-400" : "text-amber-400"
                    )} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Binance API</CardTitle>
                    <CardDescription>Exchange bağlantısı</CardDescription>
                  </div>
                </div>
                {isConnected ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Bağlı</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 border-0">Bağlı Değil</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">API Key</Label>
                <Input
                  type="text"
                  value={formData.binanceApiKey}
                  onChange={(e) => setFormData({ ...formData, binanceApiKey: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 font-mono text-sm"
                  placeholder="API Key'inizi girin"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">API Secret</Label>
                <Input
                  type="password"
                  value={formData.binanceApiSecret}
                  onChange={(e) => setFormData({ ...formData, binanceApiSecret: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 font-mono text-sm"
                  placeholder="API Secret'ınızı girin"
                />
              </div>

              <Button
                type="button"
                onClick={() => {
                  if (!formData.binanceApiKey || !formData.binanceApiSecret) {
                    toast.error('API Key ve Secret giriniz!');
                    return;
                  }
                  validateMutation.mutate({
                    apiKey: formData.binanceApiKey,
                    apiSecret: formData.binanceApiSecret,
                  });
                }}
                disabled={validateMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {validateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Test Ediliyor...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Bağlantıyı Test Et
                  </>
                )}
              </Button>

              {/* Balance Display */}
              {binanceBalance !== null && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Mevcut Bakiye:</span>
                    <span className="font-bold text-emerald-400">${binanceBalance.toFixed(2)} USDT</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OpenAI API */}
          <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Brain className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Model</CardTitle>
                  <CardDescription>Manus LLM kullanılıyor</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Manus LLM Aktif</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Bot, Manus'un yerleşik AI modelini kullanıyor. Ek API key gerekmez.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">OpenAI API Key (Opsiyonel)</Label>
                <Input
                  type="password"
                  value={formData.openaiApiKey}
                  onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 font-mono text-sm"
                  placeholder="Alternatif olarak OpenAI kullanmak için"
                />
                <p className="text-xs text-slate-500">
                  Boş bırakırsanız Manus LLM kullanılır
                </p>
              </div>

              {formData.openaiApiKey && (
                <Button
                  type="button"
                  onClick={() => {
                    validateOpenAIMutation.mutate({ apiKey: formData.openaiApiKey });
                  }}
                  disabled={validateOpenAIMutation.isPending}
                  variant="outline"
                  className="w-full border-slate-700"
                >
                  {validateOpenAIMutation.isPending ? "Test Ediliyor..." : "OpenAI'ı Test Et"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Capital Settings */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Wallet className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Sermaye Ayarları</CardTitle>
                <CardDescription>İşlem sermayesini yapılandırın</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="font-medium text-white">Tüm Bakiyeyi Kullan</p>
                  <p className="text-xs text-slate-400">Hesaptaki tüm USDT bakiyesi kullanılır</p>
                </div>
              </div>
              <Switch
                checked={formData.useAllBalance}
                onCheckedChange={(checked) => setFormData({ ...formData, useAllBalance: checked })}
              />
            </div>

            {!formData.useAllBalance && (
              <div className="space-y-2">
                <Label className="text-slate-300">Sermaye Limiti (USDT)</Label>
                <Input
                  type="number"
                  value={formData.capitalLimit}
                  onChange={(e) => setFormData({ ...formData, capitalLimit: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                  placeholder="Örn: 1000"
                  min="100"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-medium text-white">Bileşik Getiri</p>
                  <p className="text-xs text-slate-400">Karları otomatik olarak sermayeye ekle</p>
                </div>
              </div>
              <Switch
                checked={formData.compoundEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, compoundEnabled: checked })}
              />
            </div>

            {actualCapital && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Kullanılacak Sermaye:</span>
                  <span className="font-bold text-amber-400">${actualCapital.toFixed(2)} USDT</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <Shield className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Risk Yönetimi</CardTitle>
                <CardDescription>Kayıp limitlerini ve risk parametrelerini ayarlayın</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily Loss Limit */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Günlük Kayıp Limiti</Label>
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                  %{formData.dailyLossLimitPercent}
                </Badge>
              </div>
              <Slider
                value={[parseFloat(formData.dailyLossLimitPercent)]}
                onValueChange={(value) => setFormData({ ...formData, dailyLossLimitPercent: value[0].toFixed(2) })}
                max={10}
                min={1}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>%1 (Düşük Risk)</span>
                <span>%10 (Yüksek Risk)</span>
              </div>
              {dailyLossLimit && (
                <p className="text-sm text-slate-400">
                  Maksimum günlük kayıp: <span className="text-red-400 font-medium">${dailyLossLimit}</span>
                </p>
              )}
            </div>

            <Separator className="bg-slate-800" />

            {/* Risk Per Trade */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">İşlem Başına Risk</Label>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                  %{formData.riskPerTradePercent}
                </Badge>
              </div>
              <Slider
                value={[parseFloat(formData.riskPerTradePercent)]}
                onValueChange={(value) => setFormData({ ...formData, riskPerTradePercent: value[0].toFixed(2) })}
                max={5}
                min={0.5}
                step={0.25}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>%0.5 (Konservatif)</span>
                <span>%5 (Agresif)</span>
              </div>
              {riskPerTrade && (
                <p className="text-sm text-slate-400">
                  İşlem başına risk: <span className="text-amber-400 font-medium">${riskPerTrade}</span>
                </p>
              )}
            </div>

            <Separator className="bg-slate-800" />

            {/* Max Daily Trades */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Maksimum Günlük İşlem</Label>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  {formData.maxDailyTrades} işlem
                </Badge>
              </div>
              <Slider
                value={[formData.maxDailyTrades]}
                onValueChange={(value) => setFormData({ ...formData, maxDailyTrades: value[0] })}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>1 işlem</span>
                <span>50 işlem</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Card */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-400 mb-2">Güvenlik Uyarısı</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• API Key oluştururken <strong>sadece gerekli yetkileri</strong> verin</li>
                  <li>• <strong>Withdrawal (Para çekme)</strong> yetkisi vermeyin</li>
                  <li>• IP kısıtlaması ekleyerek güvenliği artırın</li>
                  <li>• API bilgilerinizi kimseyle paylaşmayın</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={saveMutation.isPending}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Kaydediliyor..." : "Tüm Ayarları Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
