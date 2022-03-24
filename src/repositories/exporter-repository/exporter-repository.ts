import { Preference } from '../../utils/preference';
import { PaperEntityDraft } from '../../models/PaperEntityDraft';
import { SharedState } from '../../interactors/app-state';
import { BibExporter } from './exporters/bib-exporter';
import { PlainExporter } from './exporters/plain-exporter';

export class ExporterRepository {
  preference: Preference;
  sharedState: SharedState;

  bibExporter: BibExporter;
  plainExporter: PlainExporter;

  constructor(preference: Preference, sharedState: SharedState) {
    this.preference = preference;
    this.sharedState = sharedState;

    this.bibExporter = new BibExporter(this.preference);
    this.plainExporter = new PlainExporter(this.preference);
  }

  export(entityDrafts: PaperEntityDraft[], format: string): string {
    switch (format) {
      case 'bibtex':
        return this.bibExporter.export(entityDrafts);
      case 'plain':
        return this.plainExporter.export(entityDrafts);
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }
}
