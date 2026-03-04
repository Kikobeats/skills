---
name: keyvhq
description: Build and operate key-value caching with @keyvhq/core and official storage adapters. Use when users need to add a cache layer to a Node.js module, store data with TTL expiration, choose between storage backends (in-memory, Redis, Mongo, MySQL, PostgreSQL, SQLite), implement cache-aside patterns with namespace isolation, or memoize function results.
---

# keyvhq

`keyvhq` provides `@keyvhq/core` plus adapters and decorators for building a simple key-value cache with optional persistence.

## Quick Start

Install core:

```bash
npm install @keyvhq/core
```

Use in-memory storage:

```js
const Keyv = require('@keyvhq/core')

const cache = new Keyv()
await cache.set('greeting', 'hello', 1000)
const value = await cache.get('greeting')
```

Use a Redis adapter:

```bash
npm install @keyvhq/core @keyvhq/redis
```

```js
const Keyv = require('@keyvhq/core')
const KeyvRedis = require('@keyvhq/redis')

const cache = new Keyv({
  store: new KeyvRedis('redis://user:pass@localhost:6379'),
  namespace: 'app-cache'
})
```

## Recommended Workflow

1. Start with `@keyvhq/core` in memory for local development.
2. Add a storage adapter only when persistence or shared cache is needed.
3. Set `namespace` per module to avoid collisions and accidental global clears.
4. Use TTL in milliseconds, either globally (`ttl` option) or per `set`.
5. Keep cache operations behind one service/module so adapter changes stay isolated.

## Core API

- `new Keyv(options)`: create instance.
- `set(key, value, ttl?)`: store value, optional TTL in milliseconds.
- `get(key)`: read value.
- `has(key)`: check existence.
- `delete(key)`: remove one key.
- `clear()`: remove all keys in the current namespace.
- `iterator()`: async iterate entries (avoid for large datasets).

## Common Options

- `store`: adapter instance (default is in-memory `Map`).
- `namespace`: key namespace to isolate data.
- `ttl`: default TTL in milliseconds.
- `serialize` / `deserialize`: custom serialization for advanced types.
- `raw`: return internal stored object including expiry metadata.

## Adapter Selection

Choose an official adapter based on runtime and infrastructure:

- `@keyvhq/redis`: low-latency shared cache, easy horizontal scaling.
- `@keyvhq/mongo`: Mongo-backed cache persistence.
- `@keyvhq/mysql`: MySQL or MariaDB-backed storage.
- `@keyvhq/postgres`: PostgreSQL-backed storage.
- `@keyvhq/sqlite`: file-based local persistence.
- `@keyvhq/file`: lightweight JSON/file storage.
- `keyv-s3`: S3 object storage adapter for large, low-cost cache persistence.

## Connector Setup Snippets

Use one connector at a time as `store`:

### Redis (`@keyvhq/redis`)

```bash
npm install @keyvhq/core @keyvhq/redis
```

```js
const Keyv = require('@keyvhq/core')
const KeyvRedis = require('@keyvhq/redis')

const cache = new Keyv({
  store: new KeyvRedis('redis://user:pass@localhost:6379'),
  namespace: 'app-cache'
})
```

### Mongo (`@keyvhq/mongo`)

```bash
npm install @keyvhq/core @keyvhq/mongo
```

```js
const Keyv = require('@keyvhq/core')
const KeyvMongo = require('@keyvhq/mongo')

const cache = new Keyv({
  store: new KeyvMongo('mongodb://user:pass@localhost:27017/dbname'),
  namespace: 'app-cache'
})
```

### MySQL (`@keyvhq/mysql`)

```bash
npm install @keyvhq/core @keyvhq/mysql
```

```js
const Keyv = require('@keyvhq/core')
const KeyvMySQL = require('@keyvhq/mysql')

const cache = new Keyv({
  store: new KeyvMySQL('mysql://user:pass@localhost:3306/dbname'),
  namespace: 'app-cache'
})
```

### PostgreSQL (`@keyvhq/postgres`)

```bash
npm install @keyvhq/core @keyvhq/postgres
```

```js
const Keyv = require('@keyvhq/core')
const KeyvPostgres = require('@keyvhq/postgres')

const cache = new Keyv({
  store: new KeyvPostgres('postgresql://user:pass@localhost:5432/dbname'),
  namespace: 'app-cache'
})
```

### SQLite (`@keyvhq/sqlite`)

```bash
npm install @keyvhq/core @keyvhq/sqlite
```

```js
const Keyv = require('@keyvhq/core')
const KeyvSQLite = require('@keyvhq/sqlite')

const cache = new Keyv({
  store: new KeyvSQLite('sqlite://path/to/database.sqlite'),
  namespace: 'app-cache'
})
```

### File (`@keyvhq/file`)

```bash
npm install @keyvhq/core @keyvhq/file
```

```js
const Keyv = require('@keyvhq/core')
const KeyvFile = require('@keyvhq/file')

const cache = new Keyv({
  store: new KeyvFile({ filename: './.cache/keyv.json' }),
  namespace: 'app-cache'
})
```

### S3 (`keyv-s3`)

```bash
npm install @keyvhq/core keyv-s3 @aws-sdk/client-s3
```

```js
const Keyv = require('@keyvhq/core')
const KeyvS3 = require('keyv-s3')

const cache = new Keyv({
  store: new KeyvS3({
    region: 'us-east-1',
    namespace: 'app-cache',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  })
})
```

## Decorators

Use decorators for specialized behavior:

- `@keyvhq/compress`: compress stored payloads.
- `@keyvhq/memoize`: memoize function calls through Keyv.
- `@keyvhq/multi`: combine local and remote stores.
- `@keyvhq/offline`: add offline-aware behavior.
- `@keyvhq/stats`: collect usage metrics over time.

## Integration Pattern For Libraries

When adding cache support to a module:

1. Expose a `cache` option in module configuration.
2. Accept any Keyv-compatible store.
3. Default to in-memory behavior when no cache is passed.
4. Set a dedicated `namespace` before calling `clear()`.

```js
function createClient({ cache = new Keyv({ namespace: 'my-module' }) } = {}) {
  return {
    async getOrFetch(key, fetcher, ttl) {
      const cached = await cache.get(key)
      if (cached !== undefined) return cached

      const value = await fetcher()
      await cache.set(key, value, ttl)
      return value
    }
  }
}
```

## Reliability Notes

- TTL values are milliseconds.
- `clear()` without a namespace can wipe all entries in that store.
- Storage adapter errors should be handled close to cache boundaries.
- For bulk iteration or analytics, prefer native database tooling over `iterator()`.

## References

- Keyv monorepo: `https://github.com/microlinkhq/keyvhq`
- Root docs: `https://github.com/microlinkhq/keyvhq/blob/master/README.md`
- Keyv S3 adapter: `/Users/kikobeats/Projects/microlink/keyv-s3`
