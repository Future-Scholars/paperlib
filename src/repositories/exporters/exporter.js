import {formatString} from '../../utils/misc';

export class Exporter {
  constructor(preference) {
    this.preference = preference;
  }

  export(entities, format) {
    if (format === 'bibtex') {
      return this._exportBibtex(entities);
    } else if (format === 'plain') {
      return this._exportPlainText(entities);
    }
  }

  _replacePublication(publication) {
    if (this.preference.get('enableExportReplacement')) {
      for (const kv of this.preference.get('exportReplacement')) {
        if (kv.from == publication) {
          return kv.to;
        }
      }
    }
    return publication;
  }

  _exportBibtex(entities) {
    let allTexBib = '';

    for (const entity of entities) {
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
    author = {${entity.authors.replace(', ', ' and ')}},
    booktitle = {${this._replacePublication(entity.publication)}},
}`;
      } else {
        texbib = `@article{${citeKey},
    year = ${entity.pubTime},
    title = {${entity.title}},
    author = {${entity.authors.replace(', ', ' and ')}},
    journal = {${this._replacePublication(entity.publication)}},
}`;
      }
      allTexBib += texbib + '\n\n';
    }
    return allTexBib;
  }

  _exportPlainText(entities) {
    let allPlain = '';

    for (const entity of entities) {
      const text = `${entity.authors}. \"${entity.title}\" In ${entity.publication}, ${entity.pubTime}. \n\n`;
      allPlain += text;
    }
    return allPlain;
  }
}
