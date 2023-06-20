import { CacheDatabaseCore } from "@/base/database/cache-core";
import { DatabaseCore } from "@/base/database/core";
import { CategorizerRepository } from "@/repositories/db-repository/categorizer-repository-v2";
import { FeedEntityRepository } from "@/repositories/db-repository/feed-entity-repository-v2";
import { FeedRepository } from "@/repositories/db-repository/feed-repository-v2";
import { PaperEntityRepository } from "@/repositories/db-repository/paper-repository";
import { PaperSmartFilterRepository } from "@/repositories/db-repository/smartfilter-repository-v2";
import { FileSourceRepository } from "@/repositories/filesource-repository/filesource-repository";
import { RSSRepository } from "@/repositories/rss-repository/rss-repository";
import { APPService } from "@/services/app-service";
import { BrowserExtensionService } from "@/services/browser-extension-service";
import { BufferService } from "@/services/buffer-service";
import { CacheService } from "@/services/cache-service";
import { CategorizerService } from "@/services/categorizer-service";
import { DatabaseService } from "@/services/database-service";
import { FeedService } from "@/services/feed-service";
import { FileService } from "@/services/file-service";
import { LogService } from "@/services/log-service";
import { MSWordCommService } from "@/services/msword-comm-service";
import { PaperService } from "@/services/paper-service";
import { PreferenceService } from "@/services/preference-service";
import { ReferenceService } from "@/services/reference-service";
import { RenderService } from "@/services/render-service";
import { SchedulerService } from "@/services/scheduler-service";
import { ScrapeService } from "@/services/scrape-service";
import { SmartFilterService } from "@/services/smartfilter-service";
import { StateService } from "@/services/state-service/state-service";

export type IInjectable =
  | APPService
  | PreferenceService
  | StateService
  | LogService
  | DatabaseService
  | DatabaseCore
  | PaperEntityRepository
  | PaperService
  | BufferService
  | CategorizerRepository
  | ScrapeService
  | FileService
  | CacheService
  | CacheDatabaseCore
  | CategorizerService
  | FileSourceRepository
  | SmartFilterService
  | BrowserExtensionService
  | PaperSmartFilterRepository
  | FeedService
  | FeedRepository
  | FeedEntityRepository
  | RSSRepository
  | RenderService
  | ReferenceService
  | SchedulerService
  | MSWordCommService;
