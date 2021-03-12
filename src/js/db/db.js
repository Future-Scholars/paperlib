const sqlite3 = require('sqlite3').verbose()
import { PaperMeta } from '../pipline/structure'
import { getSetting } from 'src/js/settings'
let db

function conn () {
  if (!db || !db.open) {
    db = new sqlite3.Database(getSetting('libPath') + 'library.db')
    db.query = function (sql, params) {
      var that = this
      return new Promise(function (resolve, reject) {
        that.all(sql, params, function (error, rows) {
          if (error) { console.error(error); reject(error) } else { resolve(rows) }
        })
      })
    }
    db.launch = function (sql, params) {
      var that = this
      return new Promise(function (resolve, reject) {
        that.run(sql, params, function (error) {
          if (error) { console.error(error); resolve(false) } else { resolve(true) }
        })
      })
    }
  }

  return db
}

export function dbInit () {
  return new Promise((resolve, reject) => {
    const db = conn()
    db.serialize(() => {
      try {
        db.run('CREATE TABLE IF NOT EXISTS PaperMetas (id char(36) primary key, doi text, title text, authors text, pub text, pubType varchar(64), pubTime year, citeKey varchar(128), addTime datetime, bib text, note text, rating int, tags text, arxiv varchar(128))')
        db.run('CREATE TABLE IF NOT EXISTS Files (path text primary key, type varchar(16), paperID char(36))')
        dbAddColumn('PaperMetas', 'flag', 'int')
        resolve(true)
      } catch (error) {
        reject(error)
      }
    })
  })
}

async function dbAddColumn (tableName, columnName, dataType) {
  const db = conn()
  const success = await db.launch('ALTER TABLE ' + tableName + ' ADD COLUMN ' + columnName + ' ' + dataType)
  if (success) {
    return true
  } else {
    return false
  }
}

export async function dbSelectAll () {
  const db = conn()
  const allData = []

  const rows = await db.query('SELECT * FROM PaperMetas', [])
  await Promise.all(rows.map(async (row) => {
    const meta = new PaperMeta()
    meta.update(row)
    const files = await db.query('SELECT * FROM Files WHERE paperID=?', [meta.id])
    files.forEach(file => {
      meta.addFile(file.path, file.type)
    })
    meta.selfComplete()
    allData.push(meta)
  }))
  return allData
}

export async function dbSelectFiles (id) {
  const fileResult = await db.query('SELECT * FROM Files WHERE paperID=?', [id])
  const files = fileResult.rows
  return files
}

export async function dbInsert (paperMeta) {
  const db = conn()
  const id = paperMeta.id

  const success = await db.launch(
    'replace into PaperMetas (id, doi, title, authors, pub, pubType, pubTime, citeKey, addTime, bib, note, rating, tags, arxiv, flag) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id,
      paperMeta.doi,
      paperMeta.title,
      paperMeta.authors,
      paperMeta.pub,
      paperMeta.pubType,
      paperMeta.pubTime,
      paperMeta.citeKey,
      paperMeta.addTime,
      paperMeta.bib,
      paperMeta.note,
      paperMeta.rating,
      paperMeta.tags.join(';'),
      paperMeta.arxiv,
      paperMeta.flag
    ]
  )
  return success
}

export async function dbInsertFiles (paperMeta) {
  const db = conn()
  const id = paperMeta.id
  const successList = []
  if (paperMeta.hasAttr('paperFile')) {
    const paperFileSuccess = await db.launch(
      'replace into Files (path, type, paperID) values (?, ?, ?)',
      [paperMeta.paperFile, 'paper', id]
    )
    successList.push(paperFileSuccess)
  }
  if (paperMeta.hasAttr('attachments')) {
    await Promise.all(paperMeta.attachments.map(async (attachment) => {
      const success = await db.launch(
        'replace into Files (path, type, paperID) values (?, ?, ?)',
        [attachment, 'attachment', id]
      )
      successList.push(success)
    }))
  }
  return successList.every(function (i) { return i }) || successList.length === 0
}

export async function dbRemove (paperMeta) {
  const db = conn()
  const id = paperMeta.id
  const metaSuccess = await db.launch('DELETE FROM PaperMetas WHERE id=?', id)
  if (metaSuccess) {
    await db.launch('DELETE FROM Files WHERE paperID=?', id)
    return true
  } else {
    return false
  }
}

export async function dbRemoveFile (id, filePath) {
  const db = conn()
  const success = await db.launch('DELETE FROM Files WHERE paperID=? and path=?', [id, filePath])
  return success
}

export async function dbUpdate (key, value, id) {
  const db = conn()
  const success = await db.launch('UPDATE PaperMetas SET ' + key + ' = ? WHERE id = ?', [value, id])
  return success
}
