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

### Behance

Resolves against **behance.net**.

e.g., `https://unavatar.io/behance/vitormatosinhos`

### Bluesky

Resolves against **bsky.app**. Domain-style handles are supported.

e.g., `https://unavatar.io/bluesky/pfrazee.com`
e.g., `https://unavatar.io/bluesky/bsky.app`

### DeviantArt

Resolves against **deviantart.com**.

e.g., `https://unavatar.io/deviantart/spyed`

### Discord

Resolves against **discord.com**. Get a Discord server's icon by server name or server ID.

e.g., `https://unavatar.io/discord/lilnasx`
e.g., `https://unavatar.io/discord/uW6Hyf3E9r`

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

### Ko-fi

Resolves against **ko-fi.com**.

e.g., `https://unavatar.io/ko-fi/geekshock`

### LinkedIn

Resolves against **linkedin.com**. Supports `type:id` URI format (default: `user`).

| Type    | Example                                            |
| ------- | -------------------------------------------------- |
| user    | `https://unavatar.io/linkedin/user:wesbos`         |
| company | `https://unavatar.io/linkedin/company:microlinkhq` |

### Mastodon

Resolves against any Mastodon instance via the public account lookup API. Pass the handle as `user@server`.

e.g., `https://unavatar.io/mastodon/kpwags@hachyderm.io`

### Medium

Resolves against **medium.com**.

e.g., `https://unavatar.io/medium/juancalmaraz`

### OnlyFans

Resolves against **onlyfans.com**.

e.g., `https://unavatar.io/onlyfans/amandaribas`

### OpenStreetMap

Resolves against **openstreetmap.org**. Accepts a numeric user ID or a username.

e.g., `https://unavatar.io/openstreetmap/98672`
e.g., `https://unavatar.io/openstreetmap/Terence%20Eden`

### Patreon

Resolves against **patreon.com**.

e.g., `https://unavatar.io/patreon/gametestro`

### Pinterest

Resolves against **pinterest.com**.

e.g., `https://unavatar.io/pinterest/ohjoy`

### Printables

Resolves against **printables.com**.

e.g., `https://unavatar.io/printables/DukeDoks`

### Reddit

Resolves against **reddit.com**.

e.g., `https://unavatar.io/reddit/kikobeats`

### Snapchat

Resolves against **snapchat.com**.

e.g., `https://unavatar.io/snapchat/teddysdaytoday`

### SoundCloud

Resolves against **soundcloud.com**.

e.g., `https://unavatar.io/soundcloud/gorillaz`

### Spotify

Resolves against **open.spotify.com**. Supports `type:id` URI format (default: `user`).

| Type     | Example                                                       |
| -------- | ------------------------------------------------------------- |
| user     | `https://unavatar.io/spotify/kikobeats`                       |
| artist   | `https://unavatar.io/spotify/artist:1vCWHaC5f2uS3yhpwWbIA6`  |
| playlist | `https://unavatar.io/spotify/playlist:37i9dQZF1DZ06evO3KIUZW` |
| album    | `https://unavatar.io/spotify/album:7I9Wh2IgvI3Nnr8Z1ZSWby`   |
| show     | `https://unavatar.io/spotify/show:0iykbhPkRz53QF8LR2UyNO`    |
| episode  | `https://unavatar.io/spotify/episode:1YNm34Q8ofC2CDTYYLaFMj`  |
| track    | `https://unavatar.io/spotify/track:4OROzZUy6gOWN4UGQVaZMF`   |

### Substack

Resolves against **substack.com**.

e.g., `https://unavatar.io/substack/bankless`

### Telegram

Resolves against **telegram.com**.

e.g., `https://unavatar.io/telegram/drsdavidsoft`

### Threads

Resolves against **threads.net**.

e.g., `https://unavatar.io/threads/zuck`

### TikTok

Resolves against **tiktok.com**. No authentication or API tokens needed.

e.g., `https://unavatar.io/tiktok/carlosazaustre`

### Twitch

Resolves against **twitch.tv**.

e.g., `https://unavatar.io/twitch/midudev`

### Vimeo

Resolves against **vimeo.com**.

e.g., `https://unavatar.io/vimeo/ladieswithlenses`

### WhatsApp

Resolves against **whatsapp.com**. Supports `type:id` URI format.

| Type    | Example                                                            |
| ------- | ------------------------------------------------------------------ |
| channel | `https://unavatar.io/whatsapp/channel:0029VaARuQ7KwqSXh9fiMc0m`   |
| chat    | `https://unavatar.io/whatsapp/chat:D2FFycjQXrEIKG8qQjbwZz`        |

### X/Twitter

Resolves against **x.com**.

e.g., `https://unavatar.io/x/kikobeats`

### YouTube

Resolves against **youtube.com**. Accepts handle, legacy username, or channel ID. Input starting with `UC` and 24 characters long is treated as a channel ID.

e.g., `https://unavatar.io/youtube/casey`
e.g., `https://unavatar.io/youtube/UC_x5XG1OV2P6uZZ5FSM9Ttw`

## Email Providers

### Gravatar

Resolves against **gravatar.com**.

e.g., `https://unavatar.io/gravatar/hello@microlink.io`

## Domain Providers

### DuckDuckGo

Resolves using **duckduckgo.com**. Useful as a fallback when a domain doesn't expose its favicon directly.

e.g., `https://unavatar.io/duckduckgo/microsoft.com`

### Google

Resolves using **google.com**.

e.g., `https://unavatar.io/google/stremio.com`

### Microlink

Extracts the logo or representative image from any URL. The page is rendered and the best available image is selected.

e.g., `https://unavatar.io/microlink/microlink.io`
