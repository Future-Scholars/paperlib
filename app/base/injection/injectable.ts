import { CacheDatabaseCore } from "@/base/database/cache-core";
import { DatabaseCore } from "@/base/database/core";
import { NetworkTool } from "@/base/network";
import { PreferenceService } from "@/common/services/preference-service";
import { MainRPCService } from "@/main/services/main-rpc-service";
import { WindowControlService } from "@/main/services/window-control-service";
import { WindowProcessManagementService } from "@/main/services/window-management-service";
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
import { ReferenceService } from "@/renderer/services/reference-service";
import { RenderService } from "@/renderer/services/render-service";
import { SchedulerService } from "@/renderer/services/scheduler-service";
import { ScrapeService } from "@/renderer/services/scrape-service";
import { SmartFilterService } from "@/renderer/services/smartfilter-service";
import { StateService } from "@/renderer/services/state-service/state-service";
import { CategorizerRepository } from "@/repositories/db-repository/categorizer-repository";
import { FeedEntityRepository } from "@/repositories/db-repository/feed-entity-repository";
import { FeedRepository } from "@/repositories/db-repository/feed-repository";
import { PaperEntityRepository } from "@/repositories/db-repository/paper-entity-repository";
import { PaperSmartFilterRepository } from "@/repositories/db-repository/smartfilter-repository";
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
  | MSWordCommService
  | NetworkTool
  | WindowProcessManagementService
  | MainRPCService
  | WindowControlService;
