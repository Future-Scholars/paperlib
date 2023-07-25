import fs from "fs";
import path from "path";
import { Store } from "pinia";

import { APIShape, MainAPIShape } from "@/api/api";
import { NetworkTool } from "@/base/network";
import { PreferenceService } from "@/common/services/preference-service";
import { EntityInteractor } from "@/interactors/entity-interactor";
import { FeedInteractor } from "@/interactors/feed-interactor";
import { PluginSideInteractor } from "@/interactors/plugin-side-interactor";
import { PreviewInteractor } from "@/interactors/preview-interactor";
import { RenderInteractor } from "@/interactors/render-interactor";
import { WordAddinInteractor } from "@/interactors/word-addin-interactor";
import { Preference } from "@/preference/preference";
import { APPService } from "@/renderer/services/app-service";
import { BufferService } from "@/renderer/services/buffer-service";
import { CacheService } from "@/renderer/services/cache-service";
import { CategorizerService } from "@/renderer/services/categorizer-service";
import { DatabaseService } from "@/renderer/services/database-service";
import { FeedService } from "@/renderer/services/feed-service";
import { FileService } from "@/renderer/services/file-service";
import { LogService } from "@/renderer/services/log-service";
import { PaperService } from "@/renderer/services/paper-service";
import { ReferenceService } from "@/renderer/services/reference-service";
import { RenderService } from "@/renderer/services/render-service";
import { CommandService } from "@/renderer/services/command-service";
import { SchedulerService } from "@/renderer/services/scheduler-service";
import { SmartFilterService } from "@/renderer/services/smartfilter-service";
import { StateService } from "@/renderer/services/state-service/state-service";
import { ShortcutService } from "@/renderer/services/shortcut-service";
import { IProcessingState } from "@/renderer/services/state-service/state/processing";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";

declare global {
  var appService: APPService;
  var preferenceService: PreferenceService;
  var stateService: StateService;
  var logService: LogService;
  var databaseService: DatabaseService;
  var paperService: PaperService;
  var bufferService: BufferService;
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

  var processingState: Store<"processingState", IProcessingState>;
}
