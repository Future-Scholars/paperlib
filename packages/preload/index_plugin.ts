import { contextBridge } from "electron";

import { PluginSharedState } from "./utils/appstate";
import { Preference } from "./utils/preference";

import { PluginSideInteractor } from "./interactors/plugin-side-interactor";
import { createInteractorProxy } from "./utils/misc";

// ============================================================
// State and Preference
const preference = new Preference();
const sharedState = new PluginSharedState(preference);

const pluginInteractor = new PluginSideInteractor(sharedState, preference);

const pluginInteractorProxy = createInteractorProxy(pluginInteractor);

contextBridge.exposeInMainWorld("pluginInteractor", pluginInteractorProxy);
