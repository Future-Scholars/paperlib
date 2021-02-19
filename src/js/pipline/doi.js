const got = require('got')
import { getProxy } from 'src/js/pipline/localproxy'
const bibtexParse = require('bibtex-parse')
import { bibToMeta } from 'src/js/pipline/bib'

async function _fromDOI (paperMeta) {
  if (paperMeta.completed || !paperMeta.hasAttr('doi')) {
    return paperMeta
  }
  let res
  try {
    res = await got('https://dx.doi.org/' + paperMeta.doi, {
      agent: getProxy(),
      headers: {
        Accept: 'application/x-bibtex'
      }
    })
  } catch (error) {
    console.error('Doxbib request error.')
    return paperMeta
  }

  try {
    const bib = bibtexParse.entries(res.body)[0]
    const parsedMeta = bibToMeta(bib)
    paperMeta.merge(parsedMeta)
    return paperMeta
  } catch (error) {
    console.error('Cannot parse bib:' + error)
    return paperMeta
  }
}

export async function fromDOI (paperMetas) {
  await Promise.all(paperMetas.map(async (paperMeta) => {
    paperMeta = await _fromDOI(paperMeta)
  }))
  return paperMetas
}
