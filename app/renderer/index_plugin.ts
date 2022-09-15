import { createPinia } from "pinia";
import { createApp } from "vue";

import { PluginSideInteractor } from "@/interactors/plugin-side-interactor";
import { Preference } from "@/preference/preference";
import { PluginRendererStateStore } from "@/state/renderer/appstate";

import "./css/index.css";
import PluginView from "./ui/plugin-view/plugin-view.vue";

const pinia = createPinia();

const plugin = createApp(PluginView);
plugin.use(pinia);

// ====================================
// Setup interactors and repositories
// ====================================
const preference = new Preference();
const pluginRendererStateStore = new PluginRendererStateStore();

const pluginSideInteractor = new PluginSideInteractor(
  pluginRendererStateStore,
  preference
);

// ====================================
// Inject
// ====================================
window.pluginSideInteractor = pluginSideInteractor;

plugin.mount("#plugin");
