import got from 'got';


export class Scraper {
  async scrape(entityDraft) {
    try {
      entityDraft = await this.scrapeImpl(entityDraft);
    } catch (error) {
      this.sharedState.set('viewState.alertInformation', `Scraper Error: ${error}`);
    }
    return entityDraft;
  }

  preProcess(entityDraft) {
    throw new Error('Method not implemented.');
  }

  parsingProcess(rawResponse, entityDraft) {
    throw new Error('Method not implemented.');
  }

  async scrapeImpl(entityDraft) {
    const {scrapeURL, headers, enable} = this.preProcess(entityDraft);
    if (enable) {
      const response = await got(
          scrapeURL,
          {
            headers: headers,
          },
      );
      return this.parsingProcess(response, entityDraft);
    } else {
      return entityDraft;
    }
  }
}
