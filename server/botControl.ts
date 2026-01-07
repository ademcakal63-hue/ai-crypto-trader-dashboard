import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { processLogLine } from './logKeywordMonitor';

interface BotProcess {
  symbol: string;
  process: ChildProcess;
  pid: number;
  startedAt: string;
  status: 'running' | 'stopped' | 'error';
}

// In-memory bot process storage
const botProcesses = new Map<string, BotProcess>();

// Bot status file path
const BOT_STATUS_FILE = path.join(process.cwd(), 'ai_bot', 'bot_status.json');

/**
 * Start a trading bot for a specific symbol
 */
export async function startBot(symbol: string) {
  try {
    // CRITICAL: Check if bot is already running in memory
    if (botProcesses.has(symbol)) {
      const existing = botProcesses.get(symbol);
      if (existing?.status === 'running') {
        console.log(`[BotControl] Bot ${symbol} already in memory (PID: ${existing.pid})`);
        return {
          success: false,
          message: `Bot for ${symbol} is already running`,
          pid: existing.pid,
        };
      }
    }
    
    // CRITICAL: Also check for orphan processes (server restart scenario)
    try {
      const { execSync } = await import('child_process');
      const psOutput = execSync(`ps aux | grep "python.*main_autonomous.py" | grep -v grep`, { encoding: 'utf-8' });
      const lines = psOutput.trim().split('\n').filter(l => l.trim());
      
      if (lines.length > 0) {
        // Found running bot process - don't start another one
        const parts = lines[0].trim().split(/\s+/);
        const existingPid = parseInt(parts[1]);
        console.log(`[BotControl] Found existing bot process (PID: ${existingPid}) - preventing duplicate`);
        
        // Add to our tracking
        botProcesses.set(symbol, {
          symbol,
          process: null as any,
          pid: existingPid,
          startedAt: new Date().toISOString(),
          status: 'running',
        });
        
        return {
          success: false,
          message: `Bot is already running (PID: ${existingPid}). Stop it first before starting a new one.`,
          pid: existingPid,
        };
      }
    } catch (e) {
      // No running processes found - safe to start
      console.log(`[BotControl] No existing bot processes found - safe to start`);
    }

    // Use clean wrapper script to completely isolate from Python 3.13
    const wrapperScript = '/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/run_bot.sh';
    
    console.log(`[BotControl] Starting bot ${symbol}`);
    console.log(`[BotControl] Wrapper script: ${wrapperScript}`);
    
    // Use wrapper script with minimal environment (script handles venv activation)
    const botProcess = spawn(wrapperScript, [
      '--symbol',
      symbol,
    ], {
      cwd: '/home/ubuntu/ai-crypto-trader-dashboard/ai_bot',
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Wrapper script will unset these, but start clean
        PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      },
    });

    if (!botProcess.pid) {
      throw new Error('Failed to start bot process');
    }

    // Store process info
    const botInfo: BotProcess = {
      symbol,
      process: botProcess,
      pid: botProcess.pid,
      startedAt: new Date().toISOString(),
      status: 'running',
    };

    botProcesses.set(symbol, botInfo);

    // Handle process events
    botProcess.on('error', (error) => {
      console.error(`Bot ${symbol} error:`, error);
      const bot = botProcesses.get(symbol);
      if (bot) {
        bot.status = 'error';
      }
    });

    botProcess.on('exit', (code) => {
      console.log(`Bot ${symbol} exited with code ${code}`);
      botProcesses.delete(symbol);
    });

    // Log stdout/stderr
    const logDir = path.join(process.cwd(), 'ai_bot', 'logs');
    await fs.mkdir(logDir, { recursive: true });
    const logFile = path.join(logDir, `${symbol}.log`);
    
    botProcess.stdout?.on('data', (data) => {
      const rawLine = data.toString().trim();
      const logLine = `[${new Date().toISOString()}] [INFO] ${rawLine}\n`;
      console.log(`[${symbol}] ${rawLine}`);
      fs.appendFile(logFile, logLine).catch(console.error);
      
      // Check for keywords and send notifications
      processLogLine(symbol, rawLine).catch(console.error);
    });

    botProcess.stderr?.on('data', (data) => {
      const rawLine = data.toString().trim();
      const logLine = `[${new Date().toISOString()}] [ERROR] ${rawLine}\n`;
      console.error(`[${symbol}] ERROR: ${rawLine}`);
      fs.appendFile(logFile, logLine).catch(console.error);
      
      // Check for keywords and send notifications
      processLogLine(symbol, `ERROR: ${rawLine}`).catch(console.error);
    });

    // Save status to file
    await saveBotStatus();

    return {
      success: true,
      message: `Bot started for ${symbol}`,
      pid: botProcess.pid,
      startedAt: botInfo.startedAt,
    };
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
    const botInfo = botProcesses.get(symbol);

    if (!botInfo) {
      // Try to find and kill orphan processes
      try {
        const { execSync } = await import('child_process');
        const psOutput = execSync(`ps aux | grep "python.*main_autonomous.py" | grep -v grep`, { encoding: 'utf-8' });
        const lines = psOutput.trim().split('\n').filter(l => l.trim());
        
        if (lines.length > 0) {
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[1]);
            if (pid) {
              console.log(`[BotControl] Killing orphan bot process: ${pid}`);
              execSync(`kill -9 ${pid}`);
            }
          }
          return {
            success: true,
            message: `Orphan bot process killed for ${symbol}`,
          };
        }
      } catch (e) {
        // No orphan processes found
      }
      
      return {
        success: false,
        message: `No running bot found for ${symbol}`,
      };
    }

    console.log(`[BotControl] Stopping bot ${symbol} (PID: ${botInfo.pid})`);
    
    // Send SIGTERM for graceful shutdown
    try {
      botInfo.process.kill('SIGTERM');
      console.log(`[BotControl] Sent SIGTERM to ${botInfo.pid}`);
    } catch (e) {
      console.log(`[BotControl] SIGTERM failed, trying SIGKILL`);
      botInfo.process.kill('SIGKILL');
    }

    // Wait for graceful shutdown, then force kill if needed
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (botProcesses.has(symbol)) {
          console.log(`[BotControl] Bot ${symbol} didn't stop gracefully, force killing...`);
          try {
            botInfo.process.kill('SIGKILL');
          } catch (e) {
            console.error(`[BotControl] Force kill failed:`, e);
          }
          botProcesses.delete(symbol);
        }
        resolve();
      }, 8000);  // 8 seconds for graceful shutdown
      
      botInfo.process.on('exit', () => {
        clearTimeout(timeout);
        botProcesses.delete(symbol);
        console.log(`[BotControl] Bot ${symbol} exited cleanly`);
        resolve();
      });
    });

    // Save status to file
    await saveBotStatus();

    return {
      success: true,
      message: `Bot stopped for ${symbol}`,
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
  // First check if there are running bot processes not in our Map
  // This handles server restart scenarios
  try {
    const { execSync } = await import('child_process');
    const psOutput = execSync('ps aux | grep "python.*main_autonomous.py" | grep -v grep', { encoding: 'utf-8' });
    const lines = psOutput.trim().split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      const parts = line.split(/\s+/);
      const pid = parseInt(parts[1]);
      const symbolMatch = line.match(/--symbol\s+(\w+)/);
      const symbol = symbolMatch ? symbolMatch[1] : 'BTCUSDT';
      
      // If this process is not in our Map, add it
      if (!botProcesses.has(symbol)) {
        console.log(`[BotControl] Found orphan bot process: ${symbol} (PID: ${pid})`);
        botProcesses.set(symbol, {
          symbol,
          process: null as any, // We don't have the process handle
          pid,
          startedAt: new Date().toISOString(),
          status: 'running',
        });
      }
    }
  } catch (error) {
    // No running processes found, that's okay
  }
  
  const bots = Array.from(botProcesses.values()).map(bot => ({
    symbol: bot.symbol,
    pid: bot.pid,
    startedAt: bot.startedAt,
    status: bot.status,
  }));

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
    // Note: We don't automatically restart bots after server restart
    // This is intentional to prevent unexpected behavior
  } catch (error) {
    // File doesn't exist or invalid, ignore
  }
}

/**
 * Get logs for a specific bot
 */
export async function getBotLogs(symbol: string) {
  // Try both log file formats (Dashboard bot uses SYMBOL.log, manual uses bot_SYMBOL.log)
  const logFile = path.join(process.cwd(), 'ai_bot', 'logs', `${symbol}.log`);
  const altLogFile = path.join(process.cwd(), 'ai_bot', 'logs', `bot_${symbol}.log`);
  
  try {
    let data: string;
    try {
      // Try primary log file first (SYMBOL.log)
      data = await fs.readFile(logFile, 'utf-8');
    } catch {
      // Fallback to alternative log file (bot_SYMBOL.log)
      data = await fs.readFile(altLogFile, 'utf-8');
    }
    
    const lines = data.split('\n').filter(line => line.trim());
    
    // Return last 100 lines
    const recentLines = lines.slice(-100);
    
    return {
      logs: recentLines,
      totalLines: lines.length,
    };
  } catch (error) {
    // Log file doesn't exist yet or can't be read
    return {
      logs: [],
      totalLines: 0,
    };
  }
}
