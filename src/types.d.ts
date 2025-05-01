declare module "hono/rate-limiter" {
  export function rateLimit(options: {
    windowMs: number;
    max: number;
    keyGenerator: (c: any) => string;
    handler: (c: any) => Response;
  }): any;
}

declare module "./utils/browser" {
  import { Browser } from "playwright";
  export function getBrowser(): Promise<Browser>;
}

declare module "./utils/metadata" {
  export function extractMetadata(url: string): Promise<{
    title: string;
    description: string | null;
    image: string | null;
    url: string;
    siteName: string | null;
    type: string | null;
    locale: string | null;
  }>;
}
