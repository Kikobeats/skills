---
name: microlink-google
description: Query 10 Google verticals (search, news, images, videos, places, maps, shopping, scholar, patents, autocomplete) as structured data via @microlink/google. Use when users need to fetch Google search results programmatically, scrape Google SERP data, build search-powered features, retrieve Google News or Shopping data, get place/map coordinates, find academic papers, or work with any Google vertical through a unified Node.js API.
---

# @microlink/google

Unified Node.js client for querying 10 Google verticals through the Microlink API. Returns normalized, structured data with pagination and lazy HTML fetching.

## Quick Start

The only prerequisite to initialize @microlink/google is to have [Microlink API key](https://microlink.io/#pricing):


```js
const google = require('@microlink/google')({
  apiKey: process.env.MICROLINK_API_KEY
})

const page = await google('Lotus Elise S2')
console.log(page.results)
```

The `query` string supports standard [Google search operators](https://support.google.com/websearch/answer/2466433):

```js
await google('annual report filetype:pdf')
await google('security updates site:github.com')
await google('"machine learning" site:arxiv.org')
```

## Query Signature

```js
const page = await google(query, options?)
```

### Options

| Option     | Type     | Default    | Values                                                                                                   |
| ---------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `type`     | `string` | `'search'` | `search`, `news`, `images`, `videos`, `places`, `maps`, `shopping`, `scholar`, `patents`, `autocomplete` |
| `location` | `string` | `'us'`     | ISO 3166-1 alpha-2 country code                                                                          |
| `period`   | `string` | —          | `hour`, `day`, `week`, `month`, `year`                                                                   |
| `limit`    | `number` | —          | Results per page                                                                                         |

## Google Products

### Google Search (default)

```js
const page = await google('node.js frameworks')
```

**Page**: `results`, `knowledgeGraph?`, `peopleAlsoAsk?`, `relatedSearches?`

**Result**: `title`, `url`, `description`, `html()`

**KnowledgeGraph**: `title?`, `type?`, `website?`, `image?`, `description?`, `descriptionSource?`, `descriptionLink?`, `attributes?`

### Google News

```js
const page = await google('artificial intelligence', { type: 'news' })
```

**Result**: `title`, `url`, `description`, `date`, `publisher`, `image?`, `html()`

### Google Images

```js
const page = await google('northern lights', { type: 'images' })
```

**Result**: `title`, `url`, `image { url, width, height }`, `thumbnail { url, width, height }`, `google?`, `creator?`, `credit?`, `html()`

### Google Videos

```js
const page = await google('cooking tutorial', { type: 'videos' })
```

**Result**: `title`, `url`, `description`, `image?`, `video?`, `duration?`, `duration_pretty?`, `publisher?`, `channel?`, `date?`, `html()`

### Google Places

```js
const page = await google('coffee shops denver', { type: 'places' })
```

**Result**: `title`, `address`, `latitude`, `longitude`, `phone?`, `url?`, `cid`, `html()`

### Google Maps

```js
const page = await google('apple store new york', { type: 'maps' })
```

**Result**: `title`, `address`, `latitude`, `longitude`, `rating?`, `ratingCount?`, `price? { level }`, `type?`, `types?`, `url?`, `phone?`, `description?`, `opening?`, `thumbnail?`, `cid`, `fid?`, `place?`, `html()`

### Google Shopping

```js
const page = await google('macbook pro', { type: 'shopping' })
```

**Result**: `title`, `url`, `publisher`, `price { symbol, amount }`, `image?`, `rating? { score, total, reviews? }`, `id?`, `html()`

### Google Scholar

```js
const page = await google('transformer architecture', { type: 'scholar' })
```

**Result**: `title`, `url`, `description`, `publisher`, `year`, `citations`, `pdf?`, `id`, `html()`

### Google Patents

```js
const page = await google('touchscreen gestures apple', { type: 'patents' })
```

**Result**: `title`, `description`, `url`, `priority`, `filing`, `grant?`, `publication`, `inventor`, `assignee`, `language`, `pdf?`, `thumbnail?`, `figures?`, `id?`, `html()`

### Google Autocomplete

```js
const page = await google('how to', { type: 'autocomplete' })
```

**Result**: `value` (no `url`, no `html()`)

## Pagination

Every page exposes `.next()` returning a promise of the next page:

```js
const page1 = await google('query')
const page2 = await page1.next()
```

Iterate through all pages:

```js
let page = await google('node.js frameworks')

while (page) {
  for (const result of page.results) {
    console.log(result.title)
  }
  page = await page.next()
}
```

## Lazy HTML Fetching

Any result with a `url` exposes `.html()` to fetch the target page HTML on demand:

```js
const { results } = await google('node.js frameworks')
const html = await results[0].html()
```

Page-level `.html()` fetches the Google SERP HTML itself.
