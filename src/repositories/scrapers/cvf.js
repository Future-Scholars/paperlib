import {Scraper} from './scraper';
import {formatString} from '../../utils/misc';

export class CVFScraper extends Scraper {
  constructor(preference) {
    super();
    this.preference = preference;
  }

  preProcess(entityDraft) {
    const enable = (
      entityDraft.title !== '' &&
      (entityDraft.publication === 'arXiv' || entityDraft.publication === '') &&
      this.preference.get('cvfScraper')
    );
    const shortTitle = formatString({
      str: entityDraft.title,
      removeWhite: true,
      removeStr: '&amp',
    });
    const scrapeURL = `https://paperlib.app/api/cvf/${shortTitle}`;
    const headers = {};

    return {scrapeURL, headers, enable};
  }

  parsingProcess(rawResponse, entityDraft) {
    const response = JSON.parse(rawResponse.body);
    if (typeof response.year !== 'undefined') {
      const pubTime = response.year;
      const publication = response.booktitle;
      let pubType;
      if (response.type === 'inproceedings') {
        pubType = 1;
      } else if (response.type === 'article') {
        pubType = 0;
      } else {
        pubType = 2;
      }
      entityDraft.setValue('pubTime', `${pubTime}`, false);
      entityDraft.setValue('pubType', pubType, false);
      entityDraft.setValue('publication', publication, false);
    }
    return entityDraft;
  }
}
