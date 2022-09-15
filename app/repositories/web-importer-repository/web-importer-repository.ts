import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { ArXivWebImporter } from "./importers/arxiv";
import { EmbedWebImporter } from "./importers/embed";
import { GoogleScholarWebImporter } from "./importers/google-scholar";
import { IEEEWebImporter } from "./importers/ieee";
import { WebContentType, WebImporterType } from "./importers/importer";
import { PDFUrlWebImporter } from "./importers/pdfurl";

export class WebImporterRepository {
  stateStore: MainRendererStateStore;
  preference: Preference;

  importerList: Record<string, WebImporterType>;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.importerList = {
      arxiv: new ArXivWebImporter(this.stateStore, this.preference),
      googlescholar: new GoogleScholarWebImporter(
        this.stateStore,
        this.preference
      ),
      ieee: new IEEEWebImporter(this.stateStore, this.preference),
      embed: new EmbedWebImporter(this.stateStore, this.preference),
      pdfurl: new PDFUrlWebImporter(this.stateStore, this.preference),
    };
  }

  async parse(webContent: WebContentType): Promise<PaperEntity | boolean> {
    let parsed: PaperEntity | boolean = false;
    for (const [name, importer] of Object.entries(this.importerList)) {
      try {
        parsed = await importer.parse(webContent);
      } catch (error) {
        this.stateStore.logState.alertLog = `Web importer ${name} error: ${
          error as string
        }`;
      }
      if (parsed) {
        break;
      }
    }
    return parsed;
  }
}
