import { RecycleScroller } from "@future-scholars/vue-virtual-scroller";
import { createPinia } from "pinia";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";

import { Process } from "@/base/process-id";
import { loadLocales } from "@/locales/load";
import QuickpasteView from "@/renderer/ui/quickpaste-view/quickpaste-view.vue";

import "./css/index.css";
import { QuickpasteRPCService } from "./services/quickpaste-rpc-service";

async function initialize() {
  const pinia = createPinia();

  const app = createApp(QuickpasteView);
  app.use(pinia);

  app.component("RecycleScroller", RecycleScroller);

  // ============================================================
  // 1. Initilize the RPC service for current process
  const quickpasteRPCService = new QuickpasteRPCService();
  // ============================================================
  // 2. Start the port exchange process.
  await quickpasteRPCService.initCommunication();

  // ============================================================
  // 3. Wait for the main process to expose its APIs (PLMainAPI & PLAPI)
  const mainAPIExposed = await quickpasteRPCService.waitForAPI(
    Process.main,
    "PLMainAPI",
    5000
  );
  const rendererAPIExposed = await quickpasteRPCService.waitForAPI(
    Process.renderer,
    "PLAPI",
    5000
  );

  // ============================================================
  // 6. Setup other things for the renderer process.
  const locales = loadLocales();

  const i18n = createI18n({
    allowComposition: true,
    locale: (await PLAPI.preferenceService.get("language")) as string,
    fallbackLocale: "en-GB",
    messages: locales,
  });

  app.use(i18n);

  app.mount("#quickpaste");
}

initialize();
