import { CacheDatabaseCore } from "@/base/database/cache-core";
import { DatabaseCore } from "@/base/database/core";
import { NetworkTool } from "@/base/network";
import { LogService } from "@/common/services/log-service";
import { PreferenceService } from "@/common/services/preference-service";
import { ContextMenuService } from "@/main/services/contextmenu-service";
import { ExtensionProcessManagementService } from "@/main/services/extension-process-management-service";
import { FileSystemService } from "@/main/services/filesystem-service";
import { MainRPCService } from "@/main/services/main-rpc-service";
import { MenuService } from "@/main/services/menu-service";
import { ProxyService } from "@/main/services/proxy-service";
import { UpgradeService } from "@/main/services/upgrade-service";
import { WindowProcessManagementService } from "@/main/services/window-process-management-service";
import { BrowserExtensionService } from "@/renderer/services/browser-extension-service";
import { CacheService } from "@/renderer/services/cache-service";
import { CategorizerService } from "@/renderer/services/categorizer-service";
import { DatabaseService } from "@/renderer/services/database-service";
import { FeedService } from "@/renderer/services/feed-service";
import { FileService } from "@/renderer/services/file-service";
import { PaperService } from "@/renderer/services/paper-service";
import { ReferenceService } from "@/renderer/services/reference-service";
import { RenderService } from "@/renderer/services/render-service";
import { SchedulerService } from "@/renderer/services/scheduler-service";
import { ScrapeService } from "@/renderer/services/scrape-service";
import { SmartFilterService } from "@/renderer/services/smartfilter-service";
import { CategorizerRepository } from "@/repositories/db-repository/categorizer-repository";
import { FeedEntityRepository } from "@/repositories/db-repository/feed-entity-repository";
import { FeedRepository } from "@/repositories/db-repository/feed-repository";
import { PaperEntityRepository } from "@/repositories/db-repository/paper-entity-repository";
import { PaperSmartFilterRepository } from "@/repositories/db-repository/smartfilter-repository";
import { RSSRepository } from "@/repositories/rss-repository/rss-repository";

export type IInjectable =
  | PreferenceService
  | LogService
  | DatabaseService
  | DatabaseCore
  | PaperEntityRepository
  | PaperService
  | CategorizerRepository
  | ScrapeService
  | FileService
  | CacheService
  | CacheDatabaseCore
  | CategorizerService
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
  | NetworkTool
  | WindowProcessManagementService
  | MainRPCService
  | FileSystemService
  | ContextMenuService
  | MenuService
  | UpgradeService
  | ProxyService
  | ExtensionProcessManagementService;
