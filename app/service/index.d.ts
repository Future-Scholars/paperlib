import { NetworkTool } from "@/base/network";
import { Proxied } from "@/base/rpc/proxied";
import { RendererProcessRPCService } from "@/base/rpc/rpc-service-renderer";
import { UtilityProcessRPCService } from "@/base/rpc/rpc-service-utility";
import { LogService } from "@/common/services/log-service";

import { ExtensionManagementService } from "@/extension/services/extension-management-service";
import { ExtensionPreferenceService } from "@/extension/services/extension-preference-service";

import { ContextMenuService } from "@/main/services/contextmenu-service";
import { FileSystemService } from "@/main/services/filesystem-service";
import { MenuService } from "@/main/services/menu-service";
import { PreferenceService } from "@/main/services/preference-service";
import { ProxyService } from "@/main/services/proxy-service";
import { UpgradeService } from "@/main/services/upgrade-service";
import { UtilityProcessManagementService } from "@/main/services/utility-process-management-service";
import { WindowProcessManagementService } from "@/main/services/window-process-management-service";

import { CommandService } from "@/renderer/services/command-service";
import { QuerySentenceService } from "@/renderer/services/querysentence-service";
import { ShortcutService } from "@/renderer/services/shortcut-service";
import { UISlotService } from "@/renderer/services/uislot-service";
import { UIStateService } from "@/renderer/services/uistate-service";

import { BrowserExtensionService } from "@/service/services/browser-extension-service";
import { CacheService } from "@/service/services/cache-service";
import { CategorizerService } from "@/service/services/categorizer-service";
import { DatabaseService } from "@/service/services/database-service";
import { FeedService } from "@/service/services/feed-service";
import { FileService } from "@/service/services/file-service";
import { HookService } from "@/service/services/hook-service";
import { PaperService } from "@/service/services/paper-service";
import { ReferenceService } from "@/service/services/reference-service";
import { RenderService } from "@/service/services/render-service";
import { SchedulerService } from "@/service/services/scheduler-service";
import { ScrapeService } from "@/service/services/scrape-service";
import { SmartFilterService } from "@/service/services/smartfilter-service";

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
  serviceRPCService: UtilityProcessRPCService;
  logService: LogService;
  hookService: HookService;
  fileService: FileService;
  databaseService: DatabaseService;
  renderService: RenderService;
  schedulerService: SchedulerService;
  cacheService: CacheService;
  scrapeService: ScrapeService;
  paperService: PaperService;
  categorizerService: CategorizerService;
  smartFilterService: SmartFilterService;
  browserExtensionService: BrowserExtensionService;
  feedService: FeedService;
  referenceService: ReferenceService;
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
  extensionManagementService: Proxied<ExtensionManagementService>;
  extensionPreferenceService: Proxied<ExtensionPreferenceService>;
  networkTool: Proxied<NetworkTool>;
}

declare global {
  var PLAPI: PLAPIShape;
  var PLMainAPI: PLMainAPIShape;
  var PLExtAPI: PLExtAPIShape;
  var PLUIAPI: PLUIAPIShape;

  interface Realm {
    safeWrite: <T>(callback: () => T) => T;
    paperEntityListened: boolean;
    tagsListened: boolean;
    foldersListened: boolean;
    smartfilterListened: boolean;
    querySentenceListened: { [key: string]: boolean };
    feedEntityListened: boolean;
    feedListened: boolean;
  }
}
