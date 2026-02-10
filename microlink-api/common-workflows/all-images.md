# Extract all images

```js
const mql = require('@microlink/mql')

const { data } = await mql('https://example.com', {
  data: {
    images: { selectorAll: 'img[src]', attr: 'src', type: 'url' }
  },
  meta: false
})

console.log(data.images)
```
