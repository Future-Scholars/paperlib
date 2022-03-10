import {XMLParser} from 'fast-xml-parser';

import {Scraper} from './scraper';
import {formatString} from '../../utils/misc';

export class ArXivScraper extends Scraper {
  constructor(preference) {
    super();
    this.preference = preference;
    this.xmlParser = new XMLParser();
  }

  preProcess(entityDraft) {
    const enable = entityDraft.arxiv !== '' && this.preference.get('arXivScraper');
    const arxivID = formatString({
      str: entityDraft.arxiv,
      removeStr: 'arXiv:',
    });
    const scrapeURL = `https://export.arxiv.org/api/query?id_list=${arxivID}`;
    const headers = {
      'accept-encoding': 'UTF-32BE',
    };

    return {scrapeURL, headers, enable};
  }

  parsingProcess(rawResponse, entityDraft) {
    const arxivResponse = this.xmlParser.parse(rawResponse.body).feed.entry;
    const title = arxivResponse.title;
    const authorList = arxivResponse.author;
    const authors = authorList
        .map((author) => {
          return author.name;
        })
        .join(', ');
    const pubTime = arxivResponse.published.substring(0, 4);
    entityDraft.setValue('title', title, false);
    entityDraft.setValue('authors', authors, false);
    entityDraft.setValue('pubTime', pubTime, false);
    entityDraft.setValue('pubType', 0, false);
    entityDraft.setValue('publication', 'arXiv', false);

    return entityDraft;
  }
}
