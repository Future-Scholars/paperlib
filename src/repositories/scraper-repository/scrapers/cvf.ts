import { Response } from 'got';

import { Scraper, ScraperRequestType } from './scraper';
import { formatString } from '../../../utils/string';
import { Preference } from '../../../utils/preference';
import { PaperEntityDraft } from '../../../models/PaperEntityDraft';

export class CVFScraper extends Scraper {
  constructor(preference: Preference) {
    super(preference);
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable =
      entityDraft.title !== '' &&
      (entityDraft.publication === 'arXiv' || entityDraft.publication === '') &&
      (this.preference.get('cvfScraper') as boolean);

    const shortTitle = formatString({
      str: entityDraft.title,
      removeWhite: true,
      removeStr: '&amp',
    });
    const scrapeURL = `https://paperlib.app/api/cvf/${shortTitle}`;

    const headers = {};

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const response = JSON.parse(rawResponse.body) as {
      year: string;
      booktitle: string;
      type: string;
    };
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
      entityDraft.setValue('pubTime', `${pubTime}`);
      entityDraft.setValue('pubType', pubType);
      entityDraft.setValue('publication', publication);
    }
    return entityDraft;
  }
}
