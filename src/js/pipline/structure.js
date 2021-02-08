// DOI                   str
// Title                 str
// Authors               []
// Publication           str
// Publication Type      enumerate(str, str ...)
// Publication Time      str
// Cite Key              str
// Add Time              str
// Note                  str
// Rating                int
// PaperFile             str
// Attachments           [str, str ....]
const moment = require('moment')

export class PaperMeta {
  constructor (id = null, paperFile = null, attachments = [], doi = null, title = null, authorsList = [], authorsStr = null, pub = null, pubType = null, pubTime = null, citeKey = null, addTime = null, note = null, rating = 0, bib = null, tagsList = [], tagsStr = null, arxiv = null) {
    this.id = id
    this.doi = doi
    this.title = title
    this.authorsList = authorsList
    this.authorsStr = authorsStr
    this.constructAuthors()
    this.pub = pub
    this.pubType = pubType
    this.pubTime = pubTime
    this.citeKey = citeKey
    if (addTime == null) {
      const time = moment()
      this.addTime = time.format('YYYY-MM-DD HH:mm:ss')
    } else {
      this.addTime = addTime
    }
    this.note = note
    this.rating = rating
    this.bib = bib
    this.paperFile = paperFile
    this.attachments = attachments
    this.tagsList = tagsList
    this.tagsStr = tagsStr
    this.constructTags()
    this.arxiv = arxiv
    this.completed = false
  }

  update (metaObj) {
    this.id = metaObj.id
    this.doi = metaObj.doi
    this.title = metaObj.title
    this.authorsStr = metaObj.authorsStr
    this.authorsList = metaObj.authorsList
    this.constructAuthors()
    this.pub = metaObj.pub
    this.pubType = metaObj.pubType
    this.pubTime = metaObj.pubTime
    this.citeKey = metaObj.citeKey
    this.addTime = metaObj.addTime
    this.note = metaObj.note
    this.rating = metaObj.rating
    this.bib = metaObj.bib
    this.paperFile = metaObj.paperFile
    this.attachments = metaObj.attachments
    this.tagsList = metaObj.tagsList
    this.tagsStr = metaObj.tagsStr
    this.constructTags()
    this.arxiv = metaObj.arxiv
  }

  constructAuthors () {
    if (this.authorsStr) {
      this.authorsList = this.authorsStr.split(' and ')
    }
    if (this.authorsList && this.authorsList.length !== 0) {
      this.authorsStr = this.authorsList.join(' and ')
    }
  }

  constructTags () {
    if (this.tagsList && this.tagsList.length !== 0) {
      this.tagsStr = this.tagsList.join(';')
    }
    if (this.tagsStr) {
      this.tagsList = this.tagsStr.split(';')
    }
  }

  addPaperFile (filePath) {
    this.paperFile = filePath
  }

  addAttachment (filePath) {
    if (this.attachments === null) {
      this.attachments = []
    }
    if (!this.attachments.includes(filePath)) {
      this.attachments.push(filePath)
    }
  }

  addFile (filePath, fileType) {
    if (fileType === 'paper') {
      this.addPaperFile(filePath)
    } else if (fileType === 'attachment') {
      this.addAttachment(filePath)
    } else {
      console.log('FileType' + fileType + ': ' + filePath)
    }
  }

  hasDOI () {
    return !(this.doi === null || this.doi === '')
  }

  hasArxiv () {
    return !(this.arxiv === null || this.arxiv === '')
  }

  hasTitle () {
    return !(this.title === null || this.title === '')
  }

  hasAuthors () {
    return !(this.authorsStr === null || this.authorsStr === '' || this.authorsList.length === 0)
  }

  hasPaperFile () {
    return !(this.paperFile === null || this.paperFile === '')
  }

  hasAttachments () {
    return !(this.attachments === null)
  }
}

export function newPaperMetafromObj (metaObj) {
  return new PaperMeta(
    metaObj.id,
    metaObj.paperFile,
    metaObj.attachments,
    metaObj.doi,
    metaObj.title,
    metaObj.authorsList,
    metaObj.authorsStr,
    metaObj.pub,
    metaObj.pubType,
    metaObj.pubTime,
    metaObj.citeKey,
    metaObj.addTime,
    metaObj.note,
    metaObj.rating,
    metaObj.bib,
    metaObj.tagsList,
    metaObj.tagsStr,
    metaObj.arxiv
  )
}

export function generateBibfromMeta (metaObj) {
  let citeKey
  if (metaObj.hasAuthors()) {
    citeKey = metaObj.authorsList[0].replace(' ', '')
  } else {
    citeKey = 'undefined'
  }
  if (metaObj.pubType === 'inproceedings' || metaObj.pubType === 'incollection') {
    metaObj.bib = `@inproceedings{${citeKey}_${metaObj.pubTime},
      year = {${metaObj.pubTime}},
      title = {{${metaObj.title}}},
      author = {${metaObj.authorsStr}},
      booktitle = {${metaObj.pub}},
    }`
  } else {
    metaObj.bib = `@article{${citeKey}_${metaObj.pubTime},
      year = {${metaObj.pubTime}},
      title = {{${metaObj.title}}},
      author = {${metaObj.authorsStr}},
      journal = {${metaObj.pub}},
    }`
  }
  return metaObj
}
