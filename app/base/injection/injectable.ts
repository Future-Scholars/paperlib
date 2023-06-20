import { CacheDatabaseCore } from "@/base/database/cache-core";
import { DatabaseCore } from "@/base/database/core";
import { APPService } from "@/renderer/services/app-service";
import { BrowserExtensionService } from "@/renderer/services/browser-extension-service";
import { BufferService } from "@/renderer/services/buffer-service";
import { CacheService } from "@/renderer/services/cache-service";
import { CategorizerService } from "@/renderer/services/categorizer-service";
import { DatabaseService } from "@/renderer/services/database-service";
import { FeedService } from "@/renderer/services/feed-service";
import { FileService } from "@/renderer/services/file-service";
import { LogService } from "@/renderer/services/log-service";
import { MSWordCommService } from "@/renderer/services/msword-comm-service";
import { PaperService } from "@/renderer/services/paper-service";
import { PreferenceService } from "@/renderer/services/preference-service";
import { ReferenceService } from "@/renderer/services/reference-service";
import { RenderService } from "@/renderer/services/render-service";
import { SchedulerService } from "@/renderer/services/scheduler-service";
import { ScrapeService } from "@/renderer/services/scrape-service";
import { SmartFilterService } from "@/renderer/services/smartfilter-service";
import { StateService } from "@/renderer/services/state-service/state-service";
import { CategorizerRepository } from "@/repositories/db-repository/categorizer-repository-v2";
import { FeedEntityRepository } from "@/repositories/db-repository/feed-entity-repository-v2";
import { FeedRepository } from "@/repositories/db-repository/feed-repository-v2";
import { PaperEntityRepository } from "@/repositories/db-repository/paper-repository";
import { PaperSmartFilterRepository } from "@/repositories/db-repository/smartfilter-repository-v2";
import { FileSourceRepository } from "@/repositories/filesource-repository/filesource-repository";
import { RSSRepository } from "@/repositories/rss-repository/rss-repository";

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
