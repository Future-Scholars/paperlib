import { MessageBoxOptions, dialog } from "electron";
import updater from "electron-updater";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";

export interface IUpgradeServiceState {
  checking: number;
  available: number;
  notAvailable: number;
  error: any;
  downloaded: number;
  downloading: number;
}

export const IUpgradeService = createDecorator("upgradeService");

export class UpgradeService extends Eventable<IUpgradeServiceState> {
  private _downloadingProgress: number = 0;

  constructor() {
    super("upgradeService", {
      checking: 0,
      available: 0,
      notAvailable: 0,
      error: null,
      downloaded: 0,
      downloading: 0,
    });

    updater.autoUpdater.on("checking-for-update", () => {
      this.fire("checking");
    });

    updater.autoUpdater.on("update-available", async () => {
      this.fire("available");
      const dialogOpts = {
        type: "info",
        buttons: ["Close"],
        title: "A new version of Paperlib is available",
        message: "A new version of Paperlib is available",
        detail: "It is downloading and will notify you when it is ready.",
      } as MessageBoxOptions;
      await dialog.showMessageBox(dialogOpts);
    });

    updater.autoUpdater.on("update-not-available", () => {
      this.fire("notAvailable");
    });

    updater.autoUpdater.on("error", (error) => {
      this.fire({ error: error });
    });

    updater.autoUpdater.on("update-downloaded", async (info) => {
      this.fire({ downloading: 100 });
      this.fire("downloaded");
      if (!info.releaseNotes) {
        info.releaseNotes = "";
      }

      const dialogOpts = {
        type: "info",
        buttons: ["Update Now", "Cancel"],
        title: `A new version ${
          info.version || ""
        } of Paperlib is automatically downloaded.`,
        message: `A new version ${
          info.version || ""
        } of Paperlib is automatically downloaded.`,
        detail: `${info.releaseNotes}`,
      } as MessageBoxOptions;

      const response = await dialog.showMessageBox(dialogOpts);
      if (response.response === 0) {
        updater.autoUpdater.quitAndInstall();
      }
    });

    updater.autoUpdater.on("download-progress", (progressObj) => {
      if (progressObj.percent - this._downloadingProgress > 5) {
        this.fire({ downloading: progressObj.percent });
      }
      this._downloadingProgress = progressObj.percent;
    });

    updater.autoUpdater.checkForUpdates();
  }

  public checkForUpdates(): void {
    updater.autoUpdater.checkForUpdates();
  }

  public currentVersion(): string {
    return updater.autoUpdater.currentVersion.version;
  }
}
