import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Terminal, 
  Trash2, 
  Maximize2, 
  Minimize2,
  Circle,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Zap,
  Clock
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BotLogViewerProps {
  symbol: string;
  isRunning: boolean;
}

export function BotLogViewer({ symbol, isRunning }: BotLogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: logs, refetch } = trpc.bot.logs.useQuery(
    { symbol },
    {
      enabled: isRunning,
      refetchInterval: isRunning ? 2000 : false,
    }
  );

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClear = () => {
    refetch();
  };

  const getLogIcon = (line: string) => {
    if (line.includes('ERROR') || line.includes('FAILED') || line.includes('❌')) {
      return <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
    }
    if (line.includes('WARNING') || line.includes('WARN') || line.includes('⚠')) {
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    }
    if (line.includes('SUCCESS') || line.includes('COMPLETED') || line.includes('✅')) {
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    }
    if (line.includes('INFO') || line.includes('📊') || line.includes('🔍')) {
      return <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
    }
    if (line.includes('🔥') || line.includes('⚡') || line.includes('🚀')) {
      return <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    }
    return <Circle className="h-2 w-2 text-slate-500 shrink-0" />;
  };

  const getLogLevelColor = (line: string) => {
    if (line.includes('ERROR') || line.includes('FAILED') || line.includes('❌')) {
      return 'text-red-400';
    }
    if (line.includes('WARNING') || line.includes('WARN') || line.includes('⚠')) {
      return 'text-amber-400';
    }
    if (line.includes('SUCCESS') || line.includes('COMPLETED') || line.includes('✅')) {
      return 'text-emerald-400';
    }
    if (line.includes('INFO') || line.includes('📊')) {
      return 'text-blue-400';
    }
    if (line.includes('🔥') || line.includes('⚡')) {
      return 'text-amber-300';
    }
    return 'text-slate-400';
  };

  const getLogBgColor = (line: string) => {
    if (line.includes('ERROR') || line.includes('FAILED') || line.includes('❌')) {
      return 'bg-red-500/5 border-l-2 border-red-500/50';
    }
    if (line.includes('WARNING') || line.includes('WARN') || line.includes('⚠')) {
      return 'bg-amber-500/5 border-l-2 border-amber-500/50';
    }
    if (line.includes('SUCCESS') || line.includes('COMPLETED') || line.includes('✅')) {
      return 'bg-emerald-500/5 border-l-2 border-emerald-500/50';
    }
    return '';
  };

  const formatLogLine = (line: string) => {
    // Extract timestamp if present
    const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    if (timestampMatch) {
      const timestamp = new Date(timestampMatch[1]).toLocaleTimeString('tr-TR');
      const restOfLine = line.replace(timestampMatch[0], '').replace(']', '');
      return { timestamp, content: restOfLine.trim() };
    }
    return { timestamp: null, content: line };
  };

  const logLines = logs?.logs || [];
  const hasLogs = logLines.length > 0;

  return (
    <Card className={cn(
      "border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur overflow-hidden transition-all duration-300",
      isExpanded && "fixed inset-4 z-50 m-0"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl border",
              isRunning 
                ? "bg-emerald-500/10 border-emerald-500/20" 
                : "bg-slate-500/10 border-slate-500/20"
            )}>
              <Terminal className={cn(
                "h-5 w-5",
                isRunning ? "text-emerald-400" : "text-slate-400"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {symbol} Logs
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {isRunning ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 border-0">
                    Stopped
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              disabled={!hasLogs}
              className="hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Terminal Window */}
        <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-950">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs text-slate-500 ml-2 font-mono">bot@{symbol.toLowerCase()}</span>
            </div>
            <span className="text-xs text-slate-600 font-mono">{logLines.length} lines</span>
          </div>
          
          {/* Terminal Content */}
          <ScrollArea
            ref={scrollRef}
            className={cn(
              "p-4 font-mono text-sm",
              isExpanded ? "h-[calc(100vh-280px)]" : "h-[320px]"
            )}
          >
            {!hasLogs && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                <Terminal className="h-12 w-12 opacity-20" />
                {isRunning ? (
                  <>
                    <p className="text-sm">Waiting for logs...</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs">Bot is running</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm">Bot is not running</p>
                    <p className="text-xs text-slate-600">Start the bot to see logs.</p>
                  </>
                )}
              </div>
            )}

            {hasLogs && (
              <div className="space-y-1">
                {logLines.map((line: string, index: number) => {
                  const { timestamp, content } = formatLogLine(line);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-2 py-1 px-2 rounded-md transition-colors hover:bg-slate-800/50",
                        getLogBgColor(line)
                      )}
                    >
                      {getLogIcon(line)}
                      {timestamp && (
                        <span className="text-slate-600 text-xs shrink-0 font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timestamp}
                        </span>
                      )}
                      <span className={cn(
                        "whitespace-pre-wrap break-all flex-1",
                        getLogLevelColor(line)
                      )}>
                        {content}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Circle className="h-2 w-2 text-emerald-500" /> Success
            </span>
            <span className="flex items-center gap-1">
              <Circle className="h-2 w-2 text-amber-500" /> Warning
            </span>
            <span className="flex items-center gap-1">
              <Circle className="h-2 w-2 text-red-500" /> Error
            </span>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-400 hover:text-slate-300 transition-colors">
            <Checkbox
              checked={autoScroll}
              onCheckedChange={(checked) => setAutoScroll(checked as boolean)}
              className="border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            Auto-scroll
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
