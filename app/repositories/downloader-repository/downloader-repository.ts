import { watch } from "vue";

import { createDecorator } from "@/base/injection";
import { PaperEntity } from "@/models/paper-entity";
import { DownloaderPreference, Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { ArXivDownloader } from "./downloader/arxiv";
import { CustomDownloader } from "./downloader/custom";
import { DownloaderType } from "./downloader/downloader";
import { SemanticScholarDownloader } from "./downloader/semanticscholar";
import { UnpayWallDownloader } from "./downloader/unpaywall";
import { XHubDownloader } from "./downloader/xhub";

export const IDownloaderRepository = createDecorator("IDownloaderRepository");

export class DownloaderRepository {
  stateStore: MainRendererStateStore;
  preference: Preference;

  downloaderList: Array<{ name: string; downloader: DownloaderType }>;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.downloaderList = [];

    this.createDownloaders();

    watch(
      () => this.stateStore.viewState.downloaderReinited,
      () => {
        this.createDownloaders();
      }
    );
  }

  async createDownloaders() {
    this.downloaderList = [];

    const downloaderPrefs = (
      this.preference.get("downloaders") as Array<DownloaderPreference>
    ).sort((a, b) => b.priority - a.priority);

    for (const downloader of downloaderPrefs) {
      let downloaderInstance: DownloaderType | undefined;
      switch (downloader.name) {
        case "arxiv":
          downloaderInstance = new ArXivDownloader(
            this.stateStore,
            this.preference
          );
          break;
        case "x-hub":
          downloaderInstance = new XHubDownloader(
            this.stateStore,
            this.preference
          );
          break;
        case "unpaywall":
          downloaderInstance = new UnpayWallDownloader(
            this.stateStore,
            this.preference
          );
          break;
        case "semanticscholar":
          downloaderInstance = new SemanticScholarDownloader(
            this.stateStore,
            this.preference
          );
          break;
        default:
          downloaderInstance = new CustomDownloader(
            this.stateStore,
            this.preference,
            downloader.name
          );
          break;
      }
      if (downloaderInstance !== undefined) {
        this.downloaderList.push({
          name: downloader.name,
          downloader: downloaderInstance,
        });
      }
    }
  }

  async download(
    entityDraft: PaperEntity,
    excludes: string[] = []
  ): Promise<PaperEntity> {
    for (const downloader of this.downloaderList) {
      if (excludes.includes(downloader.name)) {
        continue;
      }
      try {
        const entityDraftOrNull = await downloader.downloader.download(
          entityDraft
        );
        if (entityDraftOrNull !== null) {
          return entityDraftOrNull;
        }
      } catch (error) {
        window.logger.error(
          `${downloader.name} error`,
          error as string,
          true,
          "Downloader"
        );
      }
    }

    return entityDraft;
  }
}
