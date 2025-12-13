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
    // Check if bot is already running
    if (botProcesses.has(symbol)) {
      const existing = botProcesses.get(symbol);
      if (existing?.status === 'running') {
        return {
          success: false,
          message: `Bot for ${symbol} is already running`,
          pid: existing.pid,
        };
      }
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
      return {
        success: false,
        message: `No running bot found for ${symbol}`,
      };
    }

    // Send SIGTERM for graceful shutdown
    botInfo.process.kill('SIGTERM');

    // Wait a bit, then force kill if still running
    setTimeout(() => {
      if (botProcesses.has(symbol)) {
        botInfo.process.kill('SIGKILL');
        botProcesses.delete(symbol);
      }
    }, 5000);

    botProcesses.delete(symbol);

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
  const logFile = path.join(process.cwd(), 'ai_bot', 'logs', `${symbol}.log`);
  
  try {
    const data = await fs.readFile(logFile, 'utf-8');
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
