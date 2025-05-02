# URL to Metadata API

A high-performance metadata extraction API built with Bun, Hono, and Cloudflare Workers.

## Features

- ⚡ Blazing fast metadata extraction
- 🌐 Global edge network deployment
- 🔒 Built-in rate limiting and caching
- 🧩 JavaScript rendering support
- 📦 Zero-cost infrastructure

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Hosting**: Cloudflare Workers
- **Browser Automation**: Playwright + Browserless
- **HTML Parsing**: Cheerio
- **Caching**: Upstash Redis
- **Storage**: Cloudflare KV

## Setup

1. Install dependencies:
```bash
bun install
```

2. Create a `.env` file with the following variables:
```env
PORT=3000
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
BROWSERLESS_TOKEN=your_browserless_token
```

3. Start the development server:
```bash
bun run dev
```

## API Usage

### Get Metadata

```bash
GET /metadata?url=https://example.com
```

Response:
```json
{
  "title": "Example Domain",
  "description": "This domain is for use in illustrative examples in documents.",
  "image": "https://example.com/image.jpg",
  "url": "https://example.com",
  "siteName": "Example",
  "type": "website",
  "locale": "en_US"
}
```

# Test the health check endpoint
```bash
curl http://localhost:3003/
```

# Test the metadata endpoint
```bash
curl "http://localhost:3003/metadata?url=https://github.com"
```

## Deployment

1. Install Wrangler:
```bash
bunx wrangler login
```

2. Create a new Cloudflare KV namespace:
```bash
bunx wrangler kv namespace create "NAMESPACE_NAME"
```

3. Deploy to Cloudflare Workers:
```bash
bunx wrangler deploy
```

## Free Tier Limits

- Cloudflare Workers: 100k requests/day
- Browserless: 50 sessions/hour
- Upstash Redis: 10k commands/day
- Cloudflare KV: 1GB storage

## License

MIT 