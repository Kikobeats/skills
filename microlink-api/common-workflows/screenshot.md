# Screenshot generation

```js
const mql = require('@microlink/mql')

const { data } = await mql('https://example.com', {
  screenshot: { fullPage: true, type: 'png' },
  meta: false
})

console.log(data.screenshot.url)
```
