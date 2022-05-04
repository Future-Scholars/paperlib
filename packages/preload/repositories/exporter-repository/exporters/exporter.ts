import { Preference } from "../../../utils/preference";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

export class Exporter {
  preference: Preference;

  constructor(preference: Preference) {
    this.preference = preference;
  }

  export(entityDrafts: PaperEntityDraft[]): string {
    return "";
  }

  replacePublication(publication: string) {
    if (this.preference.get("enableExportReplacement")) {
      for (const kv of this.preference.get("exportReplacement") as {
        from: string;
        to: string;
      }[]) {
        if (kv.from == publication) {
          return kv.to;
        }
      }
    }
    return publication;
  }
}
