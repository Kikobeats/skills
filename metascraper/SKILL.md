---
name: metascraper
description: Extract unified metadata from input HTML using metascraper rule bundles and fallbacks. Use when the user mentions metascraper, metadata extraction from URLs, Open Graph/Twitter Cards/JSON-LD parsing, custom metadata rules, or building link preview pipelines.
---

# metascraper

`metascraper` extracts normalized metadata from the input HTML you provide, using ordered rule bundles.

Extraction quality depends on the accuracy of that input HTML.

## Quick Start

Install only what you need:

```bash
npm install metascraper \
  metascraper-author \
  metascraper-date \
  metascraper-description \
  metascraper-image \
  metascraper-logo \
  metascraper-publisher \
  metascraper-title \
  metascraper-url
```

Minimal extraction:

```js
const metascraper = require('metascraper')([
  require('metascraper-author')(),
  require('metascraper-date')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-logo')(),
  require('metascraper-publisher')(),
  require('metascraper-title')(),
  require('metascraper-url')()
])

const metadata = await metascraper({
  url: 'https://example.com/article',
  html: '<html>...</html>'
})
```

## Recommended Workflow

1. Get accurate HTML for the target URL.
2. Compose rule bundles for the fields you need.
3. Run `metascraper({ url, html })`.
4. Narrow extraction with `pickPropNames` when speed matters.
5. Add custom rules only when defaults miss required data.

## Getting HTML

`metascraper` needs both `url` and `html`.

- Static pages: fetch raw HTML with your HTTP client.
- JS-heavy pages: use a rendered HTML source (for example, `html-get`).
- At scale: if browser infra is not desired, use Microlink API as managed alternative.

For accurate rendered markup, use the local [html-get skill](../html-get/SKILL.md) before running `metascraper`.

## Core API

Create an instance:

```js
const metascraper = require('metascraper')([/* rule bundles */])
```

Run extraction:

```js
const metadata = await metascraper({
  url,
  html,
  htmlDom,        // optional pre-parsed DOM
  rules,          // optional extra rules at runtime
  pickPropNames,  // optional Set of fields to compute
  omitPropNames,  // optional Set of fields to skip
  validateUrl     // default true
})
```

## Property Selection Patterns

Compute only selected fields:

```js
const metadata = await metascraper({
  url,
  html,
  pickPropNames: new Set(['title', 'description', 'image'])
})
```

Skip expensive or unwanted fields:

```js
const metadata = await metascraper({
  url,
  html,
  omitPropNames: new Set(['logo'])
})
```

When both are present, `pickPropNames` takes precedence.

## Rule Bundle Notes

- Rules are evaluated in order.
- The first rule that resolves a field wins.
- Put specific rules before generic fallbacks.
- Use package-level options for bundle behavior.

Example with bundle options:

```js
const metascraper = require('metascraper')([
  require('metascraper-logo')({
    filter: imageUrl => imageUrl.endsWith('.png')
  })
])
```

## Common Bundles

Core article fields:

- `metascraper-author`
- `metascraper-date`
- `metascraper-description`
- `metascraper-image`
- `metascraper-logo`
- `metascraper-publisher`
- `metascraper-title`
- `metascraper-url`

Media and enrichment:

- `metascraper-audio`
- `metascraper-video`
- `metascraper-lang`
- `metascraper-iframe`
- `metascraper-readability`

Provider-specific examples:

- `metascraper-youtube`
- `metascraper-spotify`
- `metascraper-soundcloud`
- `metascraper-x`
- `metascraper-instagram`
- `metascraper-tiktok`

## Troubleshooting

- Missing metadata: verify the HTML contains rendered tags (Open Graph, Twitter, JSON-LD, etc.).
- Wrong relative URLs: ensure `url` is absolute and matches the fetched page.
- Slow extraction: use `pickPropNames` to compute only needed fields.
- URL validation failures: pass `validateUrl: false` only when input is intentionally non-standard.

## Output Fields (Typical)

Common fields include:

- `title`
- `description`
- `author`
- `publisher`
- `date`
- `image`
- `logo`
- `url`
- `lang`
- `audio`
- `video`

The returned shape depends on loaded rule bundles.
