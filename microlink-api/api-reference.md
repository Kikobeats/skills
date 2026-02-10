# Microlink API Parameter Reference

Use this file as the deep reference.

- For quick task-oriented guidance, start in `SKILL.md`.
- For practical examples, use `common-workflows/README.md`.
- For exact parameter behavior, defaults, and edge cases, use this file.
- Parameter names accept both `camelCase` and `snake_case`.

## url (required)

- Type: `<string>`
- Must include protocol (`http://` or `https://`)
- Must be publicly reachable
- Must follow WHATWG URL standard
- URLs with query params should be properly encoded (MQL handles this automatically)
- Protocol affects relative URL resolution inside the target page

## meta

- Type: `<boolean>` | `<object>`
- Default: `true`

Enable/disable normalized metadata detection. When `true` (default), extracts: `title`, `description`, `author`, `publisher`, `date`, `lang`, `url`, `image`, `video`, `logo`.

Configurable detection:

- Include specific fields: `meta: { author: true, title: true }` (only those fields)
- Exclude specific fields: `meta: { image: false, logo: false }` (all except those)
- Disable entirely: `meta: false` (speeds up screenshot/video-only requests)

Reflected as `x-fetch-mode: skipped` in response headers when disabled.

## data

- Type: `<object>`

Custom data extraction using CSS selectors. Each key defines a field name, value is a rule object:

| Property    | Type   | Description                                                                                                                               |
| ----------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| selector    | string | CSS selector (Document.querySelector)                                                                                                     |
| selectorAll | string | CSS selector for collections (Document.querySelectorAll)                                                                                  |
| attr        | string | Attribute to extract: any HTML attr, `'html'`, `'outerHTML'`, `'text'`, `'markdown'`, `'val'`                                             |
| type        | string | Value type validation: `'auto'`, `'string'`, `'number'`, `'boolean'`, `'date'`, `'image'`, `'url'`, `'audio'`, `'video'`, `'email'`, etc. |
| evaluate    | string | JavaScript to evaluate in browser context                                                                                                 |

Supports:

- **Fallback rules**: Pass array of rule objects; first truthy result wins
- **Nested rules**: Use `attr` as object with sub-rules
- **Collections**: Use `selectorAll` instead of `selector`
- **Whole-page serialization**: Omit `selector`, use `attr: 'markdown'` for full-page markdown conversion

## screenshot

- Type: `<boolean>`
- Default: `false`

Generates screenshot, returned as `data.screenshot` with `url`, `width`, `height`, `type`, `size`, `size_pretty`.

Sub-parameters:

- `screenshot.element` (string): CSS selector to capture specific DOM element
- `screenshot.fullPage` (boolean, default `false`): Full scrollable page capture
- `screenshot.type` (string, default `'png'`): `'jpeg'` or `'png'`
- `screenshot.omitBackground` (boolean, default `false`): Transparent background
- `screenshot.overlay.browser` (string): `'light'` or `'dark'` browser chrome overlay
- `screenshot.overlay.background` (string): Hex color, CSS gradient, or image URL
- `screenshot.codeScheme` (string, default `'atom-dark'`): Syntax highlighting for JSON/HTML content. Accepts prism-themes identifier or remote CSS URL

## pdf

- Type: `<boolean>`
- Default: `false`

Generates PDF. Default `mediaType` becomes `'print'`.

Sub-parameters:

- `pdf.format` (string): `'A4'`, `'Letter'`, `'Legal'`, etc.
- `pdf.landscape` (boolean, default `false`)
- `pdf.scale` (number): Scale factor
- `pdf.margin` (string/object): e.g., `'0.4cm'` or `{ top: '1cm', bottom: '1cm' }`
- `pdf.pageRanges` (string): e.g., `'1-3'`
- `pdf.width` (string): Override width
- `pdf.height` (string): Override height

## embed

- Type: `<string>`

Returns a specific data field directly as the response body with matching content-type headers. Use dot notation: `'screenshot.url'`, `'pdf.url'`, `'image.url'`, `'logo.url'`, `'video.url'`.

Transforms the API from a JSON endpoint into a direct asset server. Useful in `<img>` tags, CSS `background-image`, Markdown, and Open Graph meta tags.

## video

- Type: `<boolean>`
- Default: `false`

Detects browser-friendly video source URL. Adds `data.video` with `url`, `type`, `duration`, `size`, `width`, `height`, `duration_pretty`, `size_pretty`.

## audio

- Type: `<boolean>`
- Default: `false`

Detects browser-friendly audio source URL. Adds `data.audio` with `url`, `type`, `duration`, `size`, `duration_pretty`, `size_pretty`.

## iframe

- Type: `<boolean>` | `<object>`
- Default: `false`

Detects oEmbed content. Returns `data.iframe` with `html` and `scripts` subfields. Supports oEmbed consumer params like `maxWidth`, `maxHeight`.

## insights

- Type: `<boolean>` | `<object>`
- Default: `false`

Returns `data.insights` with:

- `technologies`: Wappalyzer-powered tech stack detection
- `lighthouse`: Full Lighthouse audit report

Disable individually: `insights: { lighthouse: true, technologies: false }`

## palette

- Type: `<boolean>`
- Default: `false`

Adds per-image color info: `palette` (hex array, dominant to least), `background_color` (WCAG-compliant), `color`, `alternative_color`.

## filter

- Type: `<string>`

Comma-separated list of fields to return. Supports dot notation. Reduces payload size.

Example: `filter: 'url,title'`

## prerender

- Type: `<boolean>` | `<string>`
- Default: `'auto'`
- Values: `'auto'`, `true`, `false`

Controls fetch method:

- `true`: Headless browser (needed for SPAs)
- `false`: Simple HTTP GET (faster)
- `'auto'`: Service auto-detects

Response headers: `x-fetch-mode` (`'prerender'` or `'fetch'`), `x-fetch-time`.

## function

- Type: `<string>`

Executes JavaScript with headless browser access. Receives: `{ page, html, response }` plus query params.
- `page`: Puppeteer Page object
- `html`: Target URL HTML markup
- `response`: Puppeteer HTTPResponse

Compression: Prefix with `lz#`, `gz#`, or `br#` for compressed function bodies.

Allowed NPM packages: `@aws-sdk/client-s3`, `@mozilla/readability`, `cheerio`, `extract-email-address`, `got`, `ioredis`, `jsdom`, `lodash`, `metascraper`, `p-reflect`, `p-retry`, `p-timeout`, `path`, `url`, `youtube-dl-exec`.

## device

- Type: `<string>`
- Default: `'macbook pro 13'`

Emulates device viewport, user agent, and screen resolution. Case-insensitive. Supports: iPhone (4-13 series), iPad, iPad Pro, Galaxy series, Pixel series, Macbook Pro (13/15/16), iMac series, and many more.

## viewport

- Type: `<object>`

Custom browser viewport: `width`, `height`, `deviceScaleFactor`, `isMobile`, `hasTouch`, `isLandscape`. Merged with device defaults when partially specified.

## Browser Interaction

- `click` (string/string[]): Click CSS selector(s)
- `scroll` (string): Scroll to CSS selector
- `waitUntil` (string/string[], default `'auto'`): Navigation events: `'load'`, `'domcontentloaded'`, `'networkidle0'`, `'networkidle2'`
- `waitForSelector` (string): Wait for CSS selector to appear
- `waitForTimeout` (string/number): Wait fixed duration (e.g., `'3s'`, `3000`)
- `timeout` (string/number, default `28s`): Max request lifecycle

## Content Injection

- `scripts` (string/string[]): Inject `<script>` — inline code or absolute URLs
- `modules` (string/string[]): Inject `<script type="module">`
- `styles` (string/string[]): Inject `<style>` — inline CSS or absolute URLs

## Rendering Options

- `javascript` (boolean, default `true`): Enable/disable JS execution
- `animations` (boolean, default `false`): Enable CSS animations/transitions
- `colorScheme` (string, default `'no-preference'`): `'light'` or `'dark'`
- `mediaType` (string, default `'screen'`): `'screen'` or `'print'`
- `adblock` (boolean, default `true`): Block ads/trackers

## Cache & Performance

- `ttl` (string/number, default `'24h'`): Cache lifetime (1m–31d). Aliases: `'min'` (1m), `'max'` (31d). **Pro only.**
- `staleTtl` (string/number/boolean, default `false`): Stale-while-revalidate. Set `staleTtl=0` to always revalidate in background. **Pro only.**
- `force` (boolean, default `false`): Bypass cache entirely
- `retry` (number, default `2`): Exponential backoff retries
- `ping` (boolean/object, default `true`): Verify URL reachability. Disable per-type: `ping: { audio: false }`

## Pro-Only Parameters

- `headers` (object): Custom HTTP headers for target URL. Use `x-api-header-*` prefix for sensitive headers (not exposed in URL)
- `proxy` (string/object): Custom proxy or automatic proxy resolution. Reflected in `x-fetch-mode: prerender-proxy`
- `filename` (string): Custom filename for generated assets
- `ttl`, `staleTtl`: Cache control

## Compression

Brotli (`br`) and gzip (`gz`) supported. Set `Accept-Encoding` header. MQL enables compression by default. Verify via `content-encoding` response header.

## Rate Limiting

Free: 50 reqs/day. Headers: `x-rate-limit-limit`, `x-rate-limit-remaining`, `x-rate-limit-reset`. No throttling — parallel requests allowed within quota. HTTP 429 when exceeded.

## Error Codes (Complete)

| Code            | Message                      | Solution                                        |
| --------------- | ---------------------------- | ----------------------------------------------- |
| EAUTH           | Invalid API key              | Check `x-api-key` header                        |
| ERATE           | Daily rate limit reached     | Wait for reset or upgrade                       |
| EBRWSRTIMEOUT   | Browser navigation timeout   | Reduce page complexity or increase timeout      |
| EFATAL          | Generic failure              | Contact support with request `id`               |
| EFATALCLIENT    | Network unreachable          | Check connectivity to endpoint                  |
| EFORBIDDENURL   | Forbidden IP range           | Only unicast IPs allowed                        |
| EINVALURL       | Invalid URL                  | Must be WHATWG URL with protocol                |
| EINVALPROXY     | Invalid proxy URL            | Must be parseable WHATWG URL                    |
| EINVALTTL       | Invalid TTL                  | Must be between 1m and 31d                      |
| EINVALSTTL      | Invalid staleTtl             | Must be less than current TTL                   |
| EINVALOVERLAYBG | Invalid gradient             | Follow CSS gradient syntax                      |
| EMAXREDIRECTS   | Too many redirects           | Max 10 hops allowed                             |
| EPRO            | Auth on free endpoint        | Use pro.microlink.io for authenticated requests |
| EPROXY          | Proxy requires Pro           | Upgrade plan                                    |
| EPROXYNEEDED    | Anti-bot protection detected | Upgrade to Pro plan                             |
| EFILENAME       | Filename requires Pro        | Upgrade plan                                    |
| EHEADERS        | Headers requires Pro         | Upgrade plan                                    |
| ETIMEOUT        | Request timeout              | Resolve before timeout limit                    |
| ETTL            | TTL requires Pro             | Upgrade plan                                    |
| ESTTL           | staleTtl requires Pro        | Upgrade plan                                    |

## Response Headers

| Header                   | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `x-pricing-plan`         | `'free'` or `'pro'`                                |
| `x-cache-status`         | `'HIT'`, `'MISS'`, `'BYPASS'`                      |
| `x-cache-ttl`            | Cache TTL in milliseconds                          |
| `x-fetch-mode`           | `'fetch'`, `'prerender'`, `'skipped'`, `'proxy-*'` |
| `x-fetch-time`           | Time spent fetching                                |
| `x-response-time`        | Total response time                                |
| `x-request-id`           | Unique request identifier                          |
| `x-rate-limit-limit`     | Max requests per window                            |
| `x-rate-limit-remaining` | Remaining requests                                 |
| `x-rate-limit-reset`     | Reset time (UTC epoch seconds)                     |
| `cf-cache-status`        | CloudFlare edge cache status                       |
