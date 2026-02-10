# Turn a whole page into text

```js
const mql = require('@microlink/mql')

const { data } = await mql('https://example.com', {
  data: {
    content: { attr: 'text' }
  },
  meta: false
})

console.log(data.content)
```
