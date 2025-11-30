import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Trash2, Maximize2 } from "lucide-react";
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
      refetchInterval: isRunning ? 2000 : false, // Refresh every 2 seconds when running
    }
  );

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClear = () => {
    // This would call a clear logs API
    refetch();
  };

  const getLogLevelColor = (line: string) => {
    if (line.includes('ERROR') || line.includes('FAILED')) {
      return 'text-red-400';
    }
    if (line.includes('WARNING') || line.includes('WARN')) {
      return 'text-yellow-400';
    }
    if (line.includes('SUCCESS') || line.includes('COMPLETED')) {
      return 'text-green-400';
    }
    if (line.includes('INFO')) {
      return 'text-blue-400';
    }
    return 'text-muted-foreground';
  };

  const logLines = logs?.logs || [];
  const hasLogs = logLines.length > 0;

  return (
    <Card className={cn(isExpanded && "fixed inset-4 z-50")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              {symbol} Logs
            </CardTitle>
            <CardDescription>
              {isRunning ? (
                <Badge variant="default" className="bg-green-500 mt-1">
                  Live
                </Badge>
              ) : (
                <Badge variant="secondary" className="mt-1">
                  Stopped
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              disabled={!hasLogs}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea
          ref={scrollRef}
          className={cn(
            "rounded-lg bg-black/90 p-4 font-mono text-sm",
            isExpanded ? "h-[calc(100vh-200px)]" : "h-[300px]"
          )}
        >
          {!hasLogs && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {isRunning ? (
                <p>Waiting for logs...</p>
              ) : (
                <p>Bot is not running. Start the bot to see logs.</p>
              )}
            </div>
          )}

          {hasLogs && (
            <div className="space-y-1">
              {logLines.map((line: string, index: number) => (
                <div
                  key={index}
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    getLogLevelColor(line)
                  )}
                >
                  {line}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{logLines.length} lines</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
