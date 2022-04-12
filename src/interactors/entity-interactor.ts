import { clipboard, shell } from 'electron';
import path from 'path';
import { BrowserWindow } from '@electron/remote';

import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';

import { SharedState } from './app-state';
import { Preference } from '../utils/preference';
import { CategorizerType } from '../models/PaperCategorizer';
import { PaperEntityDraft } from '../models/PaperEntityDraft';
import { DBRepository } from '../repositories/db-repository/db-repository';
import { ScraperRepository } from '../repositories/scraper-repository/scraper-repository';
import { FileRepository } from '../repositories/file-repository/file-repository';
import { WebDavFileRepository } from '../repositories/file-repository/webdav-repository';
import { ExporterRepository } from '../repositories/exporter-repository/exporter-repository';
import { CacheRepository } from '../repositories/cache-repository/cache-repository';

export class EntityInteractor {
  sharedState: SharedState;
  preference: Preference;

  dbRepository: DBRepository;
  scraperRepository: ScraperRepository;
  fileRepository: FileRepository;
  exporterRepository: ExporterRepository;
  cacheRepository: CacheRepository;

  scheduler: ToadScheduler;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.dbRepository = new DBRepository(this.preference, this.sharedState);
    this.scraperRepository = new ScraperRepository(
      this.preference,
      this.sharedState
    );

    if (
      this.preference.get('syncFileStorage') === 'webdav' &&
      this.preference.get('webdavURL') &&
      this.preference.get('webdavUsername')
    ) {
      this.fileRepository = new WebDavFileRepository(
        this.preference,
        this.sharedState
      );
    } else {
      this.fileRepository = new FileRepository(
        this.preference,
        this.sharedState
      );
    }

    this.exporterRepository = new ExporterRepository(
      this.preference,
      this.sharedState
    );
    this.cacheRepository = new CacheRepository(
      this.preference,
      this.sharedState
    );

    this.scheduler = new ToadScheduler();
    this.setupRoutineScrape();
  }

  debug() {
    void this.dbRepository.entitiesByIds(['62389dfa09055b636c41c01e']);
  }

  // ============================================================
  // Read
  async load(
    search: string,
    flag: boolean,
    tag: string,
    folder: string,
    sortBy: string,
    sortOrder: string
  ) {
    let entities = await this.dbRepository.entities(
      search,
      flag,
      tag,
      folder,
      sortBy,
      sortOrder
    );
    if (this.sharedState.viewState.searchMode.value === 'fulltext' && search) {
      entities = await this.cacheRepository.fullTextFilter(search, entities);
    }

    return entities;
  }

  async loadCategorizers(categorizerType: CategorizerType) {
    return await this.dbRepository.categorizers(categorizerType);
  }

  // ============================================================
  // Create
  async add(urlList: string[]) {
    this.sharedState.set(
      'viewState.processingQueueCount',
      (this.sharedState.viewState.processingQueueCount.value as number) +
        urlList.length
    );

    try {
      // 1. Metadata scraping.
      const scrapingPromise = async (url: string) => {
        let entityDraft = new PaperEntityDraft(true);
        entityDraft.setValue('mainURL', url);
        entityDraft = await this.scraperRepository.scrape(entityDraft);
        return entityDraft;
      };

      let entityDrafts = await Promise.all(
        urlList.map((url) => scrapingPromise(url))
      );

      // 2. File moving.
      entityDrafts = (await Promise.all(
        entityDrafts.map((entityDraft) => this.fileRepository.move(entityDraft))
      )) as PaperEntityDraft[];
      entityDrafts = entityDrafts.filter((entityDraft) => entityDraft !== null);

      // 3. DB insertion.
      const dbSuccesses = await this.dbRepository.update(entityDrafts);
      // - find unsuccessful entities.
      const unsuccessfulEntityDrafts = entityDrafts.filter(
        (_entityDraft, index) => !dbSuccesses[index]
      );
      // - remove files of unsuccessful entities.
      await Promise.all(
        unsuccessfulEntityDrafts.map((entityDraft) =>
          this.fileRepository.remove(entityDraft)
        )
      );
    } catch (error) {
      this.sharedState.set(
        'viewState.alertInformation',
        `Add failed: ${error as string}`
      );
    }

    this.sharedState.set(
      'viewState.processingQueueCount',
      (this.sharedState.viewState.processingQueueCount.value as number) -
        urlList.length
    );
  }

  async addFromPlugin(urlList: string[]) {
    this.sharedState.set(
      'viewState.processingQueueCount',
      (this.sharedState.viewState.processingQueueCount.value as number) +
        urlList.length
    );

    urlList = urlList.map((url) => {
      return url.replace('paperlib://download?url=', '');
    });

    const downloadedURLList = await this.fileRepository.download(urlList);
    this.sharedState.set(
      'viewState.processingQueueCount',
      (this.sharedState.viewState.processingQueueCount.value as number) -
        urlList.length
    );
    void this.add(downloadedURLList);
  }

  // ============================================================
  // Delete
  async delete(ids: string[]) {
    try {
      const removeFileURLs = await this.dbRepository.remove(ids);
      await Promise.all(
        removeFileURLs.map((url) => this.fileRepository.removeFile(url))
      );
      void this.cacheRepository.remove(ids);
    } catch (error) {
      this.sharedState.set(
        'viewState.alertInformation',
        `Delete failed: ${error as string}`
      );
    }
  }

  deleteSup(entityStr: string, url: string) {
    const entity = JSON.parse(entityStr) as PaperEntityDraft;

    try {
      void this.fileRepository.removeFile(url);
      entity.supURLs = entity.supURLs.filter(
        (supUrl) => supUrl !== path.basename(url)
      );
      void this.dbRepository.update([entity]);
    } catch (error) {
      this.sharedState.set(
        'viewState.alertInformation',
        `Delete failed: ${error as string}`
      );
    }
  }

  deleteCategorizer(categorizerName: string, categorizerType: CategorizerType) {
    void this.dbRepository.deleteCategorizers(categorizerName, categorizerType);
  }

  // ============================================================
  // Update
  async scrape(entitiesStr: string) {
    let entityDrafts = JSON.parse(entitiesStr) as PaperEntityDraft[];
    entityDrafts = entityDrafts.map((entityDraft) => {
      const draft = new PaperEntityDraft();
      draft.initialize(entityDraft);
      return draft;
    });

    this.sharedState.set(
      'viewState.processingQueueCount',
      (this.sharedState.viewState.processingQueueCount.value as number) +
        entityDrafts.length
    );

    const scrapePromise = async (entityDraft: PaperEntityDraft) => {
      return await this.scraperRepository.scrape(entityDraft);
    };

    entityDrafts = await Promise.all(
      entityDrafts.map((entityDraft) => scrapePromise(entityDraft))
    );

    this.sharedState.set(
      'viewState.processingQueueCount',
      (this.sharedState.viewState.processingQueueCount.value as number) -
        entityDrafts.length
    );
    await this.update(JSON.stringify(entityDrafts));
  }

  async update(entitiesStr: string) {
    let entityDrafts = JSON.parse(entitiesStr) as PaperEntityDraft[];
    entityDrafts = entityDrafts.map((entityDraft) => {
      const draft = new PaperEntityDraft();
      draft.initialize(entityDraft);
      return draft;
    });

    this.sharedState.set(
      'viewState.processingQueueCount',
      (this.sharedState.viewState.processingQueueCount.value as number) +
        entityDrafts.length
    );

    const updatePromise = async (entityDrafts: PaperEntityDraft[]) => {
      const movedEntityDrafts = await Promise.all(
        entityDrafts.map((entityDraft: PaperEntityDraft) =>
          this.fileRepository.move(entityDraft)
        )
      );

      for (let i = 0; i < movedEntityDrafts.length; i++) {
        if (movedEntityDrafts[i] === null) {
          movedEntityDrafts[i] = entityDrafts[i];
        }
      }

      await this.dbRepository.update(movedEntityDrafts as PaperEntityDraft[]);
    };

    await updatePromise(entityDrafts);

    this.sharedState.set(
      'viewState.processingQueueCount',
      (this.sharedState.viewState.processingQueueCount.value as number) -
        entityDrafts.length
    );
  }

  async routineScrape() {
    const allowRoutineMatch = this.preference.get(
      'allowRoutineMatch'
    ) as boolean;
    if (allowRoutineMatch) {
      this.sharedState.set(
        'viewState.alertInformation',
        'Start routine scraping...'
      );
      this.preference.set('lastRematchTime', Math.round(Date.now() / 1000));
      const entities = await this.dbRepository.preprintEntities();
      void this.scrape(JSON.stringify(entities));
    }
  }

  setupRoutineScrape() {
    const rematchInterval = this.preference.get('rematchInterval') as number;
    const lastRematchTime = this.preference.get('lastRematchTime') as number;

    if (
      Math.round(Date.now() / 1000) - lastRematchTime >
      86400 * rematchInterval
    ) {
      void this.routineScrape();
    }

    if (this.scheduler == null) {
      this.scheduler = new ToadScheduler();
    } else {
      this.scheduler.stop();
      this.scheduler.removeById('routineScrape');
    }

    const task = new Task('routineScrape', () => {
      void this.routineScrape();
    });

    const job = new SimpleIntervalJob(
      { seconds: rematchInterval * 86400, runImmediately: false },
      task,
      'routineScrape'
    );

    this.scheduler.addSimpleIntervalJob(job);
  }

  // ============================================================
  export(entitiesStr: string, format: string) {
    let entityDrafts = JSON.parse(entitiesStr) as PaperEntityDraft[];
    entityDrafts = entityDrafts.map((entityDraft) => {
      const draft = new PaperEntityDraft();
      draft.initialize(entityDraft);
      return draft;
    });

    const text = this.exporterRepository.export(entityDrafts, format);
    clipboard.writeText(text);
  }

  // ============================================================
  async initDB() {
    this.sharedState.set('selectionState.selectedIndex', '[]');
    this.sharedState.set('selectionState.selectedCategorizer', '');
    await this.dbRepository.initRealm(true);
    this.sharedState.set('viewState.realmReinited', new Date().getTime());
  }

  migrateLocaltoCloud() {
    void this.dbRepository.migrateLocaltoCloud();
  }

  async logoutCloud() {
    await this.dbRepository.logoutCloud();
    this.sharedState.set('viewState.realmReinited', new Date().getTime());
  }

  pauseSync() {
    this.scheduler.removeById('pauseSync');
    const task = new Task('pauseSync', () => {
      void this.dbRepository.pauseSync();
      this.scheduler.removeById('pauseSync');
    });

    const job = new SimpleIntervalJob(
      { seconds: 3600, runImmediately: false },
      task,
      'pauseSync'
    );

    this.scheduler.addSimpleIntervalJob(job);
  }

  resumeSync() {
    this.scheduler.removeById('pauseSync');
    void this.dbRepository.resumeSync();
  }

  // ============================================================
  initFileRepository() {
    if (this.preference.get('syncFileStorage') === 'webdav') {
      this.fileRepository = new WebDavFileRepository(
        this.preference,
        this.sharedState
      );
      void this.fileRepository.check();
    } else {
      this.fileRepository = new FileRepository(
        this.preference,
        this.sharedState
      );
    }
  }

  async open(url: string) {
    const fileURL = await this.access(url, true);
    void shell.openPath(fileURL.replace('file://', ''));
  }

  async preview(url: string) {
    const fileURL = await this.access(url, true);
    BrowserWindow.getFocusedWindow()?.previewFile(
      fileURL.replace('file://', '')
    );
  }

  async access(url: string, download: boolean) {
    return await this.fileRepository.access({
      url: url,
      download: download,
    });
  }
}
