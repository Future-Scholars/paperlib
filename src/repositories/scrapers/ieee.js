import {Scraper} from './scraper';
import {formatString} from '../../utils/misc';

export class IEEEScraper extends Scraper {
  constructor(preference) {
    super();
    this.preference = preference;
  }

  preProcess(entityDraft) {
    const enable = (
      entityDraft.title !== '' &&
      (entityDraft.publication === 'arXiv' || entityDraft.publication === '') &&
      this.preference.get('ieeeScraper')
    );
    let requestTitle = formatString({
      str: entityDraft.title,
      removeNewline: true,
    });
    requestTitle = requestTitle.replace(' ', '+');

    const scrapeURL = 'http://ieeexploreapi.ieee.org/api/v1/search/articles?apikey=' +
                        this.preference.get('ieeeAPIKey') +
                        '&format=json&max_records=25&start_record=1&sort_order=asc&sort_field=article_number&article_title=' +
                        requestTitle;

    const headers = {
      Accept: 'application/json',
    };

    return {scrapeURL, headers, enable};
  }

  parsingProcess(rawResponse, entityDraft) {
    const response = JSON.parse(rawResponse.body);
    if (response.total_records > 0) {
      for (const article of response.articles) {
        let plainHitTitle = formatString({
          str: article.title,
          removeStr: '&amp',
        });
        plainHitTitle = formatString({
          str: plainHitTitle,
          removeSymbol: true,
          lowercased: true,
        });

        let existTitle = formatString({
          str: entityDraft.title,
          removeStr: '&amp',
        });
        existTitle = formatString({
          str: existTitle,
          removeSymbol: true,
          lowercased: true,
        });

        if (plainHitTitle != existTitle) {
          continue;
        } else {
          const title = article.title.replace('&amp;', '&');
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
          } else if (
            article.content_type.includes('Conferences')
          ) {
            pubType = 1;
          } else {
            pubType = 2;
          }

          const publication = article.publication_title;
          entityDraft.setValue('title', title, false);
          entityDraft.setValue('authors', authors, false);
          entityDraft.setValue('pubTime', `${pubTime}`, false);
          entityDraft.setValue('pubType', pubType, false);
          entityDraft.setValue('publication', publication, false);

          break;
        }
      }
    }
    return entityDraft;
  }
}
