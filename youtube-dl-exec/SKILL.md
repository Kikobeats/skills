---
name: youtube-dl-exec
description: Run yt-dlp from Node.js using youtube-dl-exec for metadata extraction and media downloads. Use when the user mentions youtube-dl-exec, yt-dlp automation, extracting video info, choosing formats, downloading subtitles, or controlling yt-dlp subprocesses from JavaScript.
---

# youtube-dl-exec

`youtube-dl-exec` is a Node.js wrapper around `yt-dlp` with promise and subprocess interfaces.

## Prerequisites

- Node.js `>= 18`.
- Python `>= 3.9` available as `python3`.
- Network access during install, unless binary download is skipped.

## Quick Start

Install:

```bash
npm install youtube-dl-exec
```

Get JSON metadata:

```js
const youtubedl = require('youtube-dl-exec')

const metadata = await youtubedl('https://www.youtube.com/watch?v=6xKWiCMKKJg', {
  dumpSingleJson: true,
  noWarnings: true,
  noCheckCertificates: true
})

console.log(metadata.title)
```

## Recommended Workflow

1. Run with `dumpSingleJson: true` first to inspect fields and available formats.
2. Pick explicit format/subtitle/output flags based on metadata.
3. Use `exec` for long-running downloads or progress streaming.
4. Set output paths up front and verify downloaded artifacts.

## Common Patterns

Metadata only:

```js
const youtubedl = require('youtube-dl-exec')

const info = await youtubedl('https://www.youtube.com/watch?v=6xKWiCMKKJg', {
  dumpSingleJson: true
})
```

Download best MP4 video+audio:

```js
const youtubedl = require('youtube-dl-exec')

await youtubedl('https://www.youtube.com/watch?v=6xKWiCMKKJg', {
  format: 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]',
  output: '%(title)s.%(ext)s'
})
```

Download subtitles:

```js
const youtubedl = require('youtube-dl-exec')

await youtubedl('https://www.youtube.com/watch?v=6xKWiCMKKJg', {
  writeSub: true,
  writeAutoSub: true,
  subLang: 'en.*',
  skipDownload: true
})
```

## Subprocess Control (`exec`)

Use `exec` to stream stdout/stderr and cancel safely:

```js
const youtubedl = require('youtube-dl-exec')

const subprocess = youtubedl.exec(
  'https://www.youtube.com/watch?v=6xKWiCMKKJg',
  { dumpSingleJson: true },
  { timeout: 30_000 }
)

subprocess.stdout.on('data', chunk => process.stdout.write(chunk))
subprocess.stderr.on('data', chunk => process.stderr.write(chunk))

const result = await subprocess
console.log(result)
```

## Custom Binary

Use a custom `yt-dlp` binary path when needed:

```js
const { create } = require('youtube-dl-exec')

const youtubedl = create('/absolute/path/to/yt-dlp')
const result = await youtubedl('https://example.com/video', { dumpSingleJson: true })
```

## Environment Variables

Configure install/runtime behavior:

- `YOUTUBE_DL_SKIP_DOWNLOAD`: Skip downloading `yt-dlp` during install.
- `YOUTUBE_DL_DIR`: Target directory for the binary.
- `YOUTUBE_DL_FILENAME`: Override binary filename.
- `YOUTUBE_DL_PLATFORM`: Force platform (`unix` or `win32`).
- `YOUTUBE_DL_HOST`: Override release endpoint used to fetch binaries.
- `YOUTUBE_DL_SKIP_PYTHON_CHECK`: Skip install-time Python check.
- `DEBUG=youtube-dl-exec*`: Enable debug logs for install flow.

## Troubleshooting

- `python3 not found`: install Python 3.9+ and ensure it is on `PATH`.
- Download/format errors: run metadata first and confirm format IDs.
- Rate limits from GitHub on install: set `GITHUB_TOKEN`/`GH_TOKEN`.
- Quoting issues in paths: always use absolute paths and safe templates for `output`.
