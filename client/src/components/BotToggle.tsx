import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Power, AlertTriangle } from "lucide-react";

export default function BotToggle() {
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const [showStopDialog, setShowStopDialog] = useState(false);
  const toggleMutation = trpc.settings.toggleBot.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setShowStopDialog(false);
    },
    onError: (error: any) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const isActive = settings?.isActive || false;
  const hasOpenPositions = false; // TODO: Açık pozisyon kontrolü ekle

  const handleToggle = (checked: boolean) => {
    if (!checked && hasOpenPositions) {
      // Bot durduruluyor ve açık pozisyonlar var
      setShowStopDialog(true);
    } else {
      // Direkt toggle
      toggleMutation.mutate({ isActive: checked, closePositions: false });
    }
  };

  const handleStopWithClose = () => {
    toggleMutation.mutate({ isActive: false, closePositions: true });
  };

  const handleStopWithoutClose = () => {
    toggleMutation.mutate({ isActive: false, closePositions: false });
  };

  return (
    <>
      <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
        <Power className={`w-5 h-5 ${isActive ? 'text-green-400' : 'text-slate-500'}`} />
        <div className="flex flex-col">
          <Label htmlFor="bot-toggle" className="text-xs text-slate-400 cursor-pointer">
            Bot Durumu
          </Label>
          <span className={`text-sm font-semibold ${isActive ? 'text-green-400' : 'text-slate-500'}`}>
            {isActive ? 'Aktif' : 'Pasif'}
          </span>
        </div>
        <Switch
          id="bot-toggle"
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={toggleMutation.isPending}
        />
      </div>

      {/* Durdurma Dialog'u */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Bot Durdurulsun mu?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Açık pozisyonlarınız var. Bot'u durdururken pozisyonları kapatmak ister misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleStopWithoutClose}
              disabled={toggleMutation.isPending}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              Pozisyonları Koru
            </Button>
            <Button
              onClick={handleStopWithClose}
              disabled={toggleMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Pozisyonları Kapat ve Durdur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
