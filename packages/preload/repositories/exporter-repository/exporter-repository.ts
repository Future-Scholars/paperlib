import { Preference } from "../../utils/preference";
import { PaperEntityDraft } from "../../models/PaperEntityDraft";
import { SharedState } from "../../utils/appstate";
import { BibExporter } from "./exporters/bib-exporter";
import { PlainExporter } from "./exporters/plain-exporter";

export class ExporterRepository {
  sharedState: SharedState;
  preference: Preference;

  bibExporter: BibExporter;
  plainExporter: PlainExporter;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.bibExporter = new BibExporter(this.preference);
    this.plainExporter = new PlainExporter(this.preference);
  }

  export(entityDrafts: PaperEntityDraft[], format: string): string {
    switch (format) {
      case "bibtex":
        return this.bibExporter.export(entityDrafts);
      case "plain":
        return this.plainExporter.export(entityDrafts);
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }
}
