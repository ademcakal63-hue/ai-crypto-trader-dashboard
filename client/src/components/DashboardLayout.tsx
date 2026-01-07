import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Settings, 
  History,
  Brain,
  Zap,
  TrendingUp
} from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", badge: null },
  { icon: History, label: "Trade Geçmişi", path: "/trade-history", badge: null },
  { icon: Settings, label: "Ayarlar", path: "/settings", badge: null },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
              <div className="relative p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              </div>
            </div>
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight text-white">{APP_TITLE}</h1>
              </div>
              <p className="text-sm text-slate-400">
                AI destekli kripto trading bot'unuza erişmek için giriş yapın
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            <Zap className="h-4 w-4 mr-2" />
            Giriş Yap
          </Button>
          
          <p className="text-xs text-slate-500 text-center">
            Manus hesabınızla güvenli giriş yapın
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-slate-800/50 bg-slate-900/50 backdrop-blur-xl"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-slate-800/50">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-9 w-9 shrink-0 group">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
                  <img
                    src={APP_LOGO}
                    className="relative h-9 w-9 rounded-lg object-cover ring-1 ring-slate-700/50"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-lg ring-1 ring-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                  >
                    <PanelLeft className="h-4 w-4 text-slate-300" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
                      <img
                        src={APP_LOGO}
                        className="relative h-9 w-9 rounded-lg object-cover ring-1 ring-slate-700/50 shrink-0"
                        alt="Logo"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold tracking-tight truncate text-white">
                        {APP_TITLE}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        AI Trading Bot
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-slate-800 rounded-lg transition-colors focus:outline-none shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-slate-400" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-4">
            <SidebarMenu className="px-2 space-y-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={cn(
                        "h-11 transition-all font-normal rounded-xl",
                        isActive 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4",
                          isActive ? "text-primary" : ""
                        )}
                      />
                      <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                      {item.badge && (
                        <Badge className="ml-auto bg-primary/20 text-primary text-[10px] px-1.5">
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="mt-auto border-t border-slate-800/50">
            <div className="flex items-center gap-2 px-2 py-3">
              <div className="flex-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-slate-800/50 transition-colors w-full group-data-[collapsible=icon]:justify-center">
                      <div className="relative">
                        <Avatar className="h-9 w-9 shrink-0 ring-2 ring-slate-700/50">
                          <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-blue-500/20 text-white">
                            {user?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                      </div>
                      <div className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium truncate w-full text-white">
                          {user?.name || "User"}
                        </span>
                        <span className="text-xs text-slate-500 truncate w-full">
                          {user?.email || ""}
                        </span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Çıkış Yap</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <NotificationDropdown />
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={cn(
            "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors",
            isCollapsed && "hidden"
          )}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {isMobile && (
          <div className="flex border-b border-slate-800/50 h-14 items-center justify-between bg-slate-900/80 px-4 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-slate-800/50 hover:bg-slate-800" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">
                  {activeMenuItem?.label ?? APP_TITLE}
                </span>
              </div>
            </div>
            <NotificationDropdown />
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
