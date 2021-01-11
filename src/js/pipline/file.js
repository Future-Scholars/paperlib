import { promises as fsP, constants } from 'fs'
import { getSetting } from 'src/js/settings'
import path from 'path'

function replaceInvalidChar (string) {
  return string.replace(/:/g, '-').replace(/ /g, '_').replace(/\./g, '_').replace(/\?/g, '_')
}

function constructFilePath (title, author, doi, suffix) {
  let newFilePath = getSetting('libPath')
  let newFileName = ''
  if (title) {
    newFileName = newFileName + replaceInvalidChar(title) + '_'
  }
  if (author) {
    newFileName = newFileName + replaceInvalidChar(author) + '_'
  }
  if (doi) {
    newFileName = newFileName + replaceInvalidChar(doi.split('/')[1]) + '_'
  }
  newFileName = newFileName + suffix
  newFilePath = path.join(newFilePath, newFileName)
  return newFilePath
}

async function copyFile (oriPath, newPath) {
  try {
    await fsP.access(newPath, constants.F_OK)
    console.log('Copy file exist: ' + newPath)
    return true
  } catch (err) {
    try {
      await fsP.copyFile(oriPath, newPath)
      return true
    } catch (err) {
      console.log('Copy file error: ' + err)
      return false
    }
  }
}

export async function copyPaperAndAttachments (paperMeta) {
  let title = null
  let author = null
  let doi = null
  if (paperMeta.hasPaperFile()) {
    const paperFile = paperMeta.paperFile.split('.')
    const suffix = 'main.' + paperFile[paperFile.length - 1]
    if (paperMeta.hasTitle()) title = paperMeta.title
    if (paperMeta.hasAuthors()) author = paperMeta.authorsList[0]
    if (paperMeta.hasDOI()) doi = paperMeta.doi
    const newFilePath = constructFilePath(title, author, doi, suffix)
    const success = await copyFile(paperMeta.paperFile, newFilePath)
    if (success) {
      paperMeta.paperFile = newFilePath
    }
  }

  if (paperMeta.hasAttachments()) {
    for (const i in paperMeta.attachments) {
      const attachmentFile = paperMeta.attachments[i].split('.')
      let attSuffix = attachmentFile[attachmentFile.length - 1]
      if (attSuffix === 'pdf' || attSuffix === 'doc') {
        attSuffix = 'sup' + String(i) + '.' + attSuffix
        const newAttachmentPath = constructFilePath(title, author, doi, attSuffix)
        const success = await copyFile(paperMeta.attachments[i], newAttachmentPath)
        if (success) {
          paperMeta.attachments[i] = newAttachmentPath
        }
      }
    }
  }
  return paperMeta
}

async function deleteFile (filePath) {
  try {
    await fsP.unlink(filePath)
    return true
  } catch (err) {
    return false
  }
}

export async function deletePaperAndAttachments (paperMeta) {
  // don't care success or not
  await deleteFile(paperMeta.paperFile)
  for (const i in paperMeta.attachments) {
    await deleteFile(paperMeta.attachments[i])
  }
}
