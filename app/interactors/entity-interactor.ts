import path from "path";

import { Categorizer, CategorizerType, Colors } from "@/models/categorizer";
import { DBRepository } from "@/repositories/db-repository/db-repository";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { PaperEntity } from "@/models/paper-entity";

export class EntityInteractor {
  stateStore: MainRendererStateStore;

  dbRepository: DBRepository;

  constructor(stateStore: MainRendererStateStore, dbRepository: DBRepository) {
    this.stateStore = stateStore;
    this.dbRepository = dbRepository;
  }

  // ========================
  // Read
  // ========================

  async loadPaperEntities(
    search: string,
    flag: boolean,
    tag: string,
    folder: string,
    sortBy: string,
    sortOrder: string
  ) {
    let entities;
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      entities = await this.dbRepository.paperEntities(
        search,
        flag,
        tag,
        folder,
        sortBy,
        sortOrder
      );
    } catch (e) {
      console.error(e);
      entities = [] as PaperEntityResults;
    }
    // TODO: implement this
    // if (this.sharedState.viewState.searchMode.get() === "fulltext" && search) {
    //   entities = await this.cacheRepository.fullTextFilter(search, entities);
    // }
    this.stateStore.viewState.processingQueueCount -= 1;
    return entities;
  }

  async loadCategorizers(
    type: CategorizerType,
    sortBy: string,
    sortOrder: string
  ) {
    return await this.dbRepository.categorizers(type, sortBy, sortOrder);
  }

  // ========================
  // Create
  // ========================
  async create(urlList: string[]) {
    this.stateStore.viewState.processingQueueCount += urlList.length;
    try {
      const pdfUrls = urlList.filter((url) => path.extname(url) === ".pdf");
      const bibUrls = urlList.filter((url) => path.extname(url) === ".bib");

      // 1.1 PDF Metadata scraping.
      const pdfScrapingPromise = async (url: string) => {
        let paperEntityDraft = new PaperEntity(true);
        paperEntityDraft.setValue("mainURL", url);
        paperEntityDraft = await this.scraperRepository.scrape(
          paperEntityDraft
        );
        return paperEntityDraft;
      };
      let entityDraftsFromPDFs = await Promise.all(
        pdfUrls.map((url) => pdfScrapingPromise(url))
      );
      //   // 1.2 BibTeX scraping.
      //   const bibScrapingPromise = async (url: string) => {
      //     const bibtexStr = readFileSync(url.replace("file://", ""), "utf8");
      //     const bibtexes = bibtex2json(bibtexStr);
      //     const entityDrafts = [];
      //     for (const bibtex of bibtexes) {
      //       let entityDraft = new PaperEntityDraft(true);
      //       entityDraft = bibtex2entityDraft(bibtex, entityDraft);
      //       entityDrafts.push(entityDraft);
      //     }
      //     return entityDrafts;
      //   };
      //   let entityDraftsFromBibTexes = (
      //     await Promise.all(bibUrls.map((url) => bibScrapingPromise(url)))
      //   ).flat();
      //   // 2. File moving.
      //   entityDraftsFromPDFs = (await Promise.all(
      //     entityDraftsFromPDFs.map((entityDraft) =>
      //       this.fileRepository.move(entityDraft)
      //     )
      //   )) as PaperEntityDraft[];
      //   entityDraftsFromPDFs = entityDraftsFromPDFs.filter(
      //     (entityDraft) => entityDraft !== null
      //   );
      //   // 3. Merge PDF and BibTeX scraping results.
      //   const entityDrafts = entityDraftsFromPDFs.concat(
      //     entityDraftsFromBibTexes
      //   );
      //   // 4. DB insertion.
      //   const dbSuccesses = await this.dbRepository.update(entityDrafts);
      //   // - find unsuccessful entities.
      //   const unsuccessfulEntityDrafts = entityDrafts.filter(
      //     (_entityDraft, index) => !dbSuccesses[index]
      //   );
      //   // - remove files of unsuccessful entities.
      //   await Promise.all(
      //     unsuccessfulEntityDrafts.map((entityDraft) =>
      //       this.fileRepository.remove(entityDraft)
      //     )
      //   );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Add paper to library failed: ${
        error as string
      }`;
    }
    this.stateStore.viewState.processingQueueCount -= urlList.length;
  }

  // ========================
  // Remove
  // ========================
  deleteCategorizer(
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      void this.dbRepository.deleteCategorizer(true, type, categorizer, name);
    } catch (e) {
      console.error(e);
      this.stateStore.logState.alertLog = `Failed to remove categorizer ${type} ${name} ${categorizer}`;
    }
    this.stateStore.viewState.processingQueueCount -= 1;
  }

  // ========================
  // Update
  // ========================
  colorizeCategorizers(
    color: Colors,
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    void this.dbRepository.colorizeCategorizer(color, type, categorizer, name);
  }

  async renameCategorizer(
    oldName: string,
    newName: string,
    type: CategorizerType
  ) {
    const success = await this.dbRepository.renameCategorizer(
      oldName,
      newName,
      type
    );

    // TODO: uncomment this
    // if (
    //   categorizerType === "PaperFolder" &&
    //   this.stateStore.selectionState.pluginLinkedFolder.value ===
    //     oldCategorizerName &&
    //   success
    // ) {
    //   this.stateStore.selectionState.pluginLinkedFolder.value =
    //     newCategorizerName;
    //   this.preference.set("pluginLinkedFolder", newCategorizerName);
    // }
  }

  // ========================
  // Dev Functions
  // ========================
  async addDummyData() {
    await this.dbRepository.addDummyData();
  }

  async removeAll() {
    await this.dbRepository.removeAll();
  }
}
