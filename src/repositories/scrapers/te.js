import {Scraper} from './scraper';
import fs from 'fs';
import got from 'got';


export class TEScraper extends Scraper {
  constructor(preference) {
    super();
    this.preference = preference;
  }

  preProcess(entityDraft) {
    const enable = (
      entityDraft.title === '' &&
      entityDraft.arxiv === '' &&
      entityDraft.doi === '' &&
      fs.existsSync(entityDraft.mainURL) &&
      this.preference.get('teScraper')
    );
    const scrapeURL = 'https://paperlib.app/api/files/upload/';
    const headers = {};

    return {scrapeURL, headers, enable};
  }

  parsingProcess(rawResponse, entityDraft) {
    const response = JSON.parse(rawResponse.body);
    const title = response.title;
    entity.setValue('title', title, false);
    return entityDraft;
  }

  async scrapeImpl(entityDraft) {
    const {scrapeURL, headers, enable} = this.preProcess(entityDraft);
    if (enable) {
      const form = new FormData();
      form.append('file', fs.createReadStream(entityDraft.mainURL));

      const response = await got
          .post('https://paperlib.app/api/files/upload/', {
            body: form,
          });

      return this.parsingProcess(response, entityDraft);
    } else {
      return entityDraft;
    }
  }
}
