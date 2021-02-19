import { fromBibFile } from './bib'
import { fromDOI } from './doi'
import { fromPDFFile } from './pdf'
import { fromDBLP } from './dblp'
import { fromArxiv } from './arxiv'

export async function runPipline (oprators, paperMeta) {
  for (const op of oprators) {
    paperMeta = await op(paperMeta)
  }
  return paperMeta
}

function resetCompleteStatus (paperMetas) {
  paperMetas.forEach(paperMeta => {
    paperMeta.completed = false
  })
}

export async function fromFilesPipeline (filePaths) {
  const pipeline = []
  if (filePaths[0].endsWith('.pdf')) {
    pipeline.push(fromPDFFile)
  } else if (filePaths[0].endsWith('.bib')) {
    pipeline.push(fromBibFile)
  }
  pipeline.push(fromArxiv)
  pipeline.push(fromDBLP)
  pipeline.push(fromDOI)
  pipeline.push(fromDBLP)
  return await runPipline(pipeline, filePaths)
}

export async function manuallyMatchPipeline (paperMetas) {
  const pipeline = []

  pipeline.push(fromArxiv)
  pipeline.push(fromDBLP)
  pipeline.push(fromDOI)

  resetCompleteStatus(paperMetas)
  paperMetas = await runPipline(pipeline, paperMetas)
  return paperMetas
}
