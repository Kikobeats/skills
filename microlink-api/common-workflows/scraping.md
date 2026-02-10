# Custom scraping with `data`

```js
const mql = require('@microlink/mql')

const { data } = await mql('https://news.ycombinator.com', {
  data: {
    headline: { selector: '.titleline > a', attr: 'text' },
    link: { selector: '.titleline > a', attr: 'href', type: 'url' }
  }
})

console.log(data.headline, data.link)
```
