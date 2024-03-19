import { NetworkTool } from "@/base/network";
import { Proxied } from "@/base/rpc/proxied";
import { LogService } from "@/common/services/log-service";
import { PreferenceService } from "@/common/services/preference-service";
import { PLExtension } from "@/extension/base/pl-extension";
import { ExtensionManagementService } from "@/extension/services/extension-management-service";
import { ExtensionPreferenceService } from "@/extension/services/extension-preference-service";
import { ContextMenuService } from "@/main/services/contextmenu-service";
import { FileSystemService } from "@/main/services/filesystem-service";
import { MenuService } from "@/main/services/menu-service";
import { WindowProcessManagementService } from "@/main/services/window-process-management-service";
import { CacheService } from "@/renderer/services/cache-service";
import { CategorizerService } from "@/renderer/services/categorizer-service";
import { CommandService } from "@/renderer/services/command-service";
import { DatabaseService } from "@/renderer/services/database-service";
import { FeedService } from "@/renderer/services/feed-service";
import { FileService } from "@/renderer/services/file-service";
import { HookService } from "@/renderer/services/hook-service";
import { PaperService } from "@/renderer/services/paper-service";
import { ReferenceService } from "@/renderer/services/reference-service";
import { RenderService } from "@/renderer/services/render-service";
import { ScrapeService } from "@/renderer/services/scrape-service";
import { SmartFilterService } from "@/renderer/services/smartfilter-service";
import { UISlotService } from "@/renderer/services/uislot-service";
import { UIStateService } from "@/renderer/services/uistate-service";

declare namespace PLAPI {
  const logService: Proxied<LogService>;
  const cacheService: Proxied<CacheService>;
  const categorizerService: Proxied<CategorizerService>;
  const commandService: Proxied<CommandService>;
  const databaseService: Proxied<DatabaseService>;
  const feedService: Proxied<FeedService>;
  const fileService: Proxied<FileService>;
  const hookService: Proxied<HookService>;
  const paperService: Proxied<PaperService>;
  const referenceService: Proxied<ReferenceService>;
  const renderService: Proxied<RenderService>;
  const scrapeService: Proxied<ScrapeService>;
  const smartFilterService: Proxied<SmartFilterService>;
  const uiStateService: Proxied<UIStateService>;
  const preferenceService: Proxied<PreferenceService>;
  const uiSlotService: Proxied<UISlotService>;
}

declare namespace PLMainAPI {
  const contextMenuService: Proxied<ContextMenuService>;
  const fileSystemService: Proxied<FileSystemService>;
  const menuService: Proxied<MenuService>;
  const windowProcessManagementService: Proxied<WindowProcessManagementService>;
}

declare namespace PLExtAPI {
  const extensionManagementService: ExtensionManagementService;
  const extensionPreferenceService: ExtensionPreferenceService;
  const networkTool: Proxied<NetworkTool>;
}

export { PLAPI, PLExtAPI, PLExtension, PLMainAPI };
