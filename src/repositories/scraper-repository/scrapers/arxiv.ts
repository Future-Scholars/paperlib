import { XMLParser } from 'fast-xml-parser';
import { Response } from 'got';

import { Scraper, ScraperRequestType } from './scraper';
import { formatString } from '../../../utils/string';
import { Preference } from '../../../utils/preference';
import { PaperEntityDraft } from '../../../models/PaperEntityDraft';

export class ArXivScraper extends Scraper {
  xmlParser: XMLParser;

  constructor(preference: Preference) {
    super(preference);
    this.xmlParser = new XMLParser();
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable =
      entityDraft.arxiv !== '' &&
      (this.preference.get('arXivScraper') as boolean);

    const arxivID = formatString({
      str: entityDraft.arxiv,
      removeStr: 'arXiv:',
    });
    const scrapeURL = `https://export.arxiv.org/api/query?id_list=${arxivID}`;

    const headers = {
      'accept-encoding': 'UTF-32BE',
    };

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const parsedResponse = this.xmlParser.parse(rawResponse.body) as {
      feed: {
        entry: {
          title: string;
          author: { name: string }[];
          published: string;
        };
      };
    };
    const arxivResponse = parsedResponse.feed.entry;
    const title = arxivResponse.title;
    const authorList = arxivResponse.author;
    const authors = authorList
      .map((author) => {
        return author.name.trim();
      })
      .join(', ');

    const pubTime = arxivResponse.published.substring(0, 4);
    entityDraft.setValue('title', title);
    entityDraft.setValue('authors', authors);
    entityDraft.setValue('pubTime', pubTime);
    entityDraft.setValue('pubType', 0);
    entityDraft.setValue('publication', 'arXiv');

    return entityDraft;
  }
}
