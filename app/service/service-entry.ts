import { InjectionContainer } from "@/base/injection/injection";
import { Process } from "@/base/process-id";
import { UtilityProcessRPCService } from "@/base/rpc/rpc-service-utility";
import { LogService } from "@/common/services/log-service";
import { CacheDatabaseCore } from "@/service/services/database/cache-core";
import { DatabaseCore } from "@/service/services/database/core";

import { CategorizerRepository } from "./repositories/db-repository/categorizer-repository";
import { FeedEntityRepository } from "./repositories/db-repository/feed-entity-repository";
import { FeedRepository } from "./repositories/db-repository/feed-repository";
import { PaperEntityRepository } from "./repositories/db-repository/paper-entity-repository";
import { PaperSmartFilterRepository } from "./repositories/db-repository/smartfilter-repository";
import { RSSRepository } from "./repositories/rss-repository/rss-repository";
import { BrowserExtensionService } from "./services/browser-extension-service";
import { CacheService } from "./services/cache-service";
import { CategorizerService } from "./services/categorizer-service";
import { DatabaseService } from "./services/database-service";
import { FeedService } from "./services/feed-service";
import { FileService } from "./services/file-service";
import { HookService } from "./services/hook-service";
import { IInjectable } from "./services/injectable";
import { PaperService } from "./services/paper-service";
import { PreferenceService } from "./services/preference-service";
import { ReferenceService } from "./services/reference-service";
import { RenderService } from "./services/render-service";
import { SchedulerService } from "./services/scheduler-service";
import { ScrapeService } from "./services/scrape-service";
import { SmartFilterService } from "./services/smartfilter-service";

async function initialize() {
  const logService = new LogService("service.log");

  process.on("uncaughtException", (err) => {
    logService.error("Uncaught exception:", err, false, "Service");
  });

  // ============================================================
  // 1. Initilize the RPC service for current process
  const serviceRPCService = new UtilityProcessRPCService(
    Process.service,
    "PLAPI"
  );
  // ============================================================
  // 2. Start the port exchange process.
  serviceRPCService.initCommunication();
  // ============================================================
  // 3. Wait for the main process to expose its APIs (PLMainAPI/PLAPI)
  const mainAPIExposed = await serviceRPCService.waitForAPI(
    Process.main,
    "PLMainAPI",
    5000
  );

  if (!mainAPIExposed) {
    console.error("Main process API is not exposed");
    throw new Error("Main process API is not exposed");
  }
  // ============================================================
  // 4. Create the instances for all services, tools, etc. of the current process.
  const injectionContainer = new InjectionContainer({
    logService,
    serviceRPCService,
  });

  const instances = injectionContainer.createInstance<IInjectable>({
    preferenceService: PreferenceService,
    hookService: HookService,
    fileService: FileService,
    databaseCore: DatabaseCore,
    databaseService: DatabaseService,
    renderService: RenderService,
    categorizerRepository: CategorizerRepository,
    paperEntityRepository: PaperEntityRepository,
    schedulerService: SchedulerService,
    cacheService: CacheService,
    cacheDatabaseCore: CacheDatabaseCore,
    scrapeService: ScrapeService,
    paperService: PaperService,
    categorizerService: CategorizerService,
    smartFilterService: SmartFilterService,
    paperSmartFilterRepository: PaperSmartFilterRepository,
    browserExtensionService: BrowserExtensionService,
    feedService: FeedService,
    feedEntityRepository: FeedEntityRepository,
    feedRepository: FeedRepository,
    rssRepository: RSSRepository,
    referenceService: ReferenceService,
  });
  // 4.1 Expose the instances to the global scope for convenience.
  for (const [key, instance] of Object.entries(instances)) {
    if (!globalThis["PLAPI"]) {
      globalThis["PLAPI"] = {} as any;
    }
    globalThis[key] = instance;
    globalThis["PLAPI"][key] = instance;
  }

  // ============================================================
  // 5. Set actionors for RPC service with all initialized services.
  //    Expose the APIs of the current process to other processes
  serviceRPCService.setActionor(instances);

  process.parentPort.postMessage({
    type: "service-ready",
    value: Process.service,
  });
}

initialize();
