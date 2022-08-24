import { contextBridge } from "electron";
import { PluginSideInteractor } from "./interactors/plugin-side-interactor";
import { createInteractorProxy } from "./utils/misc";

const pluginInteractor = new PluginSideInteractor();

const pluginInteractorProxy = createInteractorProxy(pluginInteractor);

contextBridge.exposeInMainWorld("pluginInteractor", pluginInteractorProxy);
