const sqlite3 = require('sqlite3').verbose()
import { uid } from 'quasar'
import { newPaperMetafromObj } from '../pipline/structure'
import { getSetting } from 'src/js/settings'
let db

function conn () {
  if (!db || !db.open) {
    db = new sqlite3.Database(getSetting('libPath') + 'library.db')
  }
  return db
}

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const db = conn()
    db.serialize(() => {
      try {
        db.run('CREATE TABLE IF NOT EXISTS PaperMetas (id char(36) primary key, doi text, title text, authors text, pub text, pubType varchar(64), pubTime year, citeKey varchar(128), addTime datetime, bib text, note text, rating int, tags text, arxiv varchar(128))')
        db.run('CREATE TABLE IF NOT EXISTS Files (path text primary key, type varchar(16), paperID char(36))')
        resolve(true)
      } catch (error) {
        reject(error)
      }
    })
  })
}

export function queryAllMetaFromDB () {
  return new Promise((resolve, reject) => {
    const db = conn()
    db.all('SELECT * FROM PaperMetas', (err, rows) => {
      if (err) reject(err)
      const allMeta = []
      for (const i in rows) {
        rows[i].authorsStr = rows[i].authors
        rows[i].tagsStr = rows[i].tags
        allMeta.push(newPaperMetafromObj(rows[i]))
      }
      resolve(allMeta)
    })
  })
}

export function queryFilesFromDB (id) {
  return new Promise((resolve, reject) => {
    const db = conn()
    db.all('SELECT * FROM Files WHERE paperID=' + "'" + id + "'", (err, rows) => {
      if (err) reject(err)
      resolve(rows || [])
    })
  })
}

export function insertToDB (paperMeta) {
  return new Promise((resolve, reject) => {
    const db = conn()
    let id
    if (!paperMeta.id) {
      id = uid()
    } else {
      id = paperMeta.id
    }
    const prepareMeta = db.prepare('replace into PaperMetas (id, doi, title, authors, pub, pubType, pubTime, citeKey, addTime, bib, note, rating, tags, arxiv) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    prepareMeta.run(id, paperMeta.doi, paperMeta.title, paperMeta.authorsStr, paperMeta.pub, paperMeta.pubType, paperMeta.pubTime, paperMeta.citeKey, paperMeta.addTime, paperMeta.bib, paperMeta.note, paperMeta.rating, paperMeta.tagsStr, paperMeta.arxiv)
    prepareMeta.finalize(err => {
      if (err) { return resolve(null) }
    })
    const prepareFiles = db.prepare('replace into Files (path, type, paperID) values (?, ?, ?)')
    if (paperMeta.hasPaperFile()) {
      prepareFiles.run(paperMeta.paperFile, 'paper', id)
    } else {
      return resolve(id)
    }
    if (paperMeta.hasAttachments()) {
      for (const i in paperMeta.attachments) {
        prepareFiles.run(paperMeta.attachments[i], 'attachment', id)
      }
    } else {
      return resolve(id)
    }
    prepareFiles.finalize(err => {
      if (err) { return resolve(null) } else { return resolve(id) }
    })
  })
}

export const updatePaperMeta = (key, value, id) => {
  return new Promise((resolve, reject) => {
    const db = conn()
    try {
      db.run('UPDATE PaperMetas SET ' + key + ' = ? WHERE id = ?', value, id)
      return resolve(true)
    } catch (err) {
      return resolve(false)
    }
  })
}

export const updateRating = async (id, rating) => {
  const success = await updatePaperMeta('rating', rating, id)
  return success
}

export const updateNote = async (id, note) => {
  const success = await updatePaperMeta('note', note, id)
  return success
}

export const addTags = async (id, tags) => {
  const success = await updatePaperMeta('tags', tags, id)
  return success
}

export function queryTagsFromDB (id) {
  return new Promise((resolve, reject) => {
    const db = conn()
    db.all('SELECT tags FROM PaperMetas WHERE id=' + "'" + id + "'", (err, rows) => {
      if (err) reject(err)
      resolve(rows[0].tags)
    })
  })
}

export const deleteFromDB = (paperMeta) => {
  return new Promise((resolve, reject) => {
    const db = conn()
    const id = paperMeta.id
    db.run('DELETE FROM PaperMetas WHERE id=?', id)
    db.run('DELETE FROM Files WHERE paperID=?', id)
    console.log('Delete ' + id)
    return resolve(true)
  })
}

export const deleteFileFromDB = (id, filePath) => {
  return new Promise((resolve, reject) => {
    console.log(id, filePath)
    const db = conn()
    db.run('DELETE FROM Files WHERE paperID=? and path=?', id, filePath)
    return resolve(true)
  })
}
