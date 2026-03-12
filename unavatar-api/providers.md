# unavatar Provider Reference

Individual provider details and example URLs. See SKILL.md for overview.

## Username Providers

### Apple Music

Get artwork for any Apple Music artist, album, or song. Search by name or look up by numeric Apple Music ID. Supports `type:id` URI format; without explicit type, searches `artist` then `song`.

| Type   | Example                                                                      |
| ------ | ---------------------------------------------------------------------------- |
| name   | `https://unavatar.io/apple-music/daft%20punk`                                |
| artist | `https://unavatar.io/apple-music/artist:daft%20punk` or `artist:5468295`     |
| album  | `https://unavatar.io/apple-music/album:discovery` or `album:78691923`        |
| song   | `https://unavatar.io/apple-music/song:harder%20better%20faster%20stronger` or `song:697195787` |

### Bluesky

Resolves against **bsky.app**. Domain-style handles are supported.

e.g., `https://unavatar.io/bluesky/pfrazee.com`
e.g., `https://unavatar.io/bluesky/bsky.app`

### DeviantArt

Resolves against **deviantart.com**.

e.g., `https://unavatar.io/deviantart/spyed`

### Dribbble

Resolves against **dribbble.com**.

e.g., `https://unavatar.io/dribbble/omidnikrah`

### GitHub

Resolves against **github.com**. Works with users and organizations.

e.g., `https://unavatar.io/github/mdo`
e.g., `https://unavatar.io/github/vercel`

### GitLab

Resolves against **gitlab.com**. Works with users and groups.

e.g., `https://unavatar.io/gitlab/sytses`
e.g., `https://unavatar.io/gitlab/inkscape`

### Instagram

Resolves against **instagram.com**. No authentication or API tokens needed.

e.g., `https://unavatar.io/instagram/willsmith`

### OnlyFans

Resolves against **onlyfans.com**.

e.g., `https://unavatar.io/onlyfans/amandaribas`

### OpenStreetMap

Resolves against **openstreetmap.org**. Accepts a numeric user ID or a username.

e.g., `https://unavatar.io/openstreetmap/98672`
e.g., `https://unavatar.io/openstreetmap/Terence%20Eden`

### Patreon

Resolves against **patreon.com**.

e.g., `https://unavatar.io/patreon/kikobeats`

### Reddit

Resolves against **reddit.com**.

e.g., `https://unavatar.io/reddit/kikobeats`

### SoundCloud

Resolves against **soundcloud.com**.

e.g., `https://unavatar.io/soundcloud/gorillaz`

### Spotify

Resolves against **open.spotify.com**. Supports `type:id` URI format (default: `user`).

| Type     | Example                                                       |
| -------- | ------------------------------------------------------------- |
| user     | `https://unavatar.io/spotify/kikobeats`                       |
| artist   | `https://unavatar.io/spotify/artist:6sFIWsNpZYqbRiDnNOkZCA`  |
| playlist | `https://unavatar.io/spotify/playlist:37i9dQZF1DXcBWIGoYBM5M` |
| album    | `https://unavatar.io/spotify/album:4aawyAB9vmqN3uQ7FjRGTy`   |
| show     | `https://unavatar.io/spotify/show:6UCtBYL29hRg064d4i5W2i`    |
| episode  | `https://unavatar.io/spotify/episode:512ojhOuo1ktJprKbVcKyQ`  |
| track    | `https://unavatar.io/spotify/track:11dFghVXANMlKmJXsNCbNl`   |

### Substack

Resolves against **substack.com**.

e.g., `https://unavatar.io/substack/bankless`

### Telegram

Resolves against **telegram.com**.

e.g., `https://unavatar.io/telegram/drsdavidsoft`

### TikTok

Resolves against **tiktok.com**. No authentication or API tokens needed.

e.g., `https://unavatar.io/tiktok/carlosazaustre`

### Twitch

Resolves against **twitch.tv**.

e.g., `https://unavatar.io/twitch/midudev`

### Vimeo

Resolves against **vimeo.com**.

e.g., `https://unavatar.io/vimeo/staff`

### X/Twitter

Resolves against **x.com**.

e.g., `https://unavatar.io/x/kikobeats`

### YouTube

Resolves against **youtube.com**. Accepts handle, legacy username, or channel ID. Input starting with `UC` and 24 characters long is treated as a channel ID.

e.g., `https://unavatar.io/youtube/casey`
e.g., `https://unavatar.io/youtube/@casey`
e.g., `https://unavatar.io/youtube/UC_x5XG1OV2P6uZZ5FSM9Ttw`

## Email Providers

### Gravatar

Resolves against **gravatar.com**.

e.g., `https://unavatar.io/gravatar/hello@microlink.io`

## Domain Providers

### DuckDuckGo

Resolves using **duckduckgo.com**. Useful as a fallback when a domain doesn't expose its favicon directly.

e.g., `https://unavatar.io/duckduckgo/gummibeer.dev`

### Google

Resolves using **google.com**.

e.g., `https://unavatar.io/google/netflix.com`

### Microlink

Extracts the logo or representative image from any URL. The page is rendered and the best available image is selected.

e.g., `https://unavatar.io/microlink/microlink.io`

## Phone Providers

### WhatsApp

Resolves against **whatsapp.com**. Supports `type:id` URI format (default: `phone`).

| Type    | Example                                                         |
| ------- | --------------------------------------------------------------- |
| phone   | `https://unavatar.io/whatsapp/34612345678`                      |
| channel | `https://unavatar.io/whatsapp/channel:0029VaABC1234abcDEF56789` |
| chat    | `https://unavatar.io/whatsapp/chat:ABC1234DEFghi`               |
| group   | `https://unavatar.io/whatsapp/group:ABC1234DEFghi`              |
