// rate limiting constants
export const RATE_LIMIT = {
  WINDOW_MS: 60 * 60 * 1000, // 1 hour
  MAX_REQUESTS: 2000,
  KEY_PREFIX: "rate_limit",
} as const;

// caching constants
export const CACHE = {
  METADATA_KEY_PREFIX: "metadata",
  METADATA_TTL: 3600, // 1 hour in seconds
} as const;

// browser constants
export const BROWSER = {
  TIMEOUT: 30000, // 30 seconds
  WAIT_UNTIL: "networkidle" as const,
} as const;

// server constants
export const SERVER = {
  PORT: 3000,
  HEALTH_CHECK_PATH: "/",
  METADATA_PATH: "/metadata",
} as const;

// redis constants
export const REDIS = {
  KEY_SEPARATOR: ":",
} as const;
