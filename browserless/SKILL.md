---
name: browserless
description: Automate websites with browserless and Puppeteer for screenshots, PDFs, HTML/text extraction, URL status checks, and Lighthouse audits. Use when the user mentions browserless, @browserless/cli, headless Chrome automation, Puppeteer wrappers, website screenshots, PDF generation from URLs, or extracting rendered page content.
---

# browserless

`browserless` is a high-level wrapper on top of Puppeteer for reliable headless Chrome workflows.

## Quick Start

### Install

```bash
npm install browserless puppeteer
```

### Minimal API usage

```js
const createBrowser = require('browserless')
const { writeFile } = require('node:fs/promises')

const browser = createBrowser({ timeout: 30000 })
const browserless = await browser.createContext({ retry: 2 })

const screenshot = await browserless.screenshot('https://example.com')
await writeFile('screenshot.png', screenshot)

await browserless.destroyContext()
await browser.close()
```

## When To Use What

- Use the API for reusable scripts, backend jobs, and multi-step browser flows.
- Use `@browserless/cli` for one-off terminal commands and quick checks.
- Use `@browserless/lighthouse` only when the task needs Lighthouse reports.

## CLI Commands

Install once:

```bash
npm install -g @browserless/cli
```

Common commands:

- `browserless screenshot <url>`
- `browserless pdf <url>`
- `browserless html <url>`
- `browserless text <url>`
- `browserless status <url>`
- `browserless ping <url>`
- `browserless goto <url>`
- `browserless page-weight <url>`
- `browserless lighthouse <url>` (requires `npm install -g @browserless/lighthouse`)

## Core API Patterns

### Capture screenshot

```js
const buffer = await browserless.screenshot('https://example.com', {
  device: 'iPhone 6',
  waitUntil: 'auto'
})
```

### Generate PDF

```js
const buffer = await browserless.pdf('https://example.com', {
  margin: '0.35cm',
  printBackground: true
})
```

### Extract rendered content

```js
const html = await browserless.html('https://example.com')
const text = await browserless.text('https://example.com')
```

### Custom evaluation

```js
const getTitle = browserless.evaluate(page =>
  page.evaluate(() => document.title)
)

const title = await getTitle('https://example.com')
```

## Reliability Rules

- Always call `destroyContext()` after each task and `close()` before process exit.
- Keep one browser process and create multiple contexts instead of launching many browsers.
- Start with defaults, then tune `timeout`, `waitUntil`, `waitForSelector`, and `retry`.
- If output is missing due blocked third-party scripts, retry with `adblock: false`.
- Set `DEBUG=browserless` to inspect internal navigation and request handling.

## Related Packages

- `browserless`: core API.
- `@browserless/cli`: command-line interface.
- `@browserless/lighthouse`: Lighthouse reports.
- `@browserless/screencast`: frame-by-frame capture.
- `@browserless/function`: sandboxed code execution against a page.
