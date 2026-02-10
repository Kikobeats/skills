# PDF generation

```js
const mql = require('@microlink/mql')

const { data } = await mql('https://example.com', {
  pdf: { format: 'A4', landscape: false },
  meta: false
})

console.log(data.pdf.url)
```
