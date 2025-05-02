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

// cors middleware
app.use("*", cors());

// rate limiting middleware using Redis
app.use("*", async (c: Context, next) => {
  // skip rate limiting for health checks
  if (c.req.path === SERVER.HEALTH_CHECK_PATH) {
    return next();
  }

  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const key = `${RATE_LIMIT.KEY_PREFIX}${REDIS.KEY_SEPARATOR}${ip}`;

  // atomic operations - increment the request count and set an expiration
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
app.get(SERVER.METADATA_PATH, async (c: Context) => {
  const url = c.req.query("url");

  // validate URL parameter
  if (!url) {
    return c.json(
      {
        success: false,
        error: "url parameter is required",
        code: "MISSING_URL",
      },
      400,
    );
  }

  // validate URL format
  try {
    new URL(url);
  } catch {
    return c.json(
      {
        success: false,
        error: "invalid url format",
        code: "INVALID_URL",
      },
      400,
    );
  }

  try {
    // check if user wants to bypass cache
    const noCache = c.req.query("noCache") === "true";

    // check KV cache first if cache is not bypassed
    const key = `${CACHE.METADATA_KEY_PREFIX}${REDIS.KEY_SEPARATOR}${url}`;
    const cached = noCache ? null : await c.env?.METADATA_CACHE?.get(key);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    // extract metadata
    const metadata = await extractMetadata(url);

    // validate extracted metadata
    if (!metadata.title) {
      return c.json(
        {
          success: false,
          error: "could not extract metadata from the URL",
          code: "NO_METADATA",
        },
        422,
      );
    }

    // cache in KV
    await c.env?.METADATA_CACHE?.put(key, JSON.stringify(metadata), {
      expirationTtl: CACHE.METADATA_TTL,
    });

    return c.json({
      success: true,
      data: metadata,
      cached: false,
    });
  } catch (error) {
    console.error("Error extracting metadata:", error);

    // handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return c.json(
          {
            success: false,
            error: "request timeout while extracting metadata",
            code: "TIMEOUT",
          },
          504,
        );
      }
      if (error.message.includes("fetch")) {
        return c.json(
          {
            success: false,
            error: "could not fetch the URL",
            code: "FETCH_ERROR",
          },
          502,
        );
      }
    }

    return c.json(
      {
        success: false,
        error: "failed to extract metadata",
        code: "INTERNAL_ERROR",
      },
      500,
    );
  }
});

// error handling
app.onError((err: Error, c: Context) => {
  console.error(`${err}`);
  return c.json({ error: "internal server error" }, 500);
});

export default app;
