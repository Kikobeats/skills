# Metadata extraction

```js
const mql = require('@microlink/mql')

const { data } = await mql('https://example.com')
console.log(data.title, data.description, data.image?.url)
```
