const bibtexParse = require('bibtex-parse')
import { PaperMeta } from './structure'
const fs = require('fs').promises

function latexToStr (latex) {
  if (latex) {
    return latex.replace('\\textendash', '-').replace('\\textemdash', '-')
  } else {
    return latex
  }
}

const pubType = {
  incollection: 'conference',
  inproceedings: 'conference',
  article: 'journal'
}

export function bibToMeta (bib) {
  const paperMeta = new PaperMeta()
  paperMeta.title = latexToStr(bib.TITLE)
  paperMeta.citeKey = bib.key
  try {
    paperMeta.pubType = pubType[bib.type]
  } catch {
    console.log('Missing type:' + bib.type)
  }
  paperMeta.pubTime = bib.YEAR
  if (bib.type === 'incollection' || bib.type === 'inproceedings') {
    if (bib.BOOKTITLE) {
      paperMeta.pub = latexToStr(bib.BOOKTITLE)
    } else if (bib.SERIES) {
      paperMeta.pub = latexToStr(bib.SERIES)
    }
  } else if (bib.type === 'article') {
    paperMeta.pub = latexToStr(bib.JOURNAL)
  }
  paperMeta.doi = bib.DOI
  paperMeta.authors = bib.AUTHOR
  if (bib.URL) {
    paperMeta.addFile(bib.URL, 'attachment')
  }
  if (bib.JOURNAL === 'arXiv' && bib.EPRINT) {
    paperMeta.arxiv = bib.EPRINT
  }
  return paperMeta
}

export async function fromBibFile (filePath) {
  const data = await fs.readFile(filePath, 'utf8')
  let bibs
  try {
    bibs = bibtexParse.entries(data)
  } catch {
    console.error('0 bib entry parsed.')
    return []
  }
  const paperMetas = []
  bibs.forEach(bib => {
    const paperMeta = bibToMeta(bib)
    paperMetas.push(paperMeta)
  })
  return paperMetas
}
