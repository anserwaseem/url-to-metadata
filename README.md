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

4. For Cloudflare Workers development:

This command uses Wrangler to run your Worker locally. Set variables in wrangler.jsonc and use the following command to start the development server:

```bash
bun run wrangler:dev
```

## API Usage

### API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | The URL to extract metadata from (must be URL encoded) |
| noCache | boolean | No | Set to true to bypass cache and get fresh metadata |

### Example Response

```json
{
  "success": true,
  "data": {
    "title": "Tom & Jerry | Animal Friends! 🐘🦭 | Animals Takeover | @wbkids - YouTube",
    "description": "Did you know there's more than just cats, mice, and dogs in Tom & Jerry? Join them as they meet and go on adventures with all their animal friends!Catch up w...",
    "image": "https://i.ytimg.com/vi/s7CVgEnuFDA/maxresdefault.jpg",
    "url": "https://www.youtube.com/watch?v=s7CVgEnuFDA",
    "siteName": "YouTube",
    "type": "video.other",
    "locale": null,
    "favicon": "https://www.youtube.com/s/desktop/3747f4fc/img/logos/favicon_32x32.png",
    "language": "ur-PK",
    "imageMetadata": {
      "url": "https://i.ytimg.com/vi/s7CVgEnuFDA/maxresdefault.jpg",
      "width": 1280,
      "height": 720
    },
    "videoMetadata": {
      "secureUrl": "https://www.youtube.com/embed/s7CVgEnuFDA",
      "type": "text/html",
      "width": 1280,
      "height": 720
    },
    "metaTags": {
      "og:title": "Tom & Jerry | Animal Friends! 🐘🦭 | Animals Takeover | @wbkids",
      "og:description": "Did you know there's more than just cats, mice, and dogs in Tom & Jerry? Join them as they meet and go on adventures with all their animal friends!Catch up w...",
      "og:image": "https://i.ytimg.com/vi/s7CVgEnuFDA/maxresdefault.jpg"
    }
  },
  "cached": false
}
```

### Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Invalid URL parameter |
| 401 | Invalid API key |
| 422 | Could not extract metadata from the URL |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 502 | Could not fetch the URL |
| 504 | Request timeout while extracting metadata |

### Get Metadata

```bash
GET /metadata?url=https://example.com
```

### Health check endpoint
```bash
curl http://localhost:3003/
```

### Metadata endpoint
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
