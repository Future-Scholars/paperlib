import type { Proxied } from "@/base/rpc/proxied";
import type { RendererProcessRPCService } from "@/base/rpc/rpc-service-renderer";
import type { UtilityProcessRPCService } from "@/base/rpc/rpc-service-utility";
import type { LogService } from "@/common/services/log-service";

import type{ NetworkTool } from "@/extension/base/network";
import type{ ExtensionManagementService } from "@/extension/services/extension-management-service";
import type{ ExtensionPreferenceService } from "@/extension/services/extension-preference-service";

import type{ ContextMenuService } from "@/main/services/contextmenu-service";
import type{ FileSystemService } from "@/main/services/filesystem-service";
import type{ MenuService } from "@/main/services/menu-service";
import type{ PreferenceService } from "@/main/services/preference-service";
import type{ ProxyService } from "@/main/services/proxy-service";
import type{ UpgradeService } from "@/main/services/upgrade-service";
import type{ UtilityProcessManagementService } from "@/main/services/utility-process-management-service";
import type{ WindowProcessManagementService } from "@/main/services/window-process-management-service";

import type{ CommandService } from "@/renderer/services/command-service";
import type{ QuerySentenceService } from "@/renderer/services/querysentence-service";
import type{ ShortcutService } from "@/renderer/services/shortcut-service";
import type{ UISlotService } from "@/renderer/services/uislot-service";
import type{ UIStateService } from "@/renderer/services/uistate-service";

import type{ BrowserExtensionService } from "@/service/services/browser-extension-service";
import type{ CacheService } from "@/service/services/cache-service";
import type{ CategorizerService } from "@/service/services/categorizer-service";
import type{ DatabaseService } from "@/service/services/database-service";
import type{ FeedService } from "@/service/services/feed-service";
import type{ FileService } from "@/service/services/file-service";
import type{ HookService } from "@/service/services/hook-service";
import type{ PaperService } from "@/service/services/paper-service";
import type{ ReferenceService } from "@/service/services/reference-service";
import type{ RenderService } from "@/service/services/render-service";
import type{ SchedulerService } from "@/service/services/scheduler-service";
import type{ ScrapeService } from "@/service/services/scrape-service";
import type{ SmartFilterService } from "@/service/services/smartfilter-service";

export interface PLMainAPIShape {
  windowProcessManagementService: Proxied<WindowProcessManagementService>;
  fileSystemService: Proxied<FileSystemService>;
  contextMenuService: Proxied<ContextMenuService>;
  menuService: Proxied<MenuService>;
  upgradeService: Proxied<UpgradeService>;
  proxyService: Proxied<ProxyService>;
  preferenceService: Proxied<PreferenceService>;
  utilityProcessManagementService: Proxied<UtilityProcessManagementService>;
}

interface PLAPIShape {
  serviceRPCService: Proxied<UtilityProcessRPCService>;
  logService: Proxied<LogService>;
  hookService: Proxied<HookService>;
  fileService: Proxied<FileService>;
  databaseService: Proxied<DatabaseService>;
  renderService: Proxied<RenderService>;
  schedulerService: Proxied<SchedulerService>;
  cacheService: Proxied<CacheService>;
  scrapeService: Proxied<ScrapeService>;
  paperService: Proxied<PaperService>;
  categorizerService: Proxied<CategorizerService>;
  smartFilterService: Proxied<SmartFilterService>;
  browserExtensionService: Proxied<BrowserExtensionService>;
  feedService: Proxied<FeedService>;
  referenceService: Proxied<ReferenceService>;
}

interface PLUIAPIShape {
  uiStateService: Proxied<UIStateService>;
  uiSlotService: Proxied<UISlotService>;
  commandService: Proxied<CommandService>;
  shortcutService: Proxied<ShortcutService>;
  rendererRPCService: Proxied<RendererProcessRPCService>;
  querySentenceService: Proxied<QuerySentenceService>;
}

export interface PLExtAPIShape {
  extensionManagementService: ExtensionManagementService;
  extensionPreferenceService: ExtensionPreferenceService;
  networkTool: NetworkTool;
}

declare global {
  var PLAPI: PLAPIShape;
  var PLMainAPI: PLMainAPIShape;
  var PLExtAPI: PLExtAPIShape;
  var PLUIAPI: PLUIAPIShape;
}
