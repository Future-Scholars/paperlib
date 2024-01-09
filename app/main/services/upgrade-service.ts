import { dialog } from "electron";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { autoUpdater } from "electron-updater";

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

    autoUpdater.on("checking-for-update", () => {
      this.fire("checking");
    });

    autoUpdater.on("update-available", async () => {
      this.fire("available");
      const dialogOpts = {
        type: "info",
        buttons: ["Close"],
        title: "A new version of Paperlib is available",
        message: "A new version of Paperlib is available",
        detail: "It is downloading and will notify you when it is ready.",
      };
      await dialog.showMessageBox(dialogOpts);
    });

    autoUpdater.on("update-not-available", () => {
      this.fire("notAvailable");
    });

    autoUpdater.on("error", (error) => {
      this.fire({ error: error });
    });

    autoUpdater.on("update-downloaded", async (info) => {
      this.fire({ downloading: 100 });
      this.fire("downloaded");
      if (!info.releaseNotes) {
        info.releaseNotes = "";
      }

      if (!info.version) {
        info.version = "";
      }

      const dialogOpts = {
        type: "info",
        buttons: ["Update Now", "Cancel"],
        title: `A new version ${info.version} of Paperlib is automatically downloaded.`,
        message: `A new version ${info.version} of Paperlib is automatically downloaded.`,
        detail: `${info.releaseNotes}`,
      };

      const response = await dialog.showMessageBox(dialogOpts);
      if (response.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });

    autoUpdater.on("download-progress", (progressObj) => {
      if (progressObj.percent - this._downloadingProgress > 5) {
        this.fire({ downloading: progressObj.percent });
      }
      this._downloadingProgress = progressObj.percent;
    });

    autoUpdater.checkForUpdates();
  }

  public checkForUpdates(): void {
    autoUpdater.checkForUpdates();
  }

  public currentVersion(): string {
    return autoUpdater.currentVersion.version;
  }
}
