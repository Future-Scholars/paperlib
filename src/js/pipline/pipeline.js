import { PaperMeta } from './structure'
import { fromExactBib, fromBibFile } from './bib'
import fromDOI from './doi'
import fromPDFMeta from './pdf'
import fromDBLP from './dblp'
import fromArxiv from './arxiv'
const fs = require('fs').promises

export async function runPipline (oprators, paperMeta) {
  for (const op of oprators) {
    paperMeta = await op(paperMeta)
  }
  return paperMeta
}

export async function fromFilePipeline (filePath) {
  let paperMeta = new PaperMeta()
  paperMeta.addFile(filePath, 'paper')
  const pipeline = []

  if (filePath.endsWith('.pdf')) {
    // PDF
    pipeline.push(fromPDFMeta)
    pipeline.push(fromArxiv)
  }
  pipeline.push(fromDBLP)
  pipeline.push(fromDOI)
  pipeline.push(fromExactBib)
  paperMeta = await runPipline(pipeline, paperMeta)
  return paperMeta
}

export async function manuallyMatchPipeline (paperMeta) {
  const pipeline = []

  pipeline.push(fromArxiv)
  pipeline.push(fromDBLP)
  pipeline.push(fromDOI)
  pipeline.push(fromExactBib)
  paperMeta = await runPipline(pipeline, paperMeta)
  return paperMeta
}

export async function fromBibtexFilePipeline (filePath) {
  const paperMeta = new PaperMeta()
  const pipeline = []
  pipeline.push(fromBibFile)
  pipeline.push(fromArxiv)
  pipeline.push(fromDBLP)
  pipeline.push(fromDOI)
  pipeline.push(fromExactBib)
  const data = await fs.readFile(filePath, 'utf8')
  paperMeta.bib = data
  const paperMetas = await runPipline(pipeline, paperMeta)
  return paperMetas
}
