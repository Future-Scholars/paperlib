import { contextBridge } from "electron";
import { SharedState } from "./utils/appstate";
import { Preference } from "./utils/preference";

import { DBRepository } from "./repositories/db-repository/db-repository";
import { FileRepository } from "./repositories/file-repository/file-repository";
import { ScraperRepository } from "./repositories/scraper-repository/scraper-repository";
import { CacheRepository } from "./repositories/cache-repository/cache-repository";

import { createInteractorProxy } from "./utils/misc";
import { AppInteractor } from "./interactors/app-interactor";
import { EntityInteractor } from "./interactors/entity-interactor";
import { ExporterRepository } from "./repositories/exporter-repository/exporter-repository";

import { appendLoading } from "./loading";
import { domReady } from "./utils";

domReady().then(appendLoading);

// ============================================================
// State and Preference
const sharedState = new SharedState();
const preference = new Preference();

// ============================================================
// Repositories
const dbRepository = new DBRepository(sharedState, preference);
const fileRepository = new FileRepository(sharedState, preference);
const scraperRepository = new ScraperRepository(sharedState, preference);
const cacheRepository = new CacheRepository(sharedState, preference);
const exporterRepository = new ExporterRepository(sharedState, preference);

const appInteractor = new AppInteractor(
  sharedState,
  preference,
  dbRepository,
  fileRepository
);
const entityInteractor = new EntityInteractor(
  sharedState,
  preference,
  dbRepository,
  fileRepository,
  scraperRepository,
  cacheRepository,
  exporterRepository
);

const appInteractorProxy = createInteractorProxy(appInteractor);
const entityInteractorProxy = createInteractorProxy(entityInteractor);

contextBridge.exposeInMainWorld("appInteractor", appInteractorProxy);
contextBridge.exposeInMainWorld("entityInteractor", entityInteractorProxy);
