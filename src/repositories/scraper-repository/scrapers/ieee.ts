import { Response } from 'got';

import { Scraper, ScraperRequestType } from './scraper';
import { formatString } from '../../../utils/string';
import { Preference } from '../../../utils/preference';
import { PaperEntityDraft } from '../../../models/PaperEntityDraft';

export class IEEEScraper extends Scraper {
  constructor(preference: Preference) {
    super(preference);
  }

  preProcess(entityDraft: PaperEntityDraft): ScraperRequestType {
    const enable =
      entityDraft.title !== '' &&
      (entityDraft.publication === 'arXiv' || entityDraft.publication === '') &&
      (this.preference.get('ieeeScraper') as boolean) &&
      (this.preference.get('ieeeAPIKey') as string) !== '';

    let requestTitle = formatString({
      str: entityDraft.title,
      removeNewline: true,
    });
    requestTitle = requestTitle.replace(/ /g, '+');
    const scrapeURL =
      'http://ieeexploreapi.ieee.org/api/v1/search/articles?apikey=' +
      (this.preference.get('ieeeAPIKey') as string) +
      '&format=json&max_records=25&start_record=1&sort_order=asc&sort_field=article_number&article_title=' +
      requestTitle;

    const headers = {
      Accept: 'application/json',
    };

    return { scrapeURL, headers, enable };
  }

  parsingProcess(
    rawResponse: Response<string>,
    entityDraft: PaperEntityDraft
  ): PaperEntityDraft {
    const response = JSON.parse(rawResponse.body) as {
      total_records: number;
      articles: {
        title: string;
        authors: {
          authors: {
            full_name: string;
          }[];
        };
        publication_year: string;
        content_type: string;
        publication_title: string;
      }[];
    };
    if (response.total_records > 0) {
      for (const article of response.articles) {
        const plainHitTitle = formatString({
          str: article.title,
          removeStr: '&amp',
          removeSymbol: true,
          lowercased: true,
        });

        const existTitle = formatString({
          str: entityDraft.title,
          removeStr: '&amp',
          removeSymbol: true,
          lowercased: true,
        });

        if (plainHitTitle != existTitle) {
          continue;
        } else {
          const title = article.title.replace(/&amp;/g, '&');
          const authors = article.authors.authors
            .map((author) => {
              return author.full_name.trim();
            })
            .join(', ');

          const pubTime = article.publication_year;

          let pubType;
          if (
            article.content_type.includes('Journals') ||
            article.content_type.includes('Article')
          ) {
            pubType = 0;
          } else if (article.content_type.includes('Conferences')) {
            pubType = 1;
          } else if (article.content_type.includes('Book')) {
            pubType = 3;
          } else {
            pubType = 2;
          }

          const publication = article.publication_title;
          entityDraft.setValue('title', title);
          entityDraft.setValue('authors', authors);
          entityDraft.setValue('pubTime', `${pubTime}`);
          entityDraft.setValue('pubType', pubType);
          entityDraft.setValue('publication', publication);

          break;
        }
      }
    }
    return entityDraft;
  }
}
