import fs from 'fs'
import * as pdfJSLib from 'pdfjs-dist/webpack'
import { PaperMeta } from './structure'

function getDOIfromSubject (subjectData) {
  if (typeof subjectData !== 'undefined' && subjectData) {
    const doiRegex = new RegExp('(?:' + '(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)' + ')', 'g')
    const doi = subjectData.match(doiRegex)
    if (doi !== null) {
      return doi[0]
    } else {
      return null
    }
  }
}

function getDOIfromText (pdfText) {
  const doiRegex = new RegExp('(?:' + '(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)' + ')', 'g')
  const doi = pdfText.match(doiRegex)
  if (doi !== null) {
    return doi[0]
  } else {
    return null
  }
}

function getArxivIDfromText (pdfText) {
  const arxivRegex = new RegExp('arXiv:(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?', 'g')
  const arxiv = pdfText.match(arxivRegex)
  if (arxiv !== null) {
    return arxiv[0].split(':')[1]
  } else {
    return null
  }
}

function RenderPage (pageData) {
  // check documents https://mozilla.github.io/pdf.js/
  // ret.text = ret.text ? ret.text : "";

  const renderOptions = {
    // replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
    normalizeWhitespace: false,
    // do not attempt to combine same line TextItem's. The default value is `false`.
    disableCombineTextItems: false
  }

  return pageData.getTextContent(renderOptions)
    .then(function (textContent) {
      let lastY, text = ''
      // https://github.com/mozilla/pdf.js/issues/8963
      // https://github.com/mozilla/pdf.js/issues/2140
      // https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
      // https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
      for (const item of textContent.items) {
        if (lastY === item.transform[5] || !lastY) {
          text += item.str
        } else {
          text += '\n' + item.str
        }
        lastY = item.transform[5]
      }
      return text
    })
}

async function getPDFText (pdfData) {
  // let text = ''
  let firstPageText = ''
  // for (var i = 1; i <= pdfData.numPages; i++) {
  const pageData = await pdfData.getPage(1)
  const pageText = await RenderPage(pageData)
  // text = `${text}\n\n${pageText}`
  // if (i === 1) {
  firstPageText = `${firstPageText}\n\n${pageText}`
  // }
  // }
  return firstPageText
}

async function _fromPDFFile (filePath) {
  const paperMeta = new PaperMeta()
  if (!filePath.endsWith('.pdf')) {
    return paperMeta
  }
  paperMeta.addFile(filePath, 'paper')
  const dataBuffer = fs.readFileSync(paperMeta.paperFile)
  const pdf = await pdfJSLib.getDocument(dataBuffer).promise
  const metaData = await pdf.getMetadata()
  const title = metaData.info.Title
  if (title !== 'untitled') {
    paperMeta.title = title
  }
  let doi
  let arxiv
  doi = getDOIfromSubject(metaData.info.Subject)
  if (doi === null || typeof doi === 'undefined') {
    const firstPageText = await getPDFText(pdf)
    doi = getDOIfromText(firstPageText)
    if (doi !== null && typeof doi !== 'undefined') {
      paperMeta.doi = doi
    }
    arxiv = getArxivIDfromText(firstPageText)
    if (arxiv !== null && typeof doi !== 'undefined') {
      paperMeta.arxiv = arxiv
    }
  }
  return paperMeta
}

export async function fromPDFFile (filePaths) {
  const paperMetas = []
  await Promise.all(filePaths.map(async (filePath) => {
    paperMetas.push(await _fromPDFFile(filePath))
  }))
  return paperMetas
}
