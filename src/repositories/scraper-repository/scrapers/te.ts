import fs from 'fs';
import got, { Response } from 'got';

import { Scraper, ScraperRequestType, ScraperType } from './scraper';
import { Preference } from '../../../utils/preference';
import { PaperEntityDraft } from '../../../models/PaperEntityDraft';

export class TEScraper extends Scraper {
  constructor(preference: Preference) {
    super(preference);
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable =
      entityDraft.title === '' &&
      entityDraft.arxiv === '' &&
      entityDraft.doi === '' &&
      fs.existsSync(entityDraft.mainURL) &&
      (this.preference.get('teScraper') as boolean);

    const scrapeURL = 'https://paperlib.app/api/files/upload/';
    const headers = {};

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const response = JSON.parse(rawResponse.body) as {
      title: string;
    };
    const title = response.title;
    entityDraft.setValue('title', title);
    return entityDraft;
  }

  scrapeImpl = scrapeImpl;
}

async function scrapeImpl(
  this: ScraperType,
  entityDraft: PaperEntityDraft
): Promise<PaperEntityDraft> {
  const { scrapeURL, headers, enable } = this.preProcess(
    entityDraft
  ) as ScraperRequestType;

  if (enable) {
    const form = new FormData();
    // @ts-ignore
    form.append('file', fs.createReadStream(entityDraft.mainURL));
    const response = await got.post(scrapeURL, {
      // @ts-ignore
      body: form,
    });

    return this.parsingProcess(response, entityDraft) as PaperEntityDraft;
  } else {
    return entityDraft;
  }
}
