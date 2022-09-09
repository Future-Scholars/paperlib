import { BIconChevronUp, BIconX } from "bootstrap-icons-vue";
import { createPinia } from "pinia";
import { Pane, Splitpanes } from "splitpanes";
import { createApp } from "vue";
import vSelect from "vue-select";

import { AppInteractor } from "@/interactors/app-interactor";
import { EntityInteractor } from "@/interactors/entity-interactor";
import { RenderInteractor } from "@/interactors/render-interactor";
import { Preference } from "@/preference/preference";
import { DBRepository } from "@/repositories/db-repository/db-repository";
import { FileRepository } from "@/repositories/file-repository/file-repository";
import { ReferenceRepository } from "@/repositories/reference-repository/reference-repository";
import { ScraperRepository } from "@/repositories/scraper-repository/scraper-repository";

import { MainRendererStateStore } from "../state/renderer/appstate";
import App from "./App.vue";
import "./css/index.css";

// @ts-ignore
vSelect.props.components.default = () => ({
  Deselect: BIconX,
  OpenIndicator: BIconChevronUp,
});

const pinia = createPinia();

const app = createApp(App);
app.config.unwrapInjectedRef = true;

app.use(pinia);

app.component("Splitpanes", Splitpanes);
app.component("Pane", Pane);
app.component("v-select", vSelect);

// ====================================
// Setup interactors and repositories
// ====================================
const stateStore = new MainRendererStateStore();
const preference = new Preference();

const dbRepository = new DBRepository(stateStore);
const scraperRepository = new ScraperRepository(stateStore, preference);
const fileRepository = new FileRepository(stateStore, preference);
const referenceRepository = new ReferenceRepository(stateStore, preference);

const appInteractor = new AppInteractor(stateStore, preference, fileRepository);
const entityInteractor = new EntityInteractor(
  stateStore,
  dbRepository,
  scraperRepository,
  fileRepository,
  referenceRepository
);
const renderInteractor = new RenderInteractor(preference);

// ====================================
// Inject
// ====================================
window.entityInteractor = entityInteractor;
window.appInteractor = appInteractor;
window.renderInteractor = renderInteractor;

app.mount("#app");
