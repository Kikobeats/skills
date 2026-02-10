# Extract all links

```js
const mql = require('@microlink/mql')

const { data } = await mql('https://example.com', {
  data: {
    links: { selectorAll: 'a[href]', attr: 'href', type: 'url' }
  },
  meta: false
})

console.log(data.links)
```
