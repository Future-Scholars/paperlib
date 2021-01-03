const got = require('got')
const bibtexParse = require('bibtex-parse')
import { getProxy } from 'src/js/pipline/localproxy'

function latexToStr (latex) {
  return latex.replace('\\textendash', '-').replace('\\textemdash', '-')
}

const pubType = {
  incollection: 'conference',
  inproceedings: 'conference',
  article: 'journal'
}

async function fromExactBib (paperMeta) {
  if (paperMeta.doi === null) {
    return paperMeta
  }
  let res
  const proxy = getProxy()
  console.log(proxy)
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
  const bib = bibtexParse.entries(res.body)[0]
  paperMeta.bib = res.body
  // Parse bib
  paperMeta.title = latexToStr(bib.TITLE)
  paperMeta.citeKey = bib.key
  try {
    paperMeta.pubType = pubType[bib.type]
  } catch {
    console.log('Missing type:' + bib.type)
  }
  paperMeta.pubTime = bib.YEAR
  if (bib.type === 'incollection' || bib.type === 'inproceedings') {
    paperMeta.pub = latexToStr(bib.BOOKTITLE)
  } else if (bib.type === 'article') {
    paperMeta.pub = latexToStr(bib.JOURNAL)
  }
  paperMeta.authorsStr = bib.AUTHOR
  paperMeta.authorsList = bib.AUTHOR.split(' and ')
  paperMeta.addFile(bib.URL, 'attachment')
  return paperMeta
}

export default fromExactBib
