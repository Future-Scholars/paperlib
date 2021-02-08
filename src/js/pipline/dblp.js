const got = require('got')
import { getProxy } from 'src/js/pipline/localproxy'

const pubType = {
  'Conference and Workshop Papers': 'conference',
  'Journal Articles': 'journal'
}

const venueID = {
  ICCV: 1,
  'ICCV Workshop': 0
}

async function fromDBLP (paperMeta) {
  if (paperMeta.completed) {
    return paperMeta
  }
  if (!paperMeta.hasTitle()) {
    return paperMeta
  }
  let res
  try {
    res = await got('http://dblp.org/search/publ/api?q=' + paperMeta.title + '&format=json', {
      agent: getProxy()
    })
  } catch (error) {
    console.error('Crossref request error.')
    return paperMeta
  }
  const queryResults = JSON.parse(res.body).result
  if (queryResults.hits['@total'] > 0) {
    const paperResult = queryResults.hits.hit[0].info

    paperMeta.doi = paperResult.doi
    paperMeta.pubType = pubType[paperResult.type]
    paperMeta.title = paperResult.title.slice(0, -1)
    paperMeta.citeKey = paperResult.key
    paperMeta.pubTime = paperResult.year
    const authorsList = []
    for (let i = 0; i < paperResult.authors.author.length; i++) {
      authorsList.push(paperResult.authors.author[i].text.replace(/ [0-9]{4}$/, ''))
    }
    paperMeta.authorsStr = authorsList.join(' and ')
    paperMeta.authorsList = authorsList
    paperMeta.addFile(paperResult.ee, 'attachment')
    const venue = paperResult.venue
    if (venue !== 'CoRR') {
      paperMeta.pub = venue
      try {
        res = await got('https://dblp.org/search/venue/api?q=' + venue + '&format=json', {
          agent: getProxy()
        })
      } catch (error) {
        return paperMeta
      }
      const venueResults = JSON.parse(res.body).result
      if (venueResults.hits.hit.length > 0) {
        let id
        if (venue in venueID) {
          id = venueID[venue]
        } else {
          id = 0
        }
        const venueName = venueResults.hits.hit[id].info.venue
        paperMeta.pub = venueName
      }
      paperMeta.completed = true
    }
  }
  return paperMeta
}

export default fromDBLP
