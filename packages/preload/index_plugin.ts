import { contextBridge } from "electron";
import { PluginInteractor } from "./interactors/plugin-interactor";
import { createInteractorProxy } from "./utils/misc";

const pluginInteractor = new PluginInteractor();

const pluginInteractorProxy = createInteractorProxy(pluginInteractor);

contextBridge.exposeInMainWorld("pluginInteractor", pluginInteractorProxy);
