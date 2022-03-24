import { Preference } from '../../../utils/preference';
import { PaperEntityDraft } from '../../../models/PaperEntityDraft';
import { Exporter } from './exporter';

export class PlainExporter extends Exporter {
  constructor(preference: Preference) {
    super(preference);
  }

  export(entityDrafts: PaperEntityDraft[]): string {
    let allPlain = '';

    for (const entity of entityDrafts) {
      const text = `${entity.authors}. \"${
        entity.title
      }\" In ${this.replacePublication(entity.publication)}, ${
        entity.pubTime
      }. \n\n`;
      allPlain += text;
    }
    return allPlain;
  }
}
