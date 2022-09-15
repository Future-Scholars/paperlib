import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

export interface WebContentType {
  url: string;
  document: string;
  cookies: string;
}

export interface WebImporterType {
  stateStore: MainRendererStateStore;
  preference: Preference;

  parse(webContent: WebContentType): Promise<PaperEntity | boolean>;

  preProcess(webContent: WebContentType): boolean;
  parsingProcess(webContent: WebContentType): Promise<PaperEntity | boolean>;
}

export class WebImporter implements WebImporterType {
  stateStore: MainRendererStateStore;
  preference: Preference;
  urlRegExp: RegExp;

  constructor(
    stateStore: MainRendererStateStore,
    preference: Preference,
    urlRegExp: RegExp
  ) {
    this.stateStore = stateStore;
    this.preference = preference;
    this.urlRegExp = urlRegExp;
  }

  async parse(webContent: WebContentType): Promise<PaperEntity | boolean> {
    const enable = this.preProcess(webContent);

    if (enable) {
      return await this.parsingProcess(webContent);
    } else {
      return false;
    }
  }

  preProcess(webContent: WebContentType): boolean {
    return this.urlRegExp.test(webContent.url);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntity | boolean> {
    throw new Error("Method not implemented.");
  }
}
