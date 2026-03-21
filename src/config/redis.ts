import { createClient } from "redis";
import { env } from "./env";

const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : createClient({
      socket: {
        host: env.redis.host,
        port: env.redis.port,
        reconnectStrategy: (retries) => {
          if (retries > 5) return new Error("Redis max retries reached");
          return Math.min(retries * 500, 3000);
        },
      },
    });

redisClient.on("error", (err) => console.warn("[Redis] Client Error:", err.message));
redisClient.on("connect", () => {});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    if (env.app.isProduction) {
      console.error("[Redis] Connection failed. Exiting in production.", error);
      process.exit(1);
    } else {
      console.warn(
        "[Redis]  Could not connect. Running WITHOUT Redis in dev mode.",
      );
      console.warn(
        "[Redis] Using in-memory token blacklist (dev fallback). Start Redis for production-grade blacklisting.",
      );
    }
  }
};


export const isRedisReady = (): boolean => redisClient.isReady;

// ─── In-Memory Fallback Blacklist (Dev mode only) ────────────────────────────
// Key: token string, Value: expiry timestamp (ms)
const memoryBlacklist = new Map<string, number>();


export const memBlacklistAdd = (token: string, ttlSec: number): void => {
  const expiresAt = Date.now() + ttlSec * 1000;
  memoryBlacklist.set(token, expiresAt);
};


export const memBlacklistHas = (token: string): boolean => {
  const expiresAt = memoryBlacklist.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    memoryBlacklist.delete(token); // expired — cleanup
    return false;
  }
  return true;
};

export default redisClient;
