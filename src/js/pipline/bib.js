const bibtexParse = require('bibtex-parse')
import { generateBibfromMeta, newPaperMetafromObj } from './structure'

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

export async function fromExactBib (paperMeta) {
  if (paperMeta.completed) {
    return paperMeta
  }
  if (paperMeta.bib === null) {
    return paperMeta
  }
  let bibs
  try {
    bibs = bibtexParse.entries(paperMeta.bib)
  } catch {
    console.log(paperMeta.bib)
    return paperMeta
  }
  const newPaperMetas = []
  bibs.forEach(bib => {
    // Parse bib
    const newPaperMeta = newPaperMetafromObj(paperMeta)
    newPaperMeta.title = latexToStr(bib.TITLE)
    newPaperMeta.citeKey = bib.key
    try {
      newPaperMeta.pubType = pubType[bib.type]
    } catch {
      console.log('Missing type:' + bib.type)
    }
    newPaperMeta.pubTime = bib.YEAR
    if (bib.type === 'incollection' || bib.type === 'inproceedings') {
      newPaperMeta.pub = latexToStr(bib.BOOKTITLE)
    } else if (bib.type === 'article') {
      newPaperMeta.pub = latexToStr(bib.JOURNAL)
    }
    newPaperMeta.authorsStr = bib.AUTHOR
    if (bib.AUTHOR) {
      newPaperMeta.authorsList = bib.AUTHOR.split(' and ')
    }
    if (bib.URL) {
      newPaperMeta.addFile(bib.URL, 'attachment')
    }
    newPaperMetas.push(newPaperMeta)
  })
  if (newPaperMetas.length === 1) {
    return newPaperMetas[0]
  } else {
    return newPaperMetas
  }
}

export async function fromBibFile (paperMeta) {
  if (paperMeta.bib === null) {
    return paperMeta
  }
  let bibs
  try {
    bibs = bibtexParse.entries(paperMeta.bib)
  } catch {
    return []
  }
  const newPaperMetas = []
  bibs.forEach(bib => {
    // Parse bib
    const newPaperMeta = newPaperMetafromObj(paperMeta)
    newPaperMeta.title = latexToStr(bib.TITLE)
    newPaperMeta.citeKey = bib.key
    try {
      newPaperMeta.pubType = pubType[bib.type]
    } catch {
      console.log('Missing type:' + bib.type)
    }
    newPaperMeta.pubTime = bib.YEAR
    if (bib.type === 'incollection' || bib.type === 'inproceedings') {
      if (bib.BOOKTITLE) {
        newPaperMeta.pub = latexToStr(bib.BOOKTITLE)
      } else if (bib.SERIES) {
        newPaperMeta.pub = latexToStr(bib.SERIES)
      }
    } else if (bib.type === 'article') {
      newPaperMeta.pub = latexToStr(bib.JOURNAL)
    }
    newPaperMeta.doi = bib.DOI
    newPaperMeta.authorsStr = bib.AUTHOR
    if (bib.AUTHOR) {
      newPaperMeta.authorsList = bib.AUTHOR.split(' and ')
    }
    if (bib.URL) {
      newPaperMeta.addFile(bib.URL, 'attachment')
    }
    if (bib.JOURNAL === 'arXiv' && bib.EPRINT) {
      newPaperMeta.arxiv = bib.EPRINT
    }
    generateBibfromMeta(newPaperMeta)
    newPaperMetas.push(newPaperMeta)
  })
  return newPaperMetas
}
