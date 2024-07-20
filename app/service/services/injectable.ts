import { LogService } from "@/common/services/log-service";
import { CacheDatabaseCore } from "@/service/services/database/cache-core";
import { DatabaseCore } from "@/service/services/database/core";
import { PreferenceService } from "@/service/services/preference-service";
import { BrowserExtensionService } from "./browser-extension-service";
import { CacheService } from "./cache-service";
import { CategorizerService } from "./categorizer-service";
import { DatabaseService } from "./database-service";
import { FeedService } from "./feed-service";
import { FileService } from "./file-service";
import { HookService } from "./hook-service";
import { PaperService } from "./paper-service";
import { ReferenceService } from "./reference-service";
import { RenderService } from "./render-service";
import { SchedulerService } from "./scheduler-service";
import { ScrapeService } from "./scrape-service";
import { SmartFilterService } from "./smartfilter-service";

import { CategorizerRepository } from "../repositories/db-repository/categorizer-repository";
import { FeedEntityRepository } from "../repositories/db-repository/feed-entity-repository";
import { FeedRepository } from "../repositories/db-repository/feed-repository";
import { PaperEntityRepository } from "../repositories/db-repository/paper-entity-repository";
import { PaperSmartFilterRepository } from "../repositories/db-repository/smartfilter-repository";
import { RSSRepository } from "../repositories/rss-repository/rss-repository";

export type IInjectable =
  | PreferenceService
  | LogService
  | DatabaseCore
  | FileService
  | HookService
  | DatabaseService
  | RenderService
  | CategorizerRepository
  | PaperEntityRepository
  | SchedulerService
  | CacheService
  | CacheDatabaseCore
  | ScrapeService
  | PaperService
  | CategorizerService
  | SmartFilterService
  | PaperSmartFilterRepository
  | BrowserExtensionService
  | FeedService
  | FeedRepository
  | FeedEntityRepository
  | RSSRepository
  | ReferenceService;
