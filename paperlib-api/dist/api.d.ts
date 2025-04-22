import { CacheService } from '../app/renderer/services/cache-service';
import { CategorizerService } from '../app/renderer/services/categorizer-service';
import { CommandService } from '../app/renderer/services/command-service';
import { ContextMenuService } from '../app/main/services/contextmenu-service';
import { DatabaseService } from '../app/renderer/services/database-service';
import { ExtensionManagementService } from '../app/extension/services/extension-management-service';
import { ExtensionPreferenceService } from '../app/extension/services/extension-preference-service';
import { FeedService } from '../app/renderer/services/feed-service';
import { FileService } from '../app/renderer/services/file-service';
import { FileSystemService } from '../app/main/services/filesystem-service';
import { HookService } from '../app/renderer/services/hook-service';
import { LogService } from '../app/common/services/log-service';
import { MenuService } from '../app/main/services/menu-service';
import { NetworkTool } from '../app/base/network';
import { PaperService } from '../app/renderer/services/paper-service';
import { PLExtension } from '../app/extension/base/pl-extension';
import { PreferenceService } from '../app/common/services/preference-service';
import { Proxied } from '../app/base/rpc/proxied';
import { ReferenceService } from '../app/renderer/services/reference-service';
import { RenderService } from '../app/renderer/services/render-service';
import { ScrapeService } from '../app/renderer/services/scrape-service';
import { ShortcutService } from '../app/renderer/services/shortcut-service.ts';
import { SmartFilterService } from '../app/renderer/services/smartfilter-service';
import { SyncService } from '../app/service/services/sync-service';
import { UISlotService } from '../app/renderer/services/uislot-service';
import { UIStateService } from '../app/renderer/services/uistate-service';
import { WindowProcessManagementService } from '../app/main/services/window-process-management-service';

declare namespace PLAPI_2 {
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
    const shortcutService: Proxied<ShortcutService>;
    const syncService: Proxied<SyncService>;
}
export { PLAPI_2 as PLAPI }

declare namespace PLExtAPI_2 {
    const extensionManagementService: ExtensionManagementService;
    const extensionPreferenceService: ExtensionPreferenceService;
    const networkTool: Proxied<NetworkTool>;
}
export { PLExtAPI_2 as PLExtAPI }

export { PLExtension }

declare namespace PLMainAPI_2 {
    const contextMenuService: Proxied<ContextMenuService>;
    const fileSystemService: Proxied<FileSystemService>;
    const menuService: Proxied<MenuService>;
    const windowProcessManagementService: Proxied<WindowProcessManagementService>;
}
export { PLMainAPI_2 as PLMainAPI }

export { }
