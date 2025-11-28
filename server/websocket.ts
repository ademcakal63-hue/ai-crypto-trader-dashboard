import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { binanceClient } from "./binance";

let io: SocketIOServer | null = null;

/**
 * WebSocket server'ı başlat
 */
export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io/",
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Client'tan subscribe isteği geldiğinde
    socket.on("subscribe", async (symbols: string[]) => {
      console.log(`[WebSocket] Client ${socket.id} subscribed to:`, symbols);

      // Binance WebSocket'e bağlan
      const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`);
      
      try {
        // @ts-ignore - binance-api-node tip tanımları eksik
        binanceClient.ws.ticker(streams, (ticker: any) => {
          // Fiyat değişimini client'a gönder
          socket.emit("price-update", {
            symbol: ticker.symbol,
            price: parseFloat(ticker.curDayClose),
            change24h: parseFloat(ticker.priceChangePercent),
            volume: parseFloat(ticker.volume),
            timestamp: Date.now(),
          });
        });
      } catch (error) {
        console.error("[WebSocket] Binance stream error:", error);
        socket.emit("error", { message: "Failed to subscribe to price stream" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[WebSocket] Server initialized");
  return io;
}

/**
 * Tüm client'lara broadcast yap
 */
export function broadcastToAll(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}

/**
 * Belirli bir room'a broadcast yap
 */
export function broadcastToRoom(room: string, event: string, data: any) {
  if (io) {
    io.to(room).emit(event, data);
  }
}
