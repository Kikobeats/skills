---
name: unavatar-api
description: Resolve user avatars from 40+ platforms via a single API endpoint. Use when users need to display profile pictures from GitHub, X/Twitter, Instagram, Apple Music, or other platforms, look up avatars by email/username/domain, or add universal avatar resolution to user interfaces without integrating each provider individually.
---

# unavatar API

unavatar.io resolves user avatars from 40+ platforms via a single endpoint. Supports lookup by email, username, or domain. For email-shaped input with no provider prefix, the API auto-resolves in order: **Gravatar**, then **GitHub**.

## Endpoint

`https://unavatar.io`

## Quick Start

| Input    | Pattern                      | Example                                          |
| -------- | ---------------------------- | ------------------------------------------------ |
| email (auto) | `/user@example.com`      | `https://unavatar.io/hello@microlink.io` (Gravatar → GitHub) |
| email    | `/gravatar/user@example.com` | `https://unavatar.io/gravatar/hello@microlink.io` |
| email    | `/github/user@example.com` | `https://unavatar.io/github/sindresorhus@gmail.com` |
| username | `/provider/username`         | `https://unavatar.io/github/kikobeats`           |
| domain   | `/provider/domain.com`       | `https://unavatar.io/google/reddit.com`          |

Use `/:provider/:key` for a specific provider, or pass an email as the only path segment for automatic resolution. Details: [unavatar.io/email](https://unavatar.io/email).

## Authentication

- **Free**: No auth required, 50 requests/day per IP
- **Pro**: Pass `x-api-key` header, usage-based billing at $0.001/token

```bash
curl -H "x-api-key: YOUR_API_KEY" https://unavatar.io/instagram/kikobeats
```

### Proxy Tiers & Token Cost

| Proxy tier  | Tokens |  Cost  |
| ----------- | :----: | :----: |
| Origin      |   1    | $0.001 |
| Datacenter  |   +2   | $0.003 |
| Residential |   +4   | $0.007 |

Response headers: `x-proxy-tier`, `x-unavatar-cost`, `x-pricing-tier`.

### Key Management

- **Usage**: `curl -H "x-api-key: KEY" https://unavatar.io/key/usage`
- **Rotate**: `curl -H "x-api-key: KEY" https://unavatar.io/key/rotate`

## Query Parameters

### ttl

- Type: `number` | `string`
- Default: `'24h'`
- Range: `'1h'` to `'28d'`

Cache duration for the resolved avatar. The avatar is considered fresh until TTL expiration, then recomputed on next request.

e.g., `https://unavatar.io/kikobeats?ttl=1h`

### fallback

- Type: `string` | `boolean`

Custom fallback image when avatar can't be resolved. Accepts:

- URL to external avatar service (boringavatars.com, avatar.vercel.sh)
- URL to static image
- Base64 encoded image (e.g., transparent 1x1 pixel GIF)
- `false` to disable fallback (returns 404 instead)

```
https://unavatar.io/github/37t?fallback=https://avatar.vercel.sh/37t?size=400
https://unavatar.io/github/37t?fallback=false
https://unavatar.io/github/37t?fallback=data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==
```

### json

- Type: `boolean`

Returns JSON payload instead of image content.

e.g., `https://unavatar.io/kikobeats?json`

## Response Format

When `json=true` is passed, responses follow a predictable shape:

| Field   | Type         | Present in                | Description                                     |
| ------- | ------------ | ------------------------- | ----------------------------------------------- |
| status  | string       | all JSON responses        | One of: `success`, `fail`, `error`.             |
| message | string       | all JSON responses        | Human-readable summary for display/logging.     |
| data    | object       | success                   | Response payload for successful requests.       |
| code    | string       | fail, error               | Stable machine-readable error code.             |
| more    | string (URL) | most fail/error responses | Documentation URL with troubleshooting details. |
| report  | string       | some error responses      | Support contact channel (e.g., mailto:).        |

## Response Headers

| Header                 | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| x-pricing-tier         | `free` or `pro` — the plan used for this request        |
| x-timestamp            | Server timestamp when request was received              |
| x-unavatar-cost        | Token cost of the request (avatar routes only)          |
| x-proxy-tier           | Proxy tier used: `origin`, `datacenter`, or `residential` |
| x-rate-limit-limit     | Maximum requests allowed per window (free tier only)    |
| x-rate-limit-remaining | Remaining requests in current window (free tier only)   |
| x-rate-limit-reset     | UTC epoch seconds when window resets (free tier only)   |
| retry-after            | Seconds until rate limit resets (only on 429 responses) |

## Response Errors

Client-side issues return `status: "fail"` (HTTP 4xx). Service-side issues return `status: "error"` (HTTP 5xx).

| HTTP | Code               | Typical trigger                           |
| ---- | ------------------ | ----------------------------------------- |
| 400  | ESESSIONID         | Missing session_id in /checkout/success   |
| 400  | ESESSION           | Checkout session not paid or not found    |
| 400  | ESIGNATURE         | Missing stripe-signature header           |
| 400  | EWEBHOOK           | Invalid/failed Stripe webhook processing  |
| 400  | EAPIKEYVALUE       | Missing apiKey query parameter            |
| 400  | EAPIKEYLABEL       | Missing label query parameter             |
| 401  | EEMAIL             | Invalid or missing authenticated email    |
| 401  | EUSERUNAUTHORIZED  | Missing/invalid auth for protected routes |
| 401  | EAPIKEY            | Invalid x-api-key                         |
| 403  | ETTL               | Custom ttl requested without pro plan     |
| 403  | EPRO               | Provider restricted to pro plan           |
| 404  | ENOTFOUND          | Route not found                           |
| 404  | EAPIKEYNOTFOUND    | API key not found                         |
| 409  | EAPIKEYEXISTS      | Custom API key already exists             |
| 409  | EAPIKEYLABELEXISTS | API key label already exists              |
| 409  | EAPIKEYMIN         | Attempt to remove last remaining key      |
| 429  | ERATE              | Free-tier daily rate limit exceeded       |
| 500  | ECHECKOUT          | Stripe checkout session creation failed   |
| 500  | EAPIKEYFAILED      | API key retrieval after checkout failed   |
| 500  | EINTERNAL          | Unexpected internal server failure        |

## Providers

Providers are grouped by input type.

| Provider      | email | username | domain |
| ------------- | :---: | :------: | :----: |
| Apple Music   |       |    ✓     |        |
| Behance       |       |    ✓     |        |
| Bluesky       |       |    ✓     |        |
| DeviantArt    |       |    ✓     |        |
| Discord       |       |    ✓     |        |
| Dribbble      |       |    ✓     |        |
| DuckDuckGo    |       |          |   ✓    |
| GitHub        |   ✓   |    ✓     |        |
| GitLab        |       |    ✓     |        |
| Google        |       |          |   ✓    |
| Gravatar      |   ✓   |          |        |
| Instagram     |       |    ✓     |        |
| Ko-fi         |       |    ✓     |        |
| LinkedIn      |       |    ✓     |        |
| Mastodon      |       |    ✓     |        |
| Medium        |       |    ✓     |        |
| Microlink     |       |          |   ✓    |
| OnlyFans      |       |    ✓     |        |
| OpenStreetMap |       |    ✓     |        |
| Patreon       |       |    ✓     |        |
| Pinterest     |       |    ✓     |        |
| Printables    |       |    ✓     |        |
| Reddit        |       |    ✓     |        |
| Snapchat      |       |    ✓     |        |
| SoundCloud    |       |    ✓     |        |
| Spotify       |       |    ✓     |        |
| Substack      |       |    ✓     |        |
| Telegram      |       |    ✓     |        |
| Threads       |       |    ✓     |        |
| TikTok        |       |    ✓     |        |
| Twitch        |       |    ✓     |        |
| Vimeo         |       |    ✓     |        |
| WhatsApp      |       |    ✓     |        |
| X/Twitter     |       |    ✓     |        |
| YouTube       |       |    ✓     |        |

### URI Format Providers

**Apple Music** supports `type:id` format. Without explicit type, it searches `artist` then `song`:

- by name: `/apple-music/daft%20punk`
- `artist`: `/apple-music/artist:daft%20punk` or `/apple-music/artist:5468295`
- `album`: `/apple-music/album:discovery` or `/apple-music/album:78691923`
- `song`: `/apple-music/song:harder%20better%20faster%20stronger` or `/apple-music/song:697195787`

**Spotify** supports `type:id` format (default type: `user`):

- `user`: `/spotify/kikobeats`
- `artist`: `/spotify/artist:6sFIWsNpZYqbRiDnNOkZCA`
- `playlist`: `/spotify/playlist:37i9dQZF1DXcBWIGoYBM5M`
- `album`: `/spotify/album:4aawyAB9vmqN3uQ7FjRGTy`
- `show`: `/spotify/show:6UCtBYL29hRg064d4i5W2i`
- `episode`: `/spotify/episode:512ojhOuo1ktJprKbVcKyQ`
- `track`: `/spotify/track:11dFghVXANMlKmJXsNCbNl`

**LinkedIn** supports `type:id` format (default type: `user`):

- `user`: `/linkedin/user:wesbos`
- `company`: `/linkedin/company:microlinkhq`

**WhatsApp** supports `type:id` format:

- `channel`: `/whatsapp/channel:0029VaARuQ7KwqSXh9fiMc0m`
- `chat`: `/whatsapp/chat:D2FFycjQXrEIKG8qQjbwZz`

**YouTube** accepts handle, legacy username, or channel ID. Input starting with `UC` and 24 characters long is treated as a channel ID:

- handle: `/youtube/casey`
- channel ID: `/youtube/UC_x5XG1OV2P6uZZ5FSM9Ttw`

For individual provider examples, see [providers.md](providers.md).
