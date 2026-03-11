import { createClient } from "redis";
import { env } from "./env";

// REDIS_URL থাকলে সেটা use করো (Upstash/Cloud), না থাকলে local host:port
const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : createClient({
      socket: {
        host: env.redis.host,
        port: env.redis.port,
        reconnectStrategy: (retries) => {
          // 5 বারের বেশি retry করবে না
          if (retries > 5) return new Error("Redis max retries reached");
          return Math.min(retries * 500, 3000);
        },
      },
    });

redisClient.on("error", (err) => console.warn("[Redis] Client Error:", err.message));
redisClient.on("connect", () => console.log("[Redis] Connected Successfully"));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    if (env.app.isProduction) {
      // Production এ Redis ছাড়া চলা unsafe — crash করো
      console.error("[Redis] Connection failed. Exiting in production.", error);
      process.exit(1);
    } else {
      // Development এ Redis না থাকলে warn করো, crash করো না
      console.warn(
        "[Redis]  Could not connect. Running WITHOUT Redis in dev mode.",
      );
      console.warn(
        "[Redis] Using in-memory token blacklist (dev fallback). Start Redis for production-grade blacklisting.",
      );
    }
  }
};

/**
 * Redis connected এবং ready কিনা check করে।
 * Redis না থাকলে (dev mode) এটা false return করবে।
 */
export const isRedisReady = (): boolean => redisClient.isReady;

// ─── In-Memory Fallback Blacklist (Dev mode only) ────────────────────────────
// Redis না থাকলে এই Map ব্যবহার করা হবে token blacklisting এর জন্য।
// Key: token string, Value: expiry timestamp (ms)
// Server restart হলে clear হয়ে যাবে — dev এ এটাই যথেষ্ট।
const memoryBlacklist = new Map<string, number>();

/**
 * Token টি memory blacklist এ add করো (Redis fallback)।
 * @param token  - JWT token string
 * @param ttlSec - কত seconds পর expire হবে
 */
export const memBlacklistAdd = (token: string, ttlSec: number): void => {
  const expiresAt = Date.now() + ttlSec * 1000;
  memoryBlacklist.set(token, expiresAt);
};

/**
 * Token টি blacklisted কিনা check করো (Redis fallback)।
 * Expired entry থাকলে সেটা delete করে false return করে।
 */
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
