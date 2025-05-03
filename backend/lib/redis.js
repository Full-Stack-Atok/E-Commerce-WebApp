// lib/redis.js
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Parse the Upstash URL (should be in the form redis://:<password>@<host>:<port> or rediss://…)
const redisUrl = process.env.UPSTASH_REDIS_URL;
if (!redisUrl) {
  console.error("❌ UPSTASH_REDIS_URL is not defined");
  process.exit(1);
}

export const redis = new Redis(redisUrl, {
  // Use TLS if your URL starts with rediss://
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
  // Reconnect strategy: exponential backoff up to 1s
  retryStrategy: (times) => Math.min(times * 50, 1000),
  // Enable keepalive
  keepAlive: 30000,
});

redis.on("connect", () => console.log("🔌 Redis: connect"));
redis.on("ready", () => console.log("✅ Redis: ready"));
redis.on("error", (err) => console.error("❌ Redis error:", err));
redis.on("close", () => console.log("🔒 Redis: connection closed"));
redis.on("reconnecting", () => console.log("♻️  Redis: reconnecting"));
