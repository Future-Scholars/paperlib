const got = require('got')
import { getProxy } from 'src/js/pipline/localproxy'

async function fromCrossref (paperMeta) {
  if (paperMeta.hasDOI()) {
    return paperMeta
  }
  if (!paperMeta.hasTitle()) {
    return paperMeta
  }
  let res
  try {
    res = await got('https://api.crossref.org/works?query.bibliographic=' + paperMeta.title, {
      agent: getProxy()
    })
  } catch (error) {
    console.error('Crossref request error.')
    return paperMeta
  }
  const title = paperMeta.title.toLowerCase()
  const queryPapers = JSON.parse(res.body).message.items
  for (let i = 0; i < 10; i++) {
    if (queryPapers[i] && queryPapers[i].title && title.indexOf(queryPapers[i].title[0].toLowerCase()) !== -1) {
      paperMeta.doi = queryPapers[i].DOI
    }
  }
  return paperMeta
}

export default fromCrossref
