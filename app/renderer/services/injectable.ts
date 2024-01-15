import { CacheDatabaseCore } from "@/base/database/cache-core";
import { DatabaseCore } from "@/base/database/core";
import { NetworkTool } from "@/base/network-legacy";
import { PreferenceService } from "@/common/services/preference-service";
import { BrowserExtensionService } from "@/renderer/services/browser-extension-service";
import { CacheService } from "@/renderer/services/cache-service";
import { CategorizerService } from "@/renderer/services/categorizer-service";
import { CommandService } from "@/renderer/services/command-service";
import { DatabaseService } from "@/renderer/services/database-service";
import { FeedService } from "@/renderer/services/feed-service";
import { FileService } from "@/renderer/services/file-service";
import { HookService } from "@/renderer/services/hook-service";
import { LogService } from "@/renderer/services/log-service";
import { PaperService } from "@/renderer/services/paper-service";
import { ReferenceService } from "@/renderer/services/reference-service";
import { RenderService } from "@/renderer/services/render-service";
import { RendererRPCService } from "@/renderer/services/renderer-rpc-service";
import { SchedulerService } from "@/renderer/services/scheduler-service";
import { ScrapeService } from "@/renderer/services/scrape-service";
import { ShortcutService } from "@/renderer/services/shortcut-service";
import { SmartFilterService } from "@/renderer/services/smartfilter-service";
import { UISlotService } from "@/renderer/services/uislot-service";
import { UIStateService } from "@/renderer/services/uistate-service";
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
  | CommandService
  | ShortcutService
  | RendererRPCService
  | HookService
  | UIStateService
  | UISlotService;
