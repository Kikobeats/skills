# Turn a whole page into HTML

```js
const mql = require('@microlink/mql')

const { data } = await mql('https://example.com', {
  data: {
    content: { attr: 'html' }
  },
  meta: false
})

console.log(data.content)
```
