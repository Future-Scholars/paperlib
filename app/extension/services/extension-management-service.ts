import {
  IPluginInfo,
  PluginManager,
} from "@future-scholars/live-plugin-manager";
import ElectronStore from "electron-store";
import fs from "fs";
import path from "path";

import { createDecorator } from "@/base/injection/injection";
import { isLocalPath } from "@/base/url";

import { Eventable } from "@/base/event";
import { INetworkTool, NetworkTool } from "@/base/network";
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
  homepage?: string;
  preference: Map<string, any>;
  location: string;
  originLocation?: string;
}

interface IExtensionManagementServiceState {
  installed: string;
  installing: string;
  uninstalling: string;
  uninstalled: string;
  reloading: string;
  reloaded: string;
  updating: string;
  updated: string;
  installedLoaded: boolean;
}

export class ExtensionManagementService extends Eventable<IExtensionManagementServiceState> {
  private readonly _extStore: ElectronStore<Record<string, IExtensionInfo>>;
  private readonly _extManager: PluginManager;

  private readonly _installedExtensions: { [key: string]: any };
  private readonly _installedExtensionInfos: {
    [key: string]: IExtensionInfo;
  };

  private _npmRegistry = "https://registry.npmjs.org/";

  constructor(
    @IExtensionPreferenceService
    private readonly _extensionPreferenceService: ExtensionPreferenceService,
    @INetworkTool private readonly _networkTool: NetworkTool
  ) {
    super("extensionManagementService", {
      installed: "",
      installing: "",
      uninstalling: "",
      uninstalled: "",
      reloading: "",
      reloaded: "",
      updating: "",
      updated: "",
      installedLoaded: false,
    });
    this._extStore = new ElectronStore({
      name: "extensions",
      cwd: globalThis["extensionWorkingDir"],
    });

    // ENHANCE: different npm url for China
    this._extManager = new PluginManager({
      pluginsPath: globalThis["extensionWorkingDir"],
    });

    this._installedExtensions = {};
    this._installedExtensionInfos = {};
  }

  async initialize() {
    await this._chooseNPMRegistry();
    await this.loadInstalledExtensions();
    await this.checkUpdate();
  }

  async _chooseNPMRegistry() {
    try {
      const { countryCode } = (
        await this._networkTool.get(
          "http://ip-api.com/json/?fields=countryCode",
          {},
          0,
          5000,
          false,
          true
        )
      ).body;
      if (countryCode === "CN") {
        // @ts-ignore
        this._extManager.npmRegistry.npmUrl = "https://registry.npmmirror.com/";
        this._npmRegistry = "https://registry.npmmirror.com/";
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Load all installed extensions.
   */
  async loadInstalledExtensions() {
    PLAPI.logService.info(
      `Loading installed extensions`,
      "",
      false,
      "ExtManagementService"
    );

    const promises: Promise<any>[] = [];

    for (const [ie, extInfo] of Object.entries(this._extStore.store)) {
      promises.push(
        new Promise(async (resolve, reject) => {
          try {
            await this.install(
              extInfo.originLocation || extInfo.id,
              false,
              extInfo.version
            );
          } catch (e) {
            console.error(e);
            PLAPI.logService.error(
              `Failed to load extension ${extInfo.id}`,
              e as Error,
              true,
              "ExtManagementService"
            );
          }
          resolve(true);
        })
      );
    }

    await Promise.all(promises);
    this.fire({ installedLoaded: true });
  }

  async checkUpdate() {
    for (const [id, info] of Object.entries(this._installedExtensionInfos)) {
      try {
        const latestVersion = (
          await this._networkTool.get(
            `${this._npmRegistry}${id}/latest`,
            {},
            0,
            5000,
            false,
            true
          )
        ).body.version;

        if (
          latestVersion !== info.version &&
          info.originLocation === undefined
        ) {
          PLAPI.logService.info(
            `New version of ${id} has been released.`,
            "Automatically updating...",
            true,
            "ExtManagementService"
          );

          await this.update(id);
        }
      } catch (e) {
        console.error(e);
        PLAPI.logService.error(
          `Failed to check update for extension ${id}`,
          e as Error,
          true,
          "ExtManagementService"
        );
      }
    }
  }

  async update(extensionID: string) {
    if (isLocalPath(extensionID)) {
      return;
    }

    const currentVersion = this._installedExtensionInfos[extensionID].version;
    const currentExtensionPath = path.join(
      globalThis["extensionWorkingDir"],
      extensionID
    );

    try {
      PLAPI.logService.info(
        "Trying to update extensions.",
        extensionID,
        false,
        "ExtManagementService"
      );
      this.fire({ updating: extensionID });

      // 1. Backup the current extension.
      fs.cpSync(currentExtensionPath, currentExtensionPath + ".bak", {
        recursive: true,
      });

      // 2. Uninstall the current extension.
      await this.uninstall(extensionID, true);
    } catch (e) {
      console.error(e);
      PLAPI.logService.error(
        `Failed to update extension ${extensionID}`,
        e as Error,
        true,
        "ExtManagementService"
      );
      return;
    }
    try {
      // 3. Install the latest version of the extension.
      let info: IPluginInfo = await this._extManager.installFromNpm(
        extensionID,
        "latest"
      );

      const extension = this._extManager.require(info.name);

      this._installedExtensions[info.name] = await extension.initialize();

      this._installedExtensionInfos[info.name] = {
        id: info.name,
        name: info.name.replace("@future-scholars/", ""),
        version: info.version,
        author: info.author ? info.author.name : "community",
        verified: info.name.startsWith("@future-scholars/"),
        description: info.description || "",
        homepage: info.homepage,
        preference:
          this._extensionPreferenceService.getAllMetadata(info.name) || {},
        location: info.location,
        originLocation: undefined,
      };

      this._extStore.set(extensionID, this._installedExtensionInfos[info.name]);

      PLAPI.logService.info(
        `Extension has been updated.`,
        `${extensionID} ${currentVersion} -> ${info.version}`,
        true,
        "ExtManagementService"
      );

      fs.rmSync(currentExtensionPath + ".bak", {
        recursive: true,
        force: true,
      });

      this.fire({ updated: extensionID });
    } catch (e) {
      console.log(e);
      PLAPI.logService.error(
        `Failed to update extension ${extensionID}`,
        e as Error,
        true,
        "ExtManagementService"
      );

      // 4. Restore the backup.
      fs.cpSync(currentExtensionPath + ".bak", currentExtensionPath, {
        recursive: true,
      });
      fs.rmSync(currentExtensionPath + ".bak", {
        recursive: true,
        force: true,
      });
      this.install(extensionID, false, currentVersion);
    }
  }

  /**
   * Install an extension from the given path or extensionID.
   * @param extensionIDorPath - extensionID or path to the extension
   * @param notify - whether to show notification, default to true
   * @param version - version to install, default to "latest"
   */
  async install(
    extensionIDorPath: string,
    notify = true,
    version: string = "latest"
  ) {
    let extensionID;
    try {
      PLAPI.logService.info(
        "Trying to install extensions.",
        extensionIDorPath,
        false,
        "ExtManagementService"
      );
      this.fire({ installing: extensionIDorPath });

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
        info = await this._extManager.installFromNpm(extensionID, version);
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
        homepage: info.homepage,
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

      this.fire({ installed: extensionIDorPath });
    } catch (e) {
      console.log(e);
      PLAPI.logService.error(
        `Failed to install extension ${extensionID}`,
        e as Error,
        true,
        "ExtManagementService"
      );

      try {
        await this._extManager.uninstall(extensionID);
      } catch (e) {}
      this.clean(extensionIDorPath);
    }
  }

  /**
   * Uninstall an extension.
   * @param extensionID - extensionID to uninstall
   */
  async uninstall(extensionID: string, keepInfo = false) {
    try {
      this.fire({ uninstalling: extensionID });
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

      await this._extManager.uninstall(extensionID);

      PLAPI.logService.info(
        `Uninstalled extension ${extensionID}`,
        "",
        true,
        "ExtManagementService"
      );

      this.fire({ uninstalled: extensionID });
    } catch (e) {
      console.error(e);
      PLAPI.logService.error(
        `Failed to uninstall extension ${extensionID}`,
        e as Error,
        true,
        "ExtManagementService"
      );
    } finally {
      this.clean(extensionID, keepInfo);
    }
  }

  /**
   * Clean the extension related files, preference, etc.
   * @param extensionIDorPath - extensionID or path to the extension
   */
  async clean(extensionIDorPath: string, keepInfo = false) {
    let extensionPath: string;
    let extensionID: string;

    if (isLocalPath(extensionIDorPath) && fs.existsSync(extensionIDorPath)) {
      // Try to find the extensionID from the package.json
      const packageJSON = JSON.parse(
        fs.readFileSync(path.join(extensionIDorPath, "package.json"), "utf-8")
      );

      extensionID = packageJSON.name || "";
    } else {
      extensionID = extensionIDorPath;
    }

    extensionPath = path.join(globalThis["extensionWorkingDir"], extensionID);

    // Clean the extension related files.
    if (fs.existsSync(extensionPath)) {
      fs.rmSync(extensionPath, { recursive: true, force: true });
    }
    // Clean the extension preference if exists.
    this._extensionPreferenceService.unregister(extensionID);
    if (fs.existsSync(extensionPath + ".json") && !keepInfo) {
      fs.rmSync(extensionPath + ".json", { force: true });
    }
    // Clean the extension info.
    delete this._installedExtensions[extensionID];
    delete this._installedExtensionInfos[extensionID];
    // Clean the extension record in the store.
    if (this._extStore.has(extensionID) && !keepInfo) {
      this._extStore.delete(extensionID);
    }
  }

  /**
   * Reload an extension.
   * @param extensionID - extensionID to reload
   */
  async reload(extensionID: string) {
    try {
      this.fire({ reloading: extensionID });

      const location =
        this._installedExtensionInfos[extensionID].originLocation ||
        this._installedExtensionInfos[extensionID].location;

      if (location !== this._installedExtensionInfos[extensionID].location) {
        // Installed from local file.
        await this.uninstall(extensionID, true);
        await this.install(location);
      } else {
        // TODO: support reload from npm
      }

      this.fire({ reloaded: extensionID });
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

  /**
   * Reload all installed extensions.
   */
  async reloadAll() {
    for (const extensionID in this._installedExtensionInfos) {
      await this.reload(extensionID);
    }
  }

  /**
   * Get all installed extensions.
   */
  installedExtensions() {
    for (const [id, ext] of Object.entries(this._installedExtensionInfos)) {
      ext.preference = this._extensionPreferenceService.getAllMetadata(id);
    }

    return this._installedExtensionInfos;
  }

  /**
   * Get extensions from marketplace.
   * @param query - Query string
   * @returns A map of extensionID to extension info.
   */
  async listExtensionMarketplace(query: string) {
    try {
      let npmQueryUrl = "";
      if (this._npmRegistry === "https://registry.npmmirror.com/") {
        npmQueryUrl = query
          ? `https://api.paperlib.app/extensions/query?keywords=${query}`
          : `https://api.paperlib.app/extensions/query`;
      } else {
        npmQueryUrl = query
          ? `https://registry.npmjs.org/-/v1/search?text=${query} keywords:paperlib&size=20`
          : "https://registry.npmjs.org/-/v1/search?text=keywords:paperlib&size=20";
      }

      const packages = (
        await this._networkTool.get(npmQueryUrl, {}, 1, 10000, false, true)
      ).body.objects as {
        package: {
          name: string;
          version: string;
          publisher: {
            username: string;
          };
          author?: { name: string };
          description?: string;
          links?: {
            homepage?: string;
          };
          keywords: string[];
        };
        score: {
          detail: {
            quality: number;
            popularity: number;
            maintenance: number;
          };
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
          homepage?: string;
        };
      } = {};

      packages.sort((a, b) => {
        return b.score.detail.popularity - a.score.detail.popularity;
      });

      for (const pkg of packages) {
        if (!pkg.package.keywords.includes("paperlib")) {
          continue;
        }
        extensions[pkg.package.name] = {
          id: pkg.package.name,
          name: pkg.package.name.replaceAll("@future-scholars/", ""),
          version: pkg.package.version,
          author: pkg.package.author
            ? pkg.package.author.name
            : pkg.package.publisher.username,
          verified: pkg.package.name.startsWith("@future-scholars/"),
          description: pkg.package.description || "",
          homepage: pkg.package.links?.homepage,
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

  /**
   * Call a method of an extension class.
   * @param extensionID - extensionID to call method
   * @param methodName - method name to call
   * @param args - arguments to pass to the method
   * @returns
   */
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

  /**
   * Get the status of the official scrape extension.
   * @returns "uninstalled" | "unloaded" | "loaded"
   */
  isOfficialScrapeExtensionInstalled() {
    if (
      this._extStore.has("@future-scholars/paperlib-entry-scrape-extension") &&
      this._extStore.has("@future-scholars/paperlib-metadata-scrape-extension")
    ) {
      if (
        this._installedExtensions[
          "@future-scholars/paperlib-entry-scrape-extension"
        ] !== undefined &&
        this._installedExtensions[
          "@future-scholars/paperlib-metadata-scrape-extension"
        ] !== undefined
      ) {
        return "loaded";
      } else {
        return "unloaded";
      }
    } else {
      return "uninstalled";
    }
  }

  memoryUsage() {
    const mem = process.memoryUsage();

    return mem.rss / 1024 / 1024;
  }
}
