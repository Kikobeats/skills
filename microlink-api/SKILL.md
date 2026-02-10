---
name: microlink-api
description: Uses Microlink API and MQL to extract metadata, screenshots, PDFs, and custom scraped data from URLs. Use when users mention Microlink, MQL, @microlink/mql, URL metadata extraction, screenshot or PDF generation from links, CSS selector scraping, or embed-based link previews.
---

# Microlink API

Microlink turns a URL into structured output over HTTP. It can return metadata, media assets, scraped content, and browser-rendered results.

## Quick Start

### 1) Pick endpoint

- Free endpoint: `https://api.microlink.io` (no auth, 50 requests/day)
- Pro endpoint: `https://pro.microlink.io` (requires `x-api-key` header)

### 2) Build a minimal request

```js
const mql = require('@microlink/mql')
const { status, data, response } = await mql('https://example.com')
```

### 3) Add only needed options

- Metadata only: default `meta: true`
- Faster screenshot/PDF requests: set `meta: false`
- Reduce payload: use `filter` (example: `'url,title,image.url'`)

## When To Use What

- Need parsed page metadata -> use default request.
- Need image capture -> `screenshot: true`.
- Need downloadable PDF -> `pdf: true`.
- Need specific DOM values -> `data` rules with CSS selectors.
- Need direct asset URL response (no JSON) -> `embed`.
- Need JS-dependent pages -> `prerender: true` or keep `auto`.

## Response Shape

Microlink uses JSend-style responses:

```json
{
  "status": "success",
  "data": {},
  "message": "optional",
  "more": "optional docs url"
}
```

- `status`: `success` (2xx), `fail` (4xx), `error` (5xx)
- `data`: extracted output (`title`, `description`, `image`, `video`, and more)

## Common Workflows

For copy-paste recipes, see [common-workflows/README.md](common-workflows/README.md).

## MQL Usage Notes

### Install

```bash
npm install @microlink/mql
```

### Runtime imports

- Node.js: `const mql = require('@microlink/mql')`
- Edge/WinterCG: `import mql from '@microlink/mql/lightweight'`
- Browser: `import mql from 'https://esm.sh/@microlink/mql'`

### Signature

`mql(url, [options], [httpOptions])`

- `url`: required target URL
- `options`: Microlink parameters plus `apiKey`, `cache`, `retry`
- `httpOptions`: forwarded to the underlying HTTP client

Extra methods: `mql.stream()`, `mql.buffer()`.

## Parameters At A Glance

### Core

- `url` (required): target URL with protocol
- `meta` (default `true`): metadata extraction
- `data`: custom scraping rules
- `filter`: comma-separated output fields
- `embed`: return one field directly as response body

### Asset generation

- `screenshot` / `screenshot.*`: create page image
- `pdf` / `pdf.*`: create PDF
- `video`, `audio`: detect playable sources

### Browser behavior

- `prerender`: `auto`, `true`, or `false`
- `waitUntil`, `waitForSelector`, `waitForTimeout`, `timeout`
- `device`, `viewport`, `javascript`, `animations`, `mediaType`
- `click`, `scroll`, `scripts`, `modules`, `styles`

### Caching and performance

- `force`: bypass cache
- `ttl` (Pro): cache lifetime
- `staleTtl` (Pro): stale-while-revalidate strategy

### Pro-only

- `headers`, `proxy`, `filename`, `ttl`, `staleTtl`

## Scraping Patterns

### Single value

```js
data: {
  avatar: { selector: '#avatar', attr: 'src', type: 'image' }
}
```

### Collection

```js
data: {
  stories: { selectorAll: '.titleline > a', attr: 'text' }
}
```

### Fallback list

```js
data: {
  title: [
    { selector: 'meta[property="og:title"]', attr: 'content' },
    { selector: 'title', attr: 'text' },
    { selector: 'h1', attr: 'text' }
  ]
}
```

### Nested object

```js
data: {
  stats: {
    selector: '.profile',
    attr: {
      followers: { selector: '.followers', type: 'number' },
      stars: { selector: '.stars', type: 'number' }
    }
  }
}
```

### Evaluate JS in browser context

```js
data: {
  version: { evaluate: 'window.next.version', type: 'string' }
}
```

## Error Handling

```js
const { MicrolinkError } = mql

try {
  const { data } = await mql('https://example.com', { screenshot: true })
} catch (error) {
  // error.status, error.code, error.message, error.statusCode
}
```

Common error codes: `EAUTH`, `ERATE`, `EINVALURL`, `EBRWSRTIMEOUT`, `EPRO`, `ETIMEOUT`.

## Security And Reliability Rules

- Never expose `x-api-key` in client-side code.
- Use `pro.microlink.io` for authenticated requests.
- For frontend usage, use a server proxy (`microlinkhq/proxy` or `microlinkhq/edge-proxy`).
- If a request is heavy and metadata is not needed, set `meta: false`.

## CLI

```bash
npm install -g @microlink/cli
microlink <url> [flags]
```

Common flags: `--api-key`, `--pretty`, `--copy`, `--colors`.

## Deep Reference

For complete parameter-by-parameter docs, full error matrix, and response headers, see [api-reference.md](api-reference.md).
