import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, X, AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type NotificationSeverity = "INFO" | "WARNING" | "ERROR" | "SUCCESS";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  read: boolean;
  createdAt: Date;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch notifications
  const { data: notifications = [], refetch } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  const { data: unreadData } = trpc.notifications.unread.useQuery(undefined, {
    refetchInterval: 5000,
  });
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });
  
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });
  
  const unreadCount = unreadData?.length || 0;
  
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate({ id });
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  const getSeverityIcon = (severity: NotificationSeverity) => {
    switch (severity) {
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "ERROR":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getSeverityColor = (severity: NotificationSeverity) => {
    switch (severity) {
      case "SUCCESS":
        return "border-l-green-500 bg-green-500/5";
      case "WARNING":
        return "border-l-yellow-500 bg-yellow-500/5";
      case "ERROR":
        return "border-l-red-500 bg-red-500/5";
      default:
        return "border-l-blue-500 bg-blue-500/5";
    }
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return "Az önce";
  };
  
  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>
      
      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-12 z-50 w-96 rounded-lg border bg-background shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Bildirimler</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} okunmamış</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Tümünü Okundu İşaretle
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Notification List */}
            <ScrollArea className="h-[500px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mb-4 opacity-20" />
                  <p>Henüz bildirim yok</p>
                  <p className="text-sm mt-1">Yeni bildirimler burada görünecek</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 border-l-4 transition-colors cursor-pointer hover:bg-accent/50",
                        getSeverityColor(notification.severity),
                        !notification.read && "bg-accent/30"
                      )}
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getSeverityIcon(notification.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm leading-tight">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
