import { BIconChevronUp, BIconX } from "bootstrap-icons-vue";
import { createPinia } from "pinia";
import { Pane, Splitpanes } from "splitpanes";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import vSelect from "vue-select";
import draggable from "vuedraggable";

import { AppInteractor } from "@/interactors/app-interactor";
import { BrowserExtensionInteractor } from "@/interactors/browser-extension-interactor";
import { EntityInteractor } from "@/interactors/entity-interactor";
import { FeedInteractor } from "@/interactors/feed-interactor";
import { PluginMainInteractor } from "@/interactors/plugin-main-interactor";
import { RenderInteractor } from "@/interactors/render-interactor";
import { loadLocales } from "@/locales/load";
import { Preference } from "@/preference/preference";
import { DBRepository } from "@/repositories/db-repository/db-repository";
import { DownloaderRepository } from "@/repositories/downloader-repository/downloader-repository";
import { FileRepository } from "@/repositories/file-repository/file-repository";
import { ReferenceRepository } from "@/repositories/reference-repository/reference-repository";
import { RSSRepository } from "@/repositories/rss-repository/rss-repository";
import { ScraperRepository } from "@/repositories/scraper-repository/scraper-repository";
import { WebImporterRepository } from "@/repositories/web-importer-repository/web-importer-repository";
import { NetworkTool } from "@/utils/got";

import { MainRendererStateStore } from "../state/renderer/appstate";
import "./css/index.css";
import "./css/katex.min.css";
import AppView from "./ui/app-view.vue";

// @ts-ignore
vSelect.props.components.default = () => ({
  Deselect: BIconX,
  OpenIndicator: BIconChevronUp,
});

const pinia = createPinia();

const app = createApp(AppView);
app.config.unwrapInjectedRef = true;

app.use(pinia);

app.component("Splitpanes", Splitpanes);
app.component("Pane", Pane);
app.component("v-select", vSelect);
app.component("draggable", draggable);

// ====================================
// Setup interactors and repositories
// ====================================
const preference = new Preference(true);
const stateStore = new MainRendererStateStore(preference);

const locales = loadLocales();

const i18n = createI18n({
  allowComposition: true,
  locale: preference.get("language") as string,
  fallbackLocale: "en-GB",
  messages: locales,
});

app.use(i18n);

console.time("Setup interactors and repositories");
const dbRepository = new DBRepository(stateStore, preference);
const scraperRepository = new ScraperRepository(stateStore, preference);
const fileRepository = new FileRepository(stateStore, preference);
const referenceRepository = new ReferenceRepository(stateStore, preference);
const downloaderRepository = new DownloaderRepository(stateStore, preference);
const rssRepository = new RSSRepository(stateStore, preference);
const webImporterRepository = new WebImporterRepository(stateStore, preference);

const appInteractor = new AppInteractor(
  stateStore,
  preference,
  fileRepository,
  dbRepository
);
const entityInteractor = new EntityInteractor(
  stateStore,
  preference,
  dbRepository,
  scraperRepository,
  fileRepository,
  referenceRepository,
  downloaderRepository
);
const renderInteractor = new RenderInteractor(preference);
const feedInteractor = new FeedInteractor(
  stateStore,
  preference,
  dbRepository,
  rssRepository,
  scraperRepository
);
const pluginMainInteractor = new PluginMainInteractor(
  stateStore,
  preference,
  referenceRepository
);
const browserExtensionInteractor = new BrowserExtensionInteractor(
  stateStore,
  preference,
  webImporterRepository,
  entityInteractor
);

const networkTool = new NetworkTool(stateStore, preference);

console.timeEnd("Setup interactors and repositories");

// ====================================
// Inject
// ====================================
window.entityInteractor = entityInteractor;
window.appInteractor = appInteractor;
window.renderInteractor = renderInteractor;
window.feedInteractor = feedInteractor;
window.networkTool = networkTool;

app.mount("#app");
