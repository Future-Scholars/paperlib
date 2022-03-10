import {Scraper} from './scraper';
import {formatString} from '../../utils/misc';

export class DOIScraper extends Scraper {
  constructor(preference) {
    super();
    this.preference = preference;
  }

  preProcess(entityDraft) {
    const enable = entityDraft.doi !== '' && this.preference.get('doiScraper');
    const doiID = formatString({
      str: entityDraft.doi,
      removeNewline: true,
      removeWhite: true,
    });
    const scrapeURL = `https://dx.doi.org/${doiID}`;
    const headers = {
      Accept: 'application/json',
    };

    return {scrapeURL, headers, enable};
  }

  parsingProcess(rawResponse, entityDraft) {
    const response = JSON.parse(rawResponse.body);
    const title = response.title;
    const authors = response.author
        .map((author) => {
          return author.given + ' ' + author.family;
        })
        .join(', ');
    const pubTime = response.published['date-parts']['0'][0];
    let pubType;
    if (response.type == 'proceedings-article') {
      pubType = 1;
    } else if (response.type == 'journal-article') {
      pubType = 0;
    } else {
      pubType = 2;
    }
    const publication = response['container-title'];

    entityDraft.setValue('title', title, false);
    entityDraft.setValue('authors', authors, false);
    entityDraft.setValue('pubTime', `${pubTime}`, false);
    entityDraft.setValue('pubType', pubType, false);
    entityDraft.setValue('publication', publication, false);

    return entityDraft;
  }
}
