const request = require('request')
const { promisify } = require('util')
const get = promisify(request.get.bind(request))
import xml2json from '@hendt/xml2json'

const uri = 'http://export.arxiv.org/api'

const query = (
  id
) => get({
  uri: uri + '/query?id_list=' + id
})
  .then(({ body }) => body)

async function fromArxiv (paperMeta) {
  if (!paperMeta.hasArxiv()) {
    return paperMeta
  }
  if (paperMeta.hasDOI()) {
    return paperMeta
  }
  let res
  try {
    res = await query(paperMeta.arxiv)
  } catch (error) {
    console.error('Arxiv request error.')
    return paperMeta
  }
  const arxivBody = xml2json(res)
  paperMeta.title = arxivBody.feed.entry.title
  paperMeta.authorsList.length = 0
  for (const i in arxivBody.feed.entry.author) {
    paperMeta.authorsList.push(arxivBody.feed.entry.author[i].name)
  }
  paperMeta.authorsStr = paperMeta.authorsList.join(' and ')
  paperMeta.pub = 'arXiv'
  paperMeta.pubTime = arxivBody.feed.entry.published.split('-')[0]
  paperMeta.pubType = 'journal'
  paperMeta.addAttachment(arxivBody.feed.entry.id)
  paperMeta.bib = `@article{${paperMeta.authorsList[0]}_${paperMeta.pubTime},
      year = ${paperMeta.pubTime},
      title = ${paperMeta.title},
      author = ${paperMeta.authorsStr},
      journal = arXiv,
  }
  `
  return paperMeta
}

export default fromArxiv
