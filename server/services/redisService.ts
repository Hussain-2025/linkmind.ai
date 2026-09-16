import Redis from "ioredis";

const redisUri = process.env.REDIS_URI || process.env.REDIS_URL;

let redisClient: any = null;
let pubClient: any = null;
let subClient: any = null;
let queueClient: any = null;
let isRedisConnected = false;

// Simple in-memory fallback cache
const localCache = new Map<string, { value: string; expiresAt: number }>();

class MemoryRedisMock {
  async get(key: string): Promise<string | null> {
    const item = localCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      localCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string> {
    let expiresAt = Infinity;
    if (mode === "EX" && typeof duration === "number") {
      expiresAt = Date.now() + duration * 1000;
    }
    localCache.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    const existed = localCache.has(key);
    localCache.delete(key);
    return existed ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const now = Date.now();
    const result: string[] = [];
    const cleanPattern = pattern.replace("*", "");
    for (const [key, item] of localCache.entries()) {
      if (item.expiresAt < now) {
        localCache.delete(key);
        continue;
      }
      if (key.includes(cleanPattern)) {
        result.push(key);
      }
    }
    return result;
  }

  async flushall(): Promise<string> {
    localCache.clear();
    return "OK";
  }

  on(event: string, handler: any) {
    // dummy handler for listeners
    return this;
  }

  duplicate() {
    return new MemoryRedisMock();
  }
}

if (redisUri) {
  try {
    console.log(`Connecting to Redis server configuration: ${redisUri.split("@").pop()}`);
    // Configure client with retry strategy and offline connections disabled to trigger error fast if bad configuration is used
    redisClient = new Redis(redisUri, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("Redis connection could not be established. Falling back to in-memory...");
          isRedisConnected = false;
          return null; // Stop retrying and fallback to error
        }
        return Math.min(times * 100, 2000);
      },
    });

    redisClient.on("connect", () => {
      console.log("Successfully connected to Redis instance!");
      isRedisConnected = true;
    });

    redisClient.on("error", (err: any) => {
      console.error("Redis client internal connection failure:", err.message);
      isRedisConnected = false;
    });

    // Support Pub/Sub
    pubClient = new Redis(redisUri, { maxRetriesPerRequest: null });
    subClient = new Redis(redisUri, { maxRetriesPerRequest: null });
    // Support Queues
    queueClient = new Redis(redisUri, { maxRetriesPerRequest: null });
  } catch (error) {
    console.error("Failed to construct Redis connection instances:", error);
    redisClient = new MemoryRedisMock();
    isRedisConnected = false;
  }
} else {
  console.log("No custom REDIS_URI/REDIS_URL defined. Running high-speed in-memory structures mock...");
  redisClient = new MemoryRedisMock();
  isRedisConnected = false;
}

export function getRedisClient() {
  return redisClient || new MemoryRedisMock();
}

export function getRedisPubClient() {
  return pubClient;
}

export function getRedisSubClient() {
  return subClient;
}

export function getQueueRedisClient() {
  return queueClient;
}

export function isRedisActive(): boolean {
  return isRedisConnected;
}

export const redisService = {
  get: async (key: string): Promise<string | null> => {
    try {
      return await getRedisClient().get(key);
    } catch {
      return null;
    }
  },
  set: async (key: string, value: string, ttlSeconds?: number): Promise<void> => {
    try {
      if (ttlSeconds) {
        await getRedisClient().set(key, value, "EX", ttlSeconds);
      } else {
        await getRedisClient().set(key, value);
      }
    } catch (e) {
      console.error("Redis Write Failure for key", key, e);
    }
  },
  del: async (key: string): Promise<void> => {
    try {
      await getRedisClient().del(key);
    } catch {}
  },
  invalidatePattern: async (pattern: string): Promise<void> => {
    try {
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((k: string) => client.del(k)));
      }
    } catch {}
  },
};
