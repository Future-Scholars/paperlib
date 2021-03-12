const moment = require('moment')
import { uid } from 'quasar'

export class PaperMeta {
  constructor () {
    const time = moment()
    this.addTime = time.format('YYYY-MM-DD HH:mm:ss')

    this.id = ''
    this.doi = ''
    this.title = ''
    this.authors = ''
    this.pub = ''
    this.pubType = ''
    this.pubTime = ''
    this.citeKey = ''
    this.note = ''
    this.rating = 0
    this.bib = ''
    this.paperFile = ''
    this.attachments = []
    this.tags = []
    this.arxiv = ''
    this.flag = 0
    this.completed = false
  }

  update (metaObj) {
    this.id = metaObj.id
    this.addTime = metaObj.addTime
    this.doi = metaObj.doi
    this.title = metaObj.title
    this.authors = metaObj.authors
    this.pub = metaObj.pub
    this.pubType = metaObj.pubType
    this.pubTime = metaObj.pubTime
    this.citeKey = metaObj.citeKey
    this.note = metaObj.note
    this.rating = metaObj.rating
    this.paperFile = metaObj.paperFile
    this.attachments = []
    if (!(metaObj.attachments === null || typeof metaObj.attachments === 'undefined')) {
      metaObj.attachments.forEach(attachment => {
        this.addAttachment(attachment)
      })
    }
    this.tags = []
    if (!(metaObj.tags === null || typeof metaObj.tags === 'undefined')) {
      this.addTags(metaObj.tags)
    }
    this.arxiv = metaObj.arxiv
    this.flag = metaObj.flag
    this.constructBib()
  }

  hasAttr (name) {
    if (name === 'attachments' || name === 'tags') {
      return this[name].length !== 0
    }
    return !(this[name] === null || this[name] === '' || typeof this[name] === 'undefined')
  }

  setAttr (name, value) {
    if (value === null || value === '' || typeof value === 'undefined') {
      if (name === 'attachments' || name === 'tags') {
        this[name] = []
      } else {
        this[name] = ''
      }
    } else {
      this[name] = value
    }
  }

  mergeAttr (name, value) {
    if (!(value === null || value === '' || typeof value === 'undefined')) {
      this.setAttr(name, value)
    }
  }

  merge (metaObj) {
    this.mergeAttr('id', metaObj.id)
    this.mergeAttr('addTime', metaObj.addTime)
    this.mergeAttr('title', metaObj.title)
    this.mergeAttr('authors', metaObj.authors)
    this.mergeAttr('pub', metaObj.pub)
    this.mergeAttr('pubType', metaObj.pubType)
    this.mergeAttr('pubTime', metaObj.pubTime)
    this.mergeAttr('citeKey', metaObj.citeKey)
    this.mergeAttr('note', metaObj.note)
    this.mergeAttr('rating', metaObj.rating)
    this.mergeAttr('paperFile', metaObj.paperFile)
    this.mergeAttr('addTime', metaObj.addTime)
    this.mergeAttr('doi', metaObj.doi)
    if (metaObj.attachments === null || typeof metaObj.attachments === 'undefined') {
      metaObj.attachments.forEach(attachment => {
        this.addAttachment(attachment)
      })
    }
    this.addTags(metaObj.tags)
    this.mergeAttr('arxiv', metaObj.arxiv)
    this.mergeAttr('flag', metaObj.flag)
    this.constructBib()
  }

  selfComplete () {
    if (!this.hasAttr('id')) {
      this.id = uid()
    }

    if (!this.hasAttr('citeKey')) {
      if (this.hasAttr('author')) {
        this.citeKey = this.authors.split(' and ')[0].replace(' ', '_') + '_' + this.pubTime
      } else if (this.hasAttr('title')) {
        this.citeKey = this.title.split(' ')[0] + '_' + this.pubTime
      }
    }

    if (!this.hasAttr('addTime')) {
      const time = moment()
      this.addTime = time.format('YYYY-MM-DD HH:mm:ss')
    }

    if (!this.hasAttr('bib')) {
      if (this.pubType === 'inproceedings' || this.pubType === 'incollection' || this.pubType === 'conference') {
        this.bib = `@inproceedings{${this.citeKey},
  year = {${this.pubTime}},
  title = {{${this.title}}},
  author = {${this.authors}},
  booktitle = {${this.pub}},
}`
      } else {
        this.bib = `@article{${this.citeKey},
  year = {${this.pubTime}},
  title = {{${this.title}}},
  author = {${this.authors}},
  journal = {${this.pub}},
 }`
      }
    }
  }

  constructBib () {
    if (!this.hasAttr('citeKey')) {
      if (this.hasAttr('authors')) {
        this.citeKey = this.authors.split(' and ')[0].replace(' ', '_') + '_' + this.pubTime
      } else if (this.hasAttr('title')) {
        this.citeKey = this.title.split(' ')[0] + '_' + this.pubTime
      }
    }
    if (this.pubType === 'inproceedings' || this.pubType === 'incollection' || this.pubType === 'conference') {
      this.bib = `@inproceedings{${this.citeKey},
  year = {${this.pubTime}},
  title = {{${this.title}}},
  author = {${this.authors}},
  booktitle = {${this.pub}},
}`
    } else {
      this.bib = `@article{${this.citeKey},
  year = {${this.pubTime}},
  title = {{${this.title}}},
  author = {${this.authors}},
  journal = {${this.pub}},
 }`
    }
  }

  addPaperFile (filePath) {
    this.paperFile = filePath
  }

  addAttachment (filePath) {
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

  parseTagsStr (tagsStr) {
    if (!(tagsStr === null || typeof tagsStr === 'undefined')) {
      const tagsList = tagsStr.split(';')
      if (tagsList.length === 1 && tagsList[0] === '') {
        return []
      } else {
        return tagsList
      }
    } else {
      return []
    }
  }

  addTags (tags) {
    let tagsList
    if (Array.isArray(tags)) {
      tagsList = tags
    } else {
      tagsList = this.parseTagsStr(tags)
    }
    tagsList.forEach(tag => {
      if (!this.tags.includes(tag)) {
        this.tags.push(tag)
      }
    })
  }

  removeTags (tagsStr) {
    const tagsList = this.parseTagsStr(tagsStr)
    this.tags = this.tags.filter(function (value, index) {
      return !tagsList.includes(value)
    })
  }
}
