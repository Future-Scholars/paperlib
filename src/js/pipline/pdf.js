import fs from 'fs'
import * as pdfJSLib from 'pdfjs-dist/webpack'

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
  let text = ''
  let firstPageText = ''
  for (var i = 1; i <= pdfData.numPages; i++) {
    const pageData = await pdfData.getPage(i)
    const pageText = await RenderPage(pageData)
    text = `${text}\n\n${pageText}`
    if (i === 1) {
      firstPageText = `${firstPageText}\n\n${pageText}`
    }
  }
  return [text, firstPageText]
}

async function fromPDFMeta (paperMeta) {
  if (paperMeta.paperFile === null) {
    return paperMeta
  }
  if (!paperMeta.paperFile.endsWith('.pdf')) {
    return paperMeta
  }
  const dataBuffer = fs.readFileSync(paperMeta.paperFile)
  const pdf = await pdfJSLib.getDocument(dataBuffer).promise
  const metaData = await pdf.getMetadata()
  const title = metaData.info.Title
  if (title !== 'untitled') {
    paperMeta.title = title
  }
  let doi = getDOIfromSubject(metaData.info.Subject)
  if (doi == null) {
    const [pdfText, firstPageText] = await getPDFText(pdf)
    doi = getDOIfromText(pdfText)
    paperMeta.arxiv = getArxivIDfromText(firstPageText)
    paperMeta.doi = doi
  } else {
    paperMeta.doi = doi
  }
  return paperMeta
}

export default fromPDFMeta
