import { spawn, ChildProcess, execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { processLogLine } from './logKeywordMonitor';

interface BotProcess {
  symbol: string;
  process: ChildProcess | null;
  pid: number;
  startedAt: string;
  status: 'running' | 'stopped' | 'error';
}

// In-memory bot process storage
const botProcesses = new Map<string, BotProcess>();

// Bot status file path
const BOT_STATUS_FILE = path.join(process.cwd(), 'ai_bot', 'bot_status.json');

/**
 * Check if PM2 is managing the bot
 */
function isPM2Bot(symbol: string): { managed: boolean; pid?: number; status?: string } {
  try {
    const pm2Output = execSync('pm2 jlist', { encoding: 'utf-8' });
    const pm2List = JSON.parse(pm2Output);
    
    const tradingBot = pm2List.find((p: any) => p.name === 'trading-bot');
    
    if (tradingBot) {
      return {
        managed: true,
        pid: tradingBot.pid,
        status: tradingBot.pm2_env?.status || 'unknown'
      };
    }
    
    return { managed: false };
  } catch (error) {
    return { managed: false };
  }
}

/**
 * Start a trading bot for a specific symbol using PM2
 */
export async function startBot(symbol: string) {
  try {
    // Check if PM2 is already managing a bot
    const pm2Status = isPM2Bot(symbol);
    
    if (pm2Status.managed && pm2Status.status === 'online') {
      console.log(`[BotControl] Bot ${symbol} already running via PM2 (PID: ${pm2Status.pid})`);
      return {
        success: false,
        message: `Bot for ${symbol} is already running`,
        pid: pm2Status.pid,
      };
    }
    
    // Check for any running python bot processes
    try {
      const psOutput = execSync(`ps aux | grep "python.*main_autonomous.py" | grep -v grep`, { encoding: 'utf-8' });
      const lines = psOutput.trim().split('\n').filter(l => l.trim());
      
      if (lines.length > 0) {
        const parts = lines[0].trim().split(/\s+/);
        const existingPid = parseInt(parts[1]);
        console.log(`[BotControl] Found existing bot process (PID: ${existingPid})`);
        
        return {
          success: false,
          message: `Bot is already running (PID: ${existingPid}). Stop it first.`,
          pid: existingPid,
        };
      }
    } catch (e) {
      // No running processes - safe to start
    }

    console.log(`[BotControl] Starting bot ${symbol} via PM2`);
    
    // Start bot using PM2
    const botDir = path.join(process.cwd(), 'ai_bot');
    
    // Check if .env file exists in bot directory
    const envFile = path.join(botDir, '.env');
    try {
      await fs.access(envFile);
    } catch {
      return {
        success: false,
        message: 'Bot .env file not found. Please configure API keys first.',
      };
    }
    
    // Start with PM2
    try {
      execSync(`pm2 start main_autonomous.py --name trading-bot --interpreter python3 --cwd "${botDir}" -- --symbol ${symbol}`, {
        encoding: 'utf-8',
        cwd: botDir,
      });
    } catch (startError: any) {
      // PM2 might already have a stopped process, try restart
      try {
        execSync('pm2 restart trading-bot', { encoding: 'utf-8' });
      } catch (restartError) {
        throw startError;
      }
    }
    
    // Wait a moment for PM2 to start the process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the new PID
    const newStatus = isPM2Bot(symbol);
    
    if (newStatus.managed && newStatus.status === 'online') {
      const startedAt = new Date().toISOString();
      
      // Store in memory for tracking
      botProcesses.set(symbol, {
        symbol,
        process: null,
        pid: newStatus.pid!,
        startedAt,
        status: 'running',
      });
      
      await saveBotStatus();
      
      return {
        success: true,
        message: `Bot started for ${symbol}`,
        pid: newStatus.pid,
        startedAt,
      };
    } else {
      return {
        success: false,
        message: 'Bot failed to start. Check PM2 logs.',
      };
    }
  } catch (error) {
    console.error(`Failed to start bot for ${symbol}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Stop a trading bot for a specific symbol
 */
export async function stopBot(symbol: string) {
  try {
    console.log(`[BotControl] Stopping bot ${symbol}`);
    
    // First try PM2
    const pm2Status = isPM2Bot(symbol);
    
    if (pm2Status.managed) {
      console.log(`[BotControl] Stopping PM2 managed bot (PID: ${pm2Status.pid})`);
      
      try {
        execSync('pm2 stop trading-bot', { encoding: 'utf-8' });
        botProcesses.delete(symbol);
        await saveBotStatus();
        
        return {
          success: true,
          message: `Bot stopped for ${symbol}`,
        };
      } catch (e) {
        console.error('[BotControl] PM2 stop failed:', e);
      }
    }
    
    // Fallback: Kill any python bot processes directly
    try {
      const psOutput = execSync(`ps aux | grep "python.*main_autonomous.py" | grep -v grep`, { encoding: 'utf-8' });
      const lines = psOutput.trim().split('\n').filter(l => l.trim());
      
      if (lines.length > 0) {
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[1]);
          if (pid) {
            console.log(`[BotControl] Killing bot process: ${pid}`);
            execSync(`kill -9 ${pid}`);
          }
        }
        
        botProcesses.delete(symbol);
        await saveBotStatus();
        
        return {
          success: true,
          message: `Bot stopped for ${symbol}`,
        };
      }
    } catch (e) {
      // No processes found
    }
    
    // Also remove from memory tracking
    if (botProcesses.has(symbol)) {
      botProcesses.delete(symbol);
      await saveBotStatus();
    }
    
    return {
      success: true,
      message: `Bot ${symbol} was already stopped`,
    };
  } catch (error) {
    console.error(`Failed to stop bot for ${symbol}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get status of all bots
 */
export async function getBotStatus() {
  const bots: Array<{
    symbol: string;
    pid: number;
    startedAt: string;
    status: 'running' | 'stopped' | 'error';
  }> = [];
  
  // Check PM2 first
  const pm2Status = isPM2Bot('BTCUSDT');
  
  if (pm2Status.managed && pm2Status.status === 'online') {
    // Get uptime from PM2
    let startedAt = new Date().toISOString();
    try {
      const pm2Output = execSync('pm2 jlist', { encoding: 'utf-8' });
      const pm2List = JSON.parse(pm2Output);
      const tradingBot = pm2List.find((p: any) => p.name === 'trading-bot');
      if (tradingBot?.pm2_env?.pm_uptime) {
        startedAt = new Date(tradingBot.pm2_env.pm_uptime).toISOString();
      }
    } catch (e) {}
    
    bots.push({
      symbol: 'BTCUSDT',
      pid: pm2Status.pid!,
      startedAt,
      status: 'running',
    });
    
    // Update memory tracking
    botProcesses.set('BTCUSDT', {
      symbol: 'BTCUSDT',
      process: null,
      pid: pm2Status.pid!,
      startedAt,
      status: 'running',
    });
  } else {
    // Check for any running python processes
    try {
      const psOutput = execSync('ps aux | grep "python.*main_autonomous.py" | grep -v grep', { encoding: 'utf-8' });
      const lines = psOutput.trim().split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        const parts = line.split(/\s+/);
        const pid = parseInt(parts[1]);
        const symbolMatch = line.match(/--symbol\s+(\w+)/);
        const symbol = symbolMatch ? symbolMatch[1] : 'BTCUSDT';
        
        // Get process start time from ps output (column 9 is START time)
        // Format: HH:MM or Mon DD depending on how long ago
        let startedAt: string;
        const existingBot = botProcesses.get(symbol);
        
        // If we already have this bot tracked with same PID, keep the original startedAt
        if (existingBot && existingBot.pid === pid && existingBot.startedAt) {
          startedAt = existingBot.startedAt;
        } else {
          // Try to get actual process start time from /proc
          try {
            const statOutput = execSync(`stat -c %Y /proc/${pid}`, { encoding: 'utf-8' }).trim();
            const startTimestamp = parseInt(statOutput) * 1000;
            startedAt = new Date(startTimestamp).toISOString();
          } catch {
            // Fallback to current time only for new processes
            startedAt = new Date().toISOString();
          }
        }
        
        bots.push({
          symbol,
          pid,
          startedAt,
          status: 'running',
        });
        
        // Update memory tracking only if not already tracked or PID changed
        if (!existingBot || existingBot.pid !== pid) {
          botProcesses.set(symbol, {
            symbol,
            process: null,
            pid,
            startedAt,
            status: 'running',
          });
        }
      }
    } catch (error) {
      // No running processes
    }
  }
  
  // Clear stale entries from memory
  const runningSymbols = new Set(bots.map(b => b.symbol));
  botProcesses.forEach((_, symbol) => {
    if (!runningSymbols.has(symbol)) {
      botProcesses.delete(symbol);
    }
  });

  return {
    bots,
    totalRunning: bots.filter(b => b.status === 'running').length,
  };
}

/**
 * Save bot status to file
 */
async function saveBotStatus() {
  try {
    const status = await getBotStatus();
    await fs.writeFile(BOT_STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Failed to save bot status:', error);
  }
}

/**
 * Load bot status from file (for recovery after restart)
 */
export async function loadBotStatus() {
  try {
    const data = await fs.readFile(BOT_STATUS_FILE, 'utf-8');
    const status = JSON.parse(data);
    console.log('Loaded bot status:', status);
  } catch (error) {
    // File doesn't exist or invalid, ignore
  }
}

/**
 * Get logs for a specific bot
 */
export async function getBotLogs(symbol: string) {
  // Try PM2 logs first
  try {
    const pm2LogPath = `/root/.pm2/logs/trading-bot-out.log`;
    const pm2ErrPath = `/root/.pm2/logs/trading-bot-error.log`;
    
    let logs: string[] = [];
    
    // Read stdout logs
    try {
      const outData = await fs.readFile(pm2LogPath, 'utf-8');
      const outLines = outData.split('\n').filter(line => line.trim());
      logs = logs.concat(outLines.slice(-50));
    } catch (e) {}
    
    // Read stderr logs
    try {
      const errData = await fs.readFile(pm2ErrPath, 'utf-8');
      const errLines = errData.split('\n').filter(line => line.trim());
      logs = logs.concat(errLines.slice(-50).map(l => `[ERROR] ${l}`));
    } catch (e) {}
    
    if (logs.length > 0) {
      // Sort by timestamp if present, otherwise keep order
      const recentLines = logs.slice(-100);
      return {
        logs: recentLines,
        totalLines: logs.length,
      };
    }
  } catch (e) {}
  
  // Fallback to local log files
  const logFile = path.join(process.cwd(), 'ai_bot', 'logs', `${symbol}.log`);
  const altLogFile = path.join(process.cwd(), 'ai_bot', 'logs', `bot_${symbol}.log`);
  
  try {
    let data: string;
    try {
      data = await fs.readFile(logFile, 'utf-8');
    } catch {
      data = await fs.readFile(altLogFile, 'utf-8');
    }
    
    const lines = data.split('\n').filter(line => line.trim());
    const recentLines = lines.slice(-100);
    
    return {
      logs: recentLines,
      totalLines: lines.length,
    };
  } catch (error) {
    return {
      logs: [],
      totalLines: 0,
    };
  }
}
