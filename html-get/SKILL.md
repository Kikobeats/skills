---
name: html-get
description: Retrieve normalized HTML from URLs using fetch or prerender with browserless fallbacks. Use when the user mentions html-get, rendered HTML extraction, JS-heavy pages, rewriting relative URLs, or preparing HTML for metascraper and scraping pipelines.
---

# html-get

`html-get` returns reliable HTML for a URL, choosing `fetch` or `prerender` depending on page needs.

## Quick Start

Install:

```bash
npm install html-get browserless puppeteer
```

Minimal usage:

```js
const createBrowserless = require('browserless')
const getHTML = require('html-get')

const browser = createBrowserless()
const context = browser.createContext()

const result = await getHTML('https://example.com', {
  getBrowserless: () => context
})

console.log(result.html)

await context((browserless) => browserless.destroyContext())
await browser.close()
```

## Recommended Workflow

1. Start with default `prerender: 'auto'`.
2. Set `prerender: false` for static pages when speed is priority.
3. Enable `rewriteUrls: true` when downstream parsing needs absolute links.
4. Enable `rewriteHtml: true` when source pages have broken meta tags.
5. Reuse one browser process and create/destroy contexts per request.

## CLI

One-off usage:

```bash
npx -y html-get https://example.com
```

Debug output with mode, timing, and headers:

```bash
npx -y html-get https://example.com --debug
```

## Core Options

- `getBrowserless` (function): required unless `prerender: false`.
- `prerender` (`'auto' | true | false`): mode selector.
- `rewriteUrls` (boolean): rewrite relative HTML/CSS URLs to absolute.
- `rewriteHtml` (boolean): normalize common meta-tag mistakes.
- `headers` (object): request headers for fetch/prerender.
- `gotOpts` (object): extra options for `got` in fetch mode.
- `puppeteerOpts` (object): options passed to browserless evaluate flow.
- `serializeHtml` (function): custom output serializer from Cheerio instance.
- `encoding` (string): output encoding, default `utf-8`.

## Output Shape

`getHTML(url, opts)` resolves to:

- `html`: serialized HTML (or custom serializer output fields).
- `url`: final URL.
- `statusCode`: HTTP status.
- `headers`: response headers.
- `redirects`: redirect chain.
- `stats`: `{ mode, timing }`.

## Common Patterns

Force fast fetch mode for known static targets:

```js
const result = await getHTML(url, {
  prerender: false,
  rewriteUrls: true
})
```

Prepare HTML for metadata extraction:

```js
const page = await getHTML(url, {
  getBrowserless,
  rewriteUrls: true,
  rewriteHtml: true
})

const metadata = await metascraper({ url: page.url, html: page.html })
```

Custom serializer (avoid returning full HTML):

```js
const result = await getHTML(url, {
  getBrowserless,
  serializeHtml: ($) => ({
    html: $.html(),
    title: $('title').first().text()
  })
})
```

## Reliability Notes

- If `getBrowserless` is missing and `prerender` is not `false`, `html-get` throws.
- PDF URLs are fetched and can be converted via `mutool` when available.
- Media URLs are normalized to HTML wrappers (`img`, `video`, `audio`) for consistent downstream parsing.
- For large batch jobs, control concurrency outside `html-get` and always clean up browser contexts.
