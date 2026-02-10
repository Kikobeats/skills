# Turn a whole page into markdown

```js
const mql = require('@microlink/mql')

const { data } = await mql('https://example.com', {
  data: {
    content: { attr: 'markdown' }
  },
  meta: false
})

console.log(data.content)
```
