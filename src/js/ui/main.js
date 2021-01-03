import { fromFilePipeline, manuallyMatchPipeline } from '../pipline/pipeline'

export function dropFile (filePath) {
  if (filePath.endsWith('.pdf')) {
    const paperMeta = fromFilePipeline(filePath)
    return paperMeta
  } else {
    return null
  }
}

export function manuallyMatch (manualMeta) {
  return manuallyMatchPipeline(manualMeta)
}
