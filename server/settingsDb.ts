import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { botSettings, type InsertBotSettings } from "../drizzle/schema";

/**
 * Bot ayarlarını getir (tek kayıt)
 */
export async function getBotSettings() {
  const db = await getDb();
  if (!db) return null;

  const [settings] = await db.select().from(botSettings).limit(1);
  
  // Eğer ayar yoksa, default ayarları oluştur
  if (!settings) {
    const defaultSettings: InsertBotSettings = {
      usedCapital: "500.00",
      useAllBalance: false,
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
}

/**
 * Bot ayarlarını güncelle
 */
export async function updateBotSettings(data: Partial<InsertBotSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getBotSettings();
  
  if (!existing) {
    // İlk kayıt
    await db.insert(botSettings).values(data as InsertBotSettings);
  } else {
    // Güncelleme
    await db.update(botSettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(botSettings.id, existing.id));
  }
  
  return await getBotSettings();
}
