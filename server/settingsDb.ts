import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { botSettings, type InsertBotSettings } from "../drizzle/schema";
import * as fs from 'fs';
import * as path from 'path';

// File-based fallback for VPS without database
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

interface FileSettings {
  id: number;
  binanceApiKey: string | null;
  binanceApiSecret: string | null;
  openaiApiKey: string | null;
  capitalLimit: string | null;
  useAllBalance: boolean;
  compoundEnabled: boolean;
  dailyLossLimitPercent: string;
  riskPerTradePercent: string;
  maxDailyTrades: number;
  isConnected: boolean;
  isActive: boolean;
  paperTradingState: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SETTINGS: FileSettings = {
  id: 1,
  binanceApiKey: null,
  binanceApiSecret: null,
  openaiApiKey: null,
  capitalLimit: null,
  useAllBalance: true,
  compoundEnabled: false,
  dailyLossLimitPercent: "4.00",
  riskPerTradePercent: "2.00",
  maxDailyTrades: 10,
  isConnected: false,
  isActive: false,
  paperTradingState: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readFileSettings(): FileSettings | null {
  try {
    ensureDataDir();
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        createdAt: new Date(parsed.createdAt || DEFAULT_SETTINGS.createdAt),
        updatedAt: new Date(parsed.updatedAt || DEFAULT_SETTINGS.updatedAt),
      };
    }
  } catch (error) {
    console.warn('[Settings] Failed to read file settings:', error);
  }
  return null;
}

function writeFileSettings(settings: FileSettings): void {
  try {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('[Settings] Failed to write file settings:', error);
  }
}

/**
 * Bot ayarlarını getir (tek kayıt)
 * Database varsa database'den, yoksa dosyadan okur
 */
export async function getBotSettings() {
  // Önce database'i dene
  const db = await getDb();
  if (db) {
    try {
      const [settings] = await db.select().from(botSettings).limit(1);
      
      if (!settings) {
        const defaultSettings: InsertBotSettings = {
          capitalLimit: null,
          useAllBalance: true,
          compoundEnabled: false,
          dailyLossLimitPercent: "4.00",
          riskPerTradePercent: "2.00",
          maxDailyTrades: 10,
          isConnected: false,
        };
        
        await db.insert(botSettings).values(defaultSettings);
        const [newSettings] = await db.select().from(botSettings).limit(1);
        return newSettings;
      }
      
      return settings;
    } catch (error) {
      console.warn('[Settings] Database query failed, falling back to file:', error);
    }
  }
  
  // Database yoksa dosyadan oku
  const fileSettings = readFileSettings();
  if (fileSettings) {
    return fileSettings;
  }
  
  // Hiçbiri yoksa default ayarları oluştur ve kaydet
  writeFileSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

/**
 * Bot ayarlarını güncelle
 * Database varsa database'e, yoksa dosyaya yazar
 */
export async function updateBotSettings(data: Partial<InsertBotSettings>) {
  // Önce database'i dene
  const db = await getDb();
  if (db) {
    try {
      const existing = await getBotSettings();
      
      if (!existing) {
        await db.insert(botSettings).values(data as InsertBotSettings);
      } else {
        await db.update(botSettings)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(botSettings.id, existing.id));
      }
      
      return await getBotSettings();
    } catch (error) {
      console.warn('[Settings] Database update failed, falling back to file:', error);
    }
  }
  
  // Database yoksa dosyaya yaz
  const existing = readFileSettings() || DEFAULT_SETTINGS;
  const updated: FileSettings = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  } as FileSettings;
  
  writeFileSettings(updated);
  return updated;
}


/**
 * Bot'u başlat/durdur
 */
export async function toggleBot(isActive: boolean, closePositions: boolean = false) {
  // Önce database'i dene
  const db = await getDb();
  if (db) {
    try {
      const existing = await getBotSettings();
      
      if (!existing) {
        throw new Error("Bot settings not found");
      }

      await db.update(botSettings)
        .set({
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(botSettings.id, existing.id));

      if (!isActive && closePositions) {
        const { emergencyStopAll } = await import('./botApi');
        await emergencyStopAll();
      }

      return {
        success: true,
        isActive,
        message: isActive ? "Bot başlatıldı" : "Bot durduruldu",
      };
    } catch (error) {
      console.warn('[Settings] Database toggle failed, falling back to file:', error);
    }
  }
  
  // Database yoksa dosyaya yaz
  const existing = readFileSettings() || DEFAULT_SETTINGS;
  const updated: FileSettings = {
    ...existing,
    isActive,
    updatedAt: new Date(),
  };
  
  writeFileSettings(updated);
  
  if (!isActive && closePositions) {
    try {
      const { emergencyStopAll } = await import('./botApi');
      await emergencyStopAll();
    } catch (error) {
      console.warn('[Settings] Emergency stop failed:', error);
    }
  }

  return {
    success: true,
    isActive,
    message: isActive ? "Bot başlatıldı" : "Bot durduruldu",
  };
}
