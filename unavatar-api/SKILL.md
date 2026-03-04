---
name: unavatar-api
description: Resolve user avatars from 20+ platforms via a single API endpoint. Use when users need to display profile pictures from GitHub, X/Twitter, Instagram, or other platforms, look up avatars by email/username/domain/phone number, or add universal avatar resolution to user interfaces without integrating each provider individually.
---

# unavatar API

unavatar.io resolves user avatars from 20+ platforms via a single endpoint. Supports lookup by email, username, domain, or phone number.

## Endpoint

`https://unavatar.io`

## Quick Start

Resolve avatars by input type:

| Input    | Pattern                      | Example                                         |
| -------- | ---------------------------- | ----------------------------------------------- |
| email    | `/provider/user@example.com` | `https://unavatar.io/gravatar/user@example.com` |
| username | `/provider/username`         | `https://unavatar.io/github/kikobeats`          |
| domain   | `/domain.com`                | `https://unavatar.io/microlink.io`              |
| phone    | `/provider/phonenumber`      | `https://unavatar.io/whatsapp/34688638289`      |

Without a provider prefix, unavatar auto-resolves using all matching providers and returns the fastest successful result.

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

## Rate Limiting

Response headers:

- `x-rate-limit-limit`: Max requests per window
- `x-rate-limit-remaining`: Remaining requests
- `x-rate-limit-reset`: Reset time (UTC epoch seconds)

HTTP 429 when limit exceeded.

## Providers

Providers are grouped by input type. When no specific provider is given, all matching providers race and the fastest successful result wins.

| Provider   | email | username | domain | phone |
| ---------- | :---: | :------: | :----: | :---: |
| Bluesky    |       |    ✓     |        |       |
| DeviantArt |       |    ✓     |        |       |
| Dribbble   |       |    ✓     |        |       |
| DuckDuckGo |       |          |   ✓    |       |
| GitHub     |       |    ✓     |        |       |
| GitLab     |       |    ✓     |        |       |
| Google     |       |          |   ✓    |       |
| Gravatar   |   ✓   |          |        |       |
| Instagram  |       |    ✓     |        |       |
| Microlink  |       |          |   ✓    |       |
| OnlyFans   |       |    ✓     |        |       |
| Reddit     |       |    ✓     |        |       |
| SoundCloud |       |    ✓     |        |       |
| Spotify    |       |    ✓     |        |       |
| Substack   |       |    ✓     |        |       |
| Telegram   |       |    ✓     |        |       |
| TikTok     |       |    ✓     |        |       |
| Twitch     |       |    ✓     |        |       |
| Vimeo      |       |    ✓     |        |       |
| WhatsApp   |       |          |        |   ✓   |
| X/Twitter  |       |    ✓     |        |       |
| YouTube    |       |    ✓     |        |       |

### URI Format Providers

**Spotify** supports `type:id` format (default type: `user`):

- `user`: `/spotify/kikobeats`
- `artist`: `/spotify/artist:6sFIWsNpZYqbRiDnNOkZCA`
- `playlist`: `/spotify/playlist:37i9dQZF1DXcBWIGoYBM5M`
- `album`: `/spotify/album:4aawyAB9vmqN3uQ7FjRGTy`
- `show`: `/spotify/show:6UCtBYL29hRg064d4i5W2i`
- `episode`: `/spotify/episode:512ojhOuo1ktJprKbVcKyQ`
- `track`: `/spotify/track:11dFghVXANMlKmJXsNCbNl`

**WhatsApp** supports `type:id` format (default type: `phone`):

- `phone`: `/whatsapp/34612345678`
- `channel`: `/whatsapp/channel:0029VaABC1234abcDEF56789`
- `chat`: `/whatsapp/chat:ABC1234DEFghi`
- `group`: `/whatsapp/group:ABC1234DEFghi`

For individual provider examples, see [providers.md](providers.md).
