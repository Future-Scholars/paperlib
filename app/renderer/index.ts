import { createApp } from "vue";
import { createPinia } from "pinia";
import { Splitpanes, Pane } from "splitpanes";
// @ts-ignore
import { RecycleScroller } from "vue-virtual-scroller";

import "./css/index.css";
import App from "./App.vue";

import { MainRendererStateStore } from "../state/renderer/appstate";
import { DBRepository } from "@/repositories/db-repository/db-repository";
import { EntityInteractor } from "@/interactors/entity-interactor";
import { AppInteractor } from "@/interactors/app-interactor";
import { Preference } from "@/preference/preference";
import { RenderInteractor } from "@/interactors/render-interactor";

const pinia = createPinia();

const app = createApp(App);

app.use(pinia);

app.component("Splitpanes", Splitpanes);
app.component("Pane", Pane);
app.component("RecycleScroller", RecycleScroller);

// ====================================
// Setup interactors and repositories
// ====================================
const stateStore = new MainRendererStateStore();
const preference = new Preference();

const dbRepository = new DBRepository(stateStore);

const entityInteractor = new EntityInteractor(stateStore, dbRepository);
const appInteractor = new AppInteractor(preference);
const renderInteractor = new RenderInteractor(preference);

// ====================================
// Inject
// ====================================
window.entityInteractor = entityInteractor;
window.appInteractor = appInteractor;
window.renderInteractor = renderInteractor;

app.mount("#app");
