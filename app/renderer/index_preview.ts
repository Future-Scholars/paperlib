import { createPinia } from "pinia";
import { createApp } from "vue";

import { PreviewInteractor } from "@/interactors/preview-interactor";
import { PreviewRendererStateStore } from "@/state/renderer/appstate";

import Preview from "./Preview.vue";
import "./css/index.css";

const pinia = createPinia();
const app = createApp(Preview);
app.use(pinia);

// ====================================
// Setup interactors and repositories
// ====================================
const stateStore = new PreviewRendererStateStore();

const previewInteractor = new PreviewInteractor(stateStore);

// ====================================
// Inject
// ====================================
window.previewInteractor = previewInteractor;

app.mount("#preview");
