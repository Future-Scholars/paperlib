import { NetworkTool } from "@/base/network";
import { LogService } from "@/common/services/log-service";
import { PreferenceService } from "@/common/services/preference-service";
import { CacheService } from "@/renderer/services/cache-service";
import { CategorizerService } from "@/renderer/services/categorizer-service";
import { CommandService } from "@/renderer/services/command-service";
import { DatabaseService } from "@/renderer/services/database-service";
import { FeedService } from "@/renderer/services/feed-service";
import { FileService } from "@/renderer/services/file-service";
import { PaperService } from "@/renderer/services/paper-service";
import { QuerySentenceService } from "@/renderer/services/querysentence-service";
import { ReferenceService } from "@/renderer/services/reference-service";
import { RenderService } from "@/renderer/services/render-service";
import { RendererRPCService } from "@/renderer/services/renderer-rpc-service";
import { SchedulerService } from "@/renderer/services/scheduler-service";
import { ShortcutService } from "@/renderer/services/shortcut-service";
import { SmartFilterService } from "@/renderer/services/smartfilter-service";
import { UISlotService } from "@/renderer/services/uislot-service";
import { UIStateService } from "@/renderer/services/uistate-service";
import { ScrapeService } from "@/renderer/services/scrape-service";

declare global {
  var preferenceService: PreferenceService;
  var logService: LogService;
  var databaseService: DatabaseService;
  var paperService: PaperService;
  var cacheService: CacheService;
  var categorizerService: CategorizerService;
  var fileService: FileService;
  var smartFilterService: SmartFilterService;
  var feedService: FeedService;
  var renderService: RenderService;
  var referenceService: ReferenceService;
  var schedulerService: SchedulerService;
  var networkTool: NetworkTool;
  var mainRPCService: MainRPCService;
  var commandService: CommandService;
  var shortcutService: ShortcutService;
  var rendererRPCService: RendererRPCService;
  var uiStateService: UIStateService;
  var uiSlotService: UISlotService;
  var querySentenceService: QuerySentenceService;
  var scrapeService: ScrapeService
}
