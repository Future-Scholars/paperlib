import { IPluginInfo, PluginManager } from "live-plugin-manager";
import fs from "node:fs";

import { createDecorator } from "@/base/injection/injection";
import { isLocalPath } from "@/base/url";

export const IExtensionManagementService = createDecorator(
  "extensionManagementService"
);

export class ExtensionManagementService {
  private readonly _extManager: PluginManager;

  private readonly _installedExtensions: { [key: string]: any };
  private readonly _installedExtensionInfos: {
    [key: string]: {
      id: string;
      name: string;
      version: string;
      author: string;
      verified: boolean;
      description: string;
      location: string;
      originLocation?: string;
    };
  };

  constructor() {
    this._extManager = new PluginManager();
    this._installedExtensions = {};
    this._installedExtensionInfos = {};
  }

  async installDemoPlugins() {
    this.install("./extension_demos/paperlib-demo-command-extension");
  }

  async install(extensionName: string) {
    try {
      let info: IPluginInfo;
      let installFromFile = false;
      if (isLocalPath(extensionName)) {
        info = await this._extManager.installFromPath(extensionName, {
          force: false,
        });
        installFromFile = true;
      } else {
        info = await this._extManager.install(extensionName);
      }
      const extension = this._extManager.require(info.name);

      this._installedExtensions[info.name] = extension.initialize();

      //TODO: verify extension
      this._installedExtensionInfos[info.name] = {
        id: info.name,
        name: this._installedExtensions[info.name].name
          ? this._installedExtensions[info.name].name
          : info.name,
        version: info.version,
        author: this._installedExtensions[info.name].author
          ? this._installedExtensions[info.name].author
          : "community",
        verified: true,
        description: this._installedExtensions[info.name].description
          ? this._installedExtensions[info.name].description
          : "",
        location: info.location,
        originLocation: installFromFile ? extensionName : undefined,
      };
    } catch (e) {
      console.log(e);
      PLAPI.logService.error(
        `Failed to install extension ${extensionName}`,
        e as Error,
        true,
        "extensionManagementService"
      );
    }
  }

  async uninstall(extensionID: string) {
    delete this._installedExtensions[extensionID];
    delete this._installedExtensionInfos[extensionID];
    await this._extManager.uninstall(extensionID);

    console.log("Uninstalled", this._extManager.list());
  }

  async reload(extensionID: string) {
    try {
      const location =
        this._installedExtensionInfos[extensionID].originLocation ||
        this._installedExtensionInfos[extensionID].location;

      if (location !== this._installedExtensionInfos[extensionID].location) {
        // Installed from local file.
        await this.uninstall(extensionID);
        await this.install(location);
      } else {
        // Installed from other sources.
        fs.copyFileSync(location, location + ".bak");
        await this.uninstall(extensionID);
        fs.linkSync(location + ".bak", location);
        await this.install(location);
      }
    } catch (e) {
      PLAPI.logService.error(
        `Failed to reload extension ${extensionID}`,
        e as Error,
        true,
        "extensionManagementService"
      );
    }
  }

  installedExtensions() {
    return this._installedExtensionInfos;
  }

  callPluginMethod(extensionName: string, methodName: string, ...args: any) {
    try {
      return this._installedExtensions[extensionName][methodName](...args);
    } catch (e) {
      PLAPI.logService.error(
        `Failed to call extension method ${methodName} of extension ${extensionName},
        e as Error,
        true,
        "extensionManagementService"`
      );
    }
  }
}
