/**
 * Bot Manager
 * Manages Python trading bot process lifecycle
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';

class BotManager {
  private botProcess: ChildProcess | null = null;
  private botSymbol: string = 'BTCUSDT';
  private isRunning: boolean = false;

  /**
   * Start the trading bot
   */
  async start(): Promise<{ success: boolean; message: string }> {
    if (this.isRunning && this.botProcess) {
      return { success: false, message: 'Bot is already running' };
    }

    try {
      const botPath = path.join(process.cwd(), 'ai_bot', 'main.py');
      const pythonPath = path.join(process.cwd(), 'ai_bot', 'venv', 'bin', 'python');

      console.log(`🤖 Starting bot: ${pythonPath} ${botPath} ${this.botSymbol}`);

      // Spawn Python process
      const dashboardUrl = `http://localhost:${process.env.PORT || 3000}`;
      this.botProcess = spawn(pythonPath, [botPath, '--symbol', this.botSymbol], {
        cwd: path.join(process.cwd(), 'ai_bot'),
        env: { 
          ...process.env,
          DASHBOARD_URL: dashboardUrl,
        },
        detached: false,
      });

      // Handle stdout
      this.botProcess.stdout?.on('data', (data) => {
        console.log(`[BOT] ${data.toString().trim()}`);
      });

      // Handle stderr
      this.botProcess.stderr?.on('data', (data) => {
        console.error(`[BOT ERROR] ${data.toString().trim()}`);
      });

      // Handle process exit
      this.botProcess.on('exit', (code, signal) => {
        console.log(`🛑 Bot process exited: code=${code}, signal=${signal}`);
        this.isRunning = false;
        this.botProcess = null;
      });

      // Handle process error
      this.botProcess.on('error', (error) => {
        console.error(`❌ Bot process error:`, error);
        this.isRunning = false;
        this.botProcess = null;
      });

      this.isRunning = true;

      return {
        success: true,
        message: `Bot started successfully (PID: ${this.botProcess.pid})`,
      };
    } catch (error: any) {
      console.error('❌ Failed to start bot:', error);
      return {
        success: false,
        message: `Failed to start bot: ${error.message}`,
      };
    }
  }

  /**
   * Stop the trading bot
   */
  async stop(): Promise<{ success: boolean; message: string }> {
    if (!this.isRunning || !this.botProcess) {
      return { success: false, message: 'Bot is not running' };
    }

    try {
      console.log(`🛑 Stopping bot (PID: ${this.botProcess.pid})...`);

      // Kill the process
      this.botProcess.kill('SIGTERM');

      // Wait for process to exit (with timeout)
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (this.botProcess) {
            console.log('⚠️ Bot did not stop gracefully, forcing kill...');
            this.botProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        this.botProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.isRunning = false;
      this.botProcess = null;

      return {
        success: true,
        message: 'Bot stopped successfully',
      };
    } catch (error: any) {
      console.error('❌ Failed to stop bot:', error);
      return {
        success: false,
        message: `Failed to stop bot: ${error.message}`,
      };
    }
  }

  /**
   * Get bot status
   */
  getStatus(): {
    isRunning: boolean;
    pid: number | undefined;
    symbol: string;
  } {
    return {
      isRunning: this.isRunning,
      pid: this.botProcess?.pid,
      symbol: this.botSymbol,
    };
  }

  /**
   * Restart the bot
   */
  async restart(): Promise<{ success: boolean; message: string }> {
    console.log('🔄 Restarting bot...');

    // Stop if running
    if (this.isRunning) {
      const stopResult = await this.stop();
      if (!stopResult.success) {
        return stopResult;
      }

      // Wait a bit before restarting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Start again
    return await this.start();
  }
}

// Singleton instance
export const botManager = new BotManager();
