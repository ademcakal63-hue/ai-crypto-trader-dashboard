import { spawn, ChildProcess, execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
// Log keyword monitoring is handled separately

interface BotProcess {
  symbol: string;
  process: ChildProcess | null;
  pid: number;
  startedAt: string;
  status: 'running' | 'stopped' | 'error';
}

// In-memory bot process storage
const botProcesses = new Map<string, BotProcess>();

// Bot status file path - stores startedAt persistently
const BOT_STATUS_FILE = path.join(process.cwd(), 'ai_bot', 'bot_status.json');

// Bot log file path
const BOT_LOG_FILE = path.join(process.cwd(), 'ai_bot', 'bot.log');

/**
 * Read bot status from file
 */
async function readBotStatusFile(): Promise<{ pid?: number; startedAt?: string } | null> {
  try {
    const data = await fs.readFile(BOT_STATUS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Write bot status to file
 */
async function writeBotStatusFile(status: { pid: number; startedAt: string }) {
  try {
    await fs.writeFile(BOT_STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Failed to write bot status file:', error);
  }
}

/**
 * Check if a process with given PID is running
 */
function isProcessRunning(pid: number): boolean {
  try {
    execSync(`ps -p ${pid}`, { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Find running bot process
 */
function findBotProcess(): { pid: number; symbol: string } | null {
  try {
    const psOutput = execSync('ps aux | grep "python.*main_autonomous.py" | grep -v grep', { encoding: 'utf-8' });
    const lines = psOutput.trim().split('\n').filter(l => l.trim());
    
    if (lines.length > 0) {
      const parts = lines[0].split(/\s+/);
      const pid = parseInt(parts[1]);
      const symbolMatch = lines[0].match(/--symbol\s+(\w+)/);
      const symbol = symbolMatch ? symbolMatch[1] : 'BTCUSDT';
      return { pid, symbol };
    }
  } catch {
    // No process found
  }
  return null;
}

/**
 * Start a trading bot for a specific symbol
 */
export async function startBot(symbol: string) {
  try {
    // Check if bot is already running
    const existingBot = findBotProcess();
    if (existingBot) {
      return {
        success: false,
        message: `Bot is already running (PID: ${existingBot.pid}). Stop it first.`,
        pid: existingBot.pid,
      };
    }

    console.log(`[BotControl] Starting bot ${symbol}`);
    
    const botDir = path.join(process.cwd(), 'ai_bot');
    
    // Check if .env file exists
    const envFile = path.join(botDir, '.env');
    try {
      await fs.access(envFile);
    } catch {
      return {
        success: false,
        message: 'Bot .env file not found. Please configure API keys first.',
      };
    }
    
    // Start bot using nohup
    const startedAt = new Date().toISOString();
    
    try {
      execSync(
        `cd "${botDir}" && nohup python3 main_autonomous.py --symbol ${symbol} > bot.log 2>&1 &`,
        { encoding: 'utf-8', shell: '/bin/bash' }
      );
    } catch (error) {
      console.error('[BotControl] Failed to start bot:', error);
      return {
        success: false,
        message: 'Failed to start bot process',
      };
    }
    
    // Wait for process to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify bot started
    const newBot = findBotProcess();
    if (newBot) {
      // Save status to file for persistence
      await writeBotStatusFile({ pid: newBot.pid, startedAt });
      
      // Update memory tracking
      botProcesses.set(symbol, {
        symbol,
        process: null,
        pid: newBot.pid,
        startedAt,
        status: 'running',
      });
      
      return {
        success: true,
        message: `Bot started for ${symbol}`,
        pid: newBot.pid,
        startedAt,
      };
    } else {
      return {
        success: false,
        message: 'Bot failed to start. Check logs for errors.',
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
    
    // Find running bot process
    const botProcess = findBotProcess();
    
    if (botProcess) {
      console.log(`[BotControl] Found bot process PID: ${botProcess.pid}`);
      
      // Try graceful kill first (SIGTERM)
      try {
        execSync(`kill ${botProcess.pid}`, { encoding: 'utf-8' });
        console.log(`[BotControl] Sent SIGTERM to ${botProcess.pid}`);
      } catch (e) {
        console.log(`[BotControl] SIGTERM failed, trying SIGKILL`);
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if still running, force kill if needed
      if (isProcessRunning(botProcess.pid)) {
        try {
          execSync(`kill -9 ${botProcess.pid}`, { encoding: 'utf-8' });
          console.log(`[BotControl] Sent SIGKILL to ${botProcess.pid}`);
        } catch (e) {
          console.log(`[BotControl] SIGKILL failed`);
        }
      }
      
      // Wait and verify
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isProcessRunning(botProcess.pid)) {
        // Clear status file
        try {
          await fs.unlink(BOT_STATUS_FILE);
        } catch {}
        
        // Clear memory tracking
        botProcesses.delete(symbol);
        
        return {
          success: true,
          message: `Bot stopped for ${symbol}`,
        };
      } else {
        return {
          success: false,
          message: `Failed to stop bot (PID: ${botProcess.pid})`,
        };
      }
    }
    
    // No process found
    botProcesses.delete(symbol);
    try {
      await fs.unlink(BOT_STATUS_FILE);
    } catch {}
    
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
  
  // Find running bot process
  const botProcess = findBotProcess();
  
  if (botProcess) {
    // Get startedAt from file or memory
    let startedAt: string;
    
    // First check memory
    const memoryBot = botProcesses.get(botProcess.symbol);
    if (memoryBot && memoryBot.pid === botProcess.pid && memoryBot.startedAt) {
      startedAt = memoryBot.startedAt;
    } else {
      // Check file
      const fileStatus = await readBotStatusFile();
      if (fileStatus && fileStatus.pid === botProcess.pid && fileStatus.startedAt) {
        startedAt = fileStatus.startedAt;
      } else {
        // New process, set current time and save
        startedAt = new Date().toISOString();
        await writeBotStatusFile({ pid: botProcess.pid, startedAt });
      }
    }
    
    bots.push({
      symbol: botProcess.symbol,
      pid: botProcess.pid,
      startedAt,
      status: 'running',
    });
    
    // Update memory tracking
    botProcesses.set(botProcess.symbol, {
      symbol: botProcess.symbol,
      process: null,
      pid: botProcess.pid,
      startedAt,
      status: 'running',
    });
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
 * Save bot status to file (legacy compatibility)
 */
async function saveBotStatus() {
  // This is now handled by writeBotStatusFile
}

/**
 * Load bot status from file (for recovery after restart)
 */
export async function loadBotStatus() {
  const fileStatus = await readBotStatusFile();
  if (fileStatus) {
    console.log('Loaded bot status from file:', fileStatus);
  }
}

/**
 * Get logs for a specific bot
 */
export async function getBotLogs(symbol: string) {
  const logPaths = [
    // Primary: bot.log in ai_bot directory
    path.join(process.cwd(), 'ai_bot', 'bot.log'),
    // Alternative paths
    path.join(process.cwd(), 'ai_bot', 'logs', `${symbol}.log`),
    path.join(process.cwd(), 'ai_bot', 'logs', `bot_${symbol}.log`),
    // PM2 logs
    `/root/.pm2/logs/trading-bot-out.log`,
  ];
  
  for (const logPath of logPaths) {
    try {
      const data = await fs.readFile(logPath, 'utf-8');
      const lines = data.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        const recentLines = lines.slice(-100);
        
        // Return raw lines - processLogLine is async and for notifications
        // Just return the lines as-is for display
        const processedLines = recentLines;
        
        return {
          logs: processedLines,
          totalLines: lines.length,
          source: logPath,
        };
      }
    } catch {
      // Try next path
    }
  }
  
  return {
    logs: [],
    totalLines: 0,
    source: null,
  };
}
