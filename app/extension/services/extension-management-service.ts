import {
  IPluginInfo,
  PluginManager,
} from "@future-scholars/live-plugin-manager";
import ElectronStore from "electron-store";
import fs from "fs";
import path from "path";

import { createDecorator } from "@/base/injection/injection";
import { isLocalPath } from "@/base/url";

import {
  ExtensionPreferenceService,
  IExtensionPreferenceService,
} from "./extension-preference-service";

export const IExtensionManagementService = createDecorator(
  "extensionManagementService"
);

interface IExtensionInfo {
  id: string;
  name: string;
  version: string;
  author: string;
  verified: boolean;
  description: string;
  preference: Map<string, any>;
  location: string;
  originLocation?: string;
}

export class ExtensionManagementService {
  private readonly _extStore: ElectronStore<Record<string, IExtensionInfo>>;
  private readonly _extManager: PluginManager;
  private readonly _extensionPreferenceService: ExtensionPreferenceService;

  private readonly _installedExtensions: { [key: string]: any };
  private readonly _installedExtensionInfos: {
    [key: string]: IExtensionInfo;
  };

  constructor(
    @IExtensionPreferenceService
    extensionPreferenceService: ExtensionPreferenceService
  ) {
    this._extStore = new ElectronStore({
      name: "extensions",
      cwd: globalThis["extensionWorkingDir"],
    });

    // ENHANCE: different npm url for China
    this._extManager = new PluginManager({
      pluginsPath: globalThis["extensionWorkingDir"],
    });
    this._extensionPreferenceService = extensionPreferenceService;

    this._installedExtensions = {};
    this._installedExtensionInfos = {};
  }

  async loadInstalledExtensions() {
    PLAPI.logService.info(
      `Loading installed extensions`,
      "",
      false,
      "ExtManagementService"
    );

    for (const [ie, extInfo] of Object.entries(this._extStore.store)) {
      try {
        this.install(extInfo.originLocation || extInfo.id, false);
      } catch (e) {
        console.error(e);
        PLAPI.logService.error(
          `Failed to load installed extension ${extInfo.id}`,
          e as Error,
          true,
          "ExtManagementService"
        );
      }
    }
  }

  async install(extensionIDorPath: string, notify = true) {
    let extensionID;
    try {
      let info: IPluginInfo;
      let installFromFile = false;
      if (isLocalPath(extensionIDorPath)) {
        if (fs.existsSync(extensionIDorPath)) {
          info = await this._extManager.installFromPath(extensionIDorPath, {
            force: false,
          });
          installFromFile = true;
          extensionID = info.name;
        } else {
          PLAPI.logService.error(
            `Failed to install extension.`,
            new Error(`File not found: ${extensionIDorPath}`),
            true,
            "ExtManagementService"
          );
          return;
        }
      } else {
        extensionID = extensionIDorPath;
        info = await this._extManager.install(extensionID);
      }
      const extension = this._extManager.require(info.name);

      this._installedExtensions[info.name] = await extension.initialize();

      this._installedExtensionInfos[info.name] = {
        id: info.name,
        name: info.name.replace("@future-scholars/", ""),
        version: info.version,
        author: info.author ? info.author.name : "community",
        verified: info.name.startsWith("@future-scholars/"),
        description: info.description || "",
        preference:
          this._extensionPreferenceService.getAllMetadata(info.name) || {},
        location: info.location,
        originLocation: installFromFile ? extensionIDorPath : undefined,
      };

      this._extStore.set(extensionID, this._installedExtensionInfos[info.name]);

      PLAPI.logService.info(
        `Installed extension ${extensionID}`,
        "",
        notify,
        "ExtManagementService"
      );
    } catch (e) {
      console.log(e);
      PLAPI.logService.error(
        `Failed to install extension ${extensionID}`,
        e as Error,
        true,
        "ExtManagementService"
      );

      const tryToDeletePath = path.join(
        globalThis["extensionWorkingDir"],
        extensionID
      );
      try {
        if (fs.existsSync(tryToDeletePath)) {
          fs.rmSync(tryToDeletePath, { recursive: true, force: true });
        }

        this._extStore.delete(extensionID);
      } catch (e) {}
    }
  }

  async uninstall(extensionID: string) {
    try {
      if (
        this._installedExtensions[extensionID] &&
        this._installedExtensions[extensionID].dispose
      ) {
        PLAPI.logService.info(
          `Disposing extension ${extensionID}`,
          "",
          false,
          "ExtManagementService"
        );
        try {
          await this._installedExtensions[extensionID].dispose();
        } catch (e) {
          console.error(e);
          PLAPI.logService.error(
            `Failed to dispose extension ${extensionID}`,
            e as Error,
            true,
            "ExtManagementService"
          );
        }
      }
      PLAPI.logService.info(
        `Uninstalling extension ${extensionID}`,
        "",
        false,
        "ExtManagementService"
      );

      fs.rmSync(this._installedExtensionInfos[extensionID].location, {
        recursive: true,
        force: true,
      });
      fs.rmSync(this._installedExtensionInfos[extensionID].location + ".json", {
        force: true,
      });
      await this._extManager.uninstall(extensionID);

      this._extStore.delete(extensionID);

      delete this._installedExtensions[extensionID];
      delete this._installedExtensionInfos[extensionID];

      PLAPI.logService.info(
        `Uninstalled extension ${extensionID}`,
        "",
        true,
        "ExtManagementService"
      );
    } catch (e) {
      console.error(e);
      PLAPI.logService.error(
        `Failed to uninstall extension ${extensionID}`,
        e as Error,
        true,
        "ExtManagementService"
      );
    }
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
      console.error(e);
      PLAPI.logService.error(
        `Failed to reload extension ${extensionID}`,
        e as Error,
        true,
        "ExtManagementService"
      );
    }
  }

  async reloadAll() {
    for (const extensionID in this._installedExtensionInfos) {
      await this.reload(extensionID);
    }
  }

  installedExtensions() {
    for (const [id, ext] of Object.entries(this._installedExtensionInfos)) {
      ext.preference = this._extensionPreferenceService.getAllMetadata(id);
    }

    return this._installedExtensionInfos;
  }

  async listExtensionMarketplace(query: string) {
    try {
      const packages = JSON.parse(
        (
          await PLAPI.networkTool.get(
            query
              ? `https://registry.npmjs.org/-/v1/search?text=${query} keywords:paperlib&size=20`
              : "https://registry.npmjs.org/-/v1/search?text=keywords:paperlib&size=20"
          )
        ).body
      ).objects as {
        package: {
          name: string;
          version: string;
          publisher: {
            username: string;
          };
          author?: { name: string };
          description?: string;
        };
      }[];

      const extensions: {
        [id: string]: {
          id: string;
          name: string;
          version: string;
          author: string;
          verified: boolean;
          description: string;
        };
      } = {};

      for (const pkg of packages) {
        extensions[pkg.package.name] = {
          id: pkg.package.name,
          name: pkg.package.name.replaceAll("@future-scholars/", ""),
          version: pkg.package.version,
          author: pkg.package.author
            ? pkg.package.author.name
            : pkg.package.publisher.username,
          verified: pkg.package.name.startsWith("@future-scholars/"),
          description: pkg.package.description || "",
        };
      }

      return extensions;
    } catch (e) {
      console.error(e);
      PLAPI.logService.error(
        `Failed to get extension marketplace`,
        e as Error,
        true,
        "ExtManagementService"
      );
      return {};
    }
  }

  async callExtensionMethod(
    extensionID: string,
    methodName: string,
    ...args: any
  ) {
    try {
      return await this._installedExtensions[extensionID][methodName](...args);
    } catch (e) {
      console.error(e);
      PLAPI.logService.error(
        `Failed to call extension method ${methodName} of extension ${extensionID}`,
        e as Error,
        true,
        "ExtManagementService"
      );
      throw e;
    }
  }
}
