import { createApp } from "vue";
import { createPinia, storeToRefs } from "pinia";
import { Splitpanes, Pane } from "splitpanes";

import "./css/index.css";
import App from "./App.vue";

import { MainRendererStateStore } from "../state/renderer/appstate";
import { DBRepository } from "@/repositories/db-repository/db-repository";
import { EntityInteractor } from "@/interactors/entity-interactor";
import { AppInteractor } from "@/interactors/app-interactor";
import { Preference } from "@/preference/preference";

const pinia = createPinia();

const app = createApp(App);

app.use(pinia);

app.component("Splitpanes", Splitpanes);
app.component("Pane", Pane);

// ====================================
// Setup interactors and repositories
// ====================================
const stateStore = new MainRendererStateStore();
const dbRepository = new DBRepository(stateStore);

const entityInteractor = new EntityInteractor(stateStore, dbRepository);
const preference = new Preference();
const appInteractor = new AppInteractor(preference);

// ====================================
// Inject
// ====================================
window.entityInteractor = entityInteractor;
window.appInteractor = appInteractor;

app.mount("#app");
