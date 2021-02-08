const got = require('got')
import { getProxy } from 'src/js/pipline/localproxy'

async function fromDOI (paperMeta) {
  if (paperMeta.completed) {
    return paperMeta
  }
  if (paperMeta.doi === null) {
    return paperMeta
  }
  let res
  const proxy = getProxy()
  try {
    res = await got('https://dx.doi.org/' + paperMeta.doi, {
      agent: proxy,
      headers: {
        Accept: 'application/x-bibtex'
      }
    })
  } catch (error) {
    console.error('Doxbib request error.')
    return paperMeta
  }
  paperMeta.bib = res.body
  return paperMeta
}

export default fromDOI
