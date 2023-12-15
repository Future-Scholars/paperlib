// import { createPinia } from "pinia";
// import { createApp } from "vue";
// import { createI18n } from "vue-i18n";

// import { PluginSideInteractor } from "@/interactors/plugin-side-interactor";
// import { loadLocales } from "@/locales/load";
// import { Preference } from "@/preference/preference";
// import { PluginRendererStateStore } from "@/state/renderer/appstate";

// import "./css/index.css";
// import PluginView from "./ui/plugin-view/plugin-view.vue";

// const pinia = createPinia();

// const plugin = createApp(PluginView);
// plugin.use(pinia);

// // ====================================
// // Setup interactors and repositories
// // ====================================
// const preference = new Preference(true);

// const locales = loadLocales();

// const i18n = createI18n({
//   allowComposition: true,
//   locale: preference.get("language") as string,
//   fallbackLocale: "en-GB",
//   messages: locales,
// });

// plugin.use(i18n);

// const pluginRendererStateStore = new PluginRendererStateStore();

// const pluginSideInteractor = new PluginSideInteractor(
//   pluginRendererStateStore,
//   preference
// );

// // ====================================
// // Inject
// // ====================================
// window.pluginSideInteractor = pluginSideInteractor;

// plugin.mount("#plugin");
