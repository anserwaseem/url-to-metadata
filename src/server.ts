import { Hono } from "hono";
import { cors } from "hono/cors";
import { Redis } from "@upstash/redis";
import { extractMetadata } from "./utils/metadata";
import type { Context } from "hono";
import { RATE_LIMIT, CACHE, SERVER, REDIS } from "./utils/constants";

// initialize redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const app = new Hono();

// middleware
app.use("*", cors());

// logging middleware
app.use("*", async (c: Context, next) => {
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  await next();
});

// rate limiting middleware using Redis
app.use("*", async (c: Context, next) => {
  // skip rate limiting for health checks
  if (c.req.path === SERVER.HEALTH_CHECK_PATH) {
    return next();
  }

  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const key = `${RATE_LIMIT.KEY_PREFIX}${REDIS.KEY_SEPARATOR}${ip}`;

  // use Redis for atomic operations
  const [current] = await redis
    .multi()
    .incr(key)
    .expire(key, RATE_LIMIT.WINDOW_MS / 1000, "NX")
    .exec();

  if (current > RATE_LIMIT.MAX_REQUESTS) {
    return c.json({ error: "too many requests" }, 429);
  }

  await next();
});

// health check endpoint
app.get(SERVER.HEALTH_CHECK_PATH, (c: Context) => c.json({ status: "ok" }));

// metadata extraction endpoint
app.get("/metadata", async (c: Context) => {
  const url = c.req.query("url");

  if (!url) {
    return c.json({ error: "url parameter is required" }, 400);
  }

  try {
    // check KV cache first (faster reads at edge)
    const key = `${CACHE.METADATA_KEY_PREFIX}${REDIS.KEY_SEPARATOR}${url}`;
    const cached = await c.env?.METADATA_CACHE?.get(key);
    console.log("c.env", c.env);
    console.log("cached", cached);
    if (cached) {
      return c.json(JSON.parse(cached));
    }

    // extract metadata
    const metadata = await extractMetadata(url);

    // cache in KV (edge caching for faster subsequent reads)
    await c.env?.METADATA_CACHE?.put(key, JSON.stringify(metadata), {
      expirationTtl: CACHE.METADATA_TTL,
    });

    return c.json(metadata);
  } catch (error) {
    console.error("Error extracting metadata:", error);
    return c.json({ error: "failed to extract metadata" }, 500);
  }
});

// error handling
app.onError((err: Error, c: Context) => {
  console.error(`${err}`);
  return c.json({ error: "internal server error" }, 500);
});

// Export for Cloudflare Workers
export default app;
