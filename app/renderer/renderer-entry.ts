import { RecycleScroller } from "@future-scholars/vue-virtual-scroller";
import "@future-scholars/vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { BIconChevronUp, BIconX } from "bootstrap-icons-vue";
import { ipcRenderer } from "electron";
import { createPinia } from "pinia";
import { Pane, Splitpanes } from "splitpanes";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import vSelect from "vue-select";
import draggable from "vuedraggable";

import { CacheDatabaseCore } from "@/base/database/cache-core";
import { DatabaseCore } from "@/base/database/core";
import { InjectionContainer } from "@/base/injection/injection";
import { NetworkTool } from "@/base/network";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { PreferenceService } from "@/common/services/preference-service";
import { loadLocales } from "@/locales/load";
import { Preference } from "@/preference/preference";
import { APPService } from "@/renderer/services/app-service";
import { BrowserExtensionService } from "@/renderer/services/browser-extension-service";
import { BufferService } from "@/renderer/services/buffer-service";
import { CacheService } from "@/renderer/services/cache-service";
import { CategorizerService } from "@/renderer/services/categorizer-service";
import { CommandService } from "@/renderer/services/command-service";
import { DatabaseService } from "@/renderer/services/database-service";
import { FeedService } from "@/renderer/services/feed-service";
import { FileService } from "@/renderer/services/file-service";
import { HookService } from "@/renderer/services/hook-service";
import { IInjectable } from "@/renderer/services/injectable";
import { LogService } from "@/renderer/services/log-service";
import { MSWordCommService } from "@/renderer/services/msword-comm-service";
import { PaperService } from "@/renderer/services/paper-service";
import { ReferenceService } from "@/renderer/services/reference-service";
import { RenderService } from "@/renderer/services/render-service";
import { RendererRPCService } from "@/renderer/services/renderer-rpc-service";
import { SchedulerService } from "@/renderer/services/scheduler-service";
import { ScrapeService } from "@/renderer/services/scrape-service";
import { ShortcutService } from "@/renderer/services/shortcut-service";
import { SmartFilterService } from "@/renderer/services/smartfilter-service";
import { useProcessingState } from "@/renderer/services/state-service/processing";
import { StateService } from "@/renderer/services/state-service/state-service";
import AppView from "@/renderer/ui/app-view.vue";
import { CategorizerRepository } from "@/repositories/db-repository/categorizer-repository";
import { FeedEntityRepository } from "@/repositories/db-repository/feed-entity-repository";
import { FeedRepository } from "@/repositories/db-repository/feed-repository";
import { PaperEntityRepository } from "@/repositories/db-repository/paper-entity-repository";
import { PaperSmartFilterRepository } from "@/repositories/db-repository/smartfilter-repository";
import { FileSourceRepository } from "@/repositories/filesource-repository/filesource-repository";
import { RSSRepository } from "@/repositories/rss-repository/rss-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import "./css/index.css";
import "./css/katex.min.css";

// @ts-ignore
vSelect.props.components.default = () => ({
  Deselect: BIconX,
  OpenIndicator: BIconChevronUp,
});

const pinia = createPinia();

const app = createApp(AppView);

app.use(pinia);

app.component("Splitpanes", Splitpanes);
app.component("Pane", Pane);
app.component("v-select", vSelect);
app.component("draggable", draggable);
app.component("RecycleScroller", RecycleScroller);

const processingState = useProcessingState();
globalThis.processingState = processingState;

// ============================================================
// 1. Initilize the RPC service for current process
const rendererRPCService = new RendererRPCService();
// ============================================================
// 2. Start the port exchange process.
await rendererRPCService.initCommunication();

// ============================================================
// 3. Wait for the main process to expose its APIs (PLMainAPI)
const mainAPIExposed = await rendererRPCService.waitForAPI(
  "mainProcess",
  "PLMainAPI",
  5000
);

if (!mainAPIExposed) {
  throw new Error("Main process API is not exposed");
  // TODO: show error message and exit
}

// ============================================================
// 4. Create the instances for all services, tools, etc. of the current process.
const injectionContainer = new InjectionContainer();
const instances = injectionContainer.createInstance<IInjectable>({
  appService: APPService,
  preferenceService: PreferenceService,
  stateService: StateService,
  logService: LogService,
  databaseCore: DatabaseCore,
  databaseService: DatabaseService,
  paperService: PaperService,
  bufferService: BufferService,
  paperEntityRepository: PaperEntityRepository,
  categorizerRepository: CategorizerRepository,
  scrapeService: ScrapeService,
  fileService: FileService,
  cacheDatabaseCore: CacheDatabaseCore,
  cacheService: CacheService,
  categorizerService: CategorizerService,
  fileSourceRepository: FileSourceRepository,
  smartFilterService: SmartFilterService,
  paperSmartFilterRepository: PaperSmartFilterRepository,
  browserExtensionService: BrowserExtensionService,
  feedService: FeedService,
  feedEntityRepository: FeedEntityRepository,
  feedRepository: FeedRepository,
  rssRepository: RSSRepository,
  renderService: RenderService,
  referenceService: ReferenceService,
  schedulerService: SchedulerService,
  msWordCommService: MSWordCommService,
  commandService: CommandService,
  shortcutService: ShortcutService,
  hookService: HookService,
  networkTool: NetworkTool,
});
// 4.1 Expose the instances to the global scope for convenience.
for (const [key, instance] of Object.entries(instances)) {
  globalThis[key] = instance;
}
globalThis["rendererRPCService"] = rendererRPCService;

// ============================================================
// 5. Set actionors for RPC service with all initialized services.
//    Expose the APIs of the current process to other processes
rendererRPCService.setActionor(instances);

// ============================================================
// 6. Setup other things for the renderer process.
const locales = loadLocales();

const i18n = createI18n({
  allowComposition: true,
  locale: preferenceService.get("language") as string,
  fallbackLocale: "en-GB",
  messages: locales,
});

app.use(i18n);

// TODO: check if this is duplicated
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    stateService.viewState.renderRequired = Date.now();
  });

app.mount("#app");
