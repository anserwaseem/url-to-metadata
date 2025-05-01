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

// optimized rate limiting middleware
app.use("*", async (c: Context, next) => {
  // skip rate limiting for health checks
  if (c.req.path === SERVER.HEALTH_CHECK_PATH) {
    return next();
  }

  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const key = `${RATE_LIMIT.KEY_PREFIX}${REDIS.KEY_SEPARATOR}${ip}`;

  // use a single Redis operation to both increment and get the result
  const [current] = await redis
    .multi()
    .incr(key)
    .expire(key, RATE_LIMIT.WINDOW_MS / 1000, "NX") // only set expiration if key doesn't exist
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
    // check cache first
    const key = `${CACHE.METADATA_KEY_PREFIX}${REDIS.KEY_SEPARATOR}${url}`;
    const cached = await redis.get(key);
    if (cached) {
      return c.json(cached);
    }

    // extract metadata
    const metadata = await extractMetadata(url);

    // cache for configured TTL
    await redis.set(key, metadata, { ex: CACHE.METADATA_TTL });

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

export default {
  port: process.env.PORT || SERVER.PORT,
  fetch: app.fetch,
};
