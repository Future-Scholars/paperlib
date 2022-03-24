import { Preference } from '../../../utils/preference';
import { PaperEntityDraft } from '../../../models/PaperEntityDraft';
import { Exporter } from './exporter';
import { formatString } from '../../../utils/string';

export class BibExporter extends Exporter {
  constructor(preference: Preference) {
    super(preference);
  }

  export(entityDrafts: PaperEntityDraft[]): string {
    let allTexBib = '';

    for (const entity of entityDrafts) {
      let citeKey = '';
      citeKey += entity.authors.split(' ')[0] + '_';
      citeKey += entity.pubTime + '_';
      citeKey += formatString({
        str: entity.title.slice(0, 3),
        removeNewline: true,
        removeWhite: true,
        removeSymbol: true,
      });
      let texbib = '';
      if (entity.pubType == 1) {
        texbib = `@inproceedings{${citeKey},
    year = ${entity.pubTime},
    title = {${entity.title}},
    author = {${entity.authors.replace(/, /g, ' and ')}},
    booktitle = {${this.replacePublication(entity.publication)}},
}`;
      } else {
        texbib = `@article{${citeKey},
    year = ${entity.pubTime},
    title = {${entity.title}},
    author = {${entity.authors.replace(/, /g, ' and ')}},
    journal = {${this.replacePublication(entity.publication)}},
}`;
      }
      allTexBib += texbib + '\n\n';
    }
    return allTexBib;
  }
}
