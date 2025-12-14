import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Check, CheckCheck, AlertCircle, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NotificationPanel() {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const { data: allNotifications, refetch: refetchAll } = trpc.notifications.list.useQuery();
  const { data: unreadNotifications, refetch: refetchUnread } = trpc.notifications.unread.useQuery();
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchAll();
      refetchUnread();
    },
  });
  
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchAll();
      refetchUnread();
    },
  });

  const notifications = showUnreadOnly ? unreadNotifications : allNotifications;
  const unreadCount = unreadNotifications?.length || 0;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'SUCCESS':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'WARNING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'ERROR':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      POSITION_OPENED: 'Pozisyon Açıldı',
      POSITION_CLOSED: 'Pozisyon Kapandı',
      RISK_LIMIT_WARNING: 'Risk Uyarısı',
      DAILY_LIMIT_REACHED: 'Günlük Limit',
      CONNECTION_LOST: 'Bağlantı Kesildi',
      CONNECTION_RESTORED: 'Bağlantı Kuruldu',
      EMERGENCY_STOP: 'Acil Durdur',
    };
    return labels[type] || type;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Bildirimler
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} Yeni
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Gerçek zamanlı sistem bildirimleri
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              {showUnreadOnly ? (
                <><Bell className="w-4 h-4 mr-2" /> Tümü</>
              ) : (
                <><BellOff className="w-4 h-4 mr-2" /> Okunmamış</>
              )}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Tümünü Okundu İşaretle
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-5 rounded-lg border transition-all ${
                    notification.read
                      ? 'bg-slate-800/60 border-slate-700/60'
                      : 'bg-slate-800/90 border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(notification.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <h4 className="text-sm font-semibold text-white">
                          {notification.title}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getSeverityBadgeColor(notification.severity)}`}
                        >
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-slate-500">
                          {new Date(notification.createdAt).toLocaleString('tr-TR')}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                            disabled={markAsReadMutation.isPending}
                            className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 ml-4"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Okundu İşaretle
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BellOff className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">
                {showUnreadOnly ? 'Okunmamış bildirim yok' : 'Henüz bildirim yok'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Bot aktif olduğunda bildirimler burada görünecek
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
