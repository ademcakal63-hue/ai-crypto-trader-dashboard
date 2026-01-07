import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Brain, Zap, Lock, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Giriş başarılı!");
        // Sayfayı yenile - cookie ayarlandı
        window.location.href = "/";
      } else {
        toast.error(data.error || "Giriş başarısız");
      }
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Bir hata oluştu");
      setIsLoading(false);
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Email ve şifre gerekli");
      return;
    }
    
    setIsLoading(true);
    loginMutation.mutate({ email, password });
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-neutral-950 to-black">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <Card className="relative w-full max-w-md mx-4 bg-neutral-900/80 border-amber-900/30 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-600/20 rounded-2xl blur-xl" />
              <div className="relative p-4 rounded-2xl bg-neutral-800/50 border border-amber-900/30 backdrop-blur">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-2xl font-bold text-white">{APP_TITLE}</CardTitle>
            </div>
            <CardDescription className="text-neutral-400">
              AI destekli kripto trading bot'unuza erişmek için giriş yapın
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-neutral-800/50 border-amber-900/30 text-white placeholder:text-neutral-500 focus:border-amber-600/50 focus:ring-amber-600/20"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-neutral-800/50 border-amber-900/30 text-white placeholder:text-neutral-500 focus:border-amber-600/50 focus:ring-amber-600/20"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 hover:shadow-xl hover:shadow-amber-600/30 transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  Giriş yapılıyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Giriş Yap
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
