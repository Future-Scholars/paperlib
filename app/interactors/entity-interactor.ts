import { ObjectId } from "bson";
import { clipboard } from "electron";
import { readFileSync } from "fs";
import path from "path";

import {
  Categorizer,
  CategorizerType,
  Colors,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { DBRepository } from "@/repositories/db-repository/db-repository";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { DownloaderRepository } from "@/repositories/downloader-repository/downloader-repository";
import { FileRepository } from "@/repositories/file-repository/file-repository";
import { ReferenceRepository } from "@/repositories/reference-repository/reference-repository";
import { ScraperRepository } from "@/repositories/scraper-repository/scraper-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { bibtex2json, bibtex2paperEntityDraft } from "@/utils/bibtex";

export class EntityInteractor {
  stateStore: MainRendererStateStore;

  dbRepository: DBRepository;
  scraperRepository: ScraperRepository;
  fileRepository: FileRepository;
  referenceRepository: ReferenceRepository;
  downloaderRepository: DownloaderRepository;

  constructor(
    stateStore: MainRendererStateStore,
    dbRepository: DBRepository,
    scraperRepository: ScraperRepository,
    fileRepository: FileRepository,
    referenceRepository: ReferenceRepository,
    downloaderRepository: DownloaderRepository
  ) {
    this.stateStore = stateStore;
    this.dbRepository = dbRepository;
    this.scraperRepository = scraperRepository;
    this.fileRepository = fileRepository;
    this.referenceRepository = referenceRepository;
    this.downloaderRepository = downloaderRepository;
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
    let successfulEntityDrafts: PaperEntity[] = [];
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
      let paperEntityDraftsFromPDFs = await Promise.all(
        pdfUrls.map((url) => pdfScrapingPromise(url))
      );
      // 1.2 BibTeX scraping.
      const bibScrapingPromise = async (url: string) => {
        const bibtexStr = readFileSync(url.replace("file://", ""), "utf8");
        const bibtexes = bibtex2json(bibtexStr);
        const paperEntityDrafts = [];
        for (const bibtex of bibtexes) {
          let paperEntityDraft = new PaperEntity(true);
          paperEntityDraft = bibtex2paperEntityDraft(bibtex, paperEntityDraft);
          paperEntityDrafts.push(paperEntityDraft);
        }
        return paperEntityDrafts;
      };
      let paperEntityDraftsFromBibTexes = (
        await Promise.all(bibUrls.map((url) => bibScrapingPromise(url)))
      ).flat();
      // 2. File moving.
      paperEntityDraftsFromPDFs = (await Promise.all(
        paperEntityDraftsFromPDFs.map((paperEntityDraft) =>
          this.fileRepository.move(paperEntityDraft)
        )
      )) as PaperEntity[];
      paperEntityDraftsFromPDFs = paperEntityDraftsFromPDFs.filter(
        (paperEntityDraft) => paperEntityDraft !== null
      );
      // 3. Merge PDF and BibTeX scraping results.
      const paperEntityDrafts = paperEntityDraftsFromPDFs.concat(
        paperEntityDraftsFromBibTexes
      );
      // 4. DB insertion.
      const dbSuccesses = await this.dbRepository.updatePaperEntities(
        paperEntityDrafts
      );
      // - find unsuccessful entities.
      const unsuccessfulEntityDrafts = paperEntityDrafts.filter(
        (_, index) => !dbSuccesses[index]
      );
      // - find successful entities.
      successfulEntityDrafts = paperEntityDrafts.filter(
        (_, index) => dbSuccesses[index]
      );
      // - remove files of unsuccessful entities.
      await Promise.all(
        unsuccessfulEntityDrafts.map((entityDraft) =>
          this.fileRepository.remove(entityDraft)
        )
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Add paper to library failed: ${
        error as string
      }`;
    }
    this.stateStore.viewState.processingQueueCount -= urlList.length;
    return successfulEntityDrafts;
  }

  async createIntoCategorizer(
    urlList: string[],
    categorizer: Categorizer,
    type: CategorizerType
  ) {
    this.stateStore.logState.processLog = `Adding ${urlList.length} papers to ${categorizer.name}...`;
    this.stateStore.viewState.processingQueueCount += urlList.length;

    try {
      const paperEntityDrafts = await this.create(urlList);

      // 4. DB update.
      const toBeUpdatedPaperEntityDrafts = paperEntityDrafts.map(
        (paperEntityDraft) => {
          if ((type = "PaperTag")) {
            paperEntityDraft.setValue("tags", [
              new PaperTag("", 0, "").initialize(categorizer),
            ]);
          } else if (type === "PaperFolder") {
            paperEntityDraft.setValue("folders", [
              new PaperFolder("", 0, "").initialize(categorizer),
            ]);
          }
          return paperEntityDraft;
        }
      );
      console.log(toBeUpdatedPaperEntityDrafts);
      await this.dbRepository.updatePaperEntities(toBeUpdatedPaperEntityDrafts);
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

  deleteSup(paperEntity: PaperEntity, url: string) {
    this.stateStore.logState.processLog = `Removing supplementary file ${url}...`;
    this.stateStore.viewState.processingQueueCount += 1;

    try {
      void this.fileRepository.removeFile(url);
      paperEntity.supURLs = paperEntity.supURLs.filter(
        (supUrl) => supUrl !== path.basename(url)
      );
      this.dbRepository.updatePaperEntities([paperEntity]);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to remove supplementary file ${url}`;
    }

    this.stateStore.viewState.processingQueueCount -= 1;
  }

  // ========================
  // Update
  // ========================
  async update(paperEntities: PaperEntity[]) {
    this.stateStore.logState.processLog = `Updating ${paperEntities.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += paperEntities.length;

    try {
      const updatePromise = async (paperEntityDrafts: PaperEntity[]) => {
        const movedPaperEntityDrafts = await Promise.all(
          paperEntityDrafts.map((paperEntityDraft: PaperEntity) =>
            this.fileRepository.move(paperEntityDraft, true)
          )
        );

        for (let i = 0; i < movedPaperEntityDrafts.length; i++) {
          if (movedPaperEntityDrafts[i] === null) {
            movedPaperEntityDrafts[i] = paperEntityDrafts[i];
          }
        }

        await this.dbRepository.updatePaperEntities(
          movedPaperEntityDrafts as PaperEntity[]
        );
      };

      await updatePromise(paperEntities);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Update paper failed: ${
        error as string
      }`;
    }

    this.stateStore.viewState.processingQueueCount -= paperEntities.length;
  }

  async scrape(paperEntities: PaperEntity[]) {
    this.stateStore.logState.processLog = `Scraping ${paperEntities.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += paperEntities.length;

    const scrapePromise = async (paperEntityDraft: PaperEntity) => {
      return await this.scraperRepository.scrape(paperEntityDraft);
    };

    try {
      paperEntities = await Promise.all(
        paperEntities.map((paperEntityDraft) => scrapePromise(paperEntityDraft))
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Scrape paper failed: ${
        error as string
      }`;
    }

    this.stateStore.viewState.processingQueueCount -= paperEntities.length;
    await this.update(paperEntities);
  }

  async scrapeFrom(paperEntities: PaperEntity[], scraperName: string) {
    this.stateStore.logState.processLog = `Scraping ${paperEntities.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += paperEntities.length;

    const scrapePromise = async (paperEntityDraft: PaperEntity) => {
      return await this.scraperRepository.scrapeFrom(
        paperEntityDraft,
        scraperName
      );
    };

    try {
      paperEntities = await Promise.all(
        paperEntities.map((paperEntityDraft) => scrapePromise(paperEntityDraft))
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Scrape paper failed: ${
        error as string
      }`;
    }

    this.stateStore.viewState.processingQueueCount -= paperEntities.length;
    await this.update(paperEntities);
  }

  async updateWithCategorizer(
    ids: (string | ObjectId)[],
    categorizer: Categorizer,
    type: CategorizerType
  ) {
    this.stateStore.logState.processLog = `Updating ${ids.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += ids.length;

    try {
      // 1. Get Entities by IDs.
      const paperEntities = await this.dbRepository.paperEntitiesByIds(ids);

      let paperEntityDrafts = paperEntities.map((paperEntity) => {
        return new PaperEntity(false).initialize(paperEntity);
      });

      paperEntityDrafts = paperEntityDrafts.map((paperEntityDraft) => {
        if (type === "PaperTag") {
          let tagNames = paperEntityDraft.tags.map((tag) => tag.name);
          if (!tagNames.includes(categorizer.name)) {
            paperEntityDraft.tags.push(categorizer);
          }
        }
        if (type === "PaperFolder") {
          let folderNames = paperEntityDraft.folders.map(
            (folder) => folder.name
          );
          if (!folderNames.includes(categorizer.name)) {
            paperEntityDraft.folders.push(categorizer);
          }
        }

        return paperEntityDraft;
      });

      await this.dbRepository.updatePaperEntities(paperEntityDrafts);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Add paper to ${
        categorizer.name
      } failed: ${error as string}`;
    }

    this.stateStore.viewState.processingQueueCount -= ids.length;
  }

  colorizeCategorizers(
    color: Colors,
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      void this.dbRepository.colorizeCategorizer(
        color,
        type,
        categorizer,
        name
      );
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to colorize categorizer ${type} ${name} ${categorizer}`;
    }
    this.stateStore.viewState.processingQueueCount -= 1;
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
  // Delete
  // ========================
  async delete(ids: (ObjectId | string)[]) {
    this.stateStore.logState.processLog = `Deleting ${ids.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += ids.length;
    try {
      const removeFileURLs = await this.dbRepository.deletePaperEntities(ids);
      await Promise.all(
        removeFileURLs.map((url) => this.fileRepository.removeFile(url))
      );
      //TODO: implement this
      // void this.cacheRepository.remove(ids);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Delete paper failed: ${
        error as string
      }`;
    }
    this.stateStore.viewState.processingQueueCount -= ids.length;
  }

  // ========================
  // Download
  // ========================
  async locateMainFile(paperEntities: PaperEntity[]) {
    this.stateStore.logState.processLog = `Locating main file for ${paperEntities.length} paper(s)...`;
    this.stateStore.viewState.processingQueueCount += paperEntities.length;

    let paperEntityDrafts = paperEntities.map((paperEntity) => {
      return new PaperEntity(false).initialize(paperEntity);
    });

    try {
      const downloadPromise = async (paperEntityDraft: PaperEntity) => {
        return await this.downloaderRepository.download(paperEntityDraft);
      };

      paperEntityDrafts = await Promise.all(
        paperEntityDrafts.map((paperEntityDraft) =>
          downloadPromise(paperEntityDraft)
        )
      );

      await this.update(paperEntityDrafts);
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Download paper failed: ${
        error as string
      }`;
    }

    this.stateStore.viewState.processingQueueCount -= paperEntities.length;
  }

  // ========================
  // Export
  // ========================

  async export(paperEntities: PaperEntity[], format: string) {
    let paperEntityDrafts = paperEntities.map((paperEntity) => {
      return new PaperEntity(false).initialize(paperEntity);
    });

    let copyStr = "";
    if (format === "BibTex") {
      copyStr = this.referenceRepository.exportBibTexBody(
        this.referenceRepository.toCite(paperEntityDrafts)
      );
    } else if (format === "BibTex-Key") {
      copyStr = this.referenceRepository.exportBibTexKey(
        this.referenceRepository.toCite(paperEntityDrafts)
      );
    } else if (format === "PlainText") {
      copyStr = await this.referenceRepository.exportPlainText(
        this.referenceRepository.toCite(paperEntityDrafts)
      );
    }

    clipboard.writeText(copyStr);
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
