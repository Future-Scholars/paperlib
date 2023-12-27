import { PreferenceService } from "@/common/services/preference-service";
import { ExtensionManagementService } from "@/extension/services/extension-management-service";
import { ExtensionPreferenceService } from "@/extension/services/extension-preference-service";
import { ContextMenuService } from "@/main/services/contextmenu-service";
import { FileSystemService } from "@/main/services/filesystem-service";
import { MenuService } from "@/main/services/menu-service";
import { ProxyService } from "@/main/services/proxy-service";
import { UpgradeService } from "@/main/services/upgrade-service";
import { WindowProcessManagementService } from "@/main/services/window-process-management-service";
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
import { SchedulerService } from "@/renderer/services/scheduler-service";
import { ScrapeService } from "@/renderer/services/scrape-service";
import { ShortcutService } from "@/renderer/services/shortcut-service";
import { SmartFilterService } from "@/renderer/services/smartfilter-service";
import { UISlotService } from "@/renderer/services/uislot-service";
import { UIStateService } from "@/renderer/services/uistate-service";

import { PaperFolder, PaperTag } from "@/models/categorizer";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { PaperSmartFilter } from "@/models/smart-filter";

import { chunkRun } from "@/base/chunk";
import { isMetadataCompleted, isPreprint } from "@/base/metadata";
import { formatString } from "@/base/string";
import {
  constructFileURL,
  eraseProtocol,
  getFileType,
  getProtocol,
  hasProtocol,
  isLocalPath,
  listAllFiles,
} from "@/base/url";
import { PLExtension } from "@/extension/base/pl-extension";

declare namespace PLAPI {
  const logService: LogService;
  const cacheService: CacheService;
  const categorizerService: CategorizerService;
  const commandService: CommandService;
  const databaseService: DatabaseService;
  const feedService: FeedService;
  const fileService: FileService;
  const hookService: HookService;
  const paperService: PaperService;
  const referenceService: ReferenceService;
  const renderService: RenderService;
  const schedulerService: SchedulerService;
  const scrapeService: ScrapeService;
  const shortcutService: ShortcutService;
  const smartFilterService: SmartFilterService;
  const uiStateService: UIStateService;
  const preferenceService: PreferenceService;
  const uiSlotService: UISlotService;
}

declare namespace PLMainAPI {
  const contextMenuService: ContextMenuService;
  const fileSystemService: FileSystemService;
  const menuService: MenuService;
  const proxyService: ProxyService;
  const upgradeService: UpgradeService;
  const windowProcessManagementService: WindowProcessManagementService;
}

declare namespace PLExtAPI {
  const extensionManagementService: ExtensionManagementService;
  const extensionPreferenceService: ExtensionPreferenceService;
}

const stringUtils = {
  formatString,
};

const urlUtils = {
  getProtocol,
  hasProtocol,
  eraseProtocol,
  getFileType,
  constructFileURL,
  listAllFiles,
  isLocalPath,
};

// const bibtexUtils = {
//   bibtex2json,
//   bibtex2paperEntityDraft,
//   bibtexes2paperEntityDrafts,
// };

const metadataUtils = {
  isMetadataCompleted,
  isPreprint,
};

export {
  Feed,
  FeedEntity,
  PLAPI,
  PLExtAPI,
  PLExtension,
  PLMainAPI,
  PaperEntity,
  PaperFolder,
  PaperSmartFilter,
  PaperTag,
  chunkRun,
  metadataUtils,
  stringUtils,
  urlUtils,
};
