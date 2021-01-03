import { PaperMeta } from './structure'
import fromExactBib from './bib'
import fromPDFMeta from './pdf'
import fromCrossref from './crossref'
import fromArxiv from './arxiv'

export async function runPipline (oprators, paperMeta) {
  if (paperMeta.hasDOI() && paperMeta.hasTitle() && paperMeta.hasPaperFile()) {
    return paperMeta
  }
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
  pipeline.push(fromCrossref)
  pipeline.push(fromExactBib)
  paperMeta = await runPipline(pipeline, paperMeta)
  return paperMeta
}

export async function manuallyMatchPipeline (paperMeta) {
  const pipeline = []

  if (paperMeta.hasDOI()) {
    pipeline.push(fromExactBib)
  } else {
    pipeline.push(fromArxiv)
    pipeline.push(fromCrossref)
    pipeline.push(fromExactBib)
  }
  paperMeta = await runPipline(pipeline, paperMeta)
  return paperMeta
}
