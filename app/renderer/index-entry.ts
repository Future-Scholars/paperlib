import { RecycleScroller } from "@future-scholars/vue-virtual-scroller";
import "@future-scholars/vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { createPinia } from "pinia";
import { Pane, Splitpanes } from "splitpanes";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import draggable from "vuedraggable";

import { InjectionContainer } from "@/base/injection/injection";
import { Process } from "@/base/process-id";
import { RendererProcessRPCService } from "@/base/rpc/rpc-service-renderer";
import { loadLocales } from "@/locales/load";

import { CommandService } from "./services/command-service";
import { IInjectable } from "./services/injectable";
import { ShortcutService } from "./services/shortcut-service";
import { UISlotService } from "./services/uislot-service";
import { UIStateService } from "./services/uistate-service";
import { QuerySentenceService } from "./services/querysentence-service";
import AppView from "./ui/app-view.vue";

async function initialize() {
  const pinia = createPinia();

  const app = createApp(AppView);

  app.use(pinia);

  app.component("Splitpanes", Splitpanes);
  app.component("Pane", Pane);
  app.component("draggable", draggable);
  app.component("RecycleScroller", RecycleScroller);

  // ============================================================
  // 1. Initilize the RPC service for current process
  const rendererRPCService = new RendererProcessRPCService(
    Process.renderer,
    "PLUIAPI"
  );
  // ============================================================
  // 2. Start the port exchange process.
  await rendererRPCService.initCommunication();

  // ============================================================
  // 3. Wait for the main/service process to expose its APIs (PLMainAPI, PLAPI)
  const mainAPIExposed = await rendererRPCService.waitForAPI(
    Process.main,
    "PLMainAPI",
    5000
  );

  if (!mainAPIExposed) {
    console.error("Main process API is not exposed");
    throw new Error("Main process API is not exposed");
  }

  const serviceAPIExposed = await rendererRPCService.waitForAPI(
    Process.service,
    "PLAPI",
    5000
  );

  if (!serviceAPIExposed) {
    console.error("Service process API is not exposed");
    throw new Error("Service process API is not exposed");
  }

  // ============================================================
  // 4. Create the instances for all services, tools, etc. of the current process.
  const injectionContainer = new InjectionContainer({
    rendererRPCService,
  });
  const instances = injectionContainer.createInstance<IInjectable>({
    commandService: CommandService,
    uiStateService: UIStateService,
    uiSlotService: UISlotService,
    shortcutService: ShortcutService,
    querySentenceService: QuerySentenceService,
  });
  // 4.1 Expose the instances to the global scope for convenience.
  for (const [key, instance] of Object.entries(instances)) {
    if (!globalThis["PLUIAPI"]) {
      globalThis["PLUIAPI"] = {} as any;
    }
    globalThis[key] = instance;
    globalThis["PLUIAPI"][key] = instance;
  }

  // ============================================================
  // 5. Set actionors for RPC service with all initialized services.
  //    Expose the APIs of the current process to other processes
  rendererRPCService.setActionor(instances);

  // ============================================================
  // 6. Bind remote states to local Pinia stores.
  await PLMainAPI.preferenceService.bindState();
  await PLAPI.paperService.bindState();
  await PLAPI.feedService.bindState();
  await PLAPI.fileService.bindState();

  // ============================================================
  // 6. Setup other things for the renderer process.
  const locales = loadLocales();

  const i18n = createI18n({
    locale: (await PLMainAPI.preferenceService.get("language")) as string,
    fallbackLocale: "en-GB",
    messages: locales,
    globalInjection: true,
    legacy: false
  });

  PLMainAPI.preferenceService.onChanged("language", (newValue) => {
    i18n.global.locale = newValue.value;
  });

  app.use(i18n);
  app.mount("#app");
}

initialize();
