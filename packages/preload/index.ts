import { contextBridge } from "electron";
import { SharedState } from "./utils/appstate";
import { Preference } from "./utils/preference";

import { DBRepository } from "./repositories/db-repository/db-repository";
import { FileRepository } from "./repositories/file-repository/file-repository";
import { ScraperRepository } from "./repositories/scraper-repository/scraper-repository";
import { CacheRepository } from "./repositories/cache-repository/cache-repository";
import { ExporterRepository } from "./repositories/exporter-repository/exporter-repository";
import { WebImporterRepository } from "./repositories/web-importer-repository/web-importer-repository";
import { RSSRepository } from "./repositories/rss-repository/rss-repository";
import { DownloaderRepository } from "./repositories/downloader-repository/downloader-repository";

import { createInteractorProxy } from "./utils/misc";
import { AppInteractor } from "./interactors/app-interactor";
import { EntityInteractor } from "./interactors/entity-interactor";
import { RenderInteractor } from "./interactors/render-interactor";
import { BrowserExtensionInteractor } from "./interactors/browser-extension-interactor";
import { FeedInteractor } from "./interactors/feed-interactor";

import { appendLoading } from "./loading";
import { domReady } from "./utils";

domReady().then(appendLoading);

// ============================================================
// State and Preference
const preference = new Preference();
const sharedState = new SharedState(preference);

// ============================================================
// Repositories
const dbRepository = new DBRepository(sharedState, preference);
const fileRepository = new FileRepository(sharedState, preference);
const scraperRepository = new ScraperRepository(sharedState, preference);
const cacheRepository = new CacheRepository(sharedState, preference);
const exporterRepository = new ExporterRepository(sharedState, preference);
const webImporterRepository = new WebImporterRepository(
  sharedState,
  preference
);
const rssRepository = new RSSRepository(sharedState, preference);
const downloaderRepository = new DownloaderRepository(sharedState, preference);

const appInteractor = new AppInteractor(
  sharedState,
  preference,
  dbRepository,
  fileRepository,
  scraperRepository,
  downloaderRepository
);
const entityInteractor = new EntityInteractor(
  sharedState,
  preference,
  dbRepository,
  fileRepository,
  scraperRepository,
  cacheRepository,
  exporterRepository,
  downloaderRepository
);
const renderInteractor = new RenderInteractor(preference);
const browserExtensionInteractor = new BrowserExtensionInteractor(
  sharedState,
  preference,
  dbRepository,
  fileRepository,
  webImporterRepository,
  entityInteractor
);
const feedInteractor = new FeedInteractor(
  sharedState,
  preference,
  dbRepository,
  scraperRepository,
  rssRepository,
  webImporterRepository,
  entityInteractor
);

const appInteractorProxy = createInteractorProxy(appInteractor);
const entityInteractorProxy = createInteractorProxy(entityInteractor);
const renderInteractorProxy = createInteractorProxy(renderInteractor);
const browserExtensionInteractorProxy = createInteractorProxy(
  browserExtensionInteractor
);
const feedInteractorProxy = createInteractorProxy(feedInteractor);

contextBridge.exposeInMainWorld("appInteractor", appInteractorProxy);
contextBridge.exposeInMainWorld("entityInteractor", entityInteractorProxy);
contextBridge.exposeInMainWorld("renderInteractor", renderInteractorProxy);
contextBridge.exposeInMainWorld(
  "browserExtensionInteractor",
  browserExtensionInteractorProxy
);
contextBridge.exposeInMainWorld("feedInteractor", feedInteractorProxy);
