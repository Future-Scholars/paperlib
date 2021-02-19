const got = require('got')
import { getProxy } from 'src/js/pipline/localproxy'
import xml2json from '@hendt/xml2json'

async function _fromArxiv (paperMeta) {
  if (paperMeta.completed || !paperMeta.hasAttr('arxiv')) {
    return paperMeta
  }
  let res
  try {
    res = await got('http://export.arxiv.org/api/query?id_list=' + paperMeta.arxiv, {
      agent: getProxy(),
      headers: {
        'accept-encoding': 'UTF-32BE'
      }
    })
  } catch (error) {
    console.error('Arxiv request error.')
    return paperMeta
  }
  const arxivBody = xml2json(res.body).feed.entry
  if (arxivBody.title === 'Error') {
    return paperMeta
  }
  paperMeta.title = arxivBody.title
  const authorsList = []
  for (const i in arxivBody.author) {
    authorsList.push(arxivBody.author[i].name)
  }
  paperMeta.authors = authorsList.join(' and ')
  paperMeta.pub = 'arXiv'
  paperMeta.pubTime = arxivBody.published.split('-')[0]
  paperMeta.pubType = 'journal'
  paperMeta.addAttachment(arxivBody.id.replace(' ', ''))
  return paperMeta
}

export async function fromArxiv (paperMetas) {
  await Promise.all(paperMetas.map(async (paperMeta) => {
    paperMeta = await _fromArxiv(paperMeta)
  }))
  return paperMetas
}
