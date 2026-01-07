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
import { APP_LOGO, APP_TITLE } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Settings, 
  History,
  Brain,
  Zap,
} from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation, Redirect } from "wouter";
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

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!user) {
    return <Redirect to="/login" />;
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
          className="border-r border-amber-900/30 bg-neutral-950/50 backdrop-blur-xl"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-amber-900/30">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-9 w-9 shrink-0 group">
                  <div className="absolute inset-0 bg-amber-600/20 rounded-lg blur-sm" />
                  <img
                    src={APP_LOGO}
                    className="relative h-9 w-9 rounded-lg object-cover ring-1 ring-amber-900/30"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-neutral-800 rounded-lg ring-1 ring-amber-900/30 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                  >
                    <PanelLeft className="h-4 w-4 text-neutral-300" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-600/20 rounded-lg blur-sm" />
                      <img
                        src={APP_LOGO}
                        className="relative h-9 w-9 rounded-lg object-cover ring-1 ring-amber-900/30 shrink-0"
                        alt="Logo"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold tracking-tight truncate text-white">
                        {APP_TITLE}
                      </span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                        AI Trading Bot
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-neutral-800 rounded-lg transition-colors focus:outline-none shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-neutral-400" />
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
                          ? "bg-amber-600/10 text-amber-500 border border-amber-600/20" 
                          : "hover:bg-neutral-800/50 text-neutral-400 hover:text-white"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4",
                          isActive ? "text-amber-500" : ""
                        )}
                      />
                      <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                      {item.badge && (
                        <Badge className="ml-auto bg-amber-600/20 text-amber-500 text-[10px] px-1.5">
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="mt-auto border-t border-amber-900/30">
            <div className="flex items-center gap-2 px-2 py-3">
              <div className="flex-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-neutral-800/50 transition-colors w-full group-data-[collapsible=icon]:justify-center">
                      <div className="relative">
                        <Avatar className="h-9 w-9 shrink-0 ring-2 ring-amber-900/30">
                          <AvatarFallback className="text-sm bg-gradient-to-br from-amber-600/20 to-orange-500/20 text-white">
                            {user?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "A"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium truncate w-full text-white">
                          {user?.name || "Admin"}
                        </span>
                        <span className="text-xs text-neutral-500 truncate w-full">
                          {user?.email || ""}
                        </span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-neutral-950 border-amber-900/20">
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
            "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-amber-600/30 transition-colors",
            isCollapsed && "hidden"
          )}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-gradient-to-br from-black via-neutral-950 to-black">
        {isMobile && (
          <div className="flex border-b border-amber-900/30 h-14 items-center justify-between bg-neutral-950/80 px-4 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-neutral-800/50 hover:bg-neutral-800" />
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
