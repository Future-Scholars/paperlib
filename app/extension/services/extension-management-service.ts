import { IPluginInfo, PluginManager } from "live-plugin-manager";

import { createDecorator } from "@/base/injection/injection";
import { isLocalPath } from "@/base/url";

export const IExtensionManagementService = createDecorator(
  "extensionManagementService"
);

export class ExtensionManagementService {
  private readonly _extManager: PluginManager;

  private readonly _installedPlugins: { [key: string]: any };

  constructor() {
    this._extManager = new PluginManager();
    this._installedPlugins = {};
  }

  async installDemoPlugins() {
    this.install("./plugin_packages/demo-command-extension");
  }

  async install(pluginName: string) {
    try {
      let info: IPluginInfo;
      if (isLocalPath(pluginName)) {
        info = await this._extManager.installFromPath(pluginName, {
          force: true,
        });
      } else {
        info = await this._extManager.install(pluginName);
      }
      const plugin = this._extManager.require(info.name);

      this._installedPlugins[info.name] = plugin.initialize();
    } catch (e) {
      PLAPI.logService.error(
        `Failed to install plugin ${pluginName}`,
        e as Error,
        true,
        "extensionManagementService"
      );
    }
  }

  async uninstall(pluginName: string) {
    delete this._installedPlugins[pluginName];
    await this._extManager.uninstall(pluginName);
  }

  callPluginMethod(pluginName: string, methodName: string, ...args: any) {
    try {
      return this._installedPlugins[pluginName][methodName](...args);
    } catch (e) {
      PLAPI.logService.error(
        `Failed to call plugin method ${methodName} of plugin ${pluginName},
        e as Error,
        true,
        "extensionManagementService"`
      );
    }
  }
}
